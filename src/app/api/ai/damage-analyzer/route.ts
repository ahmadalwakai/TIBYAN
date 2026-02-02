/**
 * AI Agent - Damage Analyzer API Route
 * =====================================
 * Analyzes images for damage detection and assessment.
 * 
 * SECURITY: Image count is validated BEFORE any processing.
 * Maximum allowed: 8 images per request (hard limit).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  decodeUserData,
  type CookieUserData,
} from "@/lib/auth/cookie-encoding";
import {
  audit,
  vision,
  MAX_DAMAGE_ANALYZER_IMAGES,
  getImageLimitExceededMessage,
  getNoImagesProvidedMessage,
  NoImagesProvidedError,
  ImageLimitExceededError,
  AgentErrorCode,
} from "@/lib/ai-agent";
import { validateDamageAnalyzerImages } from "@/lib/ai-agent/validators";

// ============================================
// Request Schema
// ============================================

const DamageAnalyzerRequestSchema = z.object({
  images: z.array(
    z.object({
      base64: z.string().optional(),
      url: z.string().url().optional(),
    }).refine(
      (img) => img.base64 || img.url,
      { message: "يجب تقديم base64 أو url لكل صورة" }
    )
  ),
  context: z.string().optional(),
  language: z.enum(["ar", "en"]).default("ar"),
});

type DamageAnalyzerRequest = z.infer<typeof DamageAnalyzerRequestSchema>;

// ============================================
// Helpers
// ============================================

function generateRequestId(): string {
  return `dmg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function getUserFromCookie(): Promise<CookieUserData | null> {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user-data");

    if (!userDataCookie?.value) {
      return null;
    }

    return decodeUserData(userDataCookie.value);
  } catch {
    return null;
  }
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Get user from cookie
  const user = await getUserFromCookie();
  const userId = user?.id;
  const userRole = user?.role;
  const prismaRole = userRole === "GUEST" ? undefined : userRole;

  try {
    // Parse request body
    const body: unknown = await request.json();
    const parseResult = DamageAnalyzerRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({
        ok: false,
        error: "البيانات المدخلة غير صالحة",
        errorCode: AgentErrorCode.INVALID_INPUT,
        details: parseResult.error.issues,
      }, { status: 400 });
    }

    const { images, context, language } = parseResult.data;

    // ========================================
    // IMAGE LIMIT ENFORCEMENT (HIGHEST PRIORITY)
    // This validation happens BEFORE any image decoding,
    // OCR, vision inference, or AI reasoning.
    // ========================================
    try {
      validateDamageAnalyzerImages(images);
    } catch (error) {
      if (error instanceof NoImagesProvidedError) {
        return NextResponse.json({
          ok: false,
          error: getNoImagesProvidedMessage(),
          errorCode: AgentErrorCode.NO_IMAGES_PROVIDED,
        }, { status: 400 });
      }

      if (error instanceof ImageLimitExceededError) {
        // Log the violation
        await audit.logDamageAnalyzerImageLimitExceeded(requestId, {
          userId,
          userRole: prismaRole,
          providedCount: error.providedCount,
          limit: error.limit,
          timestamp: new Date(),
        });

        return NextResponse.json({
          ok: false,
          error: getImageLimitExceededMessage(error.providedCount, error.limit),
          errorCode: AgentErrorCode.IMAGE_LIMIT_EXCEEDED,
          details: {
            providedCount: error.providedCount,
            limit: error.limit,
          },
        }, { status: 400 });
      }

      throw error;
    }

    // ========================================
    // PROCESS IMAGES (Only reached if count is valid)
    // ========================================
    const analysisResults = [];

    for (const image of images) {
      const prompt = context
        ? `Analyze this image for damage assessment. Context: ${context}. Describe any visible damage, its severity, location, and potential causes.`
        : `Analyze this image for damage assessment. Describe any visible damage, its severity, location, and potential causes. Include recommendations for repair if applicable.`;

      const result = await vision.analyzeImage(
        { base64: image.base64, url: image.url },
        prompt,
        {
          sessionId: `damage_${requestId}`,
          userId,
          userRole: prismaRole,
          locale: language,
          requestId,
        }
      );

      if (result.ok && result.data) {
        analysisResults.push({
          imageIndex: analysisResults.length,
          analysis: result.data,
          durationMs: result.durationMs,
        });
      } else {
        analysisResults.push({
          imageIndex: analysisResults.length,
          error: result.error,
          errorCode: result.errorCode,
        });
      }
    }

    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        imagesAnalyzed: analysisResults.length,
        results: analysisResults,
        totalDurationMs: totalDuration,
      },
    });

  } catch (error) {
    console.error("[Damage Analyzer] Error:", error);

    return NextResponse.json({
      ok: false,
      error: "حدث خطأ أثناء تحليل الصور",
      errorCode: AgentErrorCode.INTERNAL_ERROR,
    }, { status: 500 });
  }
}
