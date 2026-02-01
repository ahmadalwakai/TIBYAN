import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").optional(),
  bio: z.string().max(500, "النبذة يجب أن لا تتجاوز 500 حرف").optional(),
  avatar: z.string().url("رابط الصورة غير صالح").optional(),
});

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول أولاً" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = UpdateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatar && { avatar: data.avatar }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("[UpdateProfile] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تحديث الملف الشخصي" },
      { status: 500 }
    );
  }
}
