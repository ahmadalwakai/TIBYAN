import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get all payments (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!db.payment) {
      return NextResponse.json({
        ok: true,
        data: {
          payments: [],
          stats: {
            total: 0,
            pending: 0,
            completed: 0,
            totalRevenue: 0,
          },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = status
      ? { status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED" }
      : {};

    const [payments, total, stats] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.payment.count({ where }),
      db.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Get status counts
    const [pendingCount, completedCount] = await Promise.all([
      db.payment.count({ where: { status: "PENDING" } }),
      db.payment.count({ where: { status: "COMPLETED" } }),
    ]);

    // Calculate completed revenue
    const completedRevenue = await db.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        payments,
        stats: {
          total: stats._count.id,
          pending: pendingCount,
          completed: completedCount,
          totalRevenue: completedRevenue._sum.amount || 0,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin get payments error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
