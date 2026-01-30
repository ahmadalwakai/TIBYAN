import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { ResetPasswordSchema } from "@/lib/validations";
import { verifyToken, markTokenUsed } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = ResetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { token, password } = result.data;
    
    // Verify token
    const tokenResult = await verifyToken(token, "PASSWORD_RESET");
    if (!tokenResult.ok || !tokenResult.userId) {
      return NextResponse.json(
        { ok: false, error: tokenResult.error ?? "رابط غير صالح" },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedPassword = await hash(password, 12);
    
    // Update user password
    await prisma.user.update({
      where: { id: tokenResult.userId },
      data: { password: hashedPassword },
    });
    
    // Mark token as used
    await markTokenUsed(token);
    
    return NextResponse.json({
      ok: true,
      data: {
        message: "تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.",
      },
    });
  } catch (error) {
    console.error("[ResetPassword] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إعادة تعيين كلمة المرور" },
      { status: 500 }
    );
  }
}
