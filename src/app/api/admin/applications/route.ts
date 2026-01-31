import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Check if database is available
    if (!db.teacherApplication) {
      return NextResponse.json({
        ok: true,
        data: {
          applications: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = status ? { status: status as "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" } : {};

    const [applications, total] = await Promise.all([
      db.teacherApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.teacherApplication.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
