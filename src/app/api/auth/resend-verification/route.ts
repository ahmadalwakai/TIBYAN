import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/resend";
import { getVerificationEmailTemplate } from "@/lib/email/templates";
import { z } from "zod";

const ResendVerificationSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = ResendVerificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        ok: true,
        data: {
          message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط التحقق.",
        },
      });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        ok: true,
        data: {
          message: "البريد الإلكتروني مؤكد مسبقاً. يمكنك تسجيل الدخول.",
        },
      });
    }
    
    // Create new verification token
    const tokenResult = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
    if (!tokenResult.ok || !tokenResult.token) {
      console.error("[ResendVerification] Failed to create token");
      return NextResponse.json({
        ok: true,
        data: {
          message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط التحقق.",
        },
      });
    }
    
    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verificationUrl = `${baseUrl}/auth/verify?token=${tokenResult.token}`;
    
    // Send verification email
    const emailHtml = getVerificationEmailTemplate({
      name: user.name,
      verificationUrl,
    });
    
    const emailResult = await sendEmail({
      to: user.email,
      subject: "تأكيد بريدك الإلكتروني - تبيان",
      html: emailHtml,
    });
    
    if (!emailResult.ok) {
      console.error("[ResendVerification] Failed to send email:", emailResult.error);
    }
    
    return NextResponse.json({
      ok: true,
      data: {
        message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط التحقق.",
      },
    });
  } catch (error) {
    console.error("[ResendVerification] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
