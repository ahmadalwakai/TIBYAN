import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  textAr: z.string().min(1).optional(),
  textEn: z.string().min(1).optional(),
  link: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single news item
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const news = await db.newsTicker.findUnique({
      where: { id },
    });

    if (!news) {
      return NextResponse.json(
        { ok: false, error: "News item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: news });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// PATCH - Update news item
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const news = await db.newsTicker.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true, data: news });
  } catch (error) {
    console.error("Failed to update news:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update news" },
      { status: 500 }
    );
  }
}

// DELETE - Delete news item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    await db.newsTicker.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    console.error("Failed to delete news:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete news" },
      { status: 500 }
    );
  }
}
