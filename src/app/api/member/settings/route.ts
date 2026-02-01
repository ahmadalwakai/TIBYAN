import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PrefsSchema = z.object({
  email: z.boolean(),
  announcements: z.boolean(),
  community: z.boolean(),
});

const defaultPrefs = {
  email: true,
  announcements: true,
  community: true,
};

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
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const settings = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationPrefs: true },
  });

  return NextResponse.json({
    ok: true,
    data: {
      notificationPrefs: (settings?.notificationPrefs as typeof defaultPrefs | null) ?? defaultPrefs,
    },
  });
}

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
    const parsed = PrefsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { notificationPrefs: parsed.data },
      select: { notificationPrefs: true },
    });

    return NextResponse.json({ ok: true, data: { notificationPrefs: updated.notificationPrefs } });
  } catch (error) {
    console.error("[MemberSettings] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء تحديث الإعدادات" },
      { status: 500 }
    );
  }
}
