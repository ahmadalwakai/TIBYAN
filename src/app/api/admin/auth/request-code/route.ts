import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { getAdminLoginCodeTemplate } from "@/lib/email/templates";
import { AdminLoginRequestSchema } from "@/lib/validations";
import { isAuthorizedAdmin, VERIFICATION_CODE_CONFIG } from "@/config/admin";

/**
 * Generate a random 6-digit code
 */
function generateVerificationCode(): string {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(VERIFICATION_CODE_CONFIG.LENGTH, "0");
}

/**
 * POST /api/admin/auth/request-code
 * Request a verification code for admin login
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = AdminLoginRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error.issues[0]?.message || "Invalid email",
        },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Check if email is authorized admin
    if (!isAuthorizedAdmin(email)) {
      // Don't reveal if email is not admin (security)
      return NextResponse.json(
        {
          ok: true,
          data: {
            message: "إذا كان البريد مسجل كمسؤول، ستتلقى رمز التحقق خلال دقائق.",
          },
        },
        { status: 200 }
      );
    }

    // Clean up expired codes
    await prisma.emailVerificationCode.deleteMany({
      where: {
        email: email.toLowerCase(),
        expiresAt: { lt: new Date() },
      },
    });

    // Check for recent code attempts (rate limiting)
    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email: email.toLowerCase(),
        purpose: "ADMIN_LOGIN",
        usedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last 60 seconds
        },
      },
    });

    if (recentCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "يرجى الانتظار قبل طلب رمز جديد",
        },
        { status: 429 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    console.log("[Admin Auth] Creating verification code:", { email: email.toLowerCase(), code });

    // Save code to database
    const savedCode = await prisma.emailVerificationCode.create({
      data: {
        email: email.toLowerCase(),
        code,
        purpose: "ADMIN_LOGIN",
        expiresAt,
      },
    });

    console.log("[Admin Auth] Saved code to DB:", { id: savedCode.id, code: savedCode.code });

    // Send email with code
    console.log("[Admin Auth] Sending email with code:", code);
    const emailResult = await sendEmail({
      to: email,
      subject: "رمز دخول منصة تبيان - Admin Login Code",
      html: getAdminLoginCodeTemplate({ code }),
    });
    console.log("[Admin Auth] Email sent result:", emailResult.ok);

    if (!emailResult.ok) {
      // Clean up code if email fails
      await prisma.emailVerificationCode.deleteMany({
        where: { code },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "حدث خطأ عند إرسال البريد. يرجى المحاولة لاحقاً.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
          expiresIn: VERIFICATION_CODE_CONFIG.EXPIRY_MINUTES * 60, // Convert to seconds for client countdown
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Auth] Request code error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "حدث خطأ في الخادم",
      },
      { status: 500 }
    );
  }
}
