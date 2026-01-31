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

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

// POST /api/teacher-room/messages/[id]/reactions - Add reaction
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
    const body = await request.json();
    const data = reactionSchema.parse(body);

    // Check if message exists
    const message = await db.teacherRoomMessage.findUnique({
      where: { id },
    });

    if (!message || message.isDeleted) {
      return NextResponse.json(
        { ok: false, error: "الرسالة غير موجودة" },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const existing = await db.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: id,
          userId: user.id,
          emoji: data.emoji,
        },
      },
    });

    if (existing) {
      // Remove reaction (toggle)
      await db.messageReaction.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ ok: true, data: { action: "removed" } });
    }

    // Add reaction
    const reaction = await db.messageReaction.create({
      data: {
        messageId: id,
        userId: user.id,
        userName: user.name,
        emoji: data.emoji,
      },
    });

    return NextResponse.json({ ok: true, data: { action: "added", reaction } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }
    console.error("Error toggling reaction:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في التفاعل" },
      { status: 500 }
    );
  }
}
