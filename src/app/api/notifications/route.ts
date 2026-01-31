import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  try {
    const notifications = await db.userNotification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await db.userNotification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({
      ok: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الإشعارات" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      await db.userNotification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await db.userNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
