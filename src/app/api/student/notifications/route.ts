import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

// In-memory notification store (in production, use database)
type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

const notificationStore = new Map<string, Notification[]>();

// Initialize sample notifications for students
function getOrInitNotifications(userId: string): Notification[] {
  if (!notificationStore.has(userId)) {
    const notifications: Notification[] = [
      {
        id: `${userId}-1`,
        userId,
        title: "مرحباً بك في تبيان",
        message: "شكراً لانضمامك إلينا. ابدأ رحلتك التعليمية الآن!",
        type: "info",
        read: false,
        createdAt: new Date().toLocaleDateString("ar-SA"),
      },
    ];
    notificationStore.set(userId, notifications);
  }
  return notificationStore.get(userId)!;
}

export async function GET(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  // Only students and admins can access student notifications
  if (authResult.role !== "STUDENT" && authResult.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const notifications = getOrInitNotifications(authResult.id);
    return NextResponse.json({ ok: true, data: notifications });
  } catch (error) {
    console.error("[Student Notifications]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
