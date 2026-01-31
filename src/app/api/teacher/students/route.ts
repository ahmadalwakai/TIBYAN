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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all enrollments for instructor's courses
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { instructorId: userId } },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, lastActiveAt: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Get payments
    const payments = await prisma.payment.findMany({
      where: { course: { instructorId: userId }, status: "COMPLETED" },
    });

    // Group by student
    const studentMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      enrolledCourses: number;
      totalPaid: number;
      lastActive: string;
      enrolledAt: string;
      courses: { id: string; title: string; progress: number }[];
    }>();

    for (const enrollment of enrollments) {
      const studentId = enrollment.user.id;
      const studentPayments = payments.filter((p) => p.userId === studentId);
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          name: enrollment.user.name,
          email: enrollment.user.email,
          avatar: enrollment.user.avatar,
          enrolledCourses: 0,
          totalPaid: studentPayments.reduce((sum, p) => sum + p.amount, 0),
          lastActive: new Date(enrollment.user.lastActiveAt).toLocaleDateString("ar-SA"),
          enrolledAt: new Date(enrollment.enrolledAt).toLocaleDateString("ar-SA"),
          courses: [],
        });
      }

      const student = studentMap.get(studentId)!;
      student.enrolledCourses++;
      student.courses.push({
        id: enrollment.course.id,
        title: enrollment.course.title,
        progress: Math.round(enrollment.progress),
      });
    }

    const students = Array.from(studentMap.values());

    // Stats
    const activeStudents = students.filter((s) => {
      const lastActive = enrollments.find((e) => e.userId === s.id)?.user.lastActiveAt;
      return lastActive && new Date(lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }).length;

    const newThisMonth = enrollments.filter((e) => new Date(e.enrolledAt) >= startOfMonth).length;
    const avgProgress = students.length > 0
      ? Math.round(students.flatMap((s) => s.courses.map((c) => c.progress)).reduce((a, b) => a + b, 0) / students.flatMap((s) => s.courses).length)
      : 0;

    const stats = {
      totalStudents: students.length,
      activeStudents,
      newThisMonth,
      averageProgress: avgProgress,
    };

    return NextResponse.json({ ok: true, data: { students, stats } });
  } catch (error) {
    console.error("[Teacher Students]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
