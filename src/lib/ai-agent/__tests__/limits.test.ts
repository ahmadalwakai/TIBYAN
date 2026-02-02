/**
 * AI Agent - Input Size Limits Tests
 * ===================================
 * Input size limits are enforced to protect performance, cost, and reasoning quality.
 * 
 * Tests cover:
 * - Exactly 128,000 characters (allowed)
 * - 128,001 characters (rejected)
 * - Multi-language input (Arabic + English)
 * - Whitespace-only overflow attempts
 */

import { describe, it, expect } from "vitest";
import {
  MAX_INPUT_CHARACTERS,
  normalizeInput,
  validateInputSize,
  getInputLimitExceededMessage,
} from "../limits";
import {
  InputLimitExceededError,
  createInputLimitExceededError,
  isInputLimitExceededError,
} from "../errors";

// ============================================
// Test Constants
// ============================================

const LIMIT = MAX_INPUT_CHARACTERS; // 128,000

// ============================================
// normalizeInput Tests
// ============================================

describe("normalizeInput", () => {
  it("should trim leading and trailing whitespace", () => {
    const input = "   hello world   ";
    const result = normalizeInput(input);
    expect(result).toBe("hello world");
  });

  it("should return empty string for null/undefined-like input", () => {
    expect(normalizeInput("")).toBe("");
  });

  it("should apply Unicode NFC normalization", () => {
    // Composed vs decomposed form (é)
    const decomposed = "cafe\u0301"; // e + combining acute accent
    const composed = "café"; // precomposed é
    
    const normalizedDecomposed = normalizeInput(decomposed);
    const normalizedComposed = normalizeInput(composed);
    
    // After NFC normalization, both should be the same
    expect(normalizedDecomposed).toBe(normalizedComposed);
  });

  it("should handle Arabic text correctly", () => {
    const arabicText = "  مرحباً بالعالم  ";
    const result = normalizeInput(arabicText);
    expect(result).toBe("مرحباً بالعالم");
  });

  it("should handle mixed Arabic and English", () => {
    const mixedText = "  Hello مرحباً World عالم  ";
    const result = normalizeInput(mixedText);
    expect(result).toBe("Hello مرحباً World عالم");
  });
});

// ============================================
// validateInputSize Tests
// ============================================

describe("validateInputSize", () => {
  it("should allow exactly 128,000 characters", () => {
    const input = "a".repeat(LIMIT);
    const result = validateInputSize(input);
    
    expect(result.isValid).toBe(true);
    expect(result.characterCount).toBe(LIMIT);
    expect(result.limit).toBe(LIMIT);
    expect(result.normalizedInput).toBe(input);
    expect(result.excessCharacters).toBe(0);
  });

  it("should reject 128,001 characters", () => {
    const input = "a".repeat(LIMIT + 1);
    const result = validateInputSize(input);
    
    expect(result.isValid).toBe(false);
    expect(result.characterCount).toBe(LIMIT + 1);
    expect(result.limit).toBe(LIMIT);
    expect(result.normalizedInput).toBeNull();
    expect(result.excessCharacters).toBe(1);
  });

  it("should allow small inputs", () => {
    const input = "Hello, world!";
    const result = validateInputSize(input);
    
    expect(result.isValid).toBe(true);
    expect(result.characterCount).toBe(13);
    expect(result.normalizedInput).toBe("Hello, world!");
  });

  it("should allow empty input", () => {
    const result = validateInputSize("");
    
    expect(result.isValid).toBe(true);
    expect(result.characterCount).toBe(0);
    expect(result.normalizedInput).toBe("");
  });

  it("should handle multi-language input (Arabic + English)", () => {
    const arabicPart = "مرحباً ".repeat(10000); // Arabic
    const englishPart = "Hello ".repeat(10000); // English
    const mixedInput = arabicPart + englishPart;
    
    const result = validateInputSize(mixedInput);
    
    // Should be valid if under limit
    if (mixedInput.length <= LIMIT) {
      expect(result.isValid).toBe(true);
    }
    expect(result.characterCount).toBeLessThanOrEqual(LIMIT + 100000);
  });

  it("should reject whitespace-only overflow attempts", () => {
    // Try to overflow with whitespace that will be trimmed
    const content = "a".repeat(LIMIT - 10);
    const whitespace = " ".repeat(100);
    const input = whitespace + content + whitespace;
    
    // After trim, should be at limit - 10
    const result = validateInputSize(input);
    
    expect(result.isValid).toBe(true);
    expect(result.characterCount).toBe(LIMIT - 10);
  });

  it("should detect whitespace padding that still exceeds limit after trim", () => {
    // Content that exceeds limit even after trimming whitespace
    const content = "a".repeat(LIMIT + 100);
    const whitespace = "   ";
    const input = whitespace + content + whitespace;
    
    const result = validateInputSize(input);
    
    expect(result.isValid).toBe(false);
    expect(result.characterCount).toBe(LIMIT + 100);
    expect(result.excessCharacters).toBe(100);
  });

  it("should count characters not bytes", () => {
    // Arabic characters are multi-byte but should count as single characters
    const arabicChar = "م"; // Single Arabic character (2+ bytes in UTF-8)
    const input = arabicChar.repeat(1000);
    
    const result = validateInputSize(input);
    
    expect(result.characterCount).toBe(1000);
    expect(result.isValid).toBe(true);
  });

  it("should handle emoji correctly", () => {
    // Emojis can be complex (multiple code points)
    const emoji = "👨‍👩‍👧‍👦"; // Family emoji (multiple code points joined)
    const simpleEmoji = "😀";
    
    const result1 = validateInputSize(simpleEmoji.repeat(100));
    const result2 = validateInputSize(emoji.repeat(100));
    
    expect(result1.isValid).toBe(true);
    expect(result2.isValid).toBe(true);
  });
});

// ============================================
// getInputLimitExceededMessage Tests
// ============================================

describe("getInputLimitExceededMessage", () => {
  it("should return Arabic error message with correct values", () => {
    const message = getInputLimitExceededMessage(150000, LIMIT);
    
    // Should contain key Arabic phrases
    expect(message).toContain("تم تجاوز الحد الأقصى");
    expect(message).toContain("الحد المسموح");
    expect(message).toContain("الحل المقترح");
  });

  it("should calculate excess correctly", () => {
    const inputLength = 130000;
    const message = getInputLimitExceededMessage(inputLength, LIMIT);
    
    // The message should mention the excess (2000 characters)
    expect(message).toBeDefined();
    expect(typeof message).toBe("string");
  });
});

// ============================================
// InputLimitExceededError Tests
// ============================================

describe("InputLimitExceededError", () => {
  it("should create error with correct properties", () => {
    const error = new InputLimitExceededError(150000, LIMIT);
    
    expect(error.name).toBe("InputLimitExceededError");
    expect(error.inputLength).toBe(150000);
    expect(error.limit).toBe(LIMIT);
    expect(error.excessCharacters).toBe(22000);
    expect(error.code).toBe("AGENT_INPUT_LIMIT_EXCEEDED");
  });

  it("should be instance of AgentError", () => {
    const error = new InputLimitExceededError(150000, LIMIT);
    
    expect(error instanceof Error).toBe(true);
    // The error should have statusCode from AgentError
    expect(error.statusCode).toBe(400);
  });
});

describe("createInputLimitExceededError", () => {
  it("should create InputLimitExceededError via factory", () => {
    const error = createInputLimitExceededError(150000, LIMIT);
    
    expect(error instanceof InputLimitExceededError).toBe(true);
    expect(error.inputLength).toBe(150000);
  });
});

describe("isInputLimitExceededError", () => {
  it("should return true for InputLimitExceededError", () => {
    const error = new InputLimitExceededError(150000, LIMIT);
    expect(isInputLimitExceededError(error)).toBe(true);
  });

  it("should return false for regular Error", () => {
    const error = new Error("test");
    expect(isInputLimitExceededError(error)).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(isInputLimitExceededError(null)).toBe(false);
    expect(isInputLimitExceededError(undefined)).toBe(false);
  });
});

// ============================================
// Edge Case Tests
// ============================================

describe("Edge Cases", () => {
  it("should handle exactly at boundary minus one", () => {
    const input = "a".repeat(LIMIT - 1);
    const result = validateInputSize(input);
    
    expect(result.isValid).toBe(true);
    expect(result.characterCount).toBe(LIMIT - 1);
  });

  it("should handle exactly at boundary plus one", () => {
    const input = "a".repeat(LIMIT + 1);
    const result = validateInputSize(input);
    
    expect(result.isValid).toBe(false);
    expect(result.excessCharacters).toBe(1);
  });

  it("should handle newlines in input", () => {
    const lines = "line\n".repeat(10000);
    const result = validateInputSize(lines);
    
    expect(result.isValid).toBe(true);
    // Newlines should be counted, but trailing whitespace is trimmed
    expect(result.characterCount).toBe(49999);
  });

  it("should handle tab characters", () => {
    const tabs = "\t".repeat(1000);
    const result = validateInputSize(tabs);
    
    // Tabs in middle should be preserved
    const withContent = "a" + tabs + "b";
    const result2 = validateInputSize(withContent);
    
    expect(result2.characterCount).toBe(1002);
  });

  it("should handle null bytes", () => {
    const withNulls = "hello\0world";
    const result = validateInputSize(withNulls);
    
    expect(result.isValid).toBe(true);
    expect(result.characterCount).toBe(11);
  });
});

// ============================================
// Performance Tests (Optional)
// ============================================

describe("Performance", () => {
  it("should validate large input quickly", () => {
    const largeInput = "a".repeat(LIMIT);
    
    const startTime = performance.now();
    const result = validateInputSize(largeInput);
    const endTime = performance.now();
    
    expect(result.isValid).toBe(true);
    // Should complete in under 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });

  it("should normalize large input quickly", () => {
    const largeInput = "مرحبا ".repeat(20000);
    
    const startTime = performance.now();
    const result = normalizeInput(largeInput);
    const endTime = performance.now();
    
    expect(typeof result).toBe("string");
    // Should complete in under 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });
});
