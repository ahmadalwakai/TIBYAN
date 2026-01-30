import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { RegisterSchema } from "@/lib/validations";
import { createVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/resend";
import { getVerificationEmailTemplate } from "@/lib/email/templates";

export async function POST(request: Request) {
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
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user - try with emailVerified, fallback without it
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          status: "PENDING",
          emailVerified: false,
        },
      });
    } catch (schemaError) {
      // Fallback: emailVerified field might not exist in DB yet
      console.warn("[Register] emailVerified field not available, creating without it");
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          status: "PENDING",
        },
      });
    }
    
    // Try to create verification token (might fail if table doesn't exist)
    let tokenResult: { ok: boolean; token?: string } = { ok: false };
    try {
      tokenResult = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
    } catch (tokenError) {
      console.warn("[Register] VerificationToken table not available:", tokenError);
    }
    
    // If token created successfully, send verification email
    if (tokenResult.ok && tokenResult.token) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const verificationUrl = `${baseUrl}/auth/verify?token=${tokenResult.token}`;
      
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
        console.error("[Register] Failed to send verification email:", emailResult.error);
      }
      
      return NextResponse.json({
        ok: true,
        data: {
          message: "تم إنشاء الحساب بنجاح. يرجى تفقد بريدك الإلكتروني لتفعيل الحساب.",
          userId: user.id,
        },
      });
    }
    
    // If email verification not available, account is created but needs manual activation
    return NextResponse.json({
      ok: true,
      data: {
        message: "تم إنشاء الحساب بنجاح.",
        userId: user.id,
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
}
