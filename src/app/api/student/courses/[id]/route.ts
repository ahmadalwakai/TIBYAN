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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: id },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ ok: false, error: "غير مسجل في هذه الدورة" }, { status: 403 });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ ok: false, error: "الدورة غير موجودة" }, { status: 404 });
    }

    const completedCount = Math.round((enrollment.progress / 100) * course.lessons.length);

    const data = {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      instructor: course.instructor,
      progress: Math.round(enrollment.progress),
      enrolledAt: new Date(enrollment.enrolledAt).toLocaleDateString("ar-SA"),
      status: enrollment.status,
      level: course.level,
      duration: course.duration,
      lessons: course.lessons.map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        completed: index < completedCount,
        videoUrl: lesson.videoUrl,
      })),
      totalLessons: course.lessons.length,
      completedLessons: completedCount,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[Student Course Detail]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
