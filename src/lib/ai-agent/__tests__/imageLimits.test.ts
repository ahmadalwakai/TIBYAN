/**
 * AI Agent - Image Limits Tests
 * ==============================
 * Tests for Damage Analyzer image count validation.
 * 
 * Ensures enforcement happens BEFORE any image processing.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateDamageAnalyzerImages,
  validateDamageAnalyzerImagesSafe,
} from "../validators/imageLimits";
import {
  NoImagesProvidedError,
  ImageLimitExceededError,
} from "../errors";
import { MAX_DAMAGE_ANALYZER_IMAGES } from "../limits";

// ============================================
// Test Constants
// ============================================

const LIMIT = MAX_DAMAGE_ANALYZER_IMAGES; // 8

// Mock image objects (content not inspected by validator)
const createMockImages = (count: number): Array<{ base64: string }> => {
  return Array.from({ length: count }, (_, i) => ({
    base64: `mock_image_data_${i}`,
  }));
};

// ============================================
// validateDamageAnalyzerImages Tests
// ============================================

describe("validateDamageAnalyzerImages", () => {
  describe("Allowed cases", () => {
    it("should allow 1 image", () => {
      const images = createMockImages(1);
      
      // Should not throw
      expect(() => validateDamageAnalyzerImages(images)).not.toThrow();
    });

    it("should allow exactly 8 images (at limit)", () => {
      const images = createMockImages(8);
      
      // Should not throw
      expect(() => validateDamageAnalyzerImages(images)).not.toThrow();
    });

    it("should allow any count from 1 to 8", () => {
      for (let i = 1; i <= LIMIT; i++) {
        const images = createMockImages(i);
        expect(() => validateDamageAnalyzerImages(images)).not.toThrow();
      }
    });
  });

  describe("Rejected cases", () => {
    it("should reject 0 images with NoImagesProvidedError", () => {
      const images: Array<unknown> = [];
      
      expect(() => validateDamageAnalyzerImages(images)).toThrow(NoImagesProvidedError);
    });

    it("should reject 9 images with ImageLimitExceededError", () => {
      const images = createMockImages(9);
      
      expect(() => validateDamageAnalyzerImages(images)).toThrow(ImageLimitExceededError);
    });

    it("should reject null/undefined with NoImagesProvidedError", () => {
      expect(() => validateDamageAnalyzerImages(null as unknown as Array<unknown>)).toThrow(NoImagesProvidedError);
      expect(() => validateDamageAnalyzerImages(undefined as unknown as Array<unknown>)).toThrow(NoImagesProvidedError);
    });

    it("should include correct count in ImageLimitExceededError", () => {
      const images = createMockImages(15);
      
      try {
        validateDamageAnalyzerImages(images);
        expect.fail("Should have thrown ImageLimitExceededError");
      } catch (error) {
        expect(error).toBeInstanceOf(ImageLimitExceededError);
        const limitError = error as ImageLimitExceededError;
        expect(limitError.providedCount).toBe(15);
        expect(limitError.limit).toBe(LIMIT);
      }
    });
  });

  describe("Enforcement order", () => {
    it("should NOT inspect image content (only count)", () => {
      // Invalid image objects - but count is valid
      const invalidImages = [
        { invalid: "data" },
        { noBase64: true },
        { something: "else" },
      ];
      
      // Should not throw because we only check count
      expect(() => validateDamageAnalyzerImages(invalidImages)).not.toThrow();
    });

    it("should validate count BEFORE any processing could occur", () => {
      const analyzeImageMock = vi.fn();
      const images = createMockImages(10); // Over limit
      
      try {
        validateDamageAnalyzerImages(images);
        // This should never be reached
        images.forEach(img => analyzeImageMock(img));
      } catch {
        // Expected
      }
      
      // analyzeImageMock should never be called
      expect(analyzeImageMock).not.toHaveBeenCalled();
    });
  });
});

// ============================================
// validateDamageAnalyzerImagesSafe Tests
// ============================================

describe("validateDamageAnalyzerImagesSafe", () => {
  it("should return valid result for 1 image", () => {
    const images = createMockImages(1);
    const result = validateDamageAnalyzerImagesSafe(images);
    
    expect(result.isValid).toBe(true);
    expect(result.providedCount).toBe(1);
    expect(result.limit).toBe(LIMIT);
    expect(result.errorType).toBe("none");
  });

  it("should return valid result for 8 images", () => {
    const images = createMockImages(8);
    const result = validateDamageAnalyzerImagesSafe(images);
    
    expect(result.isValid).toBe(true);
    expect(result.providedCount).toBe(8);
    expect(result.errorType).toBe("none");
  });

  it("should return invalid result for 0 images", () => {
    const images: Array<unknown> = [];
    const result = validateDamageAnalyzerImagesSafe(images);
    
    expect(result.isValid).toBe(false);
    expect(result.providedCount).toBe(0);
    expect(result.errorType).toBe("no_images");
  });

  it("should return invalid result for 9 images", () => {
    const images = createMockImages(9);
    const result = validateDamageAnalyzerImagesSafe(images);
    
    expect(result.isValid).toBe(false);
    expect(result.providedCount).toBe(9);
    expect(result.limit).toBe(LIMIT);
    expect(result.errorType).toBe("limit_exceeded");
  });
});

// ============================================
// Error Type Tests
// ============================================

describe("NoImagesProvidedError", () => {
  it("should have correct error code", () => {
    const error = new NoImagesProvidedError();
    
    expect(error.name).toBe("NoImagesProvidedError");
    expect(error.code).toBe("AGENT_NO_IMAGES_PROVIDED");
  });

  it("should be instance of Error", () => {
    const error = new NoImagesProvidedError();
    
    expect(error instanceof Error).toBe(true);
  });
});

describe("ImageLimitExceededError", () => {
  it("should have correct error code and properties", () => {
    const error = new ImageLimitExceededError(12, 8);
    
    expect(error.name).toBe("ImageLimitExceededError");
    expect(error.code).toBe("AGENT_IMAGE_LIMIT_EXCEEDED");
    expect(error.providedCount).toBe(12);
    expect(error.limit).toBe(8);
  });

  it("should have correct status code (400)", () => {
    const error = new ImageLimitExceededError(10, 8);
    
    expect(error.statusCode).toBe(400);
  });
});

// ============================================
// Integration Test (Mock Analyzer Flow)
// ============================================

describe("Integration: Damage Analyzer Flow", () => {
  const mockAnalyzeImage = vi.fn().mockResolvedValue({ ok: true, data: {} });

  beforeEach(() => {
    mockAnalyzeImage.mockClear();
  });

  it("should process images only when count is valid", async () => {
    const images = createMockImages(5);
    
    // Validate first
    validateDamageAnalyzerImages(images);
    
    // Then process
    for (const img of images) {
      await mockAnalyzeImage(img);
    }
    
    expect(mockAnalyzeImage).toHaveBeenCalledTimes(5);
  });

  it("should NOT process any images when limit exceeded", async () => {
    const images = createMockImages(10);
    
    try {
      validateDamageAnalyzerImages(images);
      
      // This should never execute
      for (const img of images) {
        await mockAnalyzeImage(img);
      }
    } catch (error) {
      expect(error).toBeInstanceOf(ImageLimitExceededError);
    }
    
    // No images should have been processed
    expect(mockAnalyzeImage).not.toHaveBeenCalled();
  });

  it("should NOT process any images when no images provided", async () => {
    const images: Array<unknown> = [];
    
    try {
      validateDamageAnalyzerImages(images);
      
      // This should never execute
      for (const img of images) {
        await mockAnalyzeImage(img);
      }
    } catch (error) {
      expect(error).toBeInstanceOf(NoImagesProvidedError);
    }
    
    expect(mockAnalyzeImage).not.toHaveBeenCalled();
  });
});

// ============================================
// Boundary Tests
// ============================================

describe("Boundary Tests", () => {
  it("should allow exactly at limit (8)", () => {
    const images = createMockImages(LIMIT);
    expect(() => validateDamageAnalyzerImages(images)).not.toThrow();
  });

  it("should reject exactly at limit + 1 (9)", () => {
    const images = createMockImages(LIMIT + 1);
    expect(() => validateDamageAnalyzerImages(images)).toThrow(ImageLimitExceededError);
  });

  it("should allow limit - 1 (7)", () => {
    const images = createMockImages(LIMIT - 1);
    expect(() => validateDamageAnalyzerImages(images)).not.toThrow();
  });

  it("should handle large counts correctly", () => {
    const images = createMockImages(100);
    
    try {
      validateDamageAnalyzerImages(images);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ImageLimitExceededError);
      const limitError = error as ImageLimitExceededError;
      expect(limitError.providedCount).toBe(100);
    }
  });
});
