import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const userId = authResult.id;

    const course = await prisma.course.findUnique({
      where: { id, instructorId: userId },
      include: {
        lessons: { orderBy: { order: "asc" } },
        enrollments: true,
        payments: { where: { status: "COMPLETED" } },
      },
    });

    if (!course) {
      return NextResponse.json({ ok: false, error: "الدورة غير موجودة" }, { status: 404 });
    }

    const data = {
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      thumbnail: course.thumbnail,
      status: course.status,
      price: course.price,
      duration: course.duration,
      level: course.level,
      lessons: course.lessons.map((l: (typeof course.lessons)[number]) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        duration: l.duration,
        order: l.order,
        videoUrl: l.videoUrl,
      })),
      students: course.enrollments.length,
      earnings: Math.round(course.payments.reduce((sum: number, p: (typeof course.payments)[number]) => sum + p.amount * 0.8, 0)),
      createdAt: new Date(course.createdAt).toLocaleDateString("ar-SA"),
      publishedAt: course.publishedAt ? new Date(course.publishedAt).toLocaleDateString("ar-SA") : null,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[Teacher Course GET]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}

const UpdateCourseSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  price: z.number().min(0).optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  duration: z.number().nullable().optional(),
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const userId = authResult.id;

    // Verify ownership
    const existing = await prisma.course.findUnique({
      where: { id, instructorId: userId },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "الدورة غير موجودة" }, { status: 404 });
    }

    const body = await request.json();
    const result = UpdateCourseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error.issues[0].message }, { status: 400 });
    }

    await prisma.course.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Teacher Course PUT]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const userId = authResult.id;

    const course = await prisma.course.findUnique({
      where: { id, instructorId: userId },
      include: { enrollments: true },
    });

    if (!course) {
      return NextResponse.json({ ok: false, error: "الدورة غير موجودة" }, { status: 404 });
    }

    if (course.enrollments.length > 0) {
      return NextResponse.json({ ok: false, error: "لا يمكن حذف دورة بها طلاب مسجلين" }, { status: 400 });
    }

    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Teacher Course DELETE]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
