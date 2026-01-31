import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { AdminVerifyCodeSchema } from "@/lib/validations";
import { isAuthorizedAdmin } from "@/config/admin";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/auth/verify-code
 * Verify the code and create auth session for admin
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = AdminVerifyCodeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const { email, code } = result.data;

    // Check if email is authorized admin
    if (!isAuthorizedAdmin(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "البريد الإلكتروني غير مصرح به",
        },
        { status: 403 }
      );
    }

    // Find and verify code
    const verificationCode = await prisma.emailVerificationCode.findUnique({
      where: { code },
    });

    console.log("[Admin Auth] Verify code lookup:", {
      inputCode: code,
      found: !!verificationCode,
      storedEmail: verificationCode?.email,
      inputEmail: email.toLowerCase(),
      expired: verificationCode ? verificationCode.expiresAt < new Date() : null,
      used: verificationCode?.usedAt,
    });

    if (!verificationCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "الرمز غير صحيح",
        },
        { status: 400 }
      );
    }

    // Check if code is for the correct email
    if (verificationCode.email !== email.toLowerCase()) {
      return NextResponse.json(
        {
          ok: false,
          error: "الرمز غير متطابق مع البريد الإلكتروني",
        },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (verificationCode.expiresAt < new Date()) {
      return NextResponse.json(
        {
          ok: false,
          error: "انتهت صلاحية الرمز",
        },
        { status: 400 }
      );
    }

    // Check if code is already used
    if (verificationCode.usedAt) {
      return NextResponse.json(
        {
          ok: false,
          error: "تم استخدام هذا الرمز بالفعل",
        },
        { status: 400 }
      );
    }

    // Mark code as used
    await prisma.emailVerificationCode.update({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() },
    });

    // Get or create admin user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Create admin user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: "المسؤول",
          password: "", // No password for email-based login
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
    } else {
      // Ensure user is ADMIN and ACTIVE
      if (user.role !== "ADMIN" || user.status !== "ACTIVE") {
        return NextResponse.json(
          {
            ok: false,
            error: "لا يمتلك هذا الحساب صلاحيات إدارية",
          },
          { status: 403 }
        );
      }
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      role: user.role,
    });

    // Create response with secure cookie
    const response = NextResponse.json(
      {
        ok: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Admin Auth] Verify code error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "حدث خطأ في الخادم",
      },
      { status: 500 }
    );
  }
}
