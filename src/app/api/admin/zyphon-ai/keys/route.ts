/**
 * Zyphon AI API Keys Management - Admin API
 * 
 * POST: Create new API key (returns raw key ONCE)
 * GET: List all API keys (without raw keys)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  generateApiKey,
  validateScopes,
  logZyphonAudit,
  ZYPHON_SCOPES,
} from "@/lib/zyphon";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Request schema for creating a new key
const CreateKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
});

/**
 * POST /api/admin/zyphon-ai/keys
 * Create a new API key
 * 
 * SECURITY: Raw key is returned ONLY in this response, never again.
 */
export async function POST(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const admin = authResult;

  try {
    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = CreateKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, scopes } = parsed.data;

    // Validate scopes
    if (!validateScopes(scopes)) {
      const validScopes = Object.values(ZYPHON_SCOPES);
      return NextResponse.json(
        { ok: false, error: `Invalid scopes. Valid scopes: ${validScopes.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate new API key
    const { rawKey, prefix, keyHash } = generateApiKey();

    // Store in database (only hash and prefix, NEVER raw key)
    const apiKey = await db.zyphonApiKey.create({
      data: {
        name,
        keyHash, // SHA-256 hash with pepper
        prefix,  // First 8 chars for identification
        scopes,
        isActive: true,
        createdById: admin.id,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log audit event
    await logZyphonAudit({
      action: "key.created",
      keyPrefix: prefix,
      actorUserId: admin.id,
      meta: { keyName: name, scopes },
    });

    // Return raw key ONCE - never stored or returned again
    return NextResponse.json({
      ok: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        rawKey, // ⚠️ SHOWN ONLY ONCE - NOT STORED
        createdAt: apiKey.createdAt.toISOString(),
        message: "Store this key securely. It will not be shown again.",
      },
    });
  } catch (error) {
    console.error("[Zyphon Admin] Failed to create key:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/zyphon-ai/keys
 * List all API keys (without raw keys - only prefixes)
 */
export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Fetch all keys (without keyHash for security)
    const keys = await db.zyphonApiKey.findMany({
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdById: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Type for key from Prisma query
    interface ZyphonApiKeySelect {
      id: string;
      name: string;
      prefix: string;
      scopes: string[];
      isActive: boolean;
      createdAt: Date;
      lastUsedAt: Date | null;
      revokedAt: Date | null;
      createdById: string | null;
    }

    return NextResponse.json({
      ok: true,
      data: {
        keys: keys.map((key: ZyphonApiKeySelect) => ({
          id: key.id,
          name: key.name,
          prefix: key.prefix,
          scopes: key.scopes,
          isActive: key.isActive,
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
          revokedAt: key.revokedAt?.toISOString() ?? null,
        })),
        total: keys.length,
      },
    });
  } catch (error) {
    console.error("[Zyphon Admin] Failed to list keys:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to list API keys" },
      { status: 500 }
    );
  }
}
