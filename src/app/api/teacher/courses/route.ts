import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;

    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        enrollments: true,
        reviews: true,
        payments: { where: { status: "COMPLETED" } },
        lessons: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const coursesList = courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      status: c.status,
      price: c.price,
      students: c.enrollments.length,
      earnings: Math.round(c.payments.reduce((sum, p) => sum + p.amount * 0.8, 0)),
      rating:
        c.reviews.length > 0
          ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length
          : 0,
      reviewCount: c.reviews.length,
      lessons: c.lessons.length,
      level: c.level,
      createdAt: new Date(c.createdAt).toLocaleDateString("ar-SA"),
      publishedAt: c.publishedAt ? new Date(c.publishedAt).toLocaleDateString("ar-SA") : null,
    }));

    return NextResponse.json({ ok: true, data: coursesList });
  } catch (error) {
    console.error("[Teacher Courses GET]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}

const CreateCourseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  price: z.number().min(0),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  duration: z.number().nullable().optional(),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100) + "-" + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;

    const body = await request.json();
    const result = CreateCourseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { title, description, price, level, duration } = result.data;
    const slug = generateSlug(title);

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        price,
        level,
        duration,
        status: "DRAFT",
        instructorId: userId,
      },
    });

    return NextResponse.json({ ok: true, data: { id: course.id } });
  } catch (error) {
    console.error("[Teacher Courses POST]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
