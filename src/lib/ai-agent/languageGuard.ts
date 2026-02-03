/**
 * Language Guard System
 * =====================
 * Prevents AI from responding in unauthorized languages (especially Chinese).
 * 
 * Features:
 * - Language detection (Arabic, English, CJK)
 * - Session language locking
 * - History sanitization
 * - Stream output filtering
 */

// ============================================
// Types
// ============================================

export type AllowedLanguage = "ar" | "en";
export type DetectedLanguage = "ar" | "en" | "cjk" | "mixed" | "unknown";

export interface LanguageDetectionResult {
  language: DetectedLanguage;
  arabicRatio: number;
  englishRatio: number;
  cjkRatio: number;
  hasCJK: boolean;
}

export interface SessionLanguageLock {
  language: AllowedLanguage;
  lockedAt: number;
  requestCount: number;
}

// ============================================
// Character Detection Patterns
// ============================================

// CJK (Chinese, Japanese, Korean) Unicode ranges
const CJK_PATTERN = /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\u30A0-\u30FF\u3040-\u309F\uAC00-\uD7AF\uF900-\uFAFF]/g;

// Arabic Unicode range
const ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

// Basic Latin letters (English)
const LATIN_PATTERN = /[a-zA-Z]/g;

// ============================================
// Language Detection
// ============================================

/**
 * Detect the language of a text string
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      language: "unknown",
      arabicRatio: 0,
      englishRatio: 0,
      cjkRatio: 0,
      hasCJK: false,
    };
  }

  const cleanText = text.replace(/\s+/g, "");
  const totalChars = cleanText.length;

  if (totalChars === 0) {
    return {
      language: "unknown",
      arabicRatio: 0,
      englishRatio: 0,
      cjkRatio: 0,
      hasCJK: false,
    };
  }

  const arabicMatches = cleanText.match(ARABIC_PATTERN) || [];
  const latinMatches = cleanText.match(LATIN_PATTERN) || [];
  const cjkMatches = cleanText.match(CJK_PATTERN) || [];

  const arabicRatio = arabicMatches.length / totalChars;
  const englishRatio = latinMatches.length / totalChars;
  const cjkRatio = cjkMatches.length / totalChars;
  const hasCJK = cjkMatches.length > 0;

  let language: DetectedLanguage;

  // If ANY CJK characters present, flag it
  if (hasCJK && cjkRatio > 0.05) {
    language = "cjk";
  } else if (arabicRatio > 0.3) {
    language = "ar";
  } else if (englishRatio > 0.3) {
    language = "en";
  } else if (arabicRatio > 0 && englishRatio > 0) {
    language = "mixed";
  } else {
    language = "unknown";
  }

  return {
    language,
    arabicRatio,
    englishRatio,
    cjkRatio,
    hasCJK,
  };
}

/**
 * Check if text contains CJK characters
 */
export function containsCJK(text: string): boolean {
  return CJK_PATTERN.test(text);
}

/**
 * Quick check: is this text Arabic-dominant?
 */
export function isArabicText(text: string): boolean {
  const result = detectLanguage(text);
  return result.language === "ar" || result.arabicRatio > 0.3;
}

/**
 * Quick check: is this text English-dominant?
 */
export function isEnglishText(text: string): boolean {
  const result = detectLanguage(text);
  return result.language === "en" || result.englishRatio > 0.5;
}

// ============================================
// Session Language Lock Store
// ============================================

const sessionLanguageLocks = new Map<string, SessionLanguageLock>();

// Clean up old sessions every 30 minutes
const SESSION_TTL_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer(): void {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const entries = Array.from(sessionLanguageLocks.entries());
    for (const [sessionId, lock] of entries) {
      if (now - lock.lockedAt > SESSION_TTL_MS) {
        sessionLanguageLocks.delete(sessionId);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

// Start cleanup on module load
if (typeof window === "undefined") {
  startCleanupTimer();
}

/**
 * Get or set the language lock for a session
 */
export function getSessionLanguageLock(sessionId: string): SessionLanguageLock | null {
  return sessionLanguageLocks.get(sessionId) || null;
}

/**
 * Lock a session to a specific language
 */
export function lockSessionLanguage(sessionId: string, language: AllowedLanguage): SessionLanguageLock {
  const existing = sessionLanguageLocks.get(sessionId);
  
  if (existing) {
    // Already locked - increment count but don't change language
    existing.requestCount++;
    return existing;
  }

  const lock: SessionLanguageLock = {
    language,
    lockedAt: Date.now(),
    requestCount: 1,
  };

  sessionLanguageLocks.set(sessionId, lock);
  return lock;
}

/**
 * Determine allowed language for a session based on user message
 */
export function determineSessionLanguage(
  sessionId: string,
  userMessage: string
): AllowedLanguage {
  // Check if session already has a language lock
  const existingLock = getSessionLanguageLock(sessionId);
  if (existingLock) {
    existingLock.requestCount++;
    return existingLock.language;
  }

  // Detect language from user message
  const detection = detectLanguage(userMessage);

  // Default to Arabic for this Arabic-first platform
  let language: AllowedLanguage = "ar";

  if (detection.language === "en" && detection.englishRatio > 0.5) {
    language = "en";
  }

  // Lock the session
  lockSessionLanguage(sessionId, language);
  
  return language;
}

// ============================================
// History Sanitization
// ============================================

export interface SanitizedHistory {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  removedCount: number;
  sanitizationLog: string[];
}

/**
 * Sanitize conversation history by removing messages with CJK content
 */
export function sanitizeHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>
): SanitizedHistory {
  const sanitizationLog: string[] = [];
  let removedCount = 0;

  const sanitizedMessages = history.filter((msg, index) => {
    if (containsCJK(msg.content)) {
      removedCount++;
      const preview = msg.content.substring(0, 50).replace(/\n/g, " ");
      sanitizationLog.push(
        `[REMOVED] Message ${index} (${msg.role}): Contains CJK - "${preview}..."`
      );
      return false;
    }
    return true;
  });

  return {
    messages: sanitizedMessages,
    removedCount,
    sanitizationLog,
  };
}

// ============================================
// Language Guard Message Generator
// ============================================

const LANGUAGE_GUARD_AR = `هام جداً: يجب أن ترد باللغة العربية فقط. أي لغة أخرى ممنوعة منعاً باتاً. لا تستخدم الصينية أو اليابانية أو الكورية أبداً.`;

const LANGUAGE_GUARD_EN = `CRITICAL: You MUST respond ONLY in English. Any other language is strictly forbidden. NEVER use Chinese, Japanese, or Korean characters.`;

/**
 * Generate a language guard message to inject after system prompt
 */
export function generateLanguageGuard(language: AllowedLanguage): string {
  return language === "ar" ? LANGUAGE_GUARD_AR : LANGUAGE_GUARD_EN;
}

/**
 * Generate a language guard as a system message
 */
export function generateLanguageGuardMessage(language: AllowedLanguage): {
  role: "system";
  content: string;
} {
  return {
    role: "system",
    content: generateLanguageGuard(language),
  };
}

// ============================================
// Stream Output Filter
// ============================================

export interface StreamFilterResult {
  shouldAbort: boolean;
  filteredContent: string;
  cjkDetected: boolean;
}

const ARABIC_FALLBACK_MESSAGE = "عذرًا، حصل خلل لغوي. سأعيد الإجابة بالعربية.";
const ENGLISH_FALLBACK_MESSAGE = "Sorry, a language error occurred. Please try again.";

/**
 * Filter streaming chunk for CJK content
 */
export function filterStreamChunk(
  chunk: string,
  sessionLanguage: AllowedLanguage
): StreamFilterResult {
  const hasCJK = containsCJK(chunk);

  if (hasCJK) {
    return {
      shouldAbort: true,
      filteredContent: sessionLanguage === "ar" ? ARABIC_FALLBACK_MESSAGE : ENGLISH_FALLBACK_MESSAGE,
      cjkDetected: true,
    };
  }

  return {
    shouldAbort: false,
    filteredContent: chunk,
    cjkDetected: false,
  };
}

/**
 * Get fallback message for language errors
 */
export function getLanguageFallbackMessage(language: AllowedLanguage): string {
  return language === "ar" ? ARABIC_FALLBACK_MESSAGE : ENGLISH_FALLBACK_MESSAGE;
}

// ============================================
// Debug Logging
// ============================================

export interface LanguageDebugInfo {
  sessionId: string;
  userMessageLanguage: LanguageDetectionResult;
  sessionLanguageLock: AllowedLanguage;
  historyCount: number;
  sanitizedCount: number;
  guardInjected: boolean;
}

/**
 * Generate debug info for language handling
 */
export function generateLanguageDebugInfo(
  sessionId: string,
  userMessage: string,
  historyCount: number,
  sanitizedCount: number
): LanguageDebugInfo {
  const lock = getSessionLanguageLock(sessionId);
  
  return {
    sessionId,
    userMessageLanguage: detectLanguage(userMessage),
    sessionLanguageLock: lock?.language || "ar",
    historyCount,
    sanitizedCount,
    guardInjected: true,
  };
}

/**
 * Log language debug info (dev only)
 */
export function logLanguageDebug(
  prefix: string,
  info: LanguageDebugInfo
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.log(`[${prefix}] Language Debug:`, {
    session: info.sessionId,
    detected: info.userMessageLanguage.language,
    arabicRatio: info.userMessageLanguage.arabicRatio.toFixed(2),
    englishRatio: info.userMessageLanguage.englishRatio.toFixed(2),
    cjkRatio: info.userMessageLanguage.cjkRatio.toFixed(2),
    hasCJK: info.userMessageLanguage.hasCJK,
    locked: info.sessionLanguageLock,
    historyOriginal: info.historyCount,
    historySanitized: info.sanitizedCount,
    guardInjected: info.guardInjected,
  });
}

// ============================================
// Exports
// ============================================

export const languageGuard = {
  detectLanguage,
  containsCJK,
  isArabicText,
  isEnglishText,
  getSessionLanguageLock,
  lockSessionLanguage,
  determineSessionLanguage,
  sanitizeHistory,
  generateLanguageGuard,
  generateLanguageGuardMessage,
  filterStreamChunk,
  getLanguageFallbackMessage,
  generateLanguageDebugInfo,
  logLanguageDebug,
};
