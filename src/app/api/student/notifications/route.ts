import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    // Return sample notifications (can be extended with Notification model)
    const notifications = [
      {
        id: "1",
        title: "مرحباً بك في تبيان",
        message: "شكراً لانضمامك إلينا. ابدأ رحلتك التعليمية الآن!",
        type: "info",
        read: false,
        createdAt: new Date().toLocaleDateString("ar-SA"),
      },
    ];

    return NextResponse.json({ ok: true, data: notifications });
  } catch (error) {
    console.error("[Student Notifications]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
