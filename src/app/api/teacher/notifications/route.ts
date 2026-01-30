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

    // Sample notifications (would need Notification model)
    const notifications = [
      {
        id: "1",
        title: "مرحباً بك كمدرس في تبيان",
        message: "يمكنك الآن إنشاء دوراتك الأولى والبدء في التدريس",
        type: "system",
        read: false,
        createdAt: new Date().toLocaleDateString("ar-SA"),
      },
    ];

    return NextResponse.json({ ok: true, data: notifications });
  } catch (error) {
    console.error("[Teacher Notifications]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
