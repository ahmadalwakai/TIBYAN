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

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    // Verify ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId, instructorId: userId },
      include: { lessons: true },
    });

    if (!course) {
      return NextResponse.json({ ok: false, error: "الدورة غير موجودة" }, { status: 404 });
    }

    if (course.lessons.length === 0) {
      return NextResponse.json({ ok: false, error: "يجب إضافة درس واحد على الأقل" }, { status: 400 });
    }

    if (course.status !== "DRAFT") {
      return NextResponse.json({ ok: false, error: "لا يمكن إرسال هذه الدورة للمراجعة" }, { status: 400 });
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { status: "REVIEW" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Teacher Course Publish]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
