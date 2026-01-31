import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/admin/audit-logs - List audit logs with filtering
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const search = searchParams.get("search") || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      action?: string;
      entityType?: string;
      actorUserId?: string;
      OR?: Array<{ action?: { contains: string; mode: "insensitive" } } | { entityType?: { contains: string; mode: "insensitive" } }>;
    } = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorUserId = actorId;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entityType: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Get action type stats
    const actionStats = await db.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      ok: true,
      data: {
        logs,
        stats: {
          total,
          actionBreakdown: actionStats.map((s: { action: string; _count: { action: number } }) => ({
            action: s.action,
            count: s._count.action,
          })),
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
    console.error("Audit logs fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب السجلات" },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit-logs - Create audit log entry (internal use)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { action, entityType, entityId, metadata, actorUserId } = body;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "الإجراء مطلوب" },
        { status: 400 }
      );
    }

    const log = await db.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        metadata,
        actorUserId,
      },
    });

    return NextResponse.json({
      ok: true,
      data: log,
    });
  } catch (error) {
    console.error("Audit log create error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إنشاء السجل" },
      { status: 500 }
    );
  }
}
