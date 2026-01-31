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
