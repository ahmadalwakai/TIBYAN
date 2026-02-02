/**
 * AI Agent - Telemetry
 * Logging, traces, and cost tracking hooks
 */

import type {
  TelemetryEvent,
  TelemetryEventType,
  TokenUsage,
  RequestMetrics,
} from "./types";

// ============================================
// Cost Configuration (per 1K tokens)
// ============================================

interface CostConfig {
  promptCostPer1K: number;
  completionCostPer1K: number;
}

const COST_CONFIG: Record<string, CostConfig> = {
  "llama-local": { promptCostPer1K: 0, completionCostPer1K: 0 }, // Local = free
  "gpt-4": { promptCostPer1K: 0.03, completionCostPer1K: 0.06 },
  "gpt-3.5-turbo": { promptCostPer1K: 0.0015, completionCostPer1K: 0.002 },
  "claude-3-opus": { promptCostPer1K: 0.015, completionCostPer1K: 0.075 },
  "claude-3-sonnet": { promptCostPer1K: 0.003, completionCostPer1K: 0.015 },
};

// ============================================
// Telemetry Store (In-Memory for now)
// ============================================

interface TelemetryStore {
  events: TelemetryEvent[];
  metrics: Map<string, RequestMetrics>;
  totals: {
    requests: number;
    errors: number;
    cacheHits: number;
    cacheMisses: number;
    totalTokens: number;
    totalCostUsd: number;
  };
}

const store: TelemetryStore = {
  events: [],
  metrics: new Map(),
  totals: {
    requests: 0,
    errors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalTokens: 0,
    totalCostUsd: 0,
  },
};

// Maximum events to keep in memory
const MAX_EVENTS = 1000;

// ============================================
// Telemetry Class
// ============================================

class AgentTelemetry {
  private enabled: boolean = true;

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Record a telemetry event
   */
  record(
    type: TelemetryEventType,
    data: Omit<TelemetryEvent, "type" | "timestamp">
  ): void {
    if (!this.enabled) return;

    const event: TelemetryEvent = {
      type,
      timestamp: new Date(),
      ...data,
    };

    // Add to events array (with size limit)
    store.events.push(event);
    if (store.events.length > MAX_EVENTS) {
      store.events.shift();
    }

    // Update totals based on event type
    switch (type) {
      case "request_start":
        store.totals.requests++;
        break;
      case "error":
        store.totals.errors++;
        break;
      case "cache_hit":
        store.totals.cacheHits++;
        break;
      case "cache_miss":
        store.totals.cacheMisses++;
        break;
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Telemetry] ${type}`, {
        requestId: data.requestId,
        durationMs: data.durationMs,
      });
    }
  }

  /**
   * Start tracking a request
   */
  startRequest(requestId: string, sessionId?: string, userId?: string): void {
    const metrics: RequestMetrics = {
      requestId,
      startTime: new Date(),
      cacheHit: false,
      toolCalls: 0,
      errorCount: 0,
    };

    store.metrics.set(requestId, metrics);

    this.record("request_start", { requestId, sessionId, userId });
  }

  /**
   * End tracking a request
   */
  endRequest(
    requestId: string,
    options?: {
      tokenUsage?: TokenUsage;
      cacheHit?: boolean;
      error?: boolean;
    }
  ): RequestMetrics | undefined {
    const metrics = store.metrics.get(requestId);
    if (!metrics) return undefined;

    metrics.endTime = new Date();
    metrics.durationMs = metrics.endTime.getTime() - metrics.startTime.getTime();

    if (options?.tokenUsage) {
      metrics.tokenUsage = options.tokenUsage;
      store.totals.totalTokens += options.tokenUsage.totalTokens;
      if (options.tokenUsage.estimatedCostUsd) {
        store.totals.totalCostUsd += options.tokenUsage.estimatedCostUsd;
      }
    }

    if (options?.cacheHit !== undefined) {
      metrics.cacheHit = options.cacheHit;
    }

    this.record("request_end", {
      requestId,
      durationMs: metrics.durationMs,
      metadata: {
        tokenUsage: metrics.tokenUsage,
        cacheHit: metrics.cacheHit,
        toolCalls: metrics.toolCalls,
      },
    });

    // Clean up after a delay
    setTimeout(() => {
      store.metrics.delete(requestId);
    }, 60_000);

    return metrics;
  }

  /**
   * Record a tool call
   */
  recordToolCall(
    requestId: string,
    toolName: string,
    durationMs: number,
    success: boolean
  ): void {
    const metrics = store.metrics.get(requestId);
    if (metrics) {
      metrics.toolCalls++;
      if (!success) {
        metrics.errorCount++;
      }
    }

    this.record("tool_call", {
      requestId,
      durationMs,
      metadata: { toolName, success },
    });
  }

  /**
   * Record LLM call
   */
  recordLLMCall(
    requestId: string,
    model: string,
    tokenUsage: TokenUsage,
    durationMs: number
  ): void {
    this.record("llm_call", {
      requestId,
      durationMs,
      metadata: { model, tokenUsage },
    });
  }

  /**
   * Record cache hit/miss
   */
  recordCache(requestId: string, hit: boolean): void {
    this.record(hit ? "cache_hit" : "cache_miss", { requestId });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimit(requestId: string, userId?: string): void {
    this.record("rate_limit", { requestId, userId });
  }

  /**
   * Record safety block
   */
  recordSafetyBlock(
    requestId: string,
    categories: string[],
    userId?: string
  ): void {
    this.record("safety_block", {
      requestId,
      userId,
      metadata: { categories },
    });
  }

  /**
   * Calculate token cost
   */
  calculateCost(model: string, tokenUsage: TokenUsage): number {
    const config = COST_CONFIG[model] ?? COST_CONFIG["llama-local"];

    const promptCost = (tokenUsage.promptTokens / 1000) * config.promptCostPer1K;
    const completionCost =
      (tokenUsage.completionTokens / 1000) * config.completionCostPer1K;

    return promptCost + completionCost;
  }

  /**
   * Estimate tokens from text (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English/Arabic mix
    return Math.ceil(text.length / 4);
  }

  /**
   * Create token usage object
   */
  createTokenUsage(
    promptTokens: number,
    completionTokens: number,
    model: string = "llama-local"
  ): TokenUsage {
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd = this.calculateCost(model, {
      promptTokens,
      completionTokens,
      totalTokens,
    });

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
    };
  }

  /**
   * Get aggregated statistics
   */
  getStats(): {
    totals: TelemetryStore["totals"];
    averageLatencyMs: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const recentEvents = store.events.filter(
      (e) => e.type === "request_end" && e.durationMs
    );

    const totalLatency = recentEvents.reduce(
      (sum, e) => sum + (e.durationMs ?? 0),
      0
    );
    const averageLatencyMs =
      recentEvents.length > 0 ? totalLatency / recentEvents.length : 0;

    const errorRate =
      store.totals.requests > 0
        ? store.totals.errors / store.totals.requests
        : 0;

    const cacheTotal = store.totals.cacheHits + store.totals.cacheMisses;
    const cacheHitRate =
      cacheTotal > 0 ? store.totals.cacheHits / cacheTotal : 0;

    return {
      totals: { ...store.totals },
      averageLatencyMs,
      errorRate,
      cacheHitRate,
    };
  }

  /**
   * Get totals only
   */
  getTotals(): TelemetryStore["totals"] {
    return { ...store.totals };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): TelemetryEvent[] {
    return store.events.slice(-limit);
  }

  /**
   * Get metrics for a specific request
   */
  getRequestMetrics(requestId: string): RequestMetrics | undefined {
    return store.metrics.get(requestId);
  }

  /**
   * Reset all telemetry data
   */
  reset(): void {
    store.events = [];
    store.metrics.clear();
    store.totals = {
      requests: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokens: 0,
      totalCostUsd: 0,
    };
  }

  /**
   * Export telemetry data for external systems
   */
  export(): {
    events: TelemetryEvent[];
    stats: ReturnType<AgentTelemetry["getStats"]>;
    exportedAt: Date;
  } {
    return {
      events: [...store.events],
      stats: this.getStats(),
      exportedAt: new Date(),
    };
  }
}

// ============================================
// Global Telemetry Instance
// ============================================

export const telemetry = new AgentTelemetry();

// ============================================
// Telemetry Middleware Helper
// ============================================

/**
 * Wrap an async function with telemetry
 */
export function withTelemetry<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const startTime = Date.now();
    const requestId = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      telemetry.startRequest(requestId);
      const result = await fn(...args);
      telemetry.endRequest(requestId);
      return result;
    } catch (error) {
      telemetry.endRequest(requestId, { error: true });
      throw error;
    }
  };
}

/**
 * Create a request tracer
 */
export function createTracer(requestId: string) {
  return {
    requestId,
    start: (sessionId?: string, userId?: string) => {
      telemetry.startRequest(requestId, sessionId, userId);
    },
    end: (options?: Parameters<AgentTelemetry["endRequest"]>[1]) => {
      return telemetry.endRequest(requestId, options);
    },
    toolCall: (toolName: string, durationMs: number, success: boolean) => {
      telemetry.recordToolCall(requestId, toolName, durationMs, success);
    },
    llmCall: (model: string, tokenUsage: TokenUsage, durationMs: number) => {
      telemetry.recordLLMCall(requestId, model, tokenUsage, durationMs);
    },
    cache: (hit: boolean) => {
      telemetry.recordCache(requestId, hit);
    },
    rateLimit: (userId?: string) => {
      telemetry.recordRateLimit(requestId, userId);
    },
    safetyBlock: (categories: string[], userId?: string) => {
      telemetry.recordSafetyBlock(requestId, categories, userId);
    },
  };
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  return `req_${timestamp}_${random}`;
}

// ============================================
// Exports
// ============================================

export { COST_CONFIG };
export type { CostConfig };
