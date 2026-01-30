import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userDataStr = cookieStore.get("user-data")?.value;
  if (!userDataStr) return null;
  try {
    const userData = JSON.parse(userDataStr);
    return userData.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "المستخدم غير موجود" }, { status: 404 });
    }

    const data = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      phone: null, // Add phone field to schema if needed
      createdAt: new Date(user.createdAt).toLocaleDateString("ar-SA"),
      emailVerified: user.emailVerified,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[Student Profile GET]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}

const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
});

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const result = UpdateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, bio } = result.data;

    await prisma.user.update({
      where: { id: userId },
      data: { name, bio },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Student Profile PUT]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
