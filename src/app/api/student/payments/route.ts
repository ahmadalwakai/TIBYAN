import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

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

    const payments = await prisma.payment.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });

    const completedPayments = payments.filter((p) => p.status === "COMPLETED");
    const pendingPayments = payments.filter((p) => p.status === "PENDING");

    const stats = {
      totalPaid: completedPayments.reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      totalCourses: completedPayments.length,
      averagePerCourse:
        completedPayments.length > 0
          ? Math.round(completedPayments.reduce((sum, p) => sum + p.amount, 0) / completedPayments.length)
          : 0,
    };

    const paymentsList = payments.map((p) => ({
      id: p.id,
      courseName: p.course.title,
      courseId: p.courseId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      discountAmount: p.discountAmount,
      couponCode: p.couponCode,
      paidAt: p.paidAt ? new Date(p.paidAt).toLocaleDateString("ar-SA") : null,
      createdAt: new Date(p.createdAt).toLocaleDateString("ar-SA"),
    }));

    return NextResponse.json({ ok: true, data: { payments: paymentsList, stats } });
  } catch (error) {
    console.error("[Student Payments]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
