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

    // Get instructor's courses
    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        enrollments: true,
        reviews: true,
        payments: { where: { status: "COMPLETED" } },
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate stats
    const totalStudents = courses.reduce((sum, c) => sum + c.enrollments.length, 0);
    const totalEarnings = courses.reduce(
      (sum, c) => sum + c.payments.reduce((pSum, p) => pSum + p.amount * 0.8, 0),
      0
    );
    const pendingPayments = await prisma.payment.findMany({
      where: {
        course: { instructorId: userId },
        status: "PENDING",
      },
    });
    const pendingEarnings = pendingPayments.reduce((sum, p) => sum + p.amount * 0.8, 0);

    // This month stats
    const thisMonthEnrollments = courses.reduce(
      (sum, c) =>
        sum + c.enrollments.filter((e) => new Date(e.enrolledAt) >= startOfMonth).length,
      0
    );
    const thisMonthPayments = courses.reduce(
      (sum, c) =>
        sum +
        c.payments
          .filter((p) => p.paidAt && new Date(p.paidAt) >= startOfMonth)
          .reduce((pSum, p) => pSum + p.amount * 0.8, 0),
      0
    );

    // Average rating
    const allReviews = courses.flatMap((c) => c.reviews);
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    const stats = {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.status === "PUBLISHED").length,
      totalStudents,
      totalEarnings: Math.round(totalEarnings),
      pendingEarnings: Math.round(pendingEarnings),
      averageRating,
      totalReviews: allReviews.length,
      thisMonthStudents: thisMonthEnrollments,
      thisMonthEarnings: Math.round(thisMonthPayments),
    };

    // Recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      where: { course: { instructorId: userId } },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
      orderBy: { enrolledAt: "desc" },
      take: 5,
    });

    const recentEnrollmentsList = recentEnrollments.map((e) => {
      const payment = courses
        .find((c) => c.id === e.courseId)
        ?.payments.find((p) => p.userId === e.userId);
      return {
        id: e.id,
        studentName: e.user.name,
        courseName: e.course.title,
        enrolledAt: new Date(e.enrolledAt).toLocaleDateString("ar-SA"),
        amount: payment ? Math.round(payment.amount * 0.8) : 0,
      };
    });

    // Top courses
    const topCourses = courses
      .map((c) => ({
        id: c.id,
        title: c.title,
        students: c.enrollments.length,
        earnings: Math.round(c.payments.reduce((sum, p) => sum + p.amount * 0.8, 0)),
        rating:
          c.reviews.length > 0
            ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length
            : 0,
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    return NextResponse.json({
      ok: true,
      data: { stats, recentEnrollments: recentEnrollmentsList, topCourses },
    });
  } catch (error) {
    console.error("[Teacher Dashboard]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
