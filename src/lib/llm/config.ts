/**
 * LLM Configuration
 * =================
 * Centralized configuration for LLM providers.
 * Supports: local (llama-server) and mock (no-key development mode).
 */

// ============================================
// Types
// ============================================

export type LLMProvider = "local" | "mock" | "ollama" | "auto";

export interface LLMConfig {
  /** Active provider: local, mock, or auto (auto-detect) */
  provider: LLMProvider;
  /** Base URL for local llama-server */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Health check timeout (shorter) */
  healthTimeoutMs: number;
  /** Context window size */
  contextSize: number;
  /** Number of GPU layers (0 = CPU only) */
  nGpuLayers: number;
  /** Model path for auto-start */
  modelPath: string | null;
  /** Auto-start llama-server in development */
  autoStart: boolean;
  /** Maximum retries for health check */
  healthRetries: number;
  /** Delay between health retries (ms) */
  healthRetryDelayMs: number;
}

// ============================================
// Environment Variables
// ============================================

function getEnvProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  if (provider === "local" || provider === "mock" || provider === "ollama") {
    return provider;
  }
  return "auto"; // Default: auto-detect
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]?.toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return defaultValue;
}

function getEnvString(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.trim();
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: getEnvProvider(),
  baseUrl: process.env.LLAMA_SERVER_URL || "http://127.0.0.1:8080",
  timeoutMs: getEnvNumber("LLM_TIMEOUT_MS", 120000),
  healthTimeoutMs: getEnvNumber("LLM_HEALTH_TIMEOUT_MS", 1500),
  contextSize: getEnvNumber("LLM_CONTEXT_SIZE", 4096),
  nGpuLayers: getEnvNumber("LLM_N_GPU_LAYERS", 0),
  modelPath: process.env.LLM_MODEL_PATH || null,
  autoStart: getEnvBoolean("AUTO_START_LLM", false),
  healthRetries: getEnvNumber("LLM_HEALTH_RETRIES", 3),
  healthRetryDelayMs: getEnvNumber("LLM_HEALTH_RETRY_DELAY_MS", 1000),
};

// ============================================
// Config Accessor
// ============================================

let currentConfig: LLMConfig = { ...DEFAULT_LLM_CONFIG };

/**
 * Get current LLM configuration
 */
export function getLLMConfig(): Readonly<LLMConfig> {
  return currentConfig;
}

/**
 * Update LLM configuration (partial update)
 */
export function updateLLMConfig(updates: Partial<LLMConfig>): void {
  currentConfig = { ...currentConfig, ...updates };
}

/**
 * Reset to default configuration
 */
export function resetLLMConfig(): void {
  currentConfig = { ...DEFAULT_LLM_CONFIG };
}

/**
 * Get the base URL for LLM API
 */
export function getLLMBaseUrl(): string {
  return currentConfig.baseUrl;
}

// ============================================
// Logging
// ============================================

export function logLLMConfig(): void {
  console.log("[LLM Config]", {
    provider: currentConfig.provider,
    baseUrl: currentConfig.baseUrl,
    timeoutMs: currentConfig.timeoutMs,
    contextSize: currentConfig.contextSize,
    nGpuLayers: currentConfig.nGpuLayers,
    autoStart: currentConfig.autoStart,
  });
}
