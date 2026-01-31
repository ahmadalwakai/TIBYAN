import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateMessageSchema = z.object({
  content: z.string().min(1),
});

// GET /api/teacher-room/messages/[id] - Get single message
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
    const message = await db.teacherRoomMessage.findUnique({
      where: { id },
      include: {
        replyTo: {
          select: { id: true, content: true, authorName: true, type: true },
        },
        reactions: true,
        replies: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
          include: { reactions: true },
        },
      },
    });

    if (!message || message.isDeleted) {
      return NextResponse.json(
        { ok: false, error: "الرسالة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: message });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الرسالة" },
      { status: 500 }
    );
  }
}

// PATCH /api/teacher-room/messages/[id] - Edit message
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
    const message = await db.teacherRoomMessage.findUnique({
      where: { id },
    });

    if (!message || message.isDeleted) {
      return NextResponse.json(
        { ok: false, error: "الرسالة غير موجودة" },
        { status: 404 }
      );
    }

    // Only author or admin can edit
    if (message.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "لا يمكنك تعديل هذه الرسالة" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateMessageSchema.parse(body);

    const updated = await db.teacherRoomMessage.update({
      where: { id },
      data: {
        content: data.content,
        isEdited: true,
      },
      include: {
        replyTo: {
          select: { id: true, content: true, authorName: true, type: true },
        },
        reactions: true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }
    console.error("Error updating message:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تعديل الرسالة" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher-room/messages/[id] - Delete message
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
    const message = await db.teacherRoomMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "الرسالة غير موجودة" },
        { status: 404 }
      );
    }

    // Only author or admin can delete
    if (message.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "لا يمكنك حذف هذه الرسالة" },
        { status: 403 }
      );
    }

    // Soft delete
    await db.teacherRoomMessage.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في حذف الرسالة" },
      { status: 500 }
    );
  }
}
