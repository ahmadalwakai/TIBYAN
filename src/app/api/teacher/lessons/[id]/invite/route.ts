import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";
import { InvitationStatus } from "@prisma/client";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const inviteSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  sendNotification: z.boolean().default(true),
});

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/lessons/[id]/invite - Get invitations
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const session = await db.teachingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    // Only teacher or admin can view
    if (session.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح" },
        { status: 403 }
      );
    }

    const invitations = await db.sessionInvitation.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/lessons/[id]/invite - Invite students
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const session = await db.teachingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    // Only teacher or admin can invite
    if (session.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "فقط المعلم يمكنه دعوة الطلاب" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = inviteSchema.parse(body);

    // Get existing invitations
    const existing = await db.sessionInvitation.findMany({
      where: {
        sessionId: id,
        userId: { in: data.studentIds },
      },
      select: { userId: true },
    });

    const existingIds = existing.map((e) => e.userId);
    const newIds = data.studentIds.filter((sid) => !existingIds.includes(sid));

    if (newIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: { invited: 0, alreadyInvited: existingIds.length },
      });
    }

    // Get student details
    const students = await db.user.findMany({
      where: { id: { in: newIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    // Create invitations
    await db.sessionInvitation.createMany({
      data: students.map((student) => ({
        sessionId: id,
        userId: student.id,
        userName: student.name,
        userEmail: student.email,
        userRole: student.role,
        status: InvitationStatus.PENDING,
      })),
    });

    // Create notifications
    if (data.sendNotification) {
      for (const student of students) {
        await db.userNotification.create({
          data: {
            userId: student.id,
            type: "MEETING_INVITATION",
            title: `دعوة لحصة: ${session.title}`,
            message: `تمت دعوتك للانضمام إلى حصة "${session.title}" مع ${session.teacherName}`,
            link: `/student/lessons/${session.id}`,
            referenceType: "teaching_session",
            referenceId: session.id,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      data: { invited: students.length, alreadyInvited: existingIds.length },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }
    console.error("Error inviting students:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/lessons/[id]/invite - Remove invitation
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json(
      { ok: false, error: "معرف الطالب مطلوب" },
      { status: 400 }
    );
  }

  try {
    const session = await db.teachingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "الحصة غير موجودة" },
        { status: 404 }
      );
    }

    // Only teacher or admin can remove
    if (session.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح" },
        { status: 403 }
      );
    }

    await db.sessionInvitation.deleteMany({
      where: {
        sessionId: id,
        userId: studentId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error removing invitation:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
