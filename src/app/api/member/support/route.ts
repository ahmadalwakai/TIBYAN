import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const SupportSchema = z.object({
  subject: z.string().min(3, "الموضوع مطلوب").max(120),
  message: z.string().min(10, "الرسالة قصيرة جداً").max(2000),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getClientIp(request), {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (rateLimit.limited) {
    return NextResponse.json(
      { ok: false, error: "عدد المحاولات كثير جداً. يرجى المحاولة لاحقاً.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

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
  const memberUser = user;

  try {
    const body = await request.json();
    const parsed = SupportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { subject, message } = parsed.data;
    const escapedSubject = escapeHtml(subject);
    const escapedMessage = escapeHtml(message);
    const ticket = await prisma.memberSupportTicket.create({
      data: {
        userId: memberUser.id,
        subject,
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
        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: `طلب دعم من عضو: ${escapedSubject}`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">
                <p>مرحباً ${admin.name},</p>
                <p>تم استلام طلب دعم جديد من العضو:</p>
                <ul>
                  <li><strong>الاسم:</strong> ${memberUser.name}</li>
                  <li><strong>البريد:</strong> ${memberUser.email}</li>
                  <li><strong>الموضوع:</strong> ${escapedSubject}</li>
                </ul>
                <p><strong>الرسالة:</strong></p>
                <p>${escapedMessage.replace(/\n/g, "<br />")}</p>
              </div>
            `,
          });
        }
        emailSent = true;
      }
    } catch (error) {
      console.error("[MemberSupport] Email send failed:", error);
    }

    return NextResponse.json({
      ok: true,
      data: {
        ticketId: ticket.id,
        emailSent,
      },
    });
  } catch (error) {
    console.error("[MemberSupport] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء إرسال الطلب" },
      { status: 500 }
    );
  }
}