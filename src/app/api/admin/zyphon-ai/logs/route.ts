/**
 * Zyphon AI Audit Logs - Admin API
 * 
 * GET: List audit logs with filtering
 * Uses existing AuditLog model from "admins" schema
 * Filters by "zyphon." prefix actions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/zyphon-ai/logs
 * List Zyphon audit logs with optional filtering
 * Queries AuditLog where action starts with "zyphon."
 */
export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const action = searchParams.get("action") || undefined;
    const keyPrefix = searchParams.get("keyPrefix") || undefined;

    const skip = (page - 1) * limit;

    // Build where clause - filter for zyphon. actions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      action: { startsWith: "zyphon." },
    };

    if (action) {
      where.action = { 
        startsWith: "zyphon.",
        contains: action,
        mode: "insensitive" as const,
      };
    }
    if (keyPrefix) {
      // keyPrefix is stored in metadata.keyPrefix
      where.metadata = { path: ["keyPrefix"], string_contains: keyPrefix };
    }

    // Fetch logs from existing AuditLog model
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          actorUserId: true,
        },
      }),
      db.auditLog.count({ where }),
    ]);

    // Get action breakdown for zyphon actions
    const actionStats = await db.auditLog.groupBy({
      by: ["action"],
      where: { action: { startsWith: "zyphon." } },
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    });

    // Types for Prisma query results
    interface AuditLogSelect {
      id: string;
      action: string;
      entityType: string | null;
      entityId: string | null;
      metadata: unknown;
      createdAt: Date;
      actorUserId: string | null;
    }

    interface ActionStatGroup {
      action: string;
      _count: { action: number };
    }

    // Transform to expected format (extract keyPrefix, ip, userAgent from metadata)
    return NextResponse.json({
      ok: true,
      data: {
        logs: logs.map((log: AuditLogSelect) => {
          const meta = (log.metadata || {}) as Record<string, unknown>;
          return {
            id: log.id,
            action: log.action.replace("zyphon.", ""), // Remove prefix for UI
            keyPrefix: meta.keyPrefix || log.entityId || null,
            ip: meta.ip || null,
            userAgent: meta.userAgent || null,
            meta: meta,
            createdAt: log.createdAt.toISOString(),
            actorUserId: log.actorUserId,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          actionBreakdown: actionStats.map((s: ActionStatGroup) => ({
            action: s.action.replace("zyphon.", ""),
            count: s._count.action,
          })),
        },
      },
    });
  } catch (error) {
    console.error("[Zyphon Admin] Failed to list logs:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to list audit logs" },
      { status: 500 }
    );
  }
}
