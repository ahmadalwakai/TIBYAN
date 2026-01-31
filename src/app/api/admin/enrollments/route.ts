import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

// Get enrollments for admin
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!db.enrollment) {
      return NextResponse.json({
        ok: true,
        data: {
          enrollments: [],
          stats: {
            total: 0,
            active: 0,
            completed: 0,
          },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;

    const [enrollments, total, activeCount, completedCount] = await Promise.all([
      db.enrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
        skip,
        take: limit,
      }),
      db.enrollment.count({ where }),
      db.enrollment.count({ where: { status: "ACTIVE" } }),
      db.enrollment.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        enrollments,
        stats: {
          total,
          active: activeCount,
          completed: completedCount,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
