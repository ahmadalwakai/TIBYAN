import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";
import { InvitationStatus } from "@prisma/client";
import {
  sendMeetingInvitationEmails,
  createMeetingInvitationNotifications,
} from "@/lib/email/meeting-notifications";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const inviteUsersSchema = z.object({
  userIds: z.array(z.string()).min(1),
  sendEmail: z.boolean().default(true),
  sendNotification: z.boolean().default(true),
});

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teacher-room/meetings/[id]/invite - Get invitations list
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const meeting = await db.teacherMeeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "الاجتماع غير موجود" },
        { status: 404 }
      );
    }

    // Only host or admin can view invitations
    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح لك بعرض الدعوات" },
        { status: 403 }
      );
    }

    // Get invitations separately
    const invitations = await db.meetingInvitation.findMany({
      where: { meetingId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// POST /api/teacher-room/meetings/[id]/invite - Invite users to meeting
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const meeting = await db.teacherMeeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "الاجتماع غير موجود" },
        { status: 404 }
      );
    }

    // Only host or admin can invite
    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "فقط مضيف الاجتماع يمكنه دعوة المشاركين" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = inviteUsersSchema.parse(body);

    // Get existing invitations
    const existingInvitations = await db.meetingInvitation.findMany({
      where: {
        meetingId: id,
        userId: { in: data.userIds },
      },
      select: { userId: true },
    });

    const existingUserIds = existingInvitations.map((i: (typeof existingInvitations)[number]) => i.userId);
    const newUserIds = data.userIds.filter((uid) => !existingUserIds.includes(uid));

    if (newUserIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: { invited: 0, alreadyInvited: existingUserIds.length },
      });
    }

    // Get user details for new invitations
    const usersToInvite = await db.user.findMany({
      where: { id: { in: newUserIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    // Create new invitations with user details
    await db.meetingInvitation.createMany({
      data: usersToInvite.map((invitedUser: (typeof usersToInvite)[number]) => ({
        meetingId: id,
        userId: invitedUser.id,
        userName: invitedUser.name,
        userEmail: invitedUser.email,
        userRole: invitedUser.role,
        status: InvitationStatus.PENDING,
      })),
    });

    const meetingInfo = {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      meetingType: meeting.type,
      scheduledFor: meeting.scheduledAt,
      privacy: meeting.privacy,
      hostId: meeting.hostId,
      hostName: meeting.hostName,
    };

    // Send notifications
    if (data.sendNotification) {
      await createMeetingInvitationNotifications(meetingInfo, newUserIds);
    }

    // Send emails (in background)
    if (data.sendEmail) {
      sendMeetingInvitationEmails(meetingInfo, newUserIds).catch(console.error);
    }

    return NextResponse.json({
      ok: true,
      data: {
        invited: newUserIds.length,
        alreadyInvited: existingUserIds.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error inviting users:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// PATCH /api/teacher-room/meetings/[id]/invite - Respond to invitation
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { response } = body; // "accept" or "decline"

    if (!["accept", "decline"].includes(response)) {
      return NextResponse.json(
        { ok: false, error: "استجابة غير صالحة" },
        { status: 400 }
      );
    }

    const invitation = await db.meetingInvitation.findFirst({
      where: {
        meetingId: id,
        userId: user.id,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { ok: false, error: "لم تتم دعوتك لهذا الاجتماع" },
        { status: 404 }
      );
    }

    await db.meetingInvitation.update({
      where: { id: invitation.id },
      data: {
        status: response === "accept" ? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher-room/meetings/[id]/invite - Remove invitation
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    const meeting = await db.teacherMeeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "الاجتماع غير موجود" },
        { status: 404 }
      );
    }

    // Only host or admin can remove invitations
    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح لك بإزالة الدعوات" },
        { status: 403 }
      );
    }

    await db.meetingInvitation.deleteMany({
      where: {
        meetingId: id,
        userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error removing invitation:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
