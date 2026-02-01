import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CloseSchema = z.object({
  ticketId: z.string().min(1),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Admin access required", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const tickets = await prisma.memberSupportTicket.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ ok: true, data: { tickets } });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Admin access required", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = CloseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const ticket = await prisma.memberSupportTicket.update({
      where: { id: parsed.data.ticketId },
      data: { status: "CLOSED" },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, data: ticket });
  } catch (error) {
    console.error("[AdminMemberSupport] Error:", error);
    return NextResponse.json(
      { ok: false, error: "تعذر تحديث الطلب" },
      { status: 500 }
    );
  }
}
