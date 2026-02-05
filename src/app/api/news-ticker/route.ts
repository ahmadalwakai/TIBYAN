import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const news = await db.newsTicker.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        textAr: true,
        textEn: true,
        link: true,
      },
    });

    return NextResponse.json({ ok: true, data: news });
  } catch (error) {
    console.error("Failed to fetch news ticker:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
