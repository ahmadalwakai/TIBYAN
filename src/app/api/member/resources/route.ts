import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  type: z.enum(["LINK", "DOCUMENT", "ARTICLE"]).optional(),
});

const CreateSchema = z
  .object({
    title: z.string().min(3, "العنوان مطلوب").max(140),
    type: z.enum(["LINK", "DOCUMENT", "ARTICLE"]),
    url: z.string().url().optional(),
    content: z.string().max(5000).optional(),
  })
  .refine((data) => Boolean(data.url || data.content), {
    message: "يجب توفير رابط أو محتوى",
  });

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const rawQuery = {
    q: searchParams.get("q") ?? undefined,
    type: (searchParams.get("type") as "LINK" | "DOCUMENT" | "ARTICLE" | null) ?? undefined,
  };

  const parsed = QuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { q, type } = parsed.data;
  const normalizedQuery = q?.toLowerCase();

  const resources = await prisma.memberResource.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(normalizedQuery
        ? {
            OR: [
              { title: { contains: normalizedQuery, mode: "insensitive" } },
              { content: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      url: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      resources,
      total: resources.length,
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      {
        ok: false,
        error: "Admin access required",
        code: "FORBIDDEN",
      },
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

    const resource = await prisma.memberResource.create({
      data: {
        title: parsed.data.title,
        type: parsed.data.type,
        url: parsed.data.url ?? null,
        content: parsed.data.content ?? null,
        createdByUserId: user.id,
      },
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, data: resource });
  } catch (error) {
    console.error("[MemberResources] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء إنشاء المورد" },
      { status: 500 }
    );
  }
}