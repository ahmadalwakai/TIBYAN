import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const membership = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      membershipStatus: true,
      membershipPlan: true,
      membershipExpiresAt: true,
      membershipPerks: true,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      membership: {
        status: membership?.membershipStatus ?? "ACTIVE",
        plan: membership?.membershipPlan ?? "الخطة الأساسية",
        expiresAt: membership?.membershipExpiresAt,
        perks: (membership?.membershipPerks as string[] | null) ?? [],
      },
    },
  });
}
