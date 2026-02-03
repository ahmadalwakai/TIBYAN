/**
 * LLM Module Types
 * ================
 * Shared types used across LLM providers.
 * This file exists to avoid circular dependencies.
 */

// ============================================
// Core Types
// ============================================

export type LLMProviderName = "local" | "mock" | "ollama" | "remote";

/**
 * A message in a chat completion request
 */
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Result from an LLM chat completion
 */
export interface LLMCompletionResult {
  /** Whether the request succeeded */
  ok: boolean;
  /** Which provider generated this response */
  provider: LLMProviderName;
  /** The generated content (undefined if error) */
  content?: string;
  /** Error message (if ok=false) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: string;
  /** Token usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Request duration in milliseconds */
  durationMs: number;
  /** Whether this was a cached response */
  cached?: boolean;
}

/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  /** Provider name */
  readonly name: LLMProviderName;
  /** Whether this provider is currently available */
  readonly isAvailable: boolean;
  /** Send a chat completion request */
  chatCompletion(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMCompletionResult>;
}
