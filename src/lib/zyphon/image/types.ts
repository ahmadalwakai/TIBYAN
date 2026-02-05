/**
 * Zyphon Image Generation Types
 * 
 * Type definitions for pluggable image generation providers.
 */

export type ImageSize = "1024x1024" | "512x512";
export type ImageFormat = "png" | "jpeg";

export interface ImageGenerationRequest {
  prompt: string;
  size: ImageSize;
  format: ImageFormat;
}

export interface ImageGenerationResult {
  success: boolean;
  imageBuffer?: Buffer;
  mimeType?: string;
  error?: string;
}

export interface ImageProvider {
  name: string;
  isConfigured(): boolean;
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

export const VALID_IMAGE_SIZES: ImageSize[] = ["1024x1024", "512x512"];
export const VALID_IMAGE_FORMATS: ImageFormat[] = ["png", "jpeg"];
export const MAX_PROMPT_LENGTH = 800;
