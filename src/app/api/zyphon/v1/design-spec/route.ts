/**
 * Zyphon AI Design Spec Endpoint
 * 
 * POST /api/zyphon/v1/design-spec
 * 
 * Uses Groq to generate a structured JSON design specification
 * for local SVG rendering. No external image providers used.
 * 
 * Requires API key authentication with "image:generate" scope.
 */

import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/groqClient";
import {
  verifyKey,
  hasScope,
  updateKeyLastUsed,
  logZyphonAudit,
  extractBearerToken,
} from "@/lib/zyphon";
import { checkZyphonRateLimit } from "@/lib/zyphon/rate-limit";
import {
  DesignRequestSchema,
  DesignSpecSchema,
  ACCENT_COLORS,
  BACKGROUND_COLORS,
  type DesignSpec,
  type DesignRequest,
} from "@/lib/zyphon/svg-gen/types";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Required scope
const REQUIRED_SCOPE = "image:generate";

// Max prompt length
const MAX_PROMPT_LENGTH = 500;

// ============================================
// Helpers
// ============================================

function generateRequestId(): string {
  return `dspec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

/**
 * Build the system prompt for Groq to generate design specs
 */
function buildSystemPrompt(): string {
  return `You are a JSON-only design specification generator. You output ONLY valid JSON, no prose, no markdown, no explanations.

Generate a DesignSpec JSON object for creating stylized Arabic calligraphy SVG images.

The JSON schema you MUST follow:
{
  "canvas": { "w": number (256-2048), "h": number (256-2048), "bg": "#RRGGBB" },
  "text": {
    "value": "string (Arabic text)",
    "strokeWidth": number (1-50),
    "geometryStyle": "kufic-block" | "kufic-rounded" | "angular" | "geometric",
    "centered": boolean,
    "color": "#RRGGBB" (optional),
    "scale": number (0.5-3)
  },
  "patterns": {
    "islamic": { "enabled": boolean, "opacity": 0-1, "tile": "8-point-star"|"6-point-star"|"hexagonal"|"octagonal", "scale": 0.5-3, "color": "#RRGGBB" (optional) },
    "circuit": { "enabled": boolean, "opacity": 0-1, "density": 0.1-1, "color": "#RRGGBB" (optional), "nodeRadius": 1-10 }
  },
  "accent": { "color": "#RRGGBB", "lineWeight": 1-20, "glow": 0-1 },
  "seed": number (random integer 0-999999999)
}

RULES:
1. Output ONLY the JSON object, nothing else
2. Respond with a single JSON object on one line if possible
3. All colors must be 6-digit hex format (#RRGGBB)
4. Adjust values based on the style/mood requested
5. For "minimal-premium": low pattern opacity (0.05-0.1), clean lines
6. For "vibrant": higher opacity, bolder colors
7. For "traditional": stronger islamic patterns, gold/warm accents
8. For "tech": stronger circuit patterns, cyan/green accents`;
}

/**
 * Build the user prompt based on the design request
 */
function buildUserPrompt(request: DesignRequest): string {
  const accentColor = ACCENT_COLORS[request.accent] || ACCENT_COLORS.emerald;
  const bgColor = BACKGROUND_COLORS[request.background] || BACKGROUND_COLORS.black;
  
  return `Generate a DesignSpec for:
- Arabic text: "${request.brandTextAr}"
- Style: ${request.style}
- Mood: ${request.mood}
- Accent color: ${accentColor}
- Background: ${bgColor}

Output JSON only.`;
}

/**
 * Parse and validate Groq response as DesignSpec
 */
function parseDesignSpec(response: string): DesignSpec {
  // Try to extract JSON from the response
  let jsonStr = response.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith("```")) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonStr = match[1];
    }
  }
  
  // Parse JSON
  const parsed = JSON.parse(jsonStr);
  
  // Validate with Zod schema
  const validated = DesignSpecSchema.parse(parsed);
  
  return validated;
}

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
    // 1. Extract and verify API key
    const authHeader = request.headers.get("authorization");
    const token = extractBearerToken(authHeader);
    if (!token) {
      await logZyphonAudit({
        action: "design-spec.denied",
        ip,
        userAgent,
        meta: { reason: "missing_token", requestId },
      });

      return NextResponse.json(
        { ok: false, error: "Missing or invalid Authorization header" },
        { status: 401, headers: corsHeaders }
      );
    }

    const keyRecord = await verifyKey(token);
    if (!keyRecord) {
      await logZyphonAudit({
        action: "design-spec.denied",
        ip,
        userAgent,
        meta: { reason: "invalid_key", requestId },
      });

      return NextResponse.json(
        { ok: false, error: "Invalid API key" },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Check scope
    if (!hasScope(keyRecord.scopes, REQUIRED_SCOPE)) {
      await logZyphonAudit({
        action: "design-spec.denied",
        keyPrefix: keyRecord.prefix,
        ip,
        userAgent,
        meta: { reason: "insufficient_scope", required: REQUIRED_SCOPE, requestId },
      });

      return NextResponse.json(
        { ok: false, error: `Missing required scope: ${REQUIRED_SCOPE}` },
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Rate limiting (reuse existing rate limiter)
    const rateLimitResult = checkZyphonRateLimit(keyRecord.prefix, ip);
    if (rateLimitResult.limited) {
      await logZyphonAudit({
        action: "design-spec.rate_limited",
        keyPrefix: keyRecord.prefix,
        ip,
        userAgent,
        meta: { requestId, resetTime: rateLimitResult.resetTime },
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
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          },
        }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const parseResult = DesignRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      await logZyphonAudit({
        action: "design-spec.invalid_request",
        keyPrefix: keyRecord.prefix,
        ip,
        userAgent,
        meta: { errors: parseResult.error.issues, requestId },
      });

      return NextResponse.json(
        { ok: false, error: "Invalid request body", details: parseResult.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    const designRequest = parseResult.data;

    // 5. Validate prompt length
    if (designRequest.brandTextAr.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Brand text exceeds ${MAX_PROMPT_LENGTH} characters` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 6. Call Groq to generate design spec
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(designRequest);

    const groqResponse = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        model: "llama-3.3-70b-versatile",
        maxTokens: 1024,
        temperature: 0.7,
      }
    );

    // 7. Parse and validate the design spec
    let designSpec: DesignSpec;
    try {
      designSpec = parseDesignSpec(groqResponse);
    } catch (parseError) {
      console.error("[DesignSpec] Failed to parse Groq response:", groqResponse);
      
      await logZyphonAudit({
        action: "design-spec.parse_error",
        keyPrefix: keyRecord.prefix,
        ip,
        userAgent,
        meta: { 
          requestId, 
          error: parseError instanceof Error ? parseError.message : "Parse error",
        },
      });

      // Return a fallback design spec
      const fallbackSpec: DesignSpec = {
        canvas: { w: 1024, h: 1024, bg: BACKGROUND_COLORS[designRequest.background] || "#000000" },
        text: {
          value: designRequest.brandTextAr,
          strokeWidth: 10,
          geometryStyle: "kufic-block",
          centered: true,
          scale: 1,
        },
        patterns: {
          islamic: { enabled: true, opacity: 0.08, tile: "8-point-star", scale: 1 },
          circuit: { enabled: true, opacity: 0.18, density: 0.35, nodeRadius: 3 },
        },
        accent: { 
          color: ACCENT_COLORS[designRequest.accent] || "#00A86B", 
          lineWeight: 3, 
          glow: 0 
        },
        seed: Math.floor(Math.random() * 999999999),
      };

      designSpec = fallbackSpec;
    }

    // 8. Update key last used
    await updateKeyLastUsed(keyRecord.id);

    // 9. Log success
    const duration = Date.now() - startTime;
    await logZyphonAudit({
      action: "design-spec.success",
      keyPrefix: keyRecord.prefix,
      ip,
      userAgent,
      meta: { requestId, duration, brandText: designRequest.brandTextAr },
    });

    // 10. Return design spec
    return NextResponse.json(
      {
        ok: true,
        data: {
          requestId,
          spec: designSpec,
        },
      },
      { 
        status: 200, 
        headers: {
          ...corsHeaders,
          "X-Request-Id": requestId,
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      }
    );

  } catch (error) {
    console.error("[DesignSpec] Error:", error);
    
    await logZyphonAudit({
      action: "design-spec.error",
      ip,
      userAgent,
      meta: { 
        requestId, 
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
