import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "STUDENT");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;

    // Get enrollments with course info
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            lessons: { select: { id: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Get payments
    const payments = await prisma.payment.findMany({
      where: { userId, status: "COMPLETED" },
      select: { amount: true },
    });

    // Calculate stats
    const totalPaid = payments.reduce((sum: number, p: (typeof payments)[number]) => sum + p.amount, 0);
    const completedCourses = enrollments.filter((e: (typeof enrollments)[number]) => e.status === "COMPLETED").length;
    const totalProgress =
      enrollments.length > 0
        ? Math.round(enrollments.reduce((sum: number, e: (typeof enrollments)[number]) => sum + e.progress, 0) / enrollments.length)
        : 0;

    const stats = {
      enrolledCourses: enrollments.length,
      completedCourses,
      totalProgress,
      totalPaid,
      upcomingLessons: 0,
      certificatesEarned: completedCourses,
    };

    // Recent courses
    const recentCourses = enrollments.slice(0, 5).map((e: (typeof enrollments)[number]) => ({
      id: e.course.id,
      title: e.course.title,
      progress: Math.round(e.progress),
      lastAccessed: new Date(e.enrolledAt).toLocaleDateString("ar-SA"),
      thumbnail: e.course.thumbnail,
    }));

    // Recent payments
    const recentPaymentsData = await prisma.payment.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentPayments = recentPaymentsData.map((p: (typeof recentPaymentsData)[number]) => ({
      id: p.id,
      courseName: p.course.title,
      amount: p.amount,
      currency: p.currency,
      date: new Date(p.createdAt).toLocaleDateString("ar-SA"),
      status: p.status,
    }));

    return NextResponse.json({
      ok: true,
      data: { stats, recentCourses, recentPayments },
    });
  } catch (error) {
    console.error("[Student Dashboard]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
