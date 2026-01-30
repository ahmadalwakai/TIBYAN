import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { LoginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }
    
    // Check if email is verified (only if field exists)
    const emailVerified = (user as { emailVerified?: boolean }).emailVerified;
    if (emailVerified === false) {
      return NextResponse.json(
        { ok: false, error: "يرجى تأكيد بريدك الإلكتروني أولاً" },
        { status: 403 }
      );
    }
    
    // Check if user is suspended
    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { ok: false, error: "تم تعليق حسابك. يرجى التواصل مع الدعم." },
        { status: 403 }
      );
    }
    
    // Check if user is pending (shouldn't reach here if emailVerified is checked)
    if (user.status === "PENDING") {
      return NextResponse.json(
        { ok: false, error: "حسابك قيد المراجعة" },
        { status: 403 }
      );
    }
    
    // Verify password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }
    
    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    
    // Create session data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
    
    // Set cookies
    const cookieStore = await cookies();
    
    // Simple token (in production, use JWT or session management)
    const authToken = Buffer.from(JSON.stringify({ userId: user.id, timestamp: Date.now() })).toString("base64");
    
    cookieStore.set("auth-token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    
    cookieStore.set("user-data", JSON.stringify(userData), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    
    return NextResponse.json({
      ok: true,
      data: {
        user: userData,
        message: "تم تسجيل الدخول بنجاح",
      },
    });
  } catch (error) {
    console.error("[Login] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تسجيل الدخول" },
      { status: 500 }
    );
  }
}
