import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";
import { InvitationStatus } from "@prisma/client";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "VOICE"]).default("VIDEO"),
  scheduledAt: z.string().datetime().optional(),
  maxStudents: z.number().min(1).max(100).default(30),
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  // Privacy settings
  privacy: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
  requireApproval: z.boolean().default(false),
  allowChat: z.boolean().default(true),
  allowScreenShare: z.boolean().default(true),
  allowHandRaise: z.boolean().default(true),
  allowStudentMic: z.boolean().default(false),
  allowStudentCamera: z.boolean().default(false),
  // Notification settings
  notifyOnCreate: z.boolean().default(true),
  notifyBeforeStart: z.number().min(0).max(60).optional(),
  // Invitations
  invitedStudentIds: z.array(z.string()).optional(),
  sendEmailInvitations: z.boolean().default(true),
  sendInAppNotifications: z.boolean().default(true),
});

// GET /api/teacher/lessons - Get teacher's teaching sessions
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "هذه الصفحة للمعلمين فقط" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  try {
    const sessions = await db.teachingSession.findMany({
      where: {
        teacherId: user.id,
        ...(status && { status: status as "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED" }),
        status: status ? undefined : { not: "CANCELLED" },
      },
      orderBy: [
        { status: "asc" }, // LIVE first
        { scheduledAt: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      include: {
        participants: {
          where: { isActive: true },
          select: {
            id: true,
            userId: true,
            userName: true,
            userAvatar: true,
            userRole: true,
            isMuted: true,
            isCameraOff: true,
            isHandRaised: true,
          },
        },
        _count: {
          select: { participants: true, invitations: true },
        },
      },
    });

    return NextResponse.json({ ok: true, data: sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الحصص" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/lessons - Create a new teaching session
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "هذه الصفحة للمعلمين فقط" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = createSessionSchema.parse(body);

    // Create the teaching session
    const session = await db.teachingSession.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        maxStudents: data.maxStudents,
        courseId: data.courseId,
        courseName: data.courseName,
        teacherId: user.id,
        teacherName: user.name,
        teacherAvatar: null,
        status: data.scheduledAt ? "SCHEDULED" : "LIVE",
        ...(data.scheduledAt ? {} : { startedAt: new Date() }),
        // Privacy settings
        privacy: data.privacy,
        requireApproval: data.requireApproval,
        allowChat: data.allowChat,
        allowScreenShare: data.allowScreenShare,
        allowHandRaise: data.allowHandRaise,
        allowStudentMic: data.allowStudentMic,
        allowStudentCamera: data.allowStudentCamera,
        notifyOnCreate: data.notifyOnCreate,
        notifyBeforeStart: data.notifyBeforeStart,
        // Add teacher as first participant
        participants: {
          create: {
            userId: user.id,
            userName: user.name,
            userAvatar: null,
            userRole: user.role,
            isActive: !data.scheduledAt,
            joinedAt: data.scheduledAt ? null : new Date(),
            canSpeak: true,
            canShare: true,
            isMuted: false,
            isCameraOff: false,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // Handle student invitations for private sessions
    if (data.invitedStudentIds && data.invitedStudentIds.length > 0) {
      // Get student details
      const studentsToInvite = await db.user.findMany({
        where: { id: { in: data.invitedStudentIds } },
        select: { id: true, name: true, email: true, role: true },
      });

      // Create invitations
      await db.sessionInvitation.createMany({
        data: studentsToInvite.map((student: (typeof studentsToInvite)[number]) => ({
          sessionId: session.id,
          userId: student.id,
          userName: student.name,
          userEmail: student.email,
          userRole: student.role,
          status: InvitationStatus.PENDING,
        })),
      });

      // Create in-app notifications for invited students
      if (data.sendInAppNotifications) {
        for (const student of studentsToInvite) {
          await db.userNotification.create({
            data: {
              userId: student.id,
              type: "MEETING_INVITATION",
              title: `دعوة لحصة: ${session.title}`,
              message: `تمت دعوتك للانضمام إلى حصة "${session.title}" مع ${user.name}`,
              link: `/student/lessons/${session.id}`,
              referenceType: "teaching_session",
              referenceId: session.id,
            },
          });
        }
      }

      // TODO: Send email invitations in background
    }

    return NextResponse.json({ ok: true, data: session });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating session:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إنشاء الحصة" },
      { status: 500 }
    );
  }
}
