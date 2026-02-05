/**
 * Internal AI Image Generation Endpoint
 * 
 * POST /api/ai/image
 * 
 * Internal endpoint for Zyphon UI image generation.
 * No API key required - uses session auth only.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage, StorageError } from "@/lib/storage";
import {
  generateImage,
  isImageGenerationConfigured,
  VALID_IMAGE_SIZES,
  VALID_IMAGE_FORMATS,
  MAX_PROMPT_LENGTH,
  type ImageSize,
  type ImageFormat,
} from "@/lib/zyphon/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Request schema
const RequestSchema = z.object({
  prompt: z.string().min(1).max(MAX_PROMPT_LENGTH),
  size: z.enum(VALID_IMAGE_SIZES as [string, ...string[]]).default("1024x1024"),
  format: z.enum(VALID_IMAGE_FORMATS as [string, ...string[]]).default("png"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check if image generation is configured
    if (!isImageGenerationConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Image generation is not configured. Please contact administrator." },
        { status: 400 }
      );
    }

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: parseResult.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { prompt, size, format } = parseResult.data;

    // 3. Generate image
    const result = await generateImage({
      prompt,
      size: size as ImageSize,
      format: format as ImageFormat,
    });

    if (!result.success || !result.imageBuffer) {
      return NextResponse.json(
        { ok: false, error: result.error || "Image generation failed" },
        { status: 500 }
      );
    }

    // 4. Store image
    const timestamp = Date.now();
    const filename = `zyphon_image_${timestamp}.${format}`;
    const mimeType = result.mimeType || (format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp");

    let uploadResult;
    try {
      uploadResult = await storage.upload(
        result.imageBuffer,
        filename,
        { contentType: mimeType }
      );
    } catch (storageErr) {
      if (storageErr instanceof StorageError && storageErr.code === "PRODUCTION_LOCAL_DENIED") {
        return NextResponse.json(
          { ok: false, error: storageErr.message },
          { status: 500 }
        );
      }
      throw storageErr;
    }

    // 5. Return response
    return NextResponse.json({
      ok: true,
      data: {
        url: uploadResult.url,
        size,
        format,
      },
    });
  } catch (error) {
    console.error("[AI Image] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
