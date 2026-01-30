import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UpdateCourseSchema } from "@/lib/validations";

// GET /api/admin/courses/[id] - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await db.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        lessons: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { ok: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: course });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/courses/[id] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = UpdateCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const course = await db.course.update({
      where: { id },
      data: validation.data,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, data: course });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.course.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, data: { message: "Course deleted successfully" } });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}
