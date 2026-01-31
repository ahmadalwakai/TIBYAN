import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VerifyEmailSchema } from "@/lib/validations";
import { verifyToken, markTokenUsed } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/resend";
import { getWelcomeEmailTemplate } from "@/lib/email/templates";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withRateLimit(request, RATE_LIMITS.auth, async () => {
    try {
      const body = await request.json();
    
    // Validate input
    const result = VerifyEmailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { token } = result.data;
    
    // Verify token
    const tokenResult = await verifyToken(token, "EMAIL_VERIFICATION");
    if (!tokenResult.ok || !tokenResult.userId) {
      return NextResponse.json(
        { ok: false, error: tokenResult.error ?? "رابط غير صالح" },
        { status: 400 }
      );
    }
    
    // Update user
    const user = await prisma.user.update({
      where: { id: tokenResult.userId },
      data: {
        emailVerified: true,
        status: "ACTIVE",
      },
    });
    
    // Mark token as used
    await markTokenUsed(token);
    
    // Send welcome email
    const emailHtml = getWelcomeEmailTemplate({ name: user.name });
    await sendEmail({
      to: user.email,
      subject: "مرحباً بك في تبيان! 🎉",
      html: emailHtml,
    });
    
    return NextResponse.json({
      ok: true,
      data: {
        message: "تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.",
      },
    });
  } catch (error) {
    console.error("[VerifyEmail] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في التحقق" },
      { status: 500 }
    );
  }
  });
}
