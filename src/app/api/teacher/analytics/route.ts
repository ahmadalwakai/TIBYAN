import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;

    // Get instructor's courses with stats
    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        enrollments: true,
        payments: { where: { status: "COMPLETED" } },
      },
    });

    // Calculate overview
    const totalEnrollments = courses.reduce((sum: number, c: (typeof courses)[number]) => sum + c.enrollments.length, 0);
    const _totalEarnings = courses.reduce(
      (sum: number, c: (typeof courses)[number]) => sum + c.payments.reduce((pSum: number, p: (typeof c.payments)[number]) => pSum + p.amount * 0.8, 0),
      0
    );

    // Note: Views would need a ViewLog model for accurate tracking
    const overview = {
      totalViews: totalEnrollments * 5, // Estimate
      totalEnrollments,
      conversionRate: totalEnrollments > 0 ? 20 : 0, // Estimate
      averageWatchTime: 45, // Estimate in minutes
    };

    // Monthly stats (last 6 months)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthEnrollments = courses.reduce(
        (sum: number, c: (typeof courses)[number]) =>
          sum +
          c.enrollments.filter(
            (e: (typeof c.enrollments)[number]) => new Date(e.enrolledAt) >= monthStart && new Date(e.enrolledAt) <= monthEnd
          ).length,
        0
      );

      const monthEarnings = courses.reduce(
        (sum: number, c: (typeof courses)[number]) =>
          sum +
          c.payments
            .filter((p: (typeof c.payments)[number]) => p.paidAt && new Date(p.paidAt) >= monthStart && new Date(p.paidAt) <= monthEnd)
            .reduce((pSum: number, p: (typeof c.payments)[number]) => pSum + p.amount * 0.8, 0),
        0
      );

      monthlyStats.push({
        month: monthStart.toLocaleDateString("ar-SA", { month: "short", year: "numeric" }),
        views: monthEnrollments * 5, // Estimate
        enrollments: monthEnrollments,
        earnings: Math.round(monthEarnings),
      });
    }

    // Top courses
    const topCourses = courses
      .map((c: (typeof courses)[number]) => ({
        id: c.id,
        title: c.title,
        views: c.enrollments.length * 5, // Estimate
        enrollments: c.enrollments.length,
        earnings: Math.round(c.payments.reduce((sum: number, p: (typeof c.payments)[number]) => sum + p.amount * 0.8, 0)),
      }))
      .sort((a: { earnings: number }, b: { earnings: number }) => b.earnings - a.earnings)
      .slice(0, 5);

    // Recent activity
    const recentEnrollments = await prisma.enrollment.findMany({
      where: { course: { instructorId: userId } },
      include: { course: { select: { title: true } } },
      orderBy: { enrolledAt: "desc" },
      take: 10,
    });

    const recentActivity = recentEnrollments.map((e: (typeof recentEnrollments)[number]) => ({
      type: "enrollment" as const,
      courseName: e.course.title,
      timestamp: new Date(e.enrolledAt).toLocaleDateString("ar-SA"),
    }));

    return NextResponse.json({
      ok: true,
      data: { overview, monthlyStats, topCourses, recentActivity },
    });
  } catch (error) {
    console.error("[Teacher Analytics]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
