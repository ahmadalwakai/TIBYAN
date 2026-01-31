import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateParticipantSchema = z.object({
  participantId: z.string(),
  action: z.enum(["mute", "unmute", "camera-off", "camera-on", "allow-speak", "revoke-speak", "kick", "lower-hand"]),
});

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/teacher/lessons/[id]/participant - Update participant (teacher controls)
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

    // Only teacher or admin can control participants
    if (session.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "فقط المعلم يمكنه التحكم في المشاركين" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { participantId, action } = updateParticipantSchema.parse(body);

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "mute":
        updateData = { isMuted: true };
        break;
      case "unmute":
        updateData = { isMuted: false };
        break;
      case "camera-off":
        updateData = { isCameraOff: true };
        break;
      case "camera-on":
        updateData = { isCameraOff: false };
        break;
      case "allow-speak":
        updateData = { canSpeak: true };
        break;
      case "revoke-speak":
        updateData = { canSpeak: false, isMuted: true };
        break;
      case "lower-hand":
        updateData = { isHandRaised: false };
        break;
      case "kick":
        updateData = { isActive: false, leftAt: new Date() };
        break;
      default:
        return NextResponse.json(
          { ok: false, error: "إجراء غير صالح" },
          { status: 400 }
        );
    }

    await db.sessionParticipant.update({
      where: { id: participantId },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/lessons/[id]/participant - Student self-update (hand raise, etc.)
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
        participants: { where: { userId: user.id } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    if (session.participants.length === 0) {
      return NextResponse.json(
        { ok: false, error: "لست مشاركاً في هذه الحصة" },
        { status: 403 }
      );
    }

    const participant = session.participants[0];
    const body = await request.json();
    const { action } = body;

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "raise-hand":
        if (!session.allowHandRaise) {
          return NextResponse.json(
            { ok: false, error: "رفع اليد غير مسموح في هذه الحصة" },
            { status: 400 }
          );
        }
        updateData = { isHandRaised: true };
        break;
      case "lower-hand":
        updateData = { isHandRaised: false };
        break;
      case "mute":
        updateData = { isMuted: true };
        break;
      case "unmute":
        if (!participant.canSpeak) {
          return NextResponse.json(
            { ok: false, error: "ليس لديك صلاحية للتحدث" },
            { status: 400 }
          );
        }
        updateData = { isMuted: false };
        break;
      case "camera-on":
        if (!session.allowStudentCamera) {
          return NextResponse.json(
            { ok: false, error: "الكاميرا غير مسموحة في هذه الحصة" },
            { status: 400 }
          );
        }
        updateData = { isCameraOff: false };
        break;
      case "camera-off":
        updateData = { isCameraOff: true };
        break;
      default:
        return NextResponse.json(
          { ok: false, error: "إجراء غير صالح" },
          { status: 400 }
        );
    }

    await db.sessionParticipant.update({
      where: { id: participant.id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
