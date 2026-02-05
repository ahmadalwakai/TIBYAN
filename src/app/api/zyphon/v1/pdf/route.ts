/**
 * Zyphon AI PDF Generation Endpoint
 * 
 * POST /api/zyphon/v1/pdf
 * 
 * External API for server-side PDF generation.
 * Requires API key authentication with "pdf:generate" scope.
 * 
 * Security:
 * - Validates API key via SHA-256 hash comparison
 * - Checks scopes (requires pdf:generate)
 * - Rate limiting: 30 requests/hour per key+IP
 * - Payload size limit: 100KB
 * - Audit logging for all requests
 * 
 * Example curl (teacher-report):
 * curl -X POST http://localhost:3000/api/zyphon/v1/pdf \
 *   -H "Authorization: Bearer zy_your_api_key" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "type": "teacher-report",
 *     "data": {
 *       "teacherName": "أحمد محمد",
 *       "reportDate": "2026-02-05",
 *       "courseName": "تجويد القرآن",
 *       "totalStudents": 25,
 *       "completedStudents": 20,
 *       "averageScore": 85
 *     }
 *   }'
 * 
 * Example curl (certificate):
 * curl -X POST http://localhost:3000/api/zyphon/v1/pdf \
 *   -H "Authorization: Bearer zy_your_api_key" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "type": "certificate",
 *     "data": {
 *       "studentName": "فاطمة علي",
 *       "courseName": "أساسيات التجويد",
 *       "completionDate": "2026-02-05",
 *       "certificateNumber": "TBY-2026-0001",
 *       "grade": "A",
 *       "score": 95
 *     }
 *   }'
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
import {
  generatePdf,
  VALID_PDF_TYPES,
  MAX_PAYLOAD_SIZE,
  type PdfTemplateType,
} from "@/lib/zyphon/pdf";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PDF generation scope
const PDF_GENERATE_SCOPE = "pdf:generate";

// Rate limit: 30 requests per hour
const PDF_RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// In-memory rate limit store for PDF generation
const pdfRateLimitStore = new Map<string, { count: number; resetTime: number }>();

// ============================================
// Schemas
// ============================================

const TeacherReportDataSchema = z.object({
  teacherName: z.string().min(1).max(200),
  teacherNameEn: z.string().max(200).optional(),
  reportDate: z.string().min(1).max(50),
  courseName: z.string().min(1).max(200),
  courseNameEn: z.string().max(200).optional(),
  totalStudents: z.number().int().min(0).max(10000),
  completedStudents: z.number().int().min(0).max(10000),
  averageScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const CertificateDataSchema = z.object({
  studentName: z.string().min(1).max(200),
  studentNameEn: z.string().max(200).optional(),
  courseName: z.string().min(1).max(200),
  courseNameEn: z.string().max(200).optional(),
  completionDate: z.string().min(1).max(50),
  grade: z.string().max(20).optional(),
  score: z.number().min(0).max(100).optional(),
  certificateNumber: z.string().min(1).max(50),
  instructorName: z.string().max(200).optional(),
  courseDuration: z.string().max(100).optional(),
});

const PdfRequestSchema = z.object({
  type: z.enum(VALID_PDF_TYPES as unknown as [string, ...string[]]),
  data: z.union([TeacherReportDataSchema, CertificateDataSchema]),
});

// ============================================
// Helpers
// ============================================

function generateRequestId(): string {
  return `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateFilename(type: PdfTemplateType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}.pdf`;
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

function checkPdfRateLimit(
  keyPrefix: string,
  ip: string
): { limited: boolean; remaining: number; resetTime: number } {
  const identifier = `pdf:${keyPrefix}:${ip}`;
  const now = Date.now();
  const entry = pdfRateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + PDF_RATE_LIMIT.windowMs;
    pdfRateLimitStore.set(identifier, { count: 1, resetTime });
    return { limited: false, remaining: PDF_RATE_LIMIT.maxRequests - 1, resetTime };
  }

  entry.count++;
  pdfRateLimitStore.set(identifier, entry);

  if (entry.count > PDF_RATE_LIMIT.maxRequests) {
    return { limited: true, remaining: 0, resetTime: entry.resetTime };
  }

  return {
    limited: false,
    remaining: PDF_RATE_LIMIT.maxRequests - entry.count,
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
    // 1. Check payload size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Payload too large (max 100KB)" },
        { status: 413, headers: corsHeaders }
      );
    }

    // 2. Validate API key
    const authHeader = request.headers.get("authorization");
    const rawKey = extractBearerToken(authHeader);

    if (!rawKey) {
      await logZyphonAudit({
        action: "pdf.denied",
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
        action: "pdf.denied",
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
    if (!hasScope(keyInfo.scopes, PDF_GENERATE_SCOPE)) {
      await logZyphonAudit({
        action: "pdf.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "insufficient_scope", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "API key does not have pdf:generate scope" },
        { status: 403, headers: corsHeaders }
      );
    }

    // 4. Rate limiting (30/hour)
    const rateLimitResult = checkPdfRateLimit(keyInfo.prefix, ip);
    if (rateLimitResult.limited) {
      await logZyphonAudit({
        action: "pdf.denied",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { reason: "rate_limited", requestId },
      });
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded (30 requests/hour)" },
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

    // Check actual payload size
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Payload too large (max 100KB)" },
        { status: 413, headers: corsHeaders }
      );
    }

    const parsed = PdfRequestSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json(
        { ok: false, error: `Validation error: ${issues}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const { type, data } = parsed.data;

    // 6. Generate PDF
    const result = await generatePdf({
      type: type as PdfTemplateType,
      data,
    });

    if (!result.success || !result.pdfBuffer) {
      await logZyphonAudit({
        action: "pdf.error",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: { requestId, error: result.error },
      });
      return NextResponse.json(
        { ok: false, error: result.error || "PDF generation failed" },
        { status: 500, headers: corsHeaders }
      );
    }

    // 7. Upload to storage (Vercel Blob in prod, local in dev)
    const filename = generateFilename(type as PdfTemplateType);
    const storagePath = `ai-pdfs/${filename}`;

    let uploadResult;
    try {
      uploadResult = await storage.upload(result.pdfBuffer, storagePath, {
        contentType: "application/pdf",
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
        action: "pdf.generated",
        keyPrefix: keyInfo.prefix,
        ip,
        userAgent,
        meta: {
          requestId,
          type,
          fileSize: result.pdfBuffer.length,
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
          filename,
          type,
          fileSize: result.pdfBuffer.length,
          processingTime: Date.now() - startTime,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Zyphon PDF] Error:", error);

    await logZyphonAudit({
      action: "pdf.error",
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
