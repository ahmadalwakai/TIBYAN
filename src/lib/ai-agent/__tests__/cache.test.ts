/**
 * AI Agent Tests - Cache Module
 * Test file for caching functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  agentCache,
  responseCache,
  retrievalCache,
  toolCache,
  sessionCache,
  AgentCache,
} from "../cache";

describe("AgentCache", () => {
  let cache: AgentCache;

  beforeEach(() => {
    cache = new AgentCache({ maxSize: 10, defaultTtlMs: 1000 });
  });

  afterEach(() => {
    cache.destroy();
  });

  it("should set and get values", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return null for non-existent keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should check if key exists", () => {
    cache.set("key1", "value1");
    expect(cache.has("key1")).toBe(true);
    expect(cache.has("nonexistent")).toBe(false);
  });

  it("should delete keys", () => {
    cache.set("key1", "value1");
    expect(cache.delete("key1")).toBe(true);
    expect(cache.get("key1")).toBeNull();
  });

  it("should delete keys by prefix", () => {
    cache.set("prefix:1", "value1");
    cache.set("prefix:2", "value2");
    cache.set("other:1", "value3");

    const deleted = cache.deleteByPrefix("prefix:");
    expect(deleted).toBe(2);
    expect(cache.get("prefix:1")).toBeNull();
    expect(cache.get("other:1")).toBe("value3");
  });

  it("should clear all values", () => {
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.clear();

    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBeNull();
  });

  it("should respect TTL", async () => {
    cache.set("key1", "value1", 50); // 50ms TTL

    expect(cache.get("key1")).toBe("value1");

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(cache.get("key1")).toBeNull();
  });

  it("should evict oldest when at capacity", () => {
    // Fill cache to capacity
    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    // Add one more
    cache.set("key10", "value10");

    // First key should be evicted
    expect(cache.get("key0")).toBeNull();
    expect(cache.get("key10")).toBe("value10");
  });

  it("should track cache statistics", () => {
    cache.set("key1", "value1");
    cache.get("key1"); // Hit
    cache.get("key1"); // Hit
    cache.get("nonexistent"); // Miss

    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.67, 1);
  });

  it("should generate consistent keys", () => {
    const key1 = cache.generateKey("test", { a: 1, b: 2 });
    const key2 = cache.generateKey("test", { a: 1, b: 2 });
    const key3 = cache.generateKey("test", { a: 1, b: 3 });

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).toMatch(/^test:/);
  });

  it("should get or set with factory", async () => {
    const factory = vi.fn().mockResolvedValue("computed");

    // First call - factory should be called
    const result1 = await cache.getOrSet("key1", factory);
    expect(result1.value).toBe("computed");
    expect(result1.cached).toBe(false);
    expect(factory).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const result2 = await cache.getOrSet("key1", factory);
    expect(result2.value).toBe("computed");
    expect(result2.cached).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1); // Not called again
  });
});

describe("responseCache", () => {
  beforeEach(() => {
    agentCache.clear();
  });

  it("should cache and retrieve responses", () => {
    const systemPrompt = "You are helpful";
    const userMessage = "Hello";
    const response = "Hi there!";

    responseCache.set(systemPrompt, userMessage, response);
    expect(responseCache.get(systemPrompt, userMessage)).toBe(response);
  });

  it("should return null for uncached responses", () => {
    expect(responseCache.get("prompt", "message")).toBeNull();
  });

  it("should generate consistent keys", () => {
    const key1 = responseCache.key("prompt1", "message1");
    const key2 = responseCache.key("prompt1", "message1");
    expect(key1).toBe(key2);
  });
});

describe("retrievalCache", () => {
  beforeEach(() => {
    agentCache.clear();
  });

  it("should cache retrieval results", () => {
    const query = "دورة القرآن";
    const results = ["result1", "result2"];

    retrievalCache.set(query, results);
    expect(retrievalCache.get(query)).toEqual(results);
  });

  it("should normalize queries", () => {
    retrievalCache.set("  QUERY  ", ["result"]);
    // Same query with different casing/spacing should match
    expect(retrievalCache.get("query")).not.toBeNull();
  });
});

describe("toolCache", () => {
  beforeEach(() => {
    agentCache.clear();
  });

  it("should cache tool results", () => {
    const toolName = "get_course";
    const params = { courseId: "123" };
    const result = { title: "Course 1" };

    toolCache.set(toolName, params, result);
    expect(toolCache.get(toolName, params)).toEqual(result);
  });

  it("should invalidate tool cache", () => {
    toolCache.set("tool1", { id: "1" }, { data: "a" });
    toolCache.set("tool1", { id: "2" }, { data: "b" });
    toolCache.set("tool2", { id: "1" }, { data: "c" });

    const invalidated = toolCache.invalidate("tool1");
    expect(invalidated).toBe(2);
    expect(toolCache.get("tool1", { id: "1" })).toBeNull();
    expect(toolCache.get("tool2", { id: "1" })).not.toBeNull();
  });
});

describe("sessionCache", () => {
  beforeEach(() => {
    agentCache.clear();
  });

  it("should cache session data", () => {
    const sessionId = "session-123";
    sessionCache.set(sessionId, "context", { courseId: "abc" });

    expect(sessionCache.get(sessionId, "context")).toEqual({ courseId: "abc" });
  });

  it("should clear all session data", () => {
    const sessionId = "session-456";
    sessionCache.set(sessionId, "key1", "value1");
    sessionCache.set(sessionId, "key2", "value2");

    const cleared = sessionCache.clear(sessionId);
    expect(cleared).toBe(2);
    expect(sessionCache.get(sessionId, "key1")).toBeNull();
    expect(sessionCache.get(sessionId, "key2")).toBeNull();
  });
});
