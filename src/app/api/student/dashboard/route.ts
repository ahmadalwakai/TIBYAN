import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userDataStr = cookieStore.get("user-data")?.value;
  if (!userDataStr) return null;
  try {
    const userData = JSON.parse(userDataStr);
    return userData.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

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
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedCourses = enrollments.filter((e) => e.status === "COMPLETED").length;
    const totalProgress =
      enrollments.length > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
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
    const recentCourses = enrollments.slice(0, 5).map((e) => ({
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

    const recentPayments = recentPaymentsData.map((p) => ({
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
