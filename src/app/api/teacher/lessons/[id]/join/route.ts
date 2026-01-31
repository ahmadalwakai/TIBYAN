import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { Role } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/teacher/lessons/[id]/join - Student joins session
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
    const session = await db.teachingSession.findUnique({
      where: { id },
      include: {
        invitations: { where: { userId: user.id } },
        participants: { where: { userId: user.id } },
        _count: { select: { participants: { where: { isActive: true } } } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    // Check if session is live
    if (session.status !== "LIVE") {
      return NextResponse.json(
        { ok: false, error: "الحصة غير متاحة حالياً" },
        { status: 400 }
      );
    }

    // Check access
    const isTeacher = session.teacherId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isInvited = session.invitations.length > 0;
    const isPublic = session.privacy === "PUBLIC";

    if (!isTeacher && !isAdmin && !isInvited && !isPublic) {
      return NextResponse.json(
        { ok: false, error: "ليس لديك دعوة لهذه الحصة" },
        { status: 403 }
      );
    }

    // Check max participants
    if (session._count.participants >= session.maxStudents && !isTeacher && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "الحصة ممتلئة" },
        { status: 400 }
      );
    }

    // Check if already a participant
    if (session.participants.length > 0) {
      // Update existing participant
      await db.sessionParticipant.update({
        where: {
          sessionId_userId: { sessionId: id, userId: user.id },
        },
        data: {
          isActive: true,
          joinedAt: new Date(),
          leftAt: null,
        },
      });
    } else {
      // Create new participant
      await db.sessionParticipant.create({
        data: {
          sessionId: id,
          userId: user.id,
          userName: user.name,
          userAvatar: null,
          userRole: user.role as Role,
          isActive: true,
          joinedAt: new Date(),
          isMuted: true,
          isCameraOff: true,
          canSpeak: session.allowStudentMic,
          canShare: false,
        },
      });
    }

    // Update invitation status if exists
    if (session.invitations.length > 0) {
      await db.sessionInvitation.update({
        where: { id: session.invitations[0].id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الانضمام" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/lessons/[id]/join - Leave session
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
    await db.sessionParticipant.updateMany({
      where: {
        sessionId: id,
        userId: user.id,
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error leaving session:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
