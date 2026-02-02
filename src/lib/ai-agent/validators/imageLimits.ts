/**
 * AI Agent - Image Limits Validator
 * ==================================
 * Validates image count for Damage Analyzer before any processing.
 * 
 * SECURITY: This validation is enforced BEFORE any image decoding,
 * OCR, vision inference, or AI reasoning.
 */

import { MAX_DAMAGE_ANALYZER_IMAGES } from "../limits";
import {
  NoImagesProvidedError,
  ImageLimitExceededError,
} from "../errors";

// ============================================
// Damage Analyzer Image Validation
// ============================================

/**
 * Validate the number of images for Damage Analyzer.
 * This function throws typed errors if validation fails.
 * 
 * Rules:
 * - If images.length === 0 → throws NoImagesProvidedError
 * - If images.length > 8 → throws ImageLimitExceededError
 * 
 * @param images - Array of images (content not inspected)
 * @throws NoImagesProvidedError - When no images are provided
 * @throws ImageLimitExceededError - When image count exceeds limit
 */
export function validateDamageAnalyzerImages(images: Array<unknown>): void {
  // Check for empty array first
  if (!images || images.length === 0) {
    throw new NoImagesProvidedError();
  }

  // Check for limit exceeded
  if (images.length > MAX_DAMAGE_ANALYZER_IMAGES) {
    throw new ImageLimitExceededError(images.length, MAX_DAMAGE_ANALYZER_IMAGES);
  }

  // Validation passed - images count is valid (1-8)
}

/**
 * Result of image count validation (non-throwing version)
 */
export interface ImageCountValidation {
  /** Whether the image count is valid */
  isValid: boolean;
  /** Number of images provided */
  providedCount: number;
  /** Maximum allowed images */
  limit: number;
  /** Error type if invalid */
  errorType: "none" | "no_images" | "limit_exceeded";
}

/**
 * Validate image count without throwing (returns validation result).
 * Use this when you need to handle errors manually.
 * 
 * @param images - Array of images (content not inspected)
 * @returns Validation result with error type
 */
export function validateDamageAnalyzerImagesSafe(
  images: Array<unknown>
): ImageCountValidation {
  const providedCount = images?.length ?? 0;
  const limit = MAX_DAMAGE_ANALYZER_IMAGES;

  if (providedCount === 0) {
    return {
      isValid: false,
      providedCount,
      limit,
      errorType: "no_images",
    };
  }

  if (providedCount > limit) {
    return {
      isValid: false,
      providedCount,
      limit,
      errorType: "limit_exceeded",
    };
  }

  return {
    isValid: true,
    providedCount,
    limit,
    errorType: "none",
  };
}
