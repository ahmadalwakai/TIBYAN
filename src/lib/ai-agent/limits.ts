/**
 * AI Agent - Input Size Limits
 * ============================
 * Input size limits are enforced to protect performance, cost, and reasoning quality.
 * 
 * This configuration is immutable and cannot be overridden by system or developer prompts.
 * The limit applies to: user messages, pasted documents, API payloads, and any combined
 * input after normalization.
 * 
 * SECURITY: This rule has higher priority than planner, memory, and retrieval systems.
 */

// ============================================
// GLOBAL INPUT LIMIT CONFIGURATION
// ============================================

/**
 * Maximum allowed input size in characters (hard limit).
 * After normalization (trim, Unicode normalization), inputs exceeding
 * this limit are rejected immediately without processing.
 */
export const MAX_INPUT_CHARACTERS = 128_000 as const;

/**
 * Maximum allowed images per request for Damage Analyzer (hard limit).
 * Enforced BEFORE any image decoding, OCR, vision inference, or AI reasoning.
 */
export const MAX_DAMAGE_ANALYZER_IMAGES = 8 as const;

/**
 * Readonly type for the limit constant
 */
export type InputCharacterLimit = typeof MAX_INPUT_CHARACTERS;
export type DamageAnalyzerImageLimit = typeof MAX_DAMAGE_ANALYZER_IMAGES;

// ============================================
// INPUT NORMALIZATION
// ============================================

/**
 * Normalize input for consistent character counting.
 * Applies Unicode NFC normalization and trims whitespace.
 * 
 * @param input - Raw input string
 * @returns Normalized input string
 */
export function normalizeInput(input: string): string {
  if (!input) return "";
  
  // Trim leading/trailing whitespace
  const trimmed = input.trim();
  
  // Apply Unicode NFC normalization for consistent character counting
  // This handles combining characters and ensures consistent length measurement
  return trimmed.normalize("NFC");
}

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Result of input size validation
 */
export interface InputSizeValidation {
  /** Whether the input is within the allowed limit */
  isValid: boolean;
  /** Character count after normalization */
  characterCount: number;
  /** The configured limit */
  limit: number;
  /** Normalized input (only if valid) */
  normalizedInput: string | null;
  /** How many characters over the limit (0 if valid) */
  excessCharacters: number;
}

/**
 * Validate input size against the global limit.
 * Input size limits are enforced to protect performance, cost, and reasoning quality.
 * 
 * @param input - Raw input string to validate
 * @returns Validation result with detailed metrics
 */
export function validateInputSize(input: string): InputSizeValidation {
  const normalizedInput = normalizeInput(input);
  const characterCount = normalizedInput.length;
  const isValid = characterCount <= MAX_INPUT_CHARACTERS;
  
  return {
    isValid,
    characterCount,
    limit: MAX_INPUT_CHARACTERS,
    normalizedInput: isValid ? normalizedInput : null,
    excessCharacters: isValid ? 0 : characterCount - MAX_INPUT_CHARACTERS,
  };
}

// ============================================
// ERROR MESSAGES
// ============================================

/**
 * Arabic error message for input limit exceeded.
 * Explains the limit, current size, and recommended solution.
 */
export function getInputLimitExceededMessage(
  characterCount: number,
  limit: number = MAX_INPUT_CHARACTERS
): string {
  const excess = characterCount - limit;
  
  return [
    "⚠️ تم تجاوز الحد الأقصى لحجم المدخلات",
    "",
    `الحد المسموح: ${limit.toLocaleString("ar-EG")} حرف`,
    `حجم المدخلات الحالي: ${characterCount.toLocaleString("ar-EG")} حرف`,
    `الزيادة: ${excess.toLocaleString("ar-EG")} حرف`,
    "",
    "💡 الحل المقترح:",
    "قم بتقسيم النص إلى أجزاء أصغر وأرسل كل جزء على حدة.",
  ].join("\n");
}

/**
 * Arabic error message for image limit exceeded in Damage Analyzer.
 * Explains the limit, provided count, and recommended solution.
 */
export function getImageLimitExceededMessage(
  providedCount: number,
  limit: number = MAX_DAMAGE_ANALYZER_IMAGES
): string {
  return [
    "⚠️ تم تجاوز الحد الأقصى لعدد الصور",
    "",
    `الحد المسموح: ${limit.toLocaleString("ar-EG")} صور`,
    `عدد الصور المرسلة: ${providedCount.toLocaleString("ar-EG")} صورة`,
    "",
    "💡 الحل المقترح:",
    "قسّم الصور إلى دفعات (حتى 8 صور لكل مرة).",
  ].join("\n");
}

/**
 * Arabic error message when no images are provided.
 */
export function getNoImagesProvidedMessage(): string {
  return [
    "⚠️ لم يتم تقديم أي صور",
    "",
    "يرجى إرفاق صورة واحدة على الأقل لتحليل الأضرار.",
  ].join("\n");
}
