import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const chatMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

// GET /api/teacher-room/meetings/[id]/chat - Get chat messages
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

  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after"); // Get messages after this timestamp

  try {
    const messages = await db.meetingChatMessage.findMany({
      where: {
        meetingId: id,
        ...(after && { createdAt: { gt: new Date(after) } }),
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, data: messages });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الرسائل" },
      { status: 500 }
    );
  }
}

// POST /api/teacher-room/meetings/[id]/chat - Send chat message
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
    // Verify user is a participant
    const participant = await db.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
    });

    if (!participant || !participant.isActive) {
      return NextResponse.json(
        { ok: false, error: "يجب الانضمام للاجتماع أولاً" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = chatMessageSchema.parse(body);

    const message = await db.meetingChatMessage.create({
      data: {
        meetingId: id,
        content: data.content,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: null,
      },
    });

    return NextResponse.json({ ok: true, data: message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إرسال الرسالة" },
      { status: 500 }
    );
  }
}
