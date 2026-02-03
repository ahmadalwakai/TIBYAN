/**
 * Zyphon AI External Integration Endpoint
 * 
 * POST /api/zyphon/v1/chat
 * 
 * External API for third-party integrations.
 * Requires API key authentication via Bearer token.
 * 
 * Security:
 * - Validates API key via SHA-256 hash comparison
 * - Checks scopes (requires chat:write)
 * - Rate limiting per key+IP
 * - Audit logging for all requests
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion, type ChatMessage } from "@/lib/groqClient";
import { db } from "@/lib/db";
import {
  verifyKey,
  hasScope,
  updateKeyLastUsed,
  logZyphonAudit,
  extractBearerToken,
  ZYPHON_SCOPES,
  getDefaultSettings,
} from "@/lib/zyphon";
import { checkZyphonRateLimit } from "@/lib/zyphon/rate-limit";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// Schemas & Types
// ============================================

const ExternalChatSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  locale: z.enum(["ar", "en"]).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  maxTokens: z.number().min(50).max(4096).optional(),
});

// ============================================
// Helpers
// ============================================

function generateRequestId(): string {
  return `zyp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

async function getZyphonSettings() {
  try {
    const settings = await db.zyphonSettings.findFirst();
    if (settings) {
      return {
        defaultLanguageMode: settings.defaultLanguageMode as "auto" | "locked_ar" | "locked_en",
        strictNoThirdLanguage: settings.strictNoThirdLanguage,
        defaultMaxTokens: settings.defaultMaxTokens,
        externalEndpointEnabled: settings.externalEndpointEnabled,
      };
    }
  } catch (error) {
    console.error("[Zyphon] Failed to fetch settings:", error);
  }
  return getDefaultSettings();
}

function getCORSHeaders(): Record<string, string> {
  const allowedOrigins = process.env.ZYPHON_ALLOWED_ORIGINS || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (allowedOrigins) {
    headers["Access-Control-Allow-Origin"] = allowedOrigins.split(",")[0].trim();
  }

  return headers;
}

// ============================================
// System Prompt
// ============================================

const SYSTEM_PROMPT = `أنت "زيفون" (Zyphon)، مساعد ذكي متخصص من معهد تبيان للتعليم الإسلامي والعربي.

هويتك:
- اسمك: زيفون (Zyphon)
- تابع لمعهد تبيان للأطفال العرب في ألمانيا وأوروبا
- تخصصك: القرآن الكريم، اللغة العربية، العلوم الإسلامية

قواعد صارمة:
1. أجب بلغة السائل (العربية أو الإنجليزية فقط)
2. لا تستخدم لغات أخرى (لا صينية، لا يابانية، إلخ)
3. كن ودوداً ومحترماً
4. ركز على المحتوى التعليمي`;

// ============================================
// Handlers
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCORSHeaders(),
  });
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  const corsHeaders = getCORSHeaders();

  try {
    // 1. Check if external endpoint is enabled
    const settings = await getZyphonSettings();
    if (!settings.externalEndpointEnabled) {
      await logZyphonAudit({
        action: "ext.denied",
        ip,
        userAgent,
        meta: { reason: "endpoint_disabled", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "External API is currently disabled" },
        { status: 503, headers: corsHeaders }
      );
    }

    // 2. Validate API key
    const authHeader = request.headers.get("authorization");
    const rawKey = extractBearerToken(authHeader);

    if (!rawKey) {
      await logZyphonAudit({
        action: "ext.denied",
        ip,
        userAgent,
        meta: { reason: "missing_auth", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Missing or invalid Authorization header" },
        { status: 401, headers: corsHeaders }
      );
    }

    const keyInfo = await verifyKey(rawKey);
    if (!keyInfo) {
      await logZyphonAudit({
        action: "ext.denied",
        ip,
        userAgent,
        meta: { reason: "invalid_key", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Invalid or revoked API key" },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. Check scope
    if (!hasScope(keyInfo.scopes, ZYPHON_SCOPES.CHAT_WRITE)) {
      await logZyphonAudit({
        action: "ext.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "insufficient_scope", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "API key does not have chat:write scope" },
        { status: 403, headers: corsHeaders }
      );
    }

    // 4. Rate limiting
    const rateLimitResult = checkZyphonRateLimit(keyInfo.prefix, ip);
    if (rateLimitResult.limited) {
      await logZyphonAudit({
        action: "ext.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "rate_limited", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded" },
        { status: 429, headers: corsHeaders }
      );
    }

    // 5. Parse request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsed = ExternalChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { message, sessionId, locale, history, maxTokens } = parsed.data;

    // 6. Input size check
    if (message.length > 10000) {
      return NextResponse.json(
        { ok: false, error: "Input too large" },
        { status: 413, headers: corsHeaders }
      );
    }

    // 7. Build messages for Groq
    const sessionLanguage = locale || "ar";
    const langInstruction = sessionLanguage === "ar"
      ? "IMPORTANT: Respond ONLY in Arabic."
      : "IMPORTANT: Respond ONLY in English.";

    const messages: ChatMessage[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${langInstruction}` },
      ...history.slice(-10).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    // 8. Call Groq
    const reply = await chatCompletion(messages, {
      maxTokens: maxTokens || settings.defaultMaxTokens,
      temperature: 0.7,
    });

    // 9. Log success
    await Promise.all([
      logZyphonAudit({
        action: "ext.request",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: {
          requestId,
          messageLength: message.length,
          replyLength: reply.length,
          locale: sessionLanguage,
          processingTime: Date.now() - startTime,
        },
      }),
      updateKeyLastUsed(keyInfo.id),
    ]);

    // 10. Return response
    return NextResponse.json(
      {
        ok: true,
        data: {
          reply,
          sessionId: sessionId || `ext_${requestId}`,
          locale: sessionLanguage,
          processingTime: Date.now() - startTime,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Zyphon External] Error:", error);

    await logZyphonAudit({
      action: "ext.error",
      ip,
      userAgent,
      meta: { requestId, error: error instanceof Error ? error.message : "Unknown error" },
    });

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
