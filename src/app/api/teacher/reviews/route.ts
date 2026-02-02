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

    // Get all reviews for instructor's courses
    const reviews = await prisma.review.findMany({
      where: { course: { instructorId: userId } },
      include: {
        user: { select: { name: true, avatar: true } },
        course: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const reviewsList = reviews.map((r: (typeof reviews)[number]) => ({
      id: r.id,
      courseName: r.course.title,
      courseId: r.courseId,
      studentName: r.user.name,
      studentAvatar: r.user.avatar,
      rating: r.rating,
      comment: r.comment,
      createdAt: new Date(r.createdAt).toLocaleDateString("ar-SA"),
    }));

    // Stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum: number, r: (typeof reviews)[number]) => sum + r.rating, 0) / totalReviews
      : 0;

    const fiveStars = reviews.filter((r: (typeof reviews)[number]) => r.rating === 5).length;
    const fourStars = reviews.filter((r: (typeof reviews)[number]) => r.rating === 4).length;
    const threeStars = reviews.filter((r: (typeof reviews)[number]) => r.rating === 3).length;
    const twoStars = reviews.filter((r: (typeof reviews)[number]) => r.rating === 2).length;
    const oneStar = reviews.filter((r: (typeof reviews)[number]) => r.rating === 1).length;

    const stats = {
      totalReviews,
      averageRating,
      fiveStars,
      fourStars,
      threeStars,
      twoStars,
      oneStar,
    };

    return NextResponse.json({ ok: true, data: { reviews: reviewsList, stats } });
  } catch (error) {
    console.error("[Teacher Reviews]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
