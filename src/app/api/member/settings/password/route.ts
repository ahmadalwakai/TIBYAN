import { NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PasswordSchema = z.object({
  currentPassword: z.string().min(8, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة غير متطابقة",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const access = await assertRoleAccess({ requiredRole: "MEMBER", user });
  if (!access.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: access.error,
        code: access.code,
        data: { nextAction: access.nextAction, role: user?.role },
      },
      { status: access.status }
    );
  }
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = PasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const isValid = await compare(parsed.data.currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    const newHash = await hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });

    return NextResponse.json({ ok: true, data: { updated: true } });
  } catch (error) {
    console.error("[MemberPassword] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء تحديث كلمة المرور" },
      { status: 500 }
    );
  }
}
