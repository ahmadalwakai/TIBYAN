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

    // Get completed enrollments
    const completedEnrollments = await prisma.enrollment.findMany({
      where: { userId, status: "COMPLETED" },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
          },
        },
      },
    });

    const certificates = completedEnrollments.map((e, index) => ({
      id: e.id,
      courseId: e.courseId,
      courseName: e.course.title,
      issuedAt: e.completedAt
        ? new Date(e.completedAt).toLocaleDateString("ar-SA")
        : new Date().toLocaleDateString("ar-SA"),
      certificateNumber: `TBY-${new Date().getFullYear()}-${String(index + 1).padStart(6, "0")}`,
      instructorName: e.course.instructor.name,
    }));

    return NextResponse.json({ ok: true, data: certificates });
  } catch (error) {
    console.error("[Student Certificates]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
