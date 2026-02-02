import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "STUDENT");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;

    const payments = await prisma.payment.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });

    const completedPayments = payments.filter((p: (typeof payments)[number]) => p.status === "COMPLETED");
    const pendingPayments = payments.filter((p: (typeof payments)[number]) => p.status === "PENDING");

    const stats = {
      totalPaid: completedPayments.reduce((sum: number, p: (typeof completedPayments)[number]) => sum + p.amount, 0),
      pendingPayments: pendingPayments.reduce((sum: number, p: (typeof pendingPayments)[number]) => sum + p.amount, 0),
      totalCourses: completedPayments.length,
      averagePerCourse:
        completedPayments.length > 0
              ? Math.round(completedPayments.reduce((sum: number, p: (typeof completedPayments)[number]) => sum + p.amount, 0) / completedPayments.length)
          : 0,
    };

            const paymentsList = payments.map((p: (typeof payments)[number]) => ({
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
