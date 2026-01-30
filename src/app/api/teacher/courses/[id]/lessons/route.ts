import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

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

const CreateLessonSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  duration: z.number().nullable().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  order: z.number().min(1),
});

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    // Verify ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId, instructorId: userId },
    });
    if (!course) {
      return NextResponse.json({ ok: false, error: "الدورة غير موجودة" }, { status: 404 });
    }

    const body = await request.json();
    const result = CreateLessonSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { title, description, duration, videoUrl, order } = result.data;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        duration: duration || null,
        videoUrl: videoUrl || null,
        order,
        content: "", // Required field, can be extended
        courseId,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        videoUrl: lesson.videoUrl,
      },
    });
  } catch (error) {
    console.error("[Teacher Lessons POST]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
