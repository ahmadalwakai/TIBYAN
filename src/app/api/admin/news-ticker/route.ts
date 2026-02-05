import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const newsTickerSchema = z.object({
  textAr: z.string().min(1, "Arabic text is required"),
  textEn: z.string().min(1, "English text is required"),
  link: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  priority: z.number().int().optional().default(0),
});

// GET - List all news items
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const news = await db.newsTicker.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ ok: true, data: news });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// POST - Create new news item
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = newsTickerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const news = await db.newsTicker.create({
      data: {
        textAr: parsed.data.textAr,
        textEn: parsed.data.textEn,
        link: parsed.data.link || null,
        isActive: parsed.data.isActive,
        priority: parsed.data.priority,
      },
    });

    return NextResponse.json({ ok: true, data: news }, { status: 201 });
  } catch (error) {
    console.error("Failed to create news:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create news" },
      { status: 500 }
    );
  }
}
