/**
 * Zyphon AI Image Generation Endpoint
 * 
 * POST /api/zyphon/v1/image
 * 
 * External API for AI image generation.
 * Requires API key authentication with "image:generate" scope.
 * 
 * Security:
 * - Validates API key via SHA-256 hash comparison
 * - Checks scopes (requires image:generate)
 * - Rate limiting: 10 requests/hour per key+IP
 * - Audit logging for all requests
 * 
 * Example curl:
 * curl -X POST http://localhost:3000/api/zyphon/v1/image \
 *   -H "Authorization: Bearer zy_your_api_key" \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt": "A serene mosque at sunset", "size": "1024x1024", "format": "png"}'
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage, StorageError } from "@/lib/storage";
import {
  verifyKey,
  hasScope,
  updateKeyLastUsed,
  logZyphonAudit,
  extractBearerToken,
} from "@/lib/zyphon";
import { checkZyphonRateLimit } from "@/lib/zyphon/rate-limit";
import {
  generateImage,
  isImageGenerationConfigured,
  VALID_IMAGE_SIZES,
  VALID_IMAGE_FORMATS,
  MAX_PROMPT_LENGTH,
  type ImageSize,
  type ImageFormat,
} from "@/lib/zyphon/image";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Image generation scope
const IMAGE_GENERATE_SCOPE = "image:generate";

// Rate limit: 10 requests per hour
const IMAGE_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// In-memory rate limit store for image generation
const imageRateLimitStore = new Map<string, { count: number; resetTime: number }>();

// ============================================
// Schemas
// ============================================

const ImageRequestSchema = z.object({
  prompt: z.string().min(1).max(MAX_PROMPT_LENGTH),
  size: z.enum(VALID_IMAGE_SIZES as unknown as [string, ...string[]]),
  format: z.enum(VALID_IMAGE_FORMATS as unknown as [string, ...string[]]),
});

// ============================================
// Helpers
// ============================================

function generateRequestId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateFilename(format: ImageFormat): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}.${format}`;
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

function checkImageRateLimit(
  keyPrefix: string,
  ip: string
): { limited: boolean; remaining: number; resetTime: number } {
  const identifier = `image:${keyPrefix}:${ip}`;
  const now = Date.now();
  const entry = imageRateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + IMAGE_RATE_LIMIT.windowMs;
    imageRateLimitStore.set(identifier, { count: 1, resetTime });
    return { limited: false, remaining: IMAGE_RATE_LIMIT.maxRequests - 1, resetTime };
  }

  entry.count++;
  imageRateLimitStore.set(identifier, entry);

  if (entry.count > IMAGE_RATE_LIMIT.maxRequests) {
    return { limited: true, remaining: 0, resetTime: entry.resetTime };
  }

  return {
    limited: false,
    remaining: IMAGE_RATE_LIMIT.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
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
    // 1. Check if image generation is configured
    if (!isImageGenerationConfigured()) {
      await logZyphonAudit({
        action: "image.denied",
        ip,
        userAgent,
        meta: { reason: "provider_not_configured", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Image generation is not configured. REPLICATE_API_TOKEN is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Validate API key
    const authHeader = request.headers.get("authorization");
    const rawKey = extractBearerToken(authHeader);

    if (!rawKey) {
      await logZyphonAudit({
        action: "image.denied",
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
        action: "image.denied",
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
    if (!hasScope(keyInfo.scopes, IMAGE_GENERATE_SCOPE)) {
      await logZyphonAudit({
        action: "image.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "insufficient_scope", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "API key does not have image:generate scope" },
        { status: 403, headers: corsHeaders }
      );
    }

    // 4. Rate limiting (10/hour)
    const rateLimitResult = checkImageRateLimit(keyInfo.prefix, ip);
    if (rateLimitResult.limited) {
      await logZyphonAudit({
        action: "image.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "rate_limited", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded (10 requests/hour)" },
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

    const parsed = ImageRequestSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json(
        { ok: false, error: `Validation error: ${issues}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const { prompt, size, format } = parsed.data;

    // 6. Generate image
    const result = await generateImage({
      prompt,
      size: size as ImageSize,
      format: format as ImageFormat,
    });

    if (!result.success || !result.imageBuffer) {
      await logZyphonAudit({
        action: "image.error",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { requestId, error: result.error },
      });
      return NextResponse.json(
        { ok: false, error: result.error || "Image generation failed" },
        { status: 500, headers: corsHeaders }
      );
    }

    // 7. Upload to storage (Vercel Blob in prod, local in dev)
    const filename = generateFilename(format as ImageFormat);
    const storagePath = `ai-images/${filename}`;
    const mimeType = format === "png" ? "image/png" : "image/jpeg";

    let uploadResult;
    try {
      uploadResult = await storage.upload(result.imageBuffer, storagePath, {
        contentType: mimeType,
      });
    } catch (storageErr) {
      if (storageErr instanceof StorageError && storageErr.code === "PRODUCTION_LOCAL_DENIED") {
        return NextResponse.json(
          { ok: false, error: storageErr.message },
          { status: 500, headers: corsHeaders }
        );
      }
      throw storageErr;
    }

    const url = uploadResult.url;

    // 8. Log success
    await Promise.all([
      logZyphonAudit({
        action: "image.generated",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: {
          requestId,
          promptLength: prompt.length,
          size,
          format,
          processingTime: Date.now() - startTime,
          url,
        },
      }),
      updateKeyLastUsed(keyInfo.id),
    ]);

    // 9. Return response
    return NextResponse.json(
      {
        ok: true,
        data: {
          url,
          storage: uploadResult.storage,
          size,
          format,
          processingTime: Date.now() - startTime,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Zyphon Image] Error:", error);

    await logZyphonAudit({
      action: "image.error",
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
