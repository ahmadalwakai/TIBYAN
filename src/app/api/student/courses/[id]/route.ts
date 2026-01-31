import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireRole(request, "STUDENT");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const userId = authResult.id;

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
