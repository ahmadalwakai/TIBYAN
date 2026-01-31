import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teacher-room/meetings/[id]/join - Join a meeting
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
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
    const meeting = await db.teacherMeeting.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: { where: { isActive: true } } } },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "الاجتماع غير موجود" },
        { status: 404 }
      );
    }

    if (meeting.status !== "LIVE") {
      return NextResponse.json(
        { ok: false, error: "الاجتماع ليس قيد التشغيل" },
        { status: 400 }
      );
    }

    if (meeting._count.participants >= meeting.maxParticipants) {
      return NextResponse.json(
        { ok: false, error: "الاجتماع ممتلئ" },
        { status: 400 }
      );
    }

    // Check if already a participant
    const existingParticipant = await db.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
    });

    let participant;
    if (existingParticipant) {
      // Rejoin
      participant = await db.meetingParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          isActive: true,
          joinedAt: new Date(),
          leftAt: null,
          isMuted: false,
          isCameraOff: false,
        },
      });
    } else {
      // New participant
      participant = await db.meetingParticipant.create({
        data: {
          meetingId: id,
          userId: user.id,
          userName: user.name,
          userAvatar: null,
          userRole: user.role,
          isActive: true,
          joinedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        participant,
        meeting: {
          id: meeting.id,
          title: meeting.title,
          type: meeting.type,
          hostId: meeting.hostId,
          hostName: meeting.hostName,
        },
      },
    });
  } catch (error) {
    console.error("Error joining meeting:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الانضمام للاجتماع" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher-room/meetings/[id]/join - Leave meeting
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const participant = await db.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
    });

    if (!participant) {
      return NextResponse.json(
        { ok: false, error: "أنت لست في هذا الاجتماع" },
        { status: 400 }
      );
    }

    await db.meetingParticipant.update({
      where: { id: participant.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, data: { left: true } });
  } catch (error) {
    console.error("Error leaving meeting:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في مغادرة الاجتماع" },
      { status: 500 }
    );
  }
}
