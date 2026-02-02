/**
 * LLM Client
 * ==========
 * Unified client that auto-selects between local, Zyphon, and mock providers.
 * Provides graceful fallback when the preferred LLM is unavailable.
 */

import { getLLMConfig, type LLMProvider as ConfigProvider } from "./config";
import { checkLLMHealth, isLLMAvailable } from "./health";
import { localProvider } from "./providers/local";
import { mockProvider } from "./providers/mock";
import { zyphonProvider } from "./providers/zyphon";
import type { LLMMessage, LLMCompletionResult, LLMProvider, LLMProviderName } from "./types";

// ============================================
// Provider Resolution
// ============================================

/**
 * Resolve which provider to use based on config and availability.
 * 
 * Logic:
 * - If LLM_PROVIDER=local: use local only (error if unavailable)
 * - If LLM_PROVIDER=zyphon: use Zyphon only (error if misconfigured)
 * - If LLM_PROVIDER=mock: use mock only
 * - If LLM_PROVIDER=auto (default): try local, fallback to Zyphon, else mock
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
    const available = await isLLMAvailable();
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

  // Explicit Zyphon mode (no fallback)
  if (effectiveProvider === "zyphon") {
    if (!zyphonProvider.isAvailable) {
      console.error("[LLM Client] Zyphon provider forced but API key missing");
      return {
        provider: zyphonProvider,
        fallbackUsed: false,
        reason: "Zyphon API key missing",
      };
    }
    console.log("[LLM Client] Using Zyphon provider (explicitly configured)");
    return { provider: zyphonProvider, fallbackUsed: false };
  }

  // Auto mode: try local, then Zyphon, then mock
  const health = await checkLLMHealth();

  if (health.available) {
    console.log("[LLM Client] Using local provider (auto-detected as available)");
    return { provider: localProvider, fallbackUsed: false };
  }

  if (zyphonProvider.isAvailable) {
    console.warn(`[LLM Client] Local unavailable (${health.errorCode}), falling back to Zyphon`);
    return {
      provider: zyphonProvider,
      fallbackUsed: true,
      reason: health.error || "Local LLM unavailable",
    };
  }

  console.warn(`[LLM Client] Local unavailable (${health.errorCode}), falling back to mock`);
  return {
    provider: mockProvider,
    fallbackUsed: true,
    reason: health.error || "Local LLM unavailable",
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
   * Quick check of current provider status
   */
  async getStatus(): Promise<{
    configuredProvider: ConfigProvider;
    effectiveProvider: LLMProviderName;
    localAvailable: boolean;
    zyphonAvailable: boolean;
    localHealth: Awaited<ReturnType<typeof checkLLMHealth>>;
  }> {
    const config = getLLMConfig();
    const health = await checkLLMHealth(true);
    const { provider } = await resolveProvider();

    return {
      configuredProvider: config.provider,
      effectiveProvider: provider.name,
      localAvailable: health.available,
      zyphonAvailable: zyphonProvider.isAvailable,
      localHealth: health,
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
 * Get current LLM status
 */
export async function getLLMStatus() {
  return llmClient.getStatus();
}
