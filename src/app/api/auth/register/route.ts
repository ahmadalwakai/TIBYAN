import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { RegisterSchema } from "@/lib/validations";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Force Node.js runtime for Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withRateLimit(request, RATE_LIMITS.auth, async () => {
    try {
      const body = await request.json();
    
    // Validate input
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "STUDENT",
        status: "ACTIVE", // Account is active, but STUDENT login still requires email verification
        emailVerified: false,
      },
    });
    
    // Try to send verification email (non-blocking)
    let emailSent = false;
    try {
      const { createVerificationToken } = await import("@/lib/auth/tokens");
      const { sendEmail } = await import("@/lib/email/resend");
      const { getVerificationEmailTemplate } = await import("@/lib/email/templates");
      
      const tokenResult = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
      
      if (tokenResult.ok && tokenResult.token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.ti-by-an.com";
        const verificationUrl = `${baseUrl}/auth/verify?token=${tokenResult.token}`;
        
        const emailHtml = getVerificationEmailTemplate({
          name: user.name,
          verificationUrl,
        });
        
        await sendEmail({
          to: user.email,
          subject: "تأكيد بريدك الإلكتروني - تبيان",
          html: emailHtml,
        });
        emailSent = true;
      }
    } catch (emailError) {
      // Log but don't fail registration if email fails
      console.error("[Register] Email verification error (non-critical):", emailError);
    }
    
    return NextResponse.json({
      ok: true,
      data: {
        message: "تم إرسال رسالة إلى بريدك الإلكتروني. يرجى تأكيد بريدك الإلكتروني.",
        email: user.email,
        userId: user.id,
        emailSent,
      },
    });
  } catch (error) {
    console.error("[Register] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `حدث خطأ في التسجيل: ${errorMessage}` },
      { status: 500 }
    );
  }
  });
}
