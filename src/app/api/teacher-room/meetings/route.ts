import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";
import {
  sendMeetingInvitationEmails,
  createMeetingInvitationNotifications,
  notifyAllTeachersAdmins,
} from "@/lib/email/meeting-notifications";
import { MeetingPrivacy, InvitationStatus } from "@prisma/client";

const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "VOICE"]).default("VIDEO"),
  scheduledAt: z.string().datetime().optional(),
  maxParticipants: z.number().min(2).max(100).default(50),
  // Privacy settings
  privacy: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  requireApproval: z.boolean().default(false),
  allowChat: z.boolean().default(true),
  allowScreenShare: z.boolean().default(true),
  allowHandRaise: z.boolean().default(true),
  // Notification settings
  notifyOnCreate: z.boolean().default(true),
  notifyBeforeStart: z.number().min(0).max(60).optional(), // Minutes before start
  // Invitations (for private meetings)
  invitedUserIds: z.array(z.string()).optional(),
  sendEmailInvitations: z.boolean().default(true),
  sendInAppNotifications: z.boolean().default(true),
});

// GET /api/teacher-room/meetings - Get meetings list
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "غرفة المعلمين للمدرسين والإداريين فقط" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  try {
    // Get meetings that are:
    // 1. Public meetings
    // 2. Private meetings where user is host or invited
    const meetings = await db.teacherMeeting.findMany({
      where: {
        ...(status && { status: status as "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED" }),
        status: status ? undefined : { not: "CANCELLED" },
        OR: [
          { privacy: MeetingPrivacy.PUBLIC },
          { hostId: user.id },
          {
            privacy: MeetingPrivacy.PRIVATE,
            invitations: {
              some: {
                userId: user.id,
                status: { not: InvitationStatus.DECLINED },
              },
            },
          },
        ],
      },
      orderBy: [
        { status: "asc" }, // LIVE first
        { scheduledAt: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      include: {
        participants: {
          where: { isActive: true },
          select: {
            id: true,
            userId: true,
            userName: true,
            userAvatar: true,
            isMuted: true,
            isCameraOff: true,
          },
        },
        invitations: {
          where: { userId: user.id },
          select: { status: true },
        },
        _count: {
          select: { participants: true, invitations: true },
        },
      },
    });

    // Add user's invitation status to each meeting
    const meetingsWithStatus = meetings.map((meeting) => ({
      ...meeting,
      userInvitationStatus: meeting.invitations[0]?.status || null,
      isHost: meeting.hostId === user.id,
    }));

    return NextResponse.json({ ok: true, data: meetingsWithStatus });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الاجتماعات" },
      { status: 500 }
    );
  }
}

// POST /api/teacher-room/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "غرفة المعلمين للمدرسين والإداريين فقط" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = createMeetingSchema.parse(body);

    // Create meeting with privacy settings
    const meeting = await db.teacherMeeting.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        maxParticipants: data.maxParticipants,
        hostId: user.id,
        hostName: user.name,
        hostAvatar: null,
        status: data.scheduledAt ? "SCHEDULED" : "LIVE",
        ...(data.scheduledAt ? {} : { startedAt: new Date() }),
        // Privacy settings
        privacy: data.privacy,
        requireApproval: data.requireApproval,
        allowChat: data.allowChat,
        allowScreenShare: data.allowScreenShare,
        allowHandRaise: data.allowHandRaise,
        notifyOnCreate: data.notifyOnCreate,
        notifyBeforeStart: data.notifyBeforeStart,
        // Add host as first participant
        participants: {
          create: {
            userId: user.id,
            userName: user.name,
            userAvatar: null,
            userRole: user.role,
            isActive: !data.scheduledAt,
            joinedAt: data.scheduledAt ? null : new Date(),
            canSpeak: true,
            canShare: true,
            isCoHost: true,
          },
        },
      },
      include: {
        participants: true,
      },
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

    // Handle invitations for private meetings
    if (data.privacy === "PRIVATE" && data.invitedUserIds && data.invitedUserIds.length > 0) {
      // Get user details for invitations
      const usersToInvite = await db.user.findMany({
        where: { id: { in: data.invitedUserIds } },
        select: { id: true, name: true, email: true, role: true },
      });

      // Create invitation records with user details
      await db.meetingInvitation.createMany({
        data: usersToInvite.map((invitedUser) => ({
          meetingId: meeting.id,
          userId: invitedUser.id,
          userName: invitedUser.name,
          userEmail: invitedUser.email,
          userRole: invitedUser.role,
          status: InvitationStatus.PENDING,
        })),
      });

      // Send notifications
      if (data.sendInAppNotifications) {
        await createMeetingInvitationNotifications(meetingInfo, data.invitedUserIds);
      }

      // Send emails
      if (data.sendEmailInvitations) {
        // Run email sending in background (don't await)
        sendMeetingInvitationEmails(meetingInfo, data.invitedUserIds).catch(console.error);
      }
    }

    // Notify all teachers/admins about public meeting
    if (data.privacy === "PUBLIC" && data.notifyOnCreate) {
      // Run notifications in background
      notifyAllTeachersAdmins(meetingInfo).catch(console.error);
    }

    return NextResponse.json({ ok: true, data: meeting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إنشاء الاجتماع" },
      { status: 500 }
    );
  }
}
