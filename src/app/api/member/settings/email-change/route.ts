import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EmailChangeSchema = z.object({
  newEmail: z.string().email("البريد الإلكتروني غير صالح"),
  note: z.string().max(500, "الملاحظة طويلة جداً").optional(),
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
    const parsed = EmailChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { newEmail, note } = parsed.data;
    const message = `طلب تغيير البريد إلى: ${newEmail}${note ? `\nملاحظة: ${note}` : ""}`;

    const ticket = await prisma.memberSupportTicket.create({
      data: {
        userId: user.id,
        subject: "طلب تغيير البريد الإلكتروني",
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
      const escapedEmail = escapeHtml(newEmail);
      const escapedNote = note ? escapeHtml(note) : "";
      if (admins.length > 0) {
        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: "طلب تغيير البريد الإلكتروني",
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">
                <p>مرحباً ${admin.name},</p>
                <p>تم استلام طلب تغيير بريد إلكتروني من العضو:</p>
                <ul>
                  <li><strong>الاسم:</strong> ${escapeHtml(user.name)}</li>
                  <li><strong>البريد الحالي:</strong> ${escapeHtml(user.email)}</li>
                  <li><strong>البريد الجديد:</strong> ${escapedEmail}</li>
                </ul>
                ${escapedNote ? `<p><strong>ملاحظة:</strong> ${escapedNote}</p>` : ""}
              </div>
            `,
          });
        }
        emailSent = true;
      }
    } catch (error) {
      console.error("[MemberEmailChange] Email send failed:", error);
    }

    return NextResponse.json({ ok: true, data: { ticketId: ticket.id, emailSent } });
  } catch (error) {
    console.error("[MemberEmailChange] Error:", error);
    return NextResponse.json(
      { ok: false, error: "تعذر إرسال الطلب" },
      { status: 500 }
    );
  }
}
