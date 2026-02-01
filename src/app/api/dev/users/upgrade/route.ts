import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpgradeSchema = z.object({
  email: z.string().email(),
  role: z.literal("MEMBER"),
  emailVerified: z.literal(true),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  console.warn("DEV ONLY endpoint used");

  try {
    const body = await request.json();
    const result = UpgradeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const normalizedEmail = result.data.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "MEMBER", emailVerified: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        email: updated.email,
        role: updated.role,
        emailVerified: (updated as { emailVerified?: boolean }).emailVerified ?? true,
      },
    });
  } catch (error) {
    console.error("[Dev Upgrade] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
