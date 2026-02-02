import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";

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

// Initialize sample notifications for teachers
function getOrInitNotifications(userId: string, _role: string): Notification[] {
  if (!notificationStore.has(userId)) {
    const notifications: Notification[] = [
      {
        id: `${userId}-1`,
        userId,
        title: "مرحباً بك كمدرس في تبيان",
        message: "يمكنك الآن إنشاء دوراتك الأولى والبدء في التدريس",
        type: "system",
        read: false,
        createdAt: new Date().toLocaleDateString("ar-SA"),
      },
    ];
    notificationStore.set(userId, notifications);
  }
  return notificationStore.get(userId)!;
}

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const notifications = getOrInitNotifications(authResult.id, authResult.role);
    return NextResponse.json({ ok: true, data: notifications });
  } catch (error) {
    console.error("[Teacher Notifications]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
