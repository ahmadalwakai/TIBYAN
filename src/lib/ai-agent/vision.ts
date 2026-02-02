/**
 * AI Agent - Vision Module
 * Image understanding and analysis using LLaVA or similar multimodal models
 * Supports: image description, OCR, object detection, content analysis
 */

import { AgentError, AgentErrorCode } from "./errors";
import type { ToolContext, ToolResult } from "./types";

// ============================================
// Configuration
// ============================================

const VISION_API_URL = process.env.VISION_API_URL || "http://127.0.0.1:8080";
const VISION_TIMEOUT_MS = parseInt(process.env.VISION_TIMEOUT_MS || "60000", 10);

export interface VisionConfig {
  apiUrl: string;
  timeoutMs: number;
  maxImageSize: number; // bytes
  supportedFormats: string[];
  defaultModel: string;
}

const defaultConfig: VisionConfig = {
  apiUrl: VISION_API_URL,
  timeoutMs: VISION_TIMEOUT_MS,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  defaultModel: "llava-v1.6-mistral-7b",
};

// ============================================
// Types
// ============================================

export interface ImageInput {
  /** Base64 encoded image data */
  base64?: string;
  /** URL to fetch image from */
  url?: string;
  /** Local file path */
  filePath?: string;
}

export interface VisionAnalysisResult {
  description: string;
  detectedObjects?: string[];
  detectedText?: string[];
  colors?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  isAppropriate: boolean;
  confidence: number;
}

export interface OCRResult {
  text: string;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  language?: string;
}

interface LLaVARequest {
  model: string;
  prompt: string;
  images: string[];
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface LLaVAResponse {
  response: string;
  done: boolean;
  context?: number[];
}

// ============================================
// Safety Filters
// ============================================

const UNSAFE_CONTENT_KEYWORDS = [
  "inappropriate",
  "explicit",
  "nsfw",
  "violent",
  "gore",
  "nudity",
];

function checkContentSafety(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return !UNSAFE_CONTENT_KEYWORDS.some((keyword) => lowerDesc.includes(keyword));
}

// ============================================
// Vision Service
// ============================================

class VisionService {
  private config: VisionConfig;
  private isAvailable: boolean | null = null;

  constructor(config: Partial<VisionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Check if vision service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Check if llama-server supports vision
      const response = await fetch(`${this.config.apiUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.isAvailable = response.ok;
      return this.isAvailable;
    } catch {
      // Try alternative health check
      try {
        const response = await fetch(`${this.config.apiUrl}/health`);
        this.isAvailable = response.ok;
        return this.isAvailable;
      } catch {
        this.isAvailable = false;
        return false;
      }
    }
  }

  /**
   * Analyze an image and return description
   */
  async analyzeImage(
    image: ImageInput,
    prompt?: string,
    context?: ToolContext
  ): Promise<ToolResult<VisionAnalysisResult>> {
    const startTime = Date.now();

    try {
      // Get base64 image data
      const imageBase64 = await this.getImageBase64(image);

      if (!imageBase64) {
        return {
          ok: false,
          error: "لم يتم توفير صورة صالحة",
          errorCode: "INVALID_IMAGE",
          durationMs: Date.now() - startTime,
        };
      }

      // Check availability
      if (this.isAvailable === null) {
        await this.checkAvailability();
      }

      if (!this.isAvailable) {
        // Fallback to basic analysis without LLM
        return this.basicImageAnalysis(imageBase64, startTime);
      }

      // Build prompt for analysis
      const analysisPrompt =
        prompt ||
        `Analyze this image in detail. Describe:
1. What is shown in the image
2. Any text visible in the image
3. Main colors and composition
4. The overall mood or sentiment
5. Any objects or people visible

Respond in a structured format.`;

      // Call LLaVA API
      const requestBody: LLaVARequest = {
        model: this.config.defaultModel,
        prompt: analysisPrompt,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 500,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(`${this.config.apiUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("[Vision] API error:", await response.text());
        return this.basicImageAnalysis(imageBase64, startTime);
      }

      const result = (await response.json()) as LLaVAResponse;
      const description = result.response;

      // Parse the response
      const analysisResult: VisionAnalysisResult = {
        description,
        detectedText: this.extractText(description),
        detectedObjects: this.extractObjects(description),
        isAppropriate: checkContentSafety(description),
        confidence: 0.85,
      };

      console.log(
        `[Vision] Analyzed image for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: analysisResult,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          ok: false,
          error: "انتهت مهلة تحليل الصورة",
          errorCode: "TIMEOUT",
          durationMs: Date.now() - startTime,
        };
      }

      console.error("[Vision] Error:", error);
      return {
        ok: false,
        error: "حدث خطأ في تحليل الصورة",
        errorCode: "ANALYSIS_FAILED",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Extract text from image (OCR)
   */
  async extractTextFromImage(
    image: ImageInput,
    context?: ToolContext
  ): Promise<ToolResult<OCRResult>> {
    const startTime = Date.now();

    try {
      const imageBase64 = await this.getImageBase64(image);

      if (!imageBase64) {
        return {
          ok: false,
          error: "لم يتم توفير صورة صالحة",
          errorCode: "INVALID_IMAGE",
          durationMs: Date.now() - startTime,
        };
      }

      // OCR-specific prompt
      const ocrPrompt = `Extract ALL text visible in this image. 
Return the text exactly as it appears, preserving:
- Line breaks
- Formatting where possible
- Both English and Arabic text
- Numbers and special characters

If no text is found, respond with "NO_TEXT_FOUND".`;

      const requestBody: LLaVARequest = {
        model: this.config.defaultModel,
        prompt: ocrPrompt,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 1000,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(`${this.config.apiUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          ok: false,
          error: "فشل في استخراج النص من الصورة",
          errorCode: "OCR_FAILED",
          durationMs: Date.now() - startTime,
        };
      }

      const result = (await response.json()) as LLaVAResponse;
      const extractedText = result.response;

      const ocrResult: OCRResult = {
        text: extractedText === "NO_TEXT_FOUND" ? "" : extractedText,
        blocks: [
          {
            text: extractedText === "NO_TEXT_FOUND" ? "" : extractedText,
            confidence: 0.8,
          },
        ],
        language: this.detectLanguage(extractedText),
      };

      console.log(
        `[Vision] OCR completed for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: ocrResult,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[Vision] OCR Error:", error);
      return {
        ok: false,
        error: "حدث خطأ في استخراج النص",
        errorCode: "OCR_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Answer questions about an image
   */
  async askAboutImage(
    image: ImageInput,
    question: string,
    context?: ToolContext
  ): Promise<ToolResult<{ answer: string }>> {
    const startTime = Date.now();

    try {
      const imageBase64 = await this.getImageBase64(image);

      if (!imageBase64) {
        return {
          ok: false,
          error: "لم يتم توفير صورة صالحة",
          errorCode: "INVALID_IMAGE",
          durationMs: Date.now() - startTime,
        };
      }

      const requestBody: LLaVARequest = {
        model: this.config.defaultModel,
        prompt: question,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 300,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(`${this.config.apiUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          ok: false,
          error: "فشل في الإجابة عن سؤالك",
          errorCode: "VQA_FAILED",
          durationMs: Date.now() - startTime,
        };
      }

      const result = (await response.json()) as LLaVAResponse;

      console.log(
        `[Vision] VQA completed for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: { answer: result.response },
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[Vision] VQA Error:", error);
      return {
        ok: false,
        error: "حدث خطأ في معالجة السؤال",
        errorCode: "VQA_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Get base64 image data from various sources
   */
  private async getImageBase64(image: ImageInput): Promise<string | null> {
    if (image.base64) {
      // Remove data URL prefix if present
      return image.base64.replace(/^data:image\/\w+;base64,/, "");
    }

    if (image.url) {
      try {
        const response = await fetch(image.url);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString("base64");
      } catch (error) {
        console.error("[Vision] Failed to fetch image from URL:", error);
        return null;
      }
    }

    if (image.filePath) {
      try {
        const fs = await import("fs/promises");
        const buffer = await fs.readFile(image.filePath);
        return buffer.toString("base64");
      } catch (error) {
        console.error("[Vision] Failed to read image file:", error);
        return null;
      }
    }

    return null;
  }

  /**
   * Basic image analysis without LLM (fallback)
   */
  private async basicImageAnalysis(
    _base64: string,
    startTime: number
  ): Promise<ToolResult<VisionAnalysisResult>> {
    // Return basic result when vision model is not available
    return {
      ok: true,
      data: {
        description: "تحليل الصورة غير متاح حالياً. يرجى التأكد من تشغيل خدمة الرؤية.",
        isAppropriate: true,
        confidence: 0,
      },
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Extract mentioned text from description
   */
  private extractText(description: string): string[] {
    const textPatterns = [
      /text[:\s]+"([^"]+)"/gi,
      /says[:\s]+"([^"]+)"/gi,
      /written[:\s]+"([^"]+)"/gi,
      /reads[:\s]+"([^"]+)"/gi,
      /"([^"]{3,})"/g,
    ];

    const texts: string[] = [];
    for (const pattern of textPatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !texts.includes(match[1])) {
          texts.push(match[1]);
        }
      }
    }

    return texts;
  }

  /**
   * Extract mentioned objects from description
   */
  private extractObjects(description: string): string[] {
    const commonObjects = [
      "person",
      "people",
      "man",
      "woman",
      "child",
      "car",
      "building",
      "tree",
      "animal",
      "dog",
      "cat",
      "bird",
      "phone",
      "computer",
      "book",
      "table",
      "chair",
      "food",
      "water",
      "sky",
      "mountain",
      "beach",
      "road",
      "house",
      "window",
      "door",
    ];

    const lowerDesc = description.toLowerCase();
    return commonObjects.filter((obj) => lowerDesc.includes(obj));
  }

  /**
   * Detect language of text
   */
  private detectLanguage(text: string): string {
    const arabicPattern = /[\u0600-\u06FF]/;
    const englishPattern = /[a-zA-Z]/;

    const hasArabic = arabicPattern.test(text);
    const hasEnglish = englishPattern.test(text);

    if (hasArabic && hasEnglish) return "mixed";
    if (hasArabic) return "ar";
    if (hasEnglish) return "en";
    return "unknown";
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    available: boolean;
    model?: string;
  }> {
    const available = await this.checkAvailability();
    return {
      available,
      model: available ? this.config.defaultModel : undefined,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

export const vision = new VisionService();

// ============================================
// Tool Handlers
// ============================================

export interface AnalyzeImageParams {
  image_base64?: string;
  image_url?: string;
  prompt?: string;
}

export async function handleAnalyzeImage(
  params: AnalyzeImageParams,
  context: ToolContext
): Promise<ToolResult<VisionAnalysisResult>> {
  return vision.analyzeImage(
    {
      base64: params.image_base64,
      url: params.image_url,
    },
    params.prompt,
    context
  );
}

export interface ExtractTextParams {
  image_base64?: string;
  image_url?: string;
}

export async function handleExtractText(
  params: ExtractTextParams,
  context: ToolContext
): Promise<ToolResult<OCRResult>> {
  return vision.extractTextFromImage(
    {
      base64: params.image_base64,
      url: params.image_url,
    },
    context
  );
}

export interface AskAboutImageParams {
  image_base64?: string;
  image_url?: string;
  question: string;
}

export async function handleAskAboutImage(
  params: AskAboutImageParams,
  context: ToolContext
): Promise<ToolResult<{ answer: string }>> {
  return vision.askAboutImage(
    {
      base64: params.image_base64,
      url: params.image_url,
    },
    params.question,
    context
  );
}

export { VisionService };
