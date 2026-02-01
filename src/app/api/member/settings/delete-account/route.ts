import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DeleteRequestSchema = z.object({
  reason: z.string().max(500, "السبب طويل جداً").optional(),
});

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const access = await assertRoleAccess({ requiredRole: "MEMBER", user });
  if (!access.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: access.error,
        code: access.code,
        data: { nextAction: access.nextAction, role: user?.role },
      },
      { status: access.status }
    );
  }
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = DeleteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const reason = parsed.data.reason?.trim();
    const message = reason ? `سبب الحذف: ${reason}` : "طلب حذف الحساب";

    const ticket = await prisma.memberSupportTicket.create({
      data: {
        userId: user.id,
        subject: "طلب حذف الحساب",
        message,
      },
      select: { id: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, name: true },
    });

    let emailSent = false;
    try {
      const { sendEmail } = await import("@/lib/email/resend");
      if (admins.length > 0) {
        const escapedReason = reason ? escapeHtml(reason) : "";
        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: "طلب حذف الحساب",
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">
                <p>مرحباً ${admin.name},</p>
                <p>تم استلام طلب حذف حساب من العضو:</p>
                <ul>
                  <li><strong>الاسم:</strong> ${escapeHtml(user.name)}</li>
                  <li><strong>البريد:</strong> ${escapeHtml(user.email)}</li>
                </ul>
                ${escapedReason ? `<p><strong>السبب:</strong> ${escapedReason}</p>` : ""}
              </div>
            `,
          });
        }
        emailSent = true;
      }
    } catch (error) {
      console.error("[MemberDeleteAccount] Email send failed:", error);
    }

    return NextResponse.json({ ok: true, data: { ticketId: ticket.id, emailSent } });
  } catch (error) {
    console.error("[MemberDeleteAccount] Error:", error);
    return NextResponse.json(
      { ok: false, error: "تعذر إرسال الطلب" },
      { status: 500 }
    );
  }
}
