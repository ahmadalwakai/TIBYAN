import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/activity - Get recent platform activity
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type") || undefined;

    // Fetch various types of activity in parallel
    const [
      recentUsers,
      recentEnrollments,
      recentPayments,
      recentCourses,
      recentReviews,
    ] = await Promise.all([
      // New users
      db.user.findMany({
        where: type === "users" ? {} : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: type ? limit : 10,
      }),
      // Recent enrollments
      db.enrollment.findMany({
        where: type === "enrollments" ? {} : undefined,
        select: {
          id: true,
          enrolledAt: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          course: {
            select: { id: true, title: true },
          },
        },
        orderBy: { enrolledAt: "desc" },
        take: type ? limit : 10,
      }),
      // Recent payments
      db.payment.findMany({
        where: type === "payments" ? {} : undefined,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          customerName: true,
          customerEmail: true,
          course: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: type ? limit : 10,
      }),
      // Recent courses
      db.course.findMany({
        where: type === "courses" ? {} : undefined,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          instructor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: type ? limit : 10,
      }),
      // Recent reviews
      db.review.findMany({
        where: type === "reviews" ? {} : undefined,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: { id: true, name: true },
          },
          course: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: type ? limit : 10,
      }),
    ]);

    // Combine and format into unified activity feed
    const activities: Array<{
      id: string;
      type: string;
      icon: string;
      title: string;
      description: string;
      timestamp: Date;
      metadata?: Record<string, unknown>;
    }> = [];

    // Add user activities
    for (const user of recentUsers) {
      activities.push({
        id: `user-${user.id}`,
        type: "user_joined",
        icon: "👤",
        title: "مستخدم جديد",
        description: `انضم ${user.name || user.email} كـ ${user.role === "STUDENT" ? "طالب" : user.role === "INSTRUCTOR" ? "معلم" : "مسؤول"}`,
        timestamp: user.createdAt,
        metadata: { userId: user.id, email: user.email, role: user.role },
      });
    }

    // Add enrollment activities
    for (const enrollment of recentEnrollments) {
      activities.push({
        id: `enrollment-${enrollment.id}`,
        type: "enrollment",
        icon: "📚",
        title: "تسجيل جديد",
        description: `${enrollment.user?.name || "طالب"} سجّل في ${enrollment.course?.title || "دورة"}`,
        timestamp: enrollment.enrolledAt,
        metadata: {
          userId: enrollment.user?.id,
          courseId: enrollment.course?.id,
        },
      });
    }

    // Add payment activities
    for (const payment of recentPayments) {
      const statusLabel = payment.status === "COMPLETED" ? "مكتملة" : payment.status === "PENDING" ? "قيد الانتظار" : payment.status;
      activities.push({
        id: `payment-${payment.id}`,
        type: "payment",
        icon: "💰",
        title: `دفعة ${statusLabel}`,
        description: `${payment.customerName || "عميل"} - ${payment.amount} ${payment.currency} - ${payment.course?.title || ""}`,
        timestamp: payment.createdAt,
        metadata: {
          paymentId: payment.id,
          amount: payment.amount,
          status: payment.status,
        },
      });
    }

    // Add course activities
    for (const course of recentCourses) {
      activities.push({
        id: `course-${course.id}`,
        type: "course_created",
        icon: "🎓",
        title: "دورة جديدة",
        description: `${course.instructor?.name || "معلم"} أنشأ "${course.title}"`,
        timestamp: course.createdAt,
        metadata: { courseId: course.id, status: course.status },
      });
    }

    // Add review activities
    for (const review of recentReviews) {
      activities.push({
        id: `review-${review.id}`,
        type: "review",
        icon: "⭐",
        title: `تقييم جديد (${review.rating}/5)`,
        description: `${review.user?.name || "طالب"} قيّم "${review.course?.title || "دورة"}"`,
        timestamp: review.createdAt,
        metadata: { rating: review.rating, comment: review.comment },
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Get stats
    const [totalUsers, totalEnrollments, totalPayments, totalCourses] = await Promise.all([
      db.user.count(),
      db.enrollment.count(),
      db.payment.count(),
      db.course.count(),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        activities: activities.slice(0, limit),
        stats: {
          totalUsers,
          totalEnrollments,
          totalPayments,
          totalCourses,
        },
      },
    });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب النشاطات" },
      { status: 500 }
    );
  }
}
