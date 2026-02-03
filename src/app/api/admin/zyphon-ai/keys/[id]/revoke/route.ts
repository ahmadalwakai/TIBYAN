/**
 * Zyphon AI API Key Revoke - Admin API
 * 
 * POST: Revoke an API key (permanently disable)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { logZyphonAudit } from "@/lib/zyphon";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/zyphon-ai/keys/[id]/revoke
 * Revoke an API key
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const admin = authResult;

  const { id } = await params;

  try {
    // Find the key
    const existingKey = await db.zyphonApiKey.findUnique({
      where: { id },
      select: { id: true, prefix: true, name: true, isActive: true, revokedAt: true },
    });

    if (!existingKey) {
      return NextResponse.json(
        { ok: false, error: "API key not found" },
        { status: 404 }
      );
    }

    if (existingKey.revokedAt) {
      return NextResponse.json(
        { ok: false, error: "API key is already revoked" },
        { status: 400 }
      );
    }

    // Revoke the key
    await db.zyphonApiKey.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    // Log audit event
    await logZyphonAudit({
      action: "key.revoked",
      keyPrefix: existingKey.prefix,
      actorUserId: admin.id,
      meta: { keyName: existingKey.name },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: existingKey.id,
        prefix: existingKey.prefix,
        message: "API key has been revoked",
      },
    });
  } catch (error) {
    console.error("[Zyphon Admin] Failed to revoke key:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
