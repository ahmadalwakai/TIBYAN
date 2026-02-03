/**
 * LLM Client
 * ==========
 * Unified client for Groq API (OpenAI-compatible).
 * Uses remote (Groq) provider only. Mock fallback for development without API key.
 * 
 * Provider Priority:
 * 1. remote (Groq) - requires GROQ_API_KEY
 * 2. mock - fallback for dev/testing only
 */

import { getLLMConfig, type LLMProvider as ConfigProvider } from "./config";
import { mockProvider } from "./providers/mock";
import { remoteProvider } from "./providers/remote";
import type { LLMMessage, LLMCompletionResult, LLMProvider, LLMProviderName } from "./types";

// ============================================
// Provider Resolution
// ============================================

// Track if we've already logged the mock warning (log only once per process)
let mockWarningLogged = false;

/**
 * Resolve which provider to use.
 * 
 * Provider Resolution Logic:
 * 1. If GROQ_API_KEY is set → use remote (Groq)
 * 2. If GROQ_API_KEY is missing:
 *    - If LLM_PROVIDER=mock → use mock (even in production)
 *    - Otherwise → use mock with warning (graceful degradation)
 * 
 * This allows deployments without an API key to still function
 * with mock responses rather than crashing.
 */
async function resolveProvider(forcedProvider?: ConfigProvider): Promise<{
  provider: LLMProvider;
  fallbackUsed: boolean;
  reason?: string;
}> {
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const isProduction = process.env.NODE_ENV === "production";
  const explicitMock = process.env.LLM_PROVIDER?.toLowerCase() === "mock";

  // GROQ_API_KEY is set → always use Groq (remote provider)
  if (hasGroqKey) {
    const available = await remoteProvider.checkAvailability();
    if (!available) {
      // Key set but provider check failed - still try remote
      console.warn("[LLM Client] GROQ_API_KEY set but availability check failed, using Groq anyway");
    }
    console.log("[LLM Client] Using Groq API (GROQ_API_KEY configured)");
    return { provider: remoteProvider, fallbackUsed: false };
  }

  // No GROQ_API_KEY - use mock fallback (graceful degradation)
  // This prevents crashes and allows the app to function with limited AI features
  const envInfo = isProduction ? "production" : "development";
  const reasonPrefix = explicitMock ? "LLM_PROVIDER=mock configured" : "GROQ_API_KEY not configured";
  
  if (!mockWarningLogged) {
    if (isProduction && !explicitMock) {
      console.warn(`[LLM Client] WARNING: ${reasonPrefix} in ${envInfo}. AI features will use mock responses.`);
      console.warn("[LLM Client] Set GROQ_API_KEY for real AI capabilities: https://console.groq.com");
    } else {
      console.warn(`[LLM Client] ${reasonPrefix} - using mock provider (${envInfo})`);
    }
    mockWarningLogged = true;
  }
  
  return {
    provider: mockProvider,
    fallbackUsed: true,
    reason: `${reasonPrefix} - using mock responses (${envInfo} mode)`,
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

    // Remote (Groq) provider streaming
    if (provider.name === ("remote" as LLMProviderName) && "streamCompletion" in provider) {
      const remoteProv = provider as typeof import("./providers/remote").remoteProvider;
      yield* remoteProv.streamCompletion(messages, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        signal: options?.signal,
      });
      return;
    }

    // Mock - simulate with instant response
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

  /**
   * Quick check of current provider status
   */
  async getStatus(): Promise<{
    configuredProvider: string;
    effectiveProvider: LLMProviderName;
    groqAvailable: boolean;
    groqKeySet: boolean;
    isProduction: boolean;
  }> {
    const groqKeySet = !!process.env.GROQ_API_KEY;
    const isProduction = process.env.NODE_ENV === "production";
    const groqAvail = await remoteProvider.checkAvailability();
    
    // Determine effective provider based on new logic
    let effectiveProvider: LLMProviderName;
    if (groqKeySet) {
      effectiveProvider = "remote" as LLMProviderName;
    } else if (isProduction) {
      effectiveProvider = "remote" as LLMProviderName; // Will throw when used
    } else {
      effectiveProvider = "mock" as LLMProviderName;
    }

    return {
      configuredProvider: groqKeySet ? "remote (Groq)" : "mock (dev fallback)",
      effectiveProvider,
      groqAvailable: groqAvail,
      groqKeySet,
      isProduction,
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
