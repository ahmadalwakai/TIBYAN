import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";

// In-memory notification store (shared with GET route)
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

export async function PUT(request: NextRequest) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;
    const notifications = notificationStore.get(userId) || [];
    
    // Mark all notifications as read
    notifications.forEach(n => n.read = true);
    notificationStore.set(userId, notifications);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Teacher Notifications Mark All Read]", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
