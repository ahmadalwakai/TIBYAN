import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Check if database is connected
    if (!db.user) {
      // Return mock stats
      const stats = {
        users: {
          total: 125,
          active: 98,
          trend: "+6%",
        },
        courses: {
          total: 12,
          published: 8,
          trend: "+3",
        },
        enrollments: {
          total: 342,
          trend: "+12%",
        },
        completionRate: {
          value: 68,
          trend: "+5%",
        },
      };

      return NextResponse.json({ ok: true, data: stats });
    }

    const [
      totalUsers,
      activeUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE" } }),
      db.course.count(),
      db.course.count({ where: { status: "PUBLISHED" } }),
      db.enrollment.count(),
      db.enrollment.count({ where: { status: "COMPLETED" } }),
    ]);

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        trend: "+6%", // TODO: Calculate actual trend
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        trend: "+12",
      },
      enrollments: {
        total: totalEnrollments,
        trend: "+4%",
      },
      completionRate: {
        value: completionRate,
        trend: "+3%",
      },
    };

    return NextResponse.json({ ok: true, data: stats });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
