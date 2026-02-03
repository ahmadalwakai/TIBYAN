/**
 * LLM Client
 * ==========
 * Unified client that auto-selects between local and mock providers.
 * Provides graceful fallback when local LLM is unavailable.
 */

import { getLLMConfig, type LLMProvider as ConfigProvider } from "./config";
import { localProvider } from "./providers/local";
import { mockProvider } from "./providers/mock";
import type { LLMMessage, LLMCompletionResult, LLMProvider, LLMProviderName } from "./types";

// ============================================
// Provider Resolution
// ============================================

/**
 * Resolve which provider to use based on config and availability.
 * 
 * Logic:
 * - If LLM_PROVIDER=local: use local only (error if unavailable)
 * - If LLM_PROVIDER=mock: use mock only
 * - If LLM_PROVIDER=auto (default): try local, fallback to mock
 */
async function resolveProvider(forcedProvider?: ConfigProvider): Promise<{
  provider: LLMProvider;
  fallbackUsed: boolean;
  reason?: string;
}> {
  const config = getLLMConfig();
  const effectiveProvider = forcedProvider ?? config.provider;

  // Explicit mock mode
  if (effectiveProvider === "mock") {
    console.log("[LLM Client] Using mock provider (explicitly configured)");
    return { provider: mockProvider, fallbackUsed: false };
  }

  // Explicit local mode (no fallback)
  if (effectiveProvider === "local") {
    const available = await localProvider.checkAvailability();
    if (!available) {
      console.error("[LLM Client] Local provider forced but unavailable");
      return {
        provider: localProvider,
        fallbackUsed: false,
        reason: "Local LLM forced but unavailable",
      };
    }
    return { provider: localProvider, fallbackUsed: false };
  }

  // Auto mode: try local, then mock
  const available = await localProvider.checkAvailability();

  if (available) {
    console.log("[LLM Client] Using local provider (auto-detected as available)");
    return { provider: localProvider, fallbackUsed: false };
  }

  console.warn("[LLM Client] Local LLM unavailable, falling back to mock");
  return {
    provider: mockProvider,
    fallbackUsed: true,
    reason: "Local LLM unavailable",
  };
}

// ============================================
// LLM Client Class
// ============================================

class LLMClient {
  private lastProvider: LLMProviderName | null = null;
  private lastFallbackReason: string | null = null;

  /**
   * Get info about the last used provider
   */
  getLastProviderInfo(): { provider: LLMProviderName | null; fallbackReason: string | null } {
    return {
      provider: this.lastProvider,
      fallbackReason: this.lastFallbackReason,
    };
  }

  /**
   * Send a chat completion request with automatic provider selection
   */
  async chatCompletion(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      forceProvider?: ConfigProvider;
    }
  ): Promise<LLMCompletionResult & { fallbackUsed: boolean; fallbackReason?: string }> {
    const { provider, fallbackUsed, reason } = await resolveProvider(options?.forceProvider);
    
    this.lastProvider = provider.name;
    this.lastFallbackReason = reason || null;

    const result = await provider.chatCompletion(messages, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    return {
      ...result,
      fallbackUsed,
      fallbackReason: reason,
    };
  }

  /**
   * Stream completion with automatic provider selection
   * Only local provider supports streaming (mock falls back to instant response)
   */
  async *streamCompletion(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      signal?: AbortSignal;
      forceProvider?: ConfigProvider;
    }
  ): AsyncGenerator<{ ok: boolean; delta?: string; error?: string; done?: boolean }> {
    const { provider, fallbackUsed, reason } = await resolveProvider(options?.forceProvider);
    
    this.lastProvider = provider.name;
    this.lastFallbackReason = reason || null;

    if (provider.name === "local" && "streamCompletion" in provider) {
      const localProvider = provider as typeof import("./providers/local").localProvider;
      yield* localProvider.streamCompletion(messages, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        signal: options?.signal,
      });
    } else {
      // Mock or streaming not available - simulate with instant response
      const result = await provider.chatCompletion(messages, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });

      if (result.ok && result.content) {
        yield { ok: true, delta: result.content };
        yield { ok: true, done: true };
      } else {
        yield { ok: false, error: result.error || "Failed to complete" };
      }
    }
  }

  /**
   * Quick check of current provider status
   */
  async getStatus(): Promise<{
    configuredProvider: ConfigProvider;
    effectiveProvider: LLMProviderName;
    localAvailable: boolean;
  }> {
    const config = getLLMConfig();
    const available = await localProvider.checkAvailability();
    const { provider } = await resolveProvider();

    return {
      configuredProvider: config.provider,
      effectiveProvider: provider.name,
      localAvailable: available,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

export const llmClient = new LLMClient();

// ============================================
// Convenience Functions
// ============================================

/**
 * Send a chat completion with automatic provider selection
 */
export async function chatCompletion(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    forceProvider?: ConfigProvider;
  }
): Promise<LLMCompletionResult & { fallbackUsed: boolean }> {
  return llmClient.chatCompletion(messages, options);
}

/**
 * Stream completion with automatic provider selection
 */
export async function* chatCompletionStream(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    forceProvider?: ConfigProvider;
  }
): AsyncGenerator<{ ok: boolean; delta?: string; error?: string; done?: boolean }> {
  yield* llmClient.streamCompletion(messages, options);
}

/**
 * Get current LLM status
 */
export async function getLLMStatus() {
  return llmClient.getStatus();
}
