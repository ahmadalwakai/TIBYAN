import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { SessionInvitation } from "@prisma/client";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/lessons/[id] - Get session details
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
    const session = await db.teachingSession.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { createdAt: "asc" },
        },
        invitations: true,
        _count: {
          select: { participants: true, chatMessages: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    // Check access: teacher, admin, or invited student
    const isTeacher = session.teacherId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isInvited = session.invitations.some((inv: SessionInvitation) => inv.userId === user.id);
    const isPublic = session.privacy === "PUBLIC";

    if (!isTeacher && !isAdmin && !isInvited && !isPublic) {
      return NextResponse.json(
        { ok: false, error: "ليس لديك صلاحية للوصول لهذه الحصة" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...session,
        isTeacher,
        isAdmin,
        canControl: isTeacher || isAdmin,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// PATCH /api/teacher/lessons/[id] - Update session (start, end, settings)
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
    const session = await db.teachingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    // Only teacher or admin can update
    if (session.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "فقط المعلم يمكنه التحكم في الحصة" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...updates } = body;

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "start":
        updateData = {
          status: "LIVE",
          startedAt: new Date(),
        };
        // Activate teacher's participation
        await db.sessionParticipant.updateMany({
          where: { sessionId: id, userId: user.id },
          data: { isActive: true, joinedAt: new Date() },
        });
        break;

      case "end":
        const startTime = session.startedAt || new Date();
        const duration = Math.round(
          (new Date().getTime() - startTime.getTime()) / 60000
        );
        updateData = {
          status: "ENDED",
          endedAt: new Date(),
          duration,
        };
        // Deactivate all participants
        await db.sessionParticipant.updateMany({
          where: { sessionId: id },
          data: { isActive: false, leftAt: new Date() },
        });
        break;

      case "cancel":
        updateData = { status: "CANCELLED" };
        break;

      case "update-settings":
        updateData = {
          allowChat: updates.allowChat,
          allowScreenShare: updates.allowScreenShare,
          allowHandRaise: updates.allowHandRaise,
          allowStudentMic: updates.allowStudentMic,
          allowStudentCamera: updates.allowStudentCamera,
        };
        break;

      default:
        return NextResponse.json(
          { ok: false, error: "إجراء غير صالح" },
          { status: 400 }
        );
    }

    const updatedSession = await db.teachingSession.update({
      where: { id },
      data: updateData,
      include: {
        participants: { where: { isActive: true } },
      },
    });

    return NextResponse.json({ ok: true, data: updatedSession });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/lessons/[id] - Delete session
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
    const session = await db.teachingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    // Only teacher or admin can delete
    if (session.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "فقط المعلم يمكنه حذف الحصة" },
        { status: 403 }
      );
    }

    // Can only delete scheduled or cancelled sessions
    if (session.status === "LIVE") {
      return NextResponse.json(
        { ok: false, error: "لا يمكن حذف حصة جارية، قم بإنهائها أولاً" },
        { status: 400 }
      );
    }

    await db.teachingSession.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
