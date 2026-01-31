import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Generate analytics reports
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "overview";
    const period = searchParams.get("period") || "30"; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    switch (reportType) {
      case "overview":
        return await getOverviewReport(startDate);
      case "users":
        return await getUsersReport(startDate);
      case "courses":
        return await getCoursesReport(startDate);
      case "revenue":
        return await getRevenueReport(startDate);
      case "engagement":
        return await getEngagementReport(startDate);
      default:
        return NextResponse.json(
          { ok: false, error: "نوع التقرير غير معروف" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في إنشاء التقرير" },
      { status: 500 }
    );
  }
}

async function getOverviewReport(startDate: Date) {
  const [
    totalUsers,
    newUsers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    newEnrollments,
    totalRevenue,
    periodRevenue,
    completionRate,
  ] = await Promise.all([
    // Total users
    db.user.count(),
    // New users in period
    db.user.count({ where: { createdAt: { gte: startDate } } }),
    // Total courses
    db.course.count(),
    // Published courses
    db.course.count({ where: { status: "PUBLISHED" } }),
    // Total enrollments
    db.enrollment.count(),
    // New enrollments in period
    db.enrollment.count({ where: { enrolledAt: { gte: startDate } } }),
    // Total revenue (completed payments)
    db.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    // Period revenue
    db.payment.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: startDate } },
      _sum: { amount: true },
    }),
    // Average completion rate
    db.enrollment.aggregate({
      _avg: { progress: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      type: "overview",
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
      metrics: {
        users: {
          total: totalUsers,
          new: newUsers,
          growthRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : 0,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          publishRate: totalCourses > 0 ? ((publishedCourses / totalCourses) * 100).toFixed(1) : 0,
        },
        enrollments: {
          total: totalEnrollments,
          new: newEnrollments,
          averageCompletionRate: (completionRate._avg.progress || 0).toFixed(1),
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          period: periodRevenue._sum.amount || 0,
          currency: "EUR",
        },
      },
    },
  });
}

async function getUsersReport(startDate: Date) {
  const [
    byRole,
    byStatus,
    registrationTrend,
    activeUsers,
  ] = await Promise.all([
    // Users by role
    db.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    // Users by status
    db.user.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Registration trend (last 7 days)
    db.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM students.users 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at) 
      ORDER BY date DESC 
      LIMIT 30
    ` as Promise<{ date: Date; count: bigint }[]>,
    // Active users (logged in within period)
    db.user.count({
      where: { lastActiveAt: { gte: startDate } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      type: "users",
      metrics: {
        byRole: byRole.map((r) => ({ role: r.role, count: r._count.id })),
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
        registrationTrend: registrationTrend.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
        activeUsers,
      },
    },
  });
}

async function getCoursesReport(startDate: Date) {
  const [
    byStatus,
    byLevel,
    topCourses,
    avgRating,
  ] = await Promise.all([
    // Courses by status
    db.course.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Courses by level
    db.course.groupBy({
      by: ["level"],
      _count: { id: true },
    }),
    // Top courses by enrollments
    db.course.findMany({
      select: {
        id: true,
        title: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 10,
    }),
    // Average course rating
    db.review.aggregate({
      _avg: { rating: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      type: "courses",
      metrics: {
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byLevel: byLevel.map((l) => ({ level: l.level, count: l._count.id })),
        topCourses: topCourses.map((c) => ({
          id: c.id,
          title: c.title,
          enrollments: c._count.enrollments,
        })),
        averageRating: (avgRating._avg.rating || 0).toFixed(1),
      },
    },
  });
}

async function getRevenueReport(startDate: Date) {
  const [
    totalRevenue,
    periodRevenue,
    byStatus,
    recentPayments,
    dailyRevenue,
  ] = await Promise.all([
    // Total revenue
    db.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Period revenue
    db.payment.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: startDate } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Payments by status
    db.payment.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    }),
    // Recent payments
    db.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        customerName: true,
        course: { select: { title: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Daily revenue trend
    db.$queryRaw`
      SELECT DATE(created_at) as date, SUM(amount) as total 
      FROM students.payments 
      WHERE status = 'COMPLETED' AND created_at >= ${startDate}
      GROUP BY DATE(created_at) 
      ORDER BY date DESC 
      LIMIT 30
    ` as Promise<{ date: Date; total: number }[]>,
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      type: "revenue",
      metrics: {
        total: {
          amount: totalRevenue._sum.amount || 0,
          transactions: totalRevenue._count.id,
        },
        period: {
          amount: periodRevenue._sum.amount || 0,
          transactions: periodRevenue._count.id,
        },
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
          amount: s._sum.amount || 0,
        })),
        recentPayments,
        dailyRevenue: dailyRevenue.map((d) => ({
          date: d.date,
          total: Number(d.total),
        })),
        currency: "EUR",
      },
    },
  });
}

async function getEngagementReport(startDate: Date) {
  const [
    totalReviews,
    newReviews,
    avgRating,
    ratingDistribution,
    completedEnrollments,
  ] = await Promise.all([
    // Total reviews
    db.review.count(),
    // New reviews in period
    db.review.count({ where: { createdAt: { gte: startDate } } }),
    // Average rating
    db.review.aggregate({
      _avg: { rating: true },
    }),
    // Rating distribution
    db.review.groupBy({
      by: ["rating"],
      _count: { id: true },
    }),
    // Completed enrollments
    db.enrollment.count({ where: { status: "COMPLETED" } }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      type: "engagement",
      metrics: {
        reviews: {
          total: totalReviews,
          new: newReviews,
          averageRating: (avgRating._avg.rating || 0).toFixed(1),
        },
        ratingDistribution: ratingDistribution
          .map((r) => ({ rating: r.rating, count: r._count.id }))
          .sort((a, b) => a.rating - b.rating),
        completions: completedEnrollments,
      },
    },
  });
}
