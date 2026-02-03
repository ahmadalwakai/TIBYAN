/**
 * Zyphon AI API Key Rotate - Admin API
 * 
 * POST: Rotate an API key (generate new key, revoke old)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { generateApiKey, logZyphonAudit } from "@/lib/zyphon";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/zyphon-ai/keys/[id]/rotate
 * Rotate an API key - creates new key, revokes old one
 * 
 * SECURITY: New raw key is returned ONLY in this response, never again.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const admin = authResult;

  const { id } = await params;

  try {
    // Find the existing key
    const existingKey = await db.zyphonApiKey.findUnique({
      where: { id },
      select: {
        id: true,
        prefix: true,
        name: true,
        scopes: true,
        isActive: true,
        revokedAt: true,
        createdById: true,
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { ok: false, error: "API key not found" },
        { status: 404 }
      );
    }

    if (existingKey.revokedAt || !existingKey.isActive) {
      return NextResponse.json(
        { ok: false, error: "Cannot rotate an inactive or revoked key" },
        { status: 400 }
      );
    }

    // Generate new key
    const { rawKey, prefix, keyHash } = generateApiKey();

    // Transaction: revoke old key and create new one
    const [, newKey] = await db.$transaction([
      // Revoke old key
      db.zyphonApiKey.update({
        where: { id },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      }),
      // Create new key with same name and scopes
      db.zyphonApiKey.create({
        data: {
          name: existingKey.name,
          keyHash,
          prefix,
          scopes: existingKey.scopes,
          isActive: true,
          createdById: admin.id,
        },
        select: {
          id: true,
          name: true,
          prefix: true,
          scopes: true,
          createdAt: true,
        },
      }),
    ]);

    // Log audit events
    await logZyphonAudit({
      action: "key.rotated",
      keyPrefix: existingKey.prefix,
      actorUserId: admin.id,
      meta: {
        oldKeyPrefix: existingKey.prefix,
        newKeyPrefix: prefix,
        keyName: existingKey.name,
      },
    });

    // Return new raw key ONCE
    return NextResponse.json({
      ok: true,
      data: {
        id: newKey.id,
        name: newKey.name,
        prefix: newKey.prefix,
        scopes: newKey.scopes,
        rawKey, // ⚠️ SHOWN ONLY ONCE - NOT STORED
        createdAt: newKey.createdAt.toISOString(),
        previousKeyRevoked: true,
        message: "Key rotated successfully. Store this key securely. It will not be shown again.",
      },
    });
  } catch (error) {
    console.error("[Zyphon Admin] Failed to rotate key:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to rotate API key" },
      { status: 500 }
    );
  }
}
