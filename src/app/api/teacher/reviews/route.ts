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

    // Get all reviews for instructor's courses
    const reviews = await prisma.review.findMany({
      where: { course: { instructorId: userId } },
      include: {
        user: { select: { name: true, avatar: true } },
        course: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const reviewsList = reviews.map((r) => ({
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
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const fiveStars = reviews.filter((r) => r.rating === 5).length;
    const fourStars = reviews.filter((r) => r.rating === 4).length;
    const threeStars = reviews.filter((r) => r.rating === 3).length;
    const twoStars = reviews.filter((r) => r.rating === 2).length;
    const oneStar = reviews.filter((r) => r.rating === 1).length;

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
