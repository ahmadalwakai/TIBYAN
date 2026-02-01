import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب").max(140),
  body: z.string().min(10, "النص مطلوب").max(3000),
});

export async function GET() {
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

  const announcements = await prisma.memberAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, data: { announcements } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Admin access required", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const announcement = await prisma.memberAnnouncement.create({
      data: parsed.data,
      select: { id: true, title: true, body: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, data: announcement });
  } catch (error) {
    console.error("[MemberAnnouncements] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء إنشاء الإعلان" },
      { status: 500 }
    );
  }
}