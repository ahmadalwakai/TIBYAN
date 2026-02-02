import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "INSTRUCTOR");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;

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

    const earnings = payments.map((p: (typeof payments)[number]) => ({
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
    const totalEarnings = payments.reduce((sum: number, p: (typeof payments)[number]) => sum + p.amount * (1 - platformFeeRate), 0);
    const platformFees = payments.reduce((sum: number, p: (typeof payments)[number]) => sum + p.amount * platformFeeRate, 0);
    
    const thisMonthPayments = payments.filter((p: (typeof payments)[number]) => p.paidAt && new Date(p.paidAt) >= startOfMonth);
    const thisMonthEarnings = thisMonthPayments.reduce((sum: number, p: (typeof thisMonthPayments)[number]) => sum + p.amount * (1 - platformFeeRate), 0);

    const lastMonthPayments = payments.filter(
      (p: (typeof payments)[number]) => p.paidAt && new Date(p.paidAt) >= startOfLastMonth && new Date(p.paidAt) < startOfMonth
    );
    const lastMonthEarnings = lastMonthPayments.reduce((sum: number, p: (typeof lastMonthPayments)[number]) => sum + p.amount * (1 - platformFeeRate), 0);

    // Pending earnings (could be from pending payments)
    const pendingPayments = await prisma.payment.findMany({
      where: { course: { instructorId: userId }, status: "PENDING" },
    });
    const pendingEarnings = pendingPayments.reduce((sum: number, p: (typeof pendingPayments)[number]) => sum + p.amount * (1 - platformFeeRate), 0);

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
