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
import { chatCompletion } from "@/lib/llm/client";
import type { LLMMessage } from "@/lib/llm/types";
import { searchKnowledgeBase, buildSystemPrompt } from "@/lib/ai/kb";
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
import {
  identityGuard,
  validateInputSize,
  determineSessionLanguage,
  sanitizeHistory,
  generateLanguageGuardMessage,
  filterStreamChunk,
  getLanguageFallbackMessage,
  generateRequestId,
  type AllowedLanguage,
} from "@/lib/ai-agent";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Request schema for external chat
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

// Get client IP from request
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

// Get Zyphon settings from DB or defaults
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

// CORS headers for external access
function getCORSHeaders(): Record<string, string> {
  const allowedOrigins = process.env.ZYPHON_ALLOWED_ORIGINS || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (allowedOrigins) {
    // If specific origins are configured, use them
    headers["Access-Control-Allow-Origin"] = allowedOrigins.split(",")[0].trim();
  }
  // If no origins configured, don't set CORS header (server-to-server only)

  return headers;
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCORSHeaders(),
  });
}

/**
 * POST /api/zyphon/v1/chat
 * External chat endpoint with API key authentication
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  // CORS headers
  const corsHeaders = getCORSHeaders();

  try {
    // ================================================================
    // 1. Check if external endpoint is enabled
    // ================================================================
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

    // ================================================================
    // 2. Extract and validate API key
    // ================================================================
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
        { ok: false, error: "Missing or invalid Authorization header. Use: Bearer <api_key>" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify the key (hash comparison)
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

    // ================================================================
    // 3. Check scope permissions
    // ================================================================
    if (!hasScope(keyInfo.scopes, ZYPHON_SCOPES.CHAT_WRITE)) {
      await logZyphonAudit({
        action: "ext.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "insufficient_scope", requiredScope: ZYPHON_SCOPES.CHAT_WRITE, requestId },
      });
      return NextResponse.json(
        { ok: false, error: "API key does not have chat:write scope" },
        { status: 403, headers: corsHeaders }
      );
    }

    // ================================================================
    // 4. Rate limiting
    // ================================================================
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
        {
          ok: false,
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // ================================================================
    // 5. Parse and validate request body
    // ================================================================
    const body = await request.json().catch(() => null);
    if (!body) {
      await logZyphonAudit({
        action: "ext.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "invalid_json", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsed = ExternalChatSchema.safeParse(body);
    if (!parsed.success) {
      await logZyphonAudit({
        action: "ext.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "invalid_input", errors: parsed.error.flatten(), requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Invalid request format", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { message, sessionId, locale, history, maxTokens } = parsed.data;

    // ================================================================
    // 6. Input size validation
    // ================================================================
    const sizeCheck = validateInputSize(message);
    if (!sizeCheck.isValid) {
      await logZyphonAudit({
        action: "ext.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "input_too_large", size: sizeCheck.characterCount, requestId },
      });
      return NextResponse.json(
        { ok: false, error: `Input too large: ${sizeCheck.characterCount}/${sizeCheck.limit} characters` },
        { status: 413, headers: corsHeaders }
      );
    }

    // ================================================================
    // 7. Identity lock check
    // ================================================================
    const identityCheck = identityGuard(message);
    if (identityCheck.intercepted) {
      await logZyphonAudit({
        action: "ext.request",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { requestId, identityBlocked: true },
      });
      
      // Update last used
      await updateKeyLastUsed(keyInfo.id);
      
      return NextResponse.json(
        {
          ok: true,
          data: {
            reply: identityCheck.response || "Security policy enforced",
            sessionId: sessionId || `ext_${requestId}`,
            processingTime: Date.now() - startTime,
          },
        },
        { headers: corsHeaders }
      );
    }

    // ================================================================
    // 8. Language handling
    // ================================================================
    let sessionLanguage: AllowedLanguage;
    
    // If locale is explicitly provided, lock to that language
    if (locale) {
      sessionLanguage = locale;
    } else if (settings.defaultLanguageMode === "locked_ar") {
      sessionLanguage = "ar";
    } else if (settings.defaultLanguageMode === "locked_en") {
      sessionLanguage = "en";
    } else {
      // Auto-detect from message
      sessionLanguage = determineSessionLanguage(sessionId || requestId, message);
    }

    // Sanitize history (remove CJK content if strictNoThirdLanguage)
    let sanitizedHistory = history;
    if (settings.strictNoThirdLanguage) {
      const sanitizationResult = sanitizeHistory(
        history.map((h) => ({ role: h.role, content: h.content }))
      );
      sanitizedHistory = sanitizationResult.messages as typeof history;
    }

    // Truncate history to fit budget
    const MAX_HISTORY_TOKENS = 900;
    const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
    
    let historyTokens = 0;
    const truncatedHistory: typeof history = [];
    for (let i = sanitizedHistory.length - 1; i >= 0; i--) {
      const msgTokens = estimateTokens(sanitizedHistory[i].content);
      if (historyTokens + msgTokens > MAX_HISTORY_TOKENS) break;
      truncatedHistory.unshift(sanitizedHistory[i]);
      historyTokens += msgTokens;
    }

    // ================================================================
    // 9. Build messages for LLM
    // ================================================================
    const systemPrompt = buildSystemPrompt([], { isAdmin: false });
    
    // Build language guard
    let languageGuardContent = generateLanguageGuardMessage(sessionLanguage).content;
    if (locale) {
      const langName = locale === "ar" ? "Arabic" : "English";
      languageGuardContent += `\n\nCRITICAL: Respond ONLY in ${langName}. Even if the user writes in another language, reply in ${langName}.`;
    }
    if (settings.strictNoThirdLanguage) {
      languageGuardContent += "\n\nNEVER respond in any language other than Arabic or English. No Chinese, Japanese, Korean, or any other language.";
    }

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "system", content: languageGuardContent },
      ...truncatedHistory.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user", content: message },
    ];

    // ================================================================
    // 10. Call LLM (non-streaming for external API v1)
    // ================================================================
    const responseMaxTokens = maxTokens || settings.defaultMaxTokens;
    
    const llmResult = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: Math.min(responseMaxTokens, 4096),
    });

    if (!llmResult.ok) {
      await logZyphonAudit({
        action: "ext.error",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { requestId, error: llmResult.error },
      });
      return NextResponse.json(
        { ok: false, error: "Failed to generate response" },
        { status: 500, headers: corsHeaders }
      );
    }

    let reply = llmResult.content || "";

    // ================================================================
    // 11. Language guard on response (filter CJK if enabled)
    // ================================================================
    if (settings.strictNoThirdLanguage) {
      const filterResult = filterStreamChunk(reply, sessionLanguage);
      if (filterResult.cjkDetected) {
        // Replace with fallback
        reply = getLanguageFallbackMessage(sessionLanguage);
      }
    }

    // ================================================================
    // 12. Log success and update last used
    // ================================================================
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

    // ================================================================
    // 13. Return response
    // ================================================================
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
      {
        headers: {
          ...corsHeaders,
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        },
      }
    );
  } catch (error) {
    console.error("[Zyphon External] Unexpected error:", error);
    
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
