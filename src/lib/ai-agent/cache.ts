/**
 * AI Agent - Caching Layer
 * In-memory + Vercel-friendly caching strategy
 */

import type { CacheEntry, CacheStats } from "./types";
import { createHash } from "crypto";

// ============================================
// Cache Configuration
// ============================================

interface CacheConfig {
  maxSize: number; // Maximum number of entries
  defaultTtlMs: number; // Default TTL in milliseconds
  cleanupIntervalMs: number; // Cleanup interval
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutes
  cleanupIntervalMs: 60 * 1000, // 1 minute
};

// ============================================
// Cache Class
// ============================================

class AgentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    if (typeof setInterval !== "undefined" && !this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupIntervalMs);

      // Don't block process exit
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Generate cache key from inputs
   */
  generateKey(prefix: string, ...parts: unknown[]): string {
    const content = JSON.stringify(parts);
    const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttlMs ?? this.config.defaultTtlMs));

    this.cache.set(key, {
      key,
      value,
      expiresAt,
      createdAt: now,
      hits: 0,
    });
  }

  /**
   * Check if key exists (and not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete keys matching prefix
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt.getTime()) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict oldest entry (LRU-like)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt.getTime() < oldestTime) {
        oldestTime = entry.createdAt.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number
  ): Promise<{ value: T; cached: boolean }> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return { value: cached, cached: true };
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return { value, cached: false };
  }

  /**
   * Destroy cache and stop cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// ============================================
// Global Cache Instance
// ============================================

export const agentCache = new AgentCache();

// ============================================
// Specialized Cache Helpers
// ============================================

/**
 * Cache for LLM responses
 */
export const responseCache = {
  /**
   * Generate key for chat response
   */
  key(systemPrompt: string, userMessage: string): string {
    return agentCache.generateKey("response", systemPrompt, userMessage);
  },

  /**
   * Get cached response
   */
  get(systemPrompt: string, userMessage: string): string | null {
    const key = this.key(systemPrompt, userMessage);
    return agentCache.get<string>(key);
  },

  /**
   * Set cached response
   */
  set(
    systemPrompt: string,
    userMessage: string,
    response: string,
    ttlMs: number = 10 * 60 * 1000 // 10 minutes default
  ): void {
    const key = this.key(systemPrompt, userMessage);
    agentCache.set(key, response, ttlMs);
  },
};

/**
 * Cache for knowledge base retrieval
 */
export const retrievalCache = {
  /**
   * Generate key for retrieval query
   */
  key(query: string): string {
    return agentCache.generateKey("retrieval", query.toLowerCase().trim());
  },

  /**
   * Get cached retrieval results
   */
  get(query: string): string[] | null {
    const key = this.key(query);
    return agentCache.get<string[]>(key);
  },

  /**
   * Set cached retrieval results
   */
  set(
    query: string,
    results: string[],
    ttlMs: number = 15 * 60 * 1000 // 15 minutes default
  ): void {
    const key = this.key(query);
    agentCache.set(key, results, ttlMs);
  },
};

/**
 * Cache for tool execution results
 */
export const toolCache = {
  /**
   * Generate key for tool call
   */
  key(toolName: string, params: Record<string, unknown>): string {
    const hash = agentCache.generateKey("", params);
    return `tool:${toolName}${hash}`;
  },

  /**
   * Get cached tool result
   */
  get<T>(toolName: string, params: Record<string, unknown>): T | null {
    const key = this.key(toolName, params);
    return agentCache.get<T>(key);
  },

  /**
   * Set cached tool result
   */
  set<T>(
    toolName: string,
    params: Record<string, unknown>,
    result: T,
    ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ): void {
    const key = this.key(toolName, params);
    agentCache.set(key, result, ttlMs);
  },

  /**
   * Invalidate all cached results for a tool
   */
  invalidate(toolName: string): number {
    return agentCache.deleteByPrefix(`tool:${toolName}`);
  },
};

/**
 * Cache for user session data
 */
export const sessionCache = {
  /**
   * Generate key for session
   */
  key(sessionId: string, subKey?: string): string {
    return subKey
      ? `session:${sessionId}:${subKey}`
      : `session:${sessionId}`;
  },

  /**
   * Get session data
   */
  get<T>(sessionId: string, subKey?: string): T | null {
    const key = this.key(sessionId, subKey);
    return agentCache.get<T>(key);
  },

  /**
   * Set session data
   */
  set<T>(
    sessionId: string,
    subKey: string,
    value: T,
    ttlMs: number = 30 * 60 * 1000 // 30 minutes default
  ): void {
    const key = this.key(sessionId, subKey);
    agentCache.set(key, value, ttlMs);
  },

  /**
   * Clear all session data
   */
  clear(sessionId: string): number {
    return agentCache.deleteByPrefix(`session:${sessionId}`);
  },
};

// ============================================
// Cache Decorators
// ============================================

/**
 * Decorator to cache function results
 */
export function cached<T>(
  keyPrefix: string,
  ttlMs: number = 5 * 60 * 1000
): (
  target: unknown,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
) => TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>> {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ) {
    const originalMethod = descriptor.value;

    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = async function (...args: unknown[]): Promise<T> {
      const key = agentCache.generateKey(keyPrefix, args);

      const cachedValue = agentCache.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      const result = await originalMethod.apply(this, args);
      agentCache.set(key, result, ttlMs);
      return result;
    };

    return descriptor;
  };
}

// ============================================
// Exports
// ============================================

export { AgentCache };
export type { CacheConfig };
