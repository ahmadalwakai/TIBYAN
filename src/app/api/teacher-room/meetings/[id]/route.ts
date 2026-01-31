import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teacher-room/meetings/[id] - Get meeting details
export async function GET(request: NextRequest, { params }: RouteParams) {
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
        participants: {
          orderBy: { joinedAt: "asc" },
        },
        chatMessages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "الاجتماع غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: meeting });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الاجتماع" },
      { status: 500 }
    );
  }
}

// PATCH /api/teacher-room/meetings/[id] - Update meeting (start, end, etc)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Only host or admin can modify
    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "فقط المضيف يمكنه تعديل الاجتماع" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    let data: Record<string, unknown> = {};

    switch (action) {
      case "start":
        if (meeting.status !== "SCHEDULED") {
          return NextResponse.json(
            { ok: false, error: "الاجتماع ليس مجدولاً" },
            { status: 400 }
          );
        }
        data = { status: "LIVE", startedAt: new Date() };
        // Activate host participant
        await db.meetingParticipant.updateMany({
          where: { meetingId: id, userId: user.id },
          data: { isActive: true, joinedAt: new Date() },
        });
        break;

      case "end":
        if (meeting.status !== "LIVE") {
          return NextResponse.json(
            { ok: false, error: "الاجتماع ليس قيد التشغيل" },
            { status: 400 }
          );
        }
        const endTime = new Date();
        const duration = meeting.startedAt
          ? Math.round((endTime.getTime() - meeting.startedAt.getTime()) / 60000)
          : 0;
        data = { status: "ENDED", endedAt: endTime, duration };
        // Deactivate all participants
        await db.meetingParticipant.updateMany({
          where: { meetingId: id },
          data: { isActive: false, leftAt: endTime },
        });
        break;

      case "cancel":
        if (meeting.status === "ENDED") {
          return NextResponse.json(
            { ok: false, error: "لا يمكن إلغاء اجتماع منتهي" },
            { status: 400 }
          );
        }
        data = { status: "CANCELLED" };
        break;

      default:
        // General update
        data = {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.description !== undefined && { description: updateData.description }),
        };
    }

    const updated = await db.teacherMeeting.update({
      where: { id },
      data,
      include: {
        participants: true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تحديث الاجتماع" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher-room/meetings/[id] - Delete meeting
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
    const meeting = await db.teacherMeeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "الاجتماع غير موجود" },
        { status: 404 }
      );
    }

    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "فقط المضيف يمكنه حذف الاجتماع" },
        { status: 403 }
      );
    }

    await db.teacherMeeting.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في حذف الاجتماع" },
      { status: 500 }
    );
  }
}
