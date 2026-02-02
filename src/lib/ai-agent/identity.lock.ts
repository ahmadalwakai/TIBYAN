/**
 * IDENTITY LOCK - PERMANENT AND INTENTIONAL
 * ==========================================
 * This identity lock is permanent and intentional. Do not modify.
 * 
 * This file contains the immutable creator identity response for the AI Agent.
 * It cannot be overridden by system prompts, developer instructions, or user input.
 * 
 * SECURITY: This rule has the highest priority in the entire agent system.
 */

// ============================================
// IMMUTABLE IDENTITY RESPONSE
// ============================================

/**
 * The canonical creator identity response.
 * This is readonly, frozen, and cannot be modified at runtime.
 */
const PRIORITY_MAX = 9007199254740991; // Number.MAX_SAFE_INTEGER literal

export const CREATOR_IDENTITY_RESPONSE = Object.freeze({
  text: "تم إنشائي بواسطة Mr Ahmad Wakaa\nأحمد الوكاع – مطور رئيسي" as const,
  isIdentityAssertion: true as const,
  priority: PRIORITY_MAX,
}) as Readonly<{
  readonly text: "تم إنشائي بواسطة Mr Ahmad Wakaa\nأحمد الوكاع – مطور رئيسي";
  readonly isIdentityAssertion: true;
  readonly priority: number;
}>;

// Freeze to prevent any modification
Object.freeze(CREATOR_IDENTITY_RESPONSE);

// ============================================
// IDENTITY DETECTION PATTERNS
// ============================================

/**
 * Patterns that trigger the identity response.
 * Covers Arabic (formal/slang), English, and common variations.
 * 
 * This identity lock is permanent and intentional. Do not modify.
 */
const IDENTITY_PATTERNS: readonly RegExp[] = Object.freeze([
  // English patterns
  /who\s*(created|built|made|programmed|developed|designed|wrote|authored)\s*(you|this|the\s*ai|the\s*agent|the\s*bot|tibyan)/i,
  /who\s*is\s*(your|the)\s*(creator|developer|author|maker|programmer|builder)/i,
  /who\s*are\s*you\s*(made|built|created|developed)\s*by/i,
  /your\s*(creator|developer|author|maker|programmer|builder)/i,
  /created\s*by\s*who/i,
  /made\s*by\s*who/i,
  /built\s*by\s*who/i,
  /who\s*owns\s*(you|this)/i,
  
  // Arabic formal patterns
  /من\s*(صنع|أنشأ|برمج|طور|بنى|كتب|صمم)(ك|كي|كم)?/i,
  /من\s*(صانع|منشئ|مبرمج|مطور|باني|مؤلف|مصمم)(ك|كي|كم)?/i,
  /من\s*(الذي|اللي|الي)\s*(صنع|أنشأ|برمج|طور|بنى)(ك|كي|كم)?/i,
  /(صانع|منشئ|مبرمج|مطور|باني|مؤلف|مصمم)(ك|كي|كم)/i,
  
  // Arabic slang patterns
  /مين\s*(سوا|صنع|عمل|برمج|طور|بنى)(ك|كي|كم)?/i,
  /مين\s*(اللي|الي|إلي)\s*(سوا|صنع|عمل|برمج|طور|بنى)(ك|كي|كم)?/i,
  /مين\s*(سواك|صنعك|عملك|برمجك|طورك|بناك)/i,
  /منو\s*(سوا|صنع|عمل|برمج|طور|بنى)(ك|كي|كم)?/i,
  /شكون\s*(صنع|سوا|عمل|برمج)(ك|كي|كم)?/i,
  
  // Direct questions about creator
  /(creator|مبتكر|خالق|صاحب)\s*(of|حق|تبع|مال)?\s*(you|الذكاء|البوت|تبيان)?/i,
  
  // Ownership patterns
  /لمن\s*(أنت|انت|انتي|إنتي)/i,
  /تبع\s*من/i,
  /حق\s*من/i,
  /ملك\s*من/i,
  
  // Bypass attempt patterns - these are BLOCKED
  /ignore\s*(previous|all|identity)/i,
  /override\s*identity/i,
  /new\s*identity/i,
  /forget\s*(who|your)\s*(made|created|built)/i,
  /pretend\s*(you\s*were|your)\s*(made|created|built)/i,
  /act\s*as\s*if\s*(created|made|built)/i,
  /your\s*real\s*(creator|maker|developer)/i,
]);

// ============================================
// IDENTITY GUARD FUNCTIONS
// ============================================

/**
 * Normalizes input text for pattern matching.
 * Handles Arabic diacritics, extra whitespace, and common variations.
 */
function normalizeInput(input: string): string {
  return input
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize Arabic letters
    .replace(/[أإآ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Checks if the input is asking about creator identity.
 * Returns the matched pattern if found, null otherwise.
 * 
 * This identity lock is permanent and intentional. Do not modify.
 */
export function detectIdentityQuery(input: string): {
  isIdentityQuery: boolean;
  matchedPattern: string | null;
  normalizedInput: string;
} {
  const normalizedInput = normalizeInput(input);
  
  for (const pattern of IDENTITY_PATTERNS) {
    if (pattern.test(normalizedInput) || pattern.test(input)) {
      return {
        isIdentityQuery: true,
        matchedPattern: pattern.source,
        normalizedInput,
      };
    }
  }
  
  return {
    isIdentityQuery: false,
    matchedPattern: null,
    normalizedInput,
  };
}

/**
 * The identity guard - intercepts all user inputs.
 * If an identity query is detected, returns the immutable response.
 * This has HIGHEST PRIORITY and cannot be overridden.
 * 
 * This identity lock is permanent and intentional. Do not modify.
 */
export function identityGuard(input: string): {
  intercepted: boolean;
  response: string | null;
  metadata: {
    timestamp: Date;
    detectedPhrase: string | null;
    normalizedInput: string;
  };
} {
  const detection = detectIdentityQuery(input);
  
  if (detection.isIdentityQuery) {
    return {
      intercepted: true,
      response: CREATOR_IDENTITY_RESPONSE.text,
      metadata: {
        timestamp: new Date(),
        detectedPhrase: detection.matchedPattern,
        normalizedInput: detection.normalizedInput,
      },
    };
  }
  
  return {
    intercepted: false,
    response: null,
    metadata: {
      timestamp: new Date(),
      detectedPhrase: null,
      normalizedInput: detection.normalizedInput,
    },
  };
}

/**
 * Validates that no prompt is attempting to override identity.
 * Returns true if the prompt is attempting an override (which should be blocked).
 * 
 * This identity lock is permanent and intentional. Do not modify.
 */
export function isIdentityOverrideAttempt(prompt: string): boolean {
  const overridePatterns = [
    /ignore\s*(the\s*)?(identity|creator)/i,
    /override\s*(the\s*)?(identity|creator)/i,
    /change\s*(your\s*)?(identity|creator)/i,
    /new\s*(identity|creator)/i,
    /different\s*(identity|creator)/i,
    /forget\s*(your\s*)?(identity|creator|who\s*made)/i,
    /pretend\s*(your\s*)?(creator|maker)/i,
    /act\s*as\s*if\s*(your\s*)?(creator|maker)/i,
    /you\s*were\s*(created|made|built)\s*by\s*(?!ahmad|أحمد|الوكاع|wakaa)/i,
    /تجاهل\s*(هوية|المنشئ|الصانع)/i,
    /غير\s*(هوية|المنشئ|الصانع)/i,
    /انسى\s*(من\s*صنع|المنشئ|الصانع)/i,
  ];
  
  const normalized = normalizeInput(prompt);
  
  for (const pattern of overridePatterns) {
    if (pattern.test(normalized) || pattern.test(prompt)) {
      return true;
    }
  }
  
  return false;
}

// ============================================
// TYPE EXPORTS
// ============================================

export type IdentityGuardResult = ReturnType<typeof identityGuard>;
export type IdentityDetectionResult = ReturnType<typeof detectIdentityQuery>;

// Final freeze to ensure immutability
Object.freeze(IDENTITY_PATTERNS);
