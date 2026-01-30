import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ForgotPasswordSchema } from "@/lib/validations";
import { createVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/resend";
import { getPasswordResetEmailTemplate } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = ForgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    // Find user (don't reveal if user exists or not for security)
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        ok: true,
        data: {
          message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور.",
        },
      });
    }
    
    // Check if user is suspended
    if (user.status === "SUSPENDED") {
      return NextResponse.json({
        ok: true,
        data: {
          message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور.",
        },
      });
    }
    
    // Create reset token
    const tokenResult = await createVerificationToken(user.id, "PASSWORD_RESET");
    if (!tokenResult.ok || !tokenResult.token) {
      console.error("[ForgotPassword] Failed to create token");
      return NextResponse.json({
        ok: true,
        data: {
          message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور.",
        },
      });
    }
    
    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${tokenResult.token}`;
    
    // Send reset email
    const emailHtml = getPasswordResetEmailTemplate({
      name: user.name,
      resetUrl,
    });
    
    const emailResult = await sendEmail({
      to: user.email,
      subject: "إعادة تعيين كلمة المرور - تبيان",
      html: emailHtml,
    });
    
    if (!emailResult.ok) {
      console.error("[ForgotPassword] Failed to send email:", emailResult.error);
    }
    
    return NextResponse.json({
      ok: true,
      data: {
        message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور.",
      },
    });
  } catch (error) {
    console.error("[ForgotPassword] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
