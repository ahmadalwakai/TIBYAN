import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const userId = authResult.id;
    
    const notifications = notificationStore.get(userId) || [];
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      return NextResponse.json(
        { ok: false, error: "Notification not found" },
        { status: 404 }
      );
    }
    
    // Update notification to read
    notification.read = true;
    notificationStore.set(userId, notifications);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Teacher Notification Mark Read]", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
