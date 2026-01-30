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
