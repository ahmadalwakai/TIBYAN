import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id: courseId } = await params;
    const userId = authResult.id;

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
