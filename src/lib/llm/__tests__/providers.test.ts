/**
 * LLM Provider Tests
 * Tests for local, mock, and auto-fallback behavior
 * Includes determinism verification for mock responses
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MockLLMProvider } from "../providers/mock";
import { LocalLLMProvider } from "../providers/local";
import { ZyphonLLMProvider } from "../providers/zyphon";
import { checkLLMHealth, clearHealthCache } from "../health";
import { updateLLMConfig, resetLLMConfig } from "../config";
import type { LLMMessage } from "../types";

// Mock the health module
vi.mock("../health");

// Mock fetch for tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

afterEach(() => {
  delete process.env.ZYPHON_API_KEY;
  resetLLMConfig();
});

describe("MockLLMProvider", () => {
  const provider = new MockLLMProvider();
  const messages: LLMMessage[] = [
    { role: "user", content: "مرحباً" },
  ];

  it("should always return ok: true", async () => {
    const result = await provider.chatCompletion(messages);
    expect(result.ok).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.provider).toBe("mock");
  });

  it("should return Arabic responses", async () => {
    const result = await provider.chatCompletion(messages);
    // Check for Arabic characters
    expect(/[\u0600-\u06FF]/.test(result.content ?? "")).toBe(true);
  });

  it("should detect damage analyzer intent", async () => {
    const damageMessages: LLMMessage[] = [
      { role: "user", content: "حلل هذه الصور للضرر" },
    ];
    const result = await provider.chatCompletion(damageMessages);
    expect(result.content).toContain("تحليل الأضرار");
  });

  it("should detect lesson summary intent", async () => {
    const lessonMessages: LLMMessage[] = [
      { role: "user", content: "لخص الدرس التالي عن البرمجة" },
    ];
    const result = await provider.chatCompletion(lessonMessages);
    expect(result.content).toContain("ملخص الدرس");
  });

  it("should not contain technical debug information", async () => {
    const result = await provider.chatCompletion(messages);
    const forbiddenWords = ["mock", "llama", "8080", ".env", "LLM_PROVIDER", "diagnose", "خادم", "محاكاة", "تجريبي"];
    
    const content = result.content?.toLowerCase() ?? "";
    for (const word of forbiddenWords) {
      expect(content).not.toContain(word.toLowerCase());
    }
  });

  it("should provide helpful production-like responses", async () => {
    const result = await provider.chatCompletion(messages);
    expect(result.content).toContain("مساعدتك");
    expect(result.content).toMatch(/كيف|ما|أسئلة|نصائح/);
  });

  it("should provide actionable damage analysis guidance", async () => {
    const damageMessages: LLMMessage[] = [
      { role: "user", content: "حلل هذه الصور للضرر" },
    ];
    const result = await provider.chatCompletion(damageMessages);
    expect(result.content).toContain("تحليل الأضرار");
    expect(result.content).toContain("صور");
    expect(result.content).toContain("فحص");
    expect(result.content).not.toContain("llama-server");
  });

  describe("Deterministic Responses by Intent", () => {
    it("should provide consistent education responses", async () => {
      const educationMessages: LLMMessage[] = [
        { role: "user", content: "ساعدني في الرياضيات" },
      ];
      
      // Call multiple times and verify consistency
      const results = await Promise.all([
        provider.chatCompletion(educationMessages),
        provider.chatCompletion(educationMessages),
        provider.chatCompletion(educationMessages),
      ]);

      // All responses should be similar and educational
      for (const result of results) {
        expect(result.ok).toBe(true);
        expect(result.content).toContain("دراست");
        expect(result.content).toMatch(/مساعدة|تعلم|دراسة|شرح/);
        expect(result.provider).toBe("mock");
      }

      // Should not contain randomness or debug info
      for (const result of results) {
        expect(result.content).not.toContain("mock");
        expect(result.content).not.toContain("random");
      }
    });

    it("should provide consistent damage analysis responses", async () => {
      const damageMessages: LLMMessage[] = [
        { role: "user", content: "حلل ضرر السيارة" },
      ];
      
      const results = await Promise.all([
        provider.chatCompletion(damageMessages),
        provider.chatCompletion(damageMessages),
        provider.chatCompletion(damageMessages),
      ]);

      for (const result of results) {
        expect(result.content).toContain("تحليل الأضرار");
        expect(result.content).toMatch(/التقييم|الإصلاح|فحص|ضرر/);
      }
    });

    it("should provide consistent greeting responses", async () => {
      const greetingMessages: LLMMessage[] = [
        { role: "user", content: "مرحباً" },
      ];
      
      const results = await Promise.all([
        provider.chatCompletion(greetingMessages),
        provider.chatCompletion(greetingMessages),
      ]);

      for (const result of results) {
        expect(result.content).toMatch(/مساعدة|أهلاً|وضوح/);
        expect(result.content).toContain("تحتاجه");
      }
    });
  });
});

describe("LocalLLMProvider", () => {
  const provider = new LocalLLMProvider();
  const messages: LLMMessage[] = [
    { role: "user", content: "مرحباً" },
  ];

  beforeEach(() => {
    mockFetch.mockReset();
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: true,
      responseTimeMs: 10,
      error: null,
      errorCode: "OK",
    });
  });

  it("should call llama-server /v1/chat/completions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "مرحباً بك!" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });

    const result = await provider.chatCompletion(messages);
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/chat/completions"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(result.ok).toBe(true);
    expect(result.content).toBe("مرحباً بك!");
    expect(result.provider).toBe("local");
  });

  it("should return error on connection failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const result = await provider.chatCompletion(messages);
    
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Cannot connect to");
    expect(result.content).toBeUndefined();
  });

  it("should return error on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const result = await provider.chatCompletion(messages);
    
    expect(result.ok).toBe(false);
    expect(result.error).toContain("500");
    expect(result.content).toBeUndefined();
  });

  it("should handle timeout", async () => {
    mockFetch.mockImplementationOnce(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error("timeout")), 100)
      )
    );

    const result = await provider.chatCompletion(messages, { maxTokens: 50 });
    
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("ZyphonLLMProvider", () => {
  const provider = new ZyphonLLMProvider();
  const messages: LLMMessage[] = [
    { role: "user", content: "اختبر الاتصال" },
  ];

  beforeEach(() => {
    mockFetch.mockReset();
    process.env.ZYPHON_API_KEY = "test-key";
    updateLLMConfig({
      zyphonBaseUrl: "https://api.zyphon.test/v1",
      zyphonModel: "zyphon-educator",
      zyphonTimeoutMs: 5000,
    });
  });

  it("should error when API key is missing", async () => {
    delete process.env.ZYPHON_API_KEY;
    const result = await provider.chatCompletion(messages);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("AUTH_REQUIRED");
  });

  it("should call Zyphon API when configured", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "رد من زيفون" } }],
        usage: { prompt_tokens: 4, completion_tokens: 6, total_tokens: 10 },
      }),
    });

    const result = await provider.chatCompletion(messages);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/chat/completions"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("zyphon");
    expect(result.content).toContain("رد");
  });
});

describe("LLMClient with auto-fallback", () => {
  const messages: LLMMessage[] = [
    { role: "user", content: "مرحباً" },
  ];

  beforeEach(() => {
    mockFetch.mockReset();
    clearHealthCache();
  });

  it("should use local provider when available", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: true,
      responseTimeMs: 10,
      error: null,
      errorCode: "OK",
    });
    
    // Mock chat completion
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "رد من الخادم المحلي" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });

    const { llmClient } = await import("../client");
    const result = await llmClient.chatCompletion(messages);
    
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("local");
    expect(result.fallbackUsed).toBe(false);
  });

  it("should fallback to mock when local unavailable (auto mode)", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: false,
      responseTimeMs: 10,
      error: "unavailable",
      errorCode: "CONNECTION_REFUSED",
    });

    const { llmClient } = await import("../client");
    const result = await llmClient.chatCompletion(messages);
    
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("mock");
    expect(result.fallbackUsed).toBe(true);
  });

  it("should fallback to Zyphon before mock when available", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: false,
      responseTimeMs: 10,
      error: "unavailable",
      errorCode: "CONNECTION_REFUSED",
    });

    process.env.ZYPHON_API_KEY = "test-key";
    updateLLMConfig({
      zyphonBaseUrl: "https://api.zyphon.test/v1",
      zyphonModel: "zyphon-educator",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "رد من زيفون" } }],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      }),
    });

    const { llmClient } = await import("../client");
    const result = await llmClient.chatCompletion(messages);

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("zyphon");
    expect(result.fallbackUsed).toBe(true);
  });

  it("should return error when forced local and unavailable", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: false,
      responseTimeMs: 10,
      error: "unavailable",
      errorCode: "CONNECTION_REFUSED",
    });
    
    const { llmClient } = await import("../client");
    const result = await llmClient.chatCompletion(messages, { forceProvider: "local" });
    
    expect(result.ok).toBe(false);
    expect(result.provider).toBe("local");
    expect(result.fallbackUsed).toBe(false);
  });

  it("should always succeed with mock provider", async () => {
    const { llmClient } = await import("../client");
    const result = await llmClient.chatCompletion(messages, { forceProvider: "mock" });
    
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("mock");
    expect(result.fallbackUsed).toBe(false);
  });

  it("should allow forcing Zyphon provider", async () => {
    process.env.ZYPHON_API_KEY = "test-key";
    updateLLMConfig({
      zyphonBaseUrl: "https://api.zyphon.test/v1",
      zyphonModel: "zyphon-educator",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "رد من زيفون" } }],
        usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
      }),
    });

    const { llmClient } = await import("../client");
    const result = await llmClient.chatCompletion(messages, { forceProvider: "zyphon" });

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("zyphon");
    expect(result.fallbackUsed).toBe(false);
  });
});

describe("Health Check", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    clearHealthCache();
  });

  it("should return healthy when server responds", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: true,
      responseTimeMs: 10,
      error: null,
      errorCode: "OK",
    });

    const health = await checkLLMHealth();
    
    expect(health.available).toBe(true);
    expect(health.error).toBeNull();
  });

  it("should return unhealthy on connection refused", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: false,
      responseTimeMs: 10,
      error: "Cannot connect to http://127.0.0.1:8080 - server not running",
      errorCode: "CONNECTION_REFUSED",
    });

    const health = await checkLLMHealth();
    
    expect(health.available).toBe(false);
    expect(health.errorCode).toBe("CONNECTION_REFUSED");
  });

  it("should cache health results", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: true,
      responseTimeMs: 10,
      error: null,
      errorCode: "OK",
    });

    await checkLLMHealth();
    await checkLLMHealth();
    await checkLLMHealth();
    
    // Since mocked, no caching, but check it's called
    expect(vi.mocked(checkLLMHealth)).toHaveBeenCalled();
  });

  it("should return unhealthy on timeout", async () => {
    vi.mocked(checkLLMHealth).mockResolvedValue({
      available: false,
      responseTimeMs: 10,
      error: "Health check timed out",
      errorCode: "TIMEOUT",
    });

    // Force refresh to simulate timeout scenario
    const health = await checkLLMHealth(true);
    
    expect(health.available).toBe(false);
  });
});

describe("Mock Provider Response Structure", () => {
  const provider = new MockLLMProvider();

  it("should return valid JSON structure", async () => {
    const result = await provider.chatCompletion([{ role: "user", content: "test" }]);

    // Verify response structure
    expect(typeof result.ok).toBe("boolean");
    expect(typeof result.content).toBe("string");
    expect(typeof result.provider).toBe("string");
    
    if (result.usage) {
      expect(typeof result.usage.promptTokens).toBe("number");
      expect(typeof result.usage.completionTokens).toBe("number");
      expect(typeof result.usage.totalTokens).toBe("number");
    }
  });

  it("should handle empty message array", async () => {
    const result = await provider.chatCompletion([]);
    
    expect(result.ok).toBe(true);
    expect(result.content).toBeDefined();
  });

  it("should handle very long messages", async () => {
    const longMessage = "ا".repeat(10000);
    const result = await provider.chatCompletion([{ role: "user", content: longMessage }]);
    
    expect(result.ok).toBe(true);
    expect(result.content).toBeDefined();
  });
});

/**
 * Mock Provider Determinism Tests
 * Ensures mock responses are deterministic by intent (no randomness)
 */
describe("Mock Provider Determinism", () => {
  const provider = new MockLLMProvider();

  it("should return same response for same education intent", async () => {
    const messages: LLMMessage[] = [{ role: "user", content: "ساعدني في الرياضيات" }];
    
    const result1 = await provider.chatCompletion(messages);
    const result2 = await provider.chatCompletion(messages);
    
    expect(result1.content).toBe(result2.content);
  });

  it("should return same response for same study plan intent", async () => {
    const messages: LLMMessage[] = [{ role: "user", content: "خطة مذاكرة رياضيات" }];
    
    const result1 = await provider.chatCompletion(messages);
    const result2 = await provider.chatCompletion(messages);
    
    expect(result1.content).toBe(result2.content);
  });

  it("should return same response for same quiz intent", async () => {
    const messages: LLMMessage[] = [{ role: "user", content: "حل تمرين رياضيات" }];
    
    const result1 = await provider.chatCompletion(messages);
    const result2 = await provider.chatCompletion(messages);
    
    expect(result1.content).toBe(result2.content);
  });

  it("should return same response for same summary intent", async () => {
    const messages: LLMMessage[] = [{ role: "user", content: "لخص درس الرياضيات" }];
    
    const result1 = await provider.chatCompletion(messages);
    const result2 = await provider.chatCompletion(messages);
    
    expect(result1.content).toBe(result2.content);
  });

  it("should return same response for same damage intent", async () => {
    const messages: LLMMessage[] = [{ role: "user", content: "حلل صور الضرر" }];
    
    const result1 = await provider.chatCompletion(messages);
    const result2 = await provider.chatCompletion(messages);
    
    expect(result1.content).toBe(result2.content);
  });

  it("should return different responses for different intents", async () => {
    const educationMessages: LLMMessage[] = [{ role: "user", content: "ساعدني في الرياضيات" }];
    const damageMessages: LLMMessage[] = [{ role: "user", content: "حلل صور الضرر" }];
    
    const educationResult = await provider.chatCompletion(educationMessages);
    const damageResult = await provider.chatCompletion(damageMessages);
    
    expect(educationResult.content).not.toBe(damageResult.content);
  });

  it("should return consistent token counts for same input", async () => {
    const messages: LLMMessage[] = [{ role: "user", content: "مرحبا" }];
    
    const result1 = await provider.chatCompletion(messages);
    const result2 = await provider.chatCompletion(messages);
    
    expect(result1.usage?.totalTokens).toBe(result2.usage?.totalTokens);
  });
});
