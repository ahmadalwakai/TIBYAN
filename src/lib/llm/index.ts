/**
 * LLM Module
 * ==========
 * Unified LLM interface for Groq API.
 * Supports remote (Groq) and mock providers only.
 */

// ============================================
// Types
// ============================================

export type {
  LLMMessage,
  LLMCompletionResult,
  LLMProvider,
  LLMProviderName,
} from "./types";

// ============================================
// Re-exports
// ============================================

// Config
export {
  getLLMConfig,
  updateLLMConfig,
  resetLLMConfig,
  logLLMConfig,
  DEFAULT_LLM_CONFIG,
  type LLMConfig,
  type LLMProvider as LLMProviderType,
} from "./config";

// Providers
export { mockProvider, MockLLMProvider } from "./providers/mock";
export { remoteProvider, RemoteLLMProvider } from "./providers/remote";

// Client
export {
  llmClient,
  chatCompletion,
  chatCompletionStream,
  getLLMStatus,
} from "./client";
