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

const updateParticipantSchema = z.object({
  isMuted: z.boolean().optional(),
  isCameraOff: z.boolean().optional(),
  isHandRaised: z.boolean().optional(),
});

// PATCH /api/teacher-room/meetings/[id]/participant - Update own participant status
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
    const body = await request.json();
    const data = updateParticipantSchema.parse(body);

    const participant = await db.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
    });

    if (!participant || !participant.isActive) {
      return NextResponse.json(
        { ok: false, error: "أنت لست في هذا الاجتماع" },
        { status: 400 }
      );
    }

    const updated = await db.meetingParticipant.update({
      where: { id: participant.id },
      data: {
        ...(data.isMuted !== undefined && { isMuted: data.isMuted }),
        ...(data.isCameraOff !== undefined && { isCameraOff: data.isCameraOff }),
        ...(data.isHandRaised !== undefined && { isHandRaised: data.isHandRaised }),
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
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في التحديث" },
      { status: 500 }
    );
  }
}

// GET /api/teacher-room/meetings/[id]/participant - Get all active participants
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
    const participants = await db.meetingParticipant.findMany({
      where: { meetingId: id, isActive: true },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({ ok: true, data: participants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب المشاركين" },
      { status: 500 }
    );
  }
}
