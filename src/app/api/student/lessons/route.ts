import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { MeetingPrivacy, InvitationStatus, SessionInvitation } from "@prisma/client";

// GET /api/student/lessons - Get student's available lessons
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  try {
    // Get sessions where:
    // 1. User is invited
    // 2. Session is public
    // 3. User is the teacher (to see their own sessions)
    const sessions = await db.teachingSession.findMany({
      where: {
        ...(status && { status: status as "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED" }),
        status: status ? undefined : { not: "CANCELLED" },
        OR: [
          // Invited sessions
          {
            invitations: {
              some: {
                userId: user.id,
                status: { not: InvitationStatus.DECLINED },
              },
            },
          },
          // Public sessions
          { privacy: MeetingPrivacy.PUBLIC },
          // Own sessions (if teacher)
          { teacherId: user.id },
        ],
      },
      orderBy: [
        { status: "asc" }, // LIVE first
        { scheduledAt: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      include: {
        invitations: {
          where: { userId: user.id },
          select: { status: true },
        },
        participants: {
          where: { isActive: true },
          select: {
            id: true,
            userName: true,
            userRole: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    // Add user context to each session
    const sessionsWithContext = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      type: session.type,
      status: session.status,
      privacy: session.privacy,
      scheduledAt: session.scheduledAt,
      startedAt: session.startedAt,
      teacherId: session.teacherId,
      teacherName: session.teacherName,
      teacherAvatar: session.teacherAvatar,
      courseName: session.courseName,
      participantCount: session._count.participants,
      isTeacher: session.teacherId === user.id,
      isInvited: session.invitations.length > 0,
      invitationStatus: session.invitations[0]?.status || null,
      canJoin:
        session.status === "LIVE" &&
        (session.teacherId === user.id ||
          session.privacy === "PUBLIC" ||
          session.invitations.some((inv: Pick<SessionInvitation, "status">) => inv.status !== "DECLINED")),
    }));

    return NextResponse.json({ ok: true, data: sessionsWithContext });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الحصص" },
      { status: 500 }
    );
  }
}
