/**
 * AI Agent - Image Generation Module
 * Integrates with local Stable Diffusion WebUI (Automatic1111)
 * API endpoint: http://127.0.0.1:7860
 */

import { AgentError, AgentErrorCode } from "./errors";
import type { ToolContext, ToolResult } from "./types";

// ============================================
// Configuration
// ============================================

const SD_API_URL = process.env.SD_API_URL || "http://127.0.0.1:7860";
const SD_TIMEOUT_MS = parseInt(process.env.SD_TIMEOUT_MS || "120000", 10);

export interface ImageGenerationConfig {
  apiUrl: string;
  timeoutMs: number;
  defaultModel: string;
  defaultSampler: string;
  defaultSteps: number;
  defaultCfgScale: number;
  defaultWidth: number;
  defaultHeight: number;
  maxWidth: number;
  maxHeight: number;
  enableNsfw: boolean;
}

const defaultConfig: ImageGenerationConfig = {
  apiUrl: SD_API_URL,
  timeoutMs: SD_TIMEOUT_MS,
  defaultModel: "sd_xl_base_1.0", // or "v1-5-pruned-emaonly"
  defaultSampler: "DPM++ 2M Karras",
  defaultSteps: 25,
  defaultCfgScale: 7,
  defaultWidth: 512,
  defaultHeight: 512,
  maxWidth: 1024,
  maxHeight: 1024,
  enableNsfw: false,
};

// ============================================
// Types
// ============================================

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  seed?: number;
  batchSize?: number;
}

export interface GeneratedImage {
  base64: string;
  seed: number;
  width: number;
  height: number;
  prompt: string;
}

interface Txt2ImgRequest {
  prompt: string;
  negative_prompt: string;
  steps: number;
  cfg_scale: number;
  width: number;
  height: number;
  sampler_name: string;
  seed: number;
  batch_size: number;
  n_iter: number;
  restore_faces: boolean;
  enable_hr: boolean;
}

interface Txt2ImgResponse {
  images: string[];
  parameters: {
    prompt: string;
    negative_prompt: string;
    seed: number;
    width: number;
    height: number;
  };
  info: string;
}

interface SDModelInfo {
  title: string;
  model_name: string;
  hash: string;
  filename: string;
}

interface SDSamplerInfo {
  name: string;
  aliases: string[];
}

// ============================================
// Safety Filters
// ============================================

const BLOCKED_TERMS_AR = [
  "عري",
  "عارية",
  "جنس",
  "إباحي",
  "فاضح",
  "عنف",
  "دم",
  "قتل",
  "إرهاب",
  "كراهية",
  "عنصرية",
];

const BLOCKED_TERMS_EN = [
  "nude",
  "naked",
  "nsfw",
  "porn",
  "explicit",
  "violence",
  "gore",
  "blood",
  "terrorism",
  "hate",
  "racist",
  "sexual",
  "erotic",
];

function containsBlockedContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  for (const term of [...BLOCKED_TERMS_AR, ...BLOCKED_TERMS_EN]) {
    if (lowerText.includes(term.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

// ============================================
// Image Generation Service
// ============================================

class ImageGenerationService {
  private config: ImageGenerationConfig;
  private isAvailable: boolean | null = null;

  constructor(config: Partial<ImageGenerationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Check if Stable Diffusion WebUI is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.apiUrl}/sdapi/v1/sd-models`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.isAvailable = response.ok;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<SDModelInfo[]> {
    const response = await fetch(`${this.config.apiUrl}/sdapi/v1/sd-models`);
    
    if (!response.ok) {
      throw new AgentError(AgentErrorCode.TOOL_EXECUTION_FAILED, {
        message: "فشل في جلب قائمة النماذج",
      });
    }

    return response.json() as Promise<SDModelInfo[]>;
  }

  /**
   * Get available samplers
   */
  async getSamplers(): Promise<SDSamplerInfo[]> {
    const response = await fetch(`${this.config.apiUrl}/sdapi/v1/samplers`);
    
    if (!response.ok) {
      throw new AgentError(AgentErrorCode.TOOL_EXECUTION_FAILED, {
        message: "فشل في جلب قائمة العينات",
      });
    }

    return response.json() as Promise<SDSamplerInfo[]>;
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(
    params: ImageGenerationParams,
    context: ToolContext
  ): Promise<ToolResult<GeneratedImage[]>> {
    const startTime = Date.now();

    // Safety check
    if (containsBlockedContent(params.prompt)) {
      return {
        ok: false,
        error: "المحتوى المطلوب غير مسموح به",
        errorCode: "CONTENT_BLOCKED",
        durationMs: Date.now() - startTime,
      };
    }

    if (params.negativePrompt && containsBlockedContent(params.negativePrompt)) {
      return {
        ok: false,
        error: "المحتوى في negative prompt غير مسموح به",
        errorCode: "CONTENT_BLOCKED",
        durationMs: Date.now() - startTime,
      };
    }

    // Check availability
    if (this.isAvailable === null) {
      await this.checkAvailability();
    }

    if (!this.isAvailable) {
      return {
        ok: false,
        error: "خدمة توليد الصور غير متاحة حالياً",
        errorCode: "SERVICE_UNAVAILABLE",
        durationMs: Date.now() - startTime,
      };
    }

    // Validate dimensions
    const width = Math.min(params.width ?? this.config.defaultWidth, this.config.maxWidth);
    const height = Math.min(params.height ?? this.config.defaultHeight, this.config.maxHeight);

    // Build request
    const requestBody: Txt2ImgRequest = {
      prompt: this.enhancePrompt(params.prompt),
      negative_prompt: this.buildNegativePrompt(params.negativePrompt),
      steps: params.steps ?? this.config.defaultSteps,
      cfg_scale: params.cfgScale ?? this.config.defaultCfgScale,
      width: this.roundToMultipleOf8(width),
      height: this.roundToMultipleOf8(height),
      sampler_name: params.sampler ?? this.config.defaultSampler,
      seed: params.seed ?? -1,
      batch_size: Math.min(params.batchSize ?? 1, 4),
      n_iter: 1,
      restore_faces: false,
      enable_hr: false,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(`${this.config.apiUrl}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ImageGen] SD API error:", errorText);
        
        return {
          ok: false,
          error: "فشل في توليد الصورة",
          errorCode: "GENERATION_FAILED",
          durationMs: Date.now() - startTime,
        };
      }

      const result = (await response.json()) as Txt2ImgResponse;
      const info = JSON.parse(result.info) as { seed: number };

      const images: GeneratedImage[] = result.images.map((base64, index) => ({
        base64,
        seed: info.seed + index,
        width: requestBody.width,
        height: requestBody.height,
        prompt: params.prompt,
      }));

      console.log(
        `[ImageGen] Generated ${images.length} image(s) for user ${context.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: images,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          ok: false,
          error: "انتهت مهلة توليد الصورة",
          errorCode: "TIMEOUT",
          durationMs: Date.now() - startTime,
        };
      }

      console.error("[ImageGen] Unexpected error:", error);
      
      return {
        ok: false,
        error: "حدث خطأ غير متوقع",
        errorCode: "UNKNOWN_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Enhance prompt for better results
   */
  private enhancePrompt(prompt: string): string {
    // Add quality enhancers if not present
    const qualityTerms = ["high quality", "detailed", "professional"];
    const hasQualityTerm = qualityTerms.some((term) =>
      prompt.toLowerCase().includes(term)
    );

    if (!hasQualityTerm) {
      return `${prompt}, high quality, detailed`;
    }

    return prompt;
  }

  /**
   * Build negative prompt with safety terms
   */
  private buildNegativePrompt(userNegative?: string): string {
    const safetyNegative = this.config.enableNsfw
      ? ""
      : "nsfw, nude, naked, explicit, violence, gore, blood, disturbing";

    const qualityNegative =
      "low quality, blurry, distorted, deformed, ugly, bad anatomy, bad proportions";

    const parts = [safetyNegative, qualityNegative];
    
    if (userNegative) {
      parts.push(userNegative);
    }

    return parts.filter(Boolean).join(", ");
  }

  /**
   * Round to multiple of 8 (required by SD)
   */
  private roundToMultipleOf8(value: number): number {
    return Math.round(value / 8) * 8;
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    available: boolean;
    models: number;
    currentModel?: string;
  }> {
    const available = await this.checkAvailability();
    
    if (!available) {
      return { available: false, models: 0 };
    }

    try {
      const models = await this.getModels();
      const optionsRes = await fetch(`${this.config.apiUrl}/sdapi/v1/options`);
      const options = (await optionsRes.json()) as { sd_model_checkpoint?: string };

      return {
        available: true,
        models: models.length,
        currentModel: options.sd_model_checkpoint,
      };
    } catch {
      return { available: true, models: 0 };
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const imageGeneration = new ImageGenerationService();

// ============================================
// Tool Handler for Capabilities Registry
// ============================================

export interface GenerateImageToolParams {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  style?: "realistic" | "anime" | "artistic" | "photograph";
}

export async function handleGenerateImage(
  params: GenerateImageToolParams,
  context: ToolContext
): Promise<ToolResult<{ images: Array<{ url: string; seed: number }> }>> {
  const startTime = Date.now();

  // Map style to prompt enhancements
  const styleEnhancements: Record<string, string> = {
    realistic: "photorealistic, hyperrealistic, 8k uhd",
    anime: "anime style, manga, japanese animation",
    artistic: "artistic, painting, digital art, concept art",
    photograph: "photograph, DSLR, professional photography, bokeh",
  };

  const stylePrompt = params.style
    ? `${params.prompt}, ${styleEnhancements[params.style]}`
    : params.prompt;

  const result = await imageGeneration.generateImage(
    {
      prompt: stylePrompt,
      negativePrompt: params.negative_prompt,
      width: params.width,
      height: params.height,
      steps: params.steps,
    },
    context
  );

  if (!result.ok || !result.data) {
    return {
      ok: false,
      error: result.error,
      errorCode: result.errorCode,
      durationMs: Date.now() - startTime,
    };
  }

  // Convert base64 to data URLs for display
  const images = result.data.map((img) => ({
    url: `data:image/png;base64,${img.base64}`,
    seed: img.seed,
  }));

  return {
    ok: true,
    data: { images },
    durationMs: Date.now() - startTime,
  };
}

// ============================================
// Export Types
// ============================================

export type { ToolContext, ToolResult };
