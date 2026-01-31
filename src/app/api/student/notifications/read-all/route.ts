import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

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
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  // Students can mark their own notifications, or admins can mark any
  if (authResult.role !== "STUDENT" && authResult.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const userId = authResult.id;
    const notifications = notificationStore.get(userId) || [];
    
    // Mark all notifications as read
    notifications.forEach(n => n.read = true);
    notificationStore.set(userId, notifications);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Student Notifications Mark All Read]", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
