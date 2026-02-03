/**
 * LLM Module
 * ==========
 * Unified LLM interface with automatic provider selection.
 * Supports local llama-server and mock mode (no external API keys).
 */

// ============================================
// Types (from dedicated types file to avoid circular deps)
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
  getLLMBaseUrl,
  logLLMConfig,
  DEFAULT_LLM_CONFIG,
  type LLMConfig,
  type LLMProvider as LLMProviderType,
} from "./config";

// Health
export {
  checkLLMHealth,
  waitForLLMHealth,
  isLLMAvailable,
  clearHealthCache,
  type HealthCheckResult,
} from "./health";

// Providers
export { mockProvider, MockLLMProvider } from "./providers/mock";
export { localProvider, LocalLLMProvider } from "./providers/local";
export { remoteProvider, RemoteLLMProvider } from "./providers/remote";

// Client
export {
  llmClient,
  chatCompletion,
  getLLMStatus,
} from "./client";

// Local Server Manager
export {
  startLocalServer,
  stopServer,
  isServerRunning,
  getServerLogs,
  type ServerStartResult,
} from "./localServer";
