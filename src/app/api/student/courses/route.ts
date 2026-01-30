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

    const courses = enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      description: e.course.description,
      thumbnail: e.course.thumbnail,
      instructor: e.course.instructor.name,
      progress: Math.round(e.progress),
      totalLessons: e.course.lessons.length,
      completedLessons: Math.round((e.progress / 100) * e.course.lessons.length),
      enrolledAt: new Date(e.enrolledAt).toLocaleDateString("ar-SA"),
      status: e.status,
      level: e.course.level,
      duration: e.course.duration,
    }));

    return NextResponse.json({ ok: true, data: courses });
  } catch (error) {
    console.error("[Student Courses]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
