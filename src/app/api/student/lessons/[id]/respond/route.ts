import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";

const responseSchema = z.object({
  response: z.enum(["accept", "decline"]),
});

// POST /api/student/lessons/[id]/respond - Accept or decline invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { response } = parsed.data;

    // Find the invitation
    const invitation = await db.sessionInvitation.findFirst({
      where: {
        sessionId,
        userId: user.id,
        status: "PENDING",
      },
      include: {
        session: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { ok: false, error: "لم يتم العثور على الدعوة" },
        { status: 404 }
      );
    }

    // Update invitation status
    const newStatus = response === "accept" ? "ACCEPTED" : "DECLINED";
    await db.sessionInvitation.update({
      where: { id: invitation.id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      ok: true,
      data: {
        status: newStatus,
        sessionId,
      },
    });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
