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
    
    // Create user with PENDING status (needs email verification)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
        status: "PENDING",
        emailVerified: false,
      },
    });
    
    // Create verification token
    const tokenResult = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
    if (!tokenResult.ok || !tokenResult.token) {
      // Delete user if token creation fails
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { ok: false, error: "فشل في إنشاء رابط التحقق" },
        { status: 500 }
      );
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
      console.error("[Register] Failed to send verification email:", emailResult.error);
      // Don't delete user, they can request a new email later
    }
    
    return NextResponse.json({
      ok: true,
      data: {
        message: "تم إنشاء الحساب بنجاح. يرجى تفقد بريدك الإلكتروني لتفعيل الحساب.",
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في التسجيل" },
      { status: 500 }
    );
  }
}
