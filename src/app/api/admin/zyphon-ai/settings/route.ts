/**
 * Zyphon AI Settings - Admin API
 * 
 * GET: Get current settings
 * PUT: Update settings
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { logZyphonAudit, getDefaultSettings } from "@/lib/zyphon";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Settings schema
const SettingsSchema = z.object({
  defaultLanguageMode: z.enum(["auto", "locked_ar", "locked_en"]),
  strictNoThirdLanguage: z.boolean(),
  defaultMaxTokens: z.number().min(256).max(4096),
  externalEndpointEnabled: z.boolean(),
});

/**
 * GET /api/admin/zyphon-ai/settings
 * Get current Zyphon settings
 */
export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Get settings from DB, or return defaults
    const settings = await db.zyphonSettings.findFirst({
      select: {
        defaultLanguageMode: true,
        strictNoThirdLanguage: true,
        defaultMaxTokens: true,
        externalEndpointEnabled: true,
      },
    });

    if (!settings) {
      return NextResponse.json({
        ok: true,
        data: getDefaultSettings(),
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        defaultLanguageMode: settings.defaultLanguageMode,
        strictNoThirdLanguage: settings.strictNoThirdLanguage,
        defaultMaxTokens: settings.defaultMaxTokens,
        externalEndpointEnabled: settings.externalEndpointEnabled,
      },
    });
  } catch (error) {
    console.error("[Zyphon Admin] Failed to get settings:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/zyphon-ai/settings
 * Update Zyphon settings
 */
export async function PUT(request: NextRequest) {
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

    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settingsData = parsed.data;

    // Upsert settings (create if not exists, update if exists)
    const existingSettings = await db.zyphonSettings.findFirst();

    let settings;
    if (existingSettings) {
      settings = await db.zyphonSettings.update({
        where: { id: existingSettings.id },
        data: {
          ...settingsData,
          updatedById: admin.id,
        },
      });
    } else {
      settings = await db.zyphonSettings.create({
        data: {
          ...settingsData,
          updatedById: admin.id,
        },
      });
    }

    // Log audit event
    await logZyphonAudit({
      action: "settings.updated",
      actorUserId: admin.id,
      meta: { settings: settingsData },
    });

    return NextResponse.json({
      ok: true,
      data: {
        defaultLanguageMode: settings.defaultLanguageMode,
        strictNoThirdLanguage: settings.strictNoThirdLanguage,
        defaultMaxTokens: settings.defaultMaxTokens,
        externalEndpointEnabled: settings.externalEndpointEnabled,
      },
    });
  } catch (error) {
    console.error("[Zyphon Admin] Failed to update settings:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
