import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";

const createMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(["TEXT", "VOICE", "FILE", "SYSTEM"]).default("TEXT"),
  voiceUrl: z.string().optional(),
  voiceDuration: z.number().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentType: z.string().optional(),
  replyToId: z.string().optional(),
});

// GET /api/teacher-room/messages - Get messages
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  // Only INSTRUCTOR and ADMIN can access
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "غرفة المعلمين للمدرسين والإداريين فقط" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
    const messages = await db.teacherRoomMessage.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            authorName: true,
            type: true,
          },
        },
        reactions: true,
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, -1) : messages;

    return NextResponse.json({
      ok: true,
      data: {
        messages: data.reverse(), // Oldest first for display
        nextCursor: hasMore ? data[data.length - 1]?.id : null,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الرسائل" },
      { status: 500 }
    );
  }
}

// POST /api/teacher-room/messages - Send a message
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
    const data = createMessageSchema.parse(body);

    // Must have content or voice
    if (!data.content && !data.voiceUrl && !data.attachmentUrl) {
      return NextResponse.json(
        { ok: false, error: "يجب إرسال محتوى نصي أو صوتي أو ملف" },
        { status: 400 }
      );
    }

    const message = await db.teacherRoomMessage.create({
      data: {
        content: data.content,
        type: data.type,
        voiceUrl: data.voiceUrl,
        voiceDuration: data.voiceDuration,
        attachmentUrl: data.attachmentUrl,
        attachmentName: data.attachmentName,
        attachmentType: data.attachmentType,
        replyToId: data.replyToId,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: null,
        authorRole: user.role,
      },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            authorName: true,
            type: true,
          },
        },
        reactions: true,
      },
    });

    return NextResponse.json({ ok: true, data: message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating message:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إرسال الرسالة" },
      { status: 500 }
    );
  }
}
