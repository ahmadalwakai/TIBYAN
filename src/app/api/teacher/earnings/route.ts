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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get all payments for instructor's courses
    const payments = await prisma.payment.findMany({
      where: { course: { instructorId: userId }, status: "COMPLETED" },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const platformFeeRate = 0.2; // 20%

    const earnings = payments.map((p) => ({
      id: p.id,
      courseName: p.course.title,
      studentName: p.user.name,
      amount: p.amount,
      platformFee: Math.round(p.amount * platformFeeRate),
      netAmount: Math.round(p.amount * (1 - platformFeeRate)),
      status: "COMPLETED" as const,
      paidAt: p.paidAt ? new Date(p.paidAt).toLocaleDateString("ar-SA") : null,
      createdAt: new Date(p.createdAt).toLocaleDateString("ar-SA"),
    }));

    // Stats
    const totalEarnings = payments.reduce((sum, p) => sum + p.amount * (1 - platformFeeRate), 0);
    const platformFees = payments.reduce((sum, p) => sum + p.amount * platformFeeRate, 0);
    
    const thisMonthPayments = payments.filter((p) => p.paidAt && new Date(p.paidAt) >= startOfMonth);
    const thisMonthEarnings = thisMonthPayments.reduce((sum, p) => sum + p.amount * (1 - platformFeeRate), 0);

    const lastMonthPayments = payments.filter(
      (p) => p.paidAt && new Date(p.paidAt) >= startOfLastMonth && new Date(p.paidAt) < startOfMonth
    );
    const lastMonthEarnings = lastMonthPayments.reduce((sum, p) => sum + p.amount * (1 - platformFeeRate), 0);

    // Pending earnings (could be from pending payments)
    const pendingPayments = await prisma.payment.findMany({
      where: { course: { instructorId: userId }, status: "PENDING" },
    });
    const pendingEarnings = pendingPayments.reduce((sum, p) => sum + p.amount * (1 - platformFeeRate), 0);

    const stats = {
      totalEarnings: Math.round(totalEarnings),
      pendingEarnings: Math.round(pendingEarnings),
      withdrawnEarnings: 0, // Would need a Withdrawal model
      thisMonthEarnings: Math.round(thisMonthEarnings),
      lastMonthEarnings: Math.round(lastMonthEarnings),
      platformFees: Math.round(platformFees),
    };

    // Payout info
    const nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("ar-SA");
    const payoutInfo = {
      nextPayoutDate,
      minimumPayout: 100,
      payoutMethod: null, // Would need bank info model
    };

    return NextResponse.json({ ok: true, data: { earnings, stats, payoutInfo } });
  } catch (error) {
    console.error("[Teacher Earnings]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
