/**
 * LLM Configuration
 * =================
 * Centralized configuration for LLM providers.
 * Supports: local (llama-server) and mock (no-key development mode).
 */

// ============================================
// Types
// ============================================

export type LLMProvider = "local" | "mock" | "zyphon" | "auto";

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
  /** Remote Zyphon base URL */
  zyphonBaseUrl: string;
  /** Remote Zyphon default model id */
  zyphonModel: string;
  /** Zyphon request timeout */
  zyphonTimeoutMs: number;
  /** Optional Zyphon organization id */
  zyphonOrganization: string | null;
}

// ============================================
// Environment Variables
// ============================================

function getEnvProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  if (provider === "local" || provider === "mock" || provider === "zyphon") {
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
  baseUrl: process.env.LLAMA_SERVER_URL || "http://127.0.0.1:8080", // Dev note: If using port 3001, kill duplicate Next.js process on 3000
  timeoutMs: getEnvNumber("LLM_TIMEOUT_MS", 60000),
  healthTimeoutMs: getEnvNumber("LLM_HEALTH_TIMEOUT_MS", 1500),
  contextSize: getEnvNumber("LLM_CONTEXT_SIZE", 2048),
  nGpuLayers: getEnvNumber("LLM_N_GPU_LAYERS", 0),
  modelPath: process.env.LLM_MODEL_PATH || null,
  autoStart: getEnvBoolean("AUTO_START_LLM", false),
  healthRetries: getEnvNumber("LLM_HEALTH_RETRIES", 3),
  healthRetryDelayMs: getEnvNumber("LLM_HEALTH_RETRY_DELAY_MS", 1000),
  zyphonBaseUrl: getEnvString("ZYPHON_API_BASE_URL", "https://api.zyphon.ai/v1"),
  zyphonModel: getEnvString("ZYPHON_MODEL_ID", "zyphon-educator"),
  zyphonTimeoutMs: getEnvNumber("ZYPHON_TIMEOUT_MS", 60000),
  zyphonOrganization: process.env.ZYPHON_ORG_ID?.trim() ?? null,
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
    zyphonBaseUrl: currentConfig.zyphonBaseUrl,
    zyphonModel: currentConfig.zyphonModel,
    zyphonConfigured: Boolean(process.env.ZYPHON_API_KEY),
  });
}

export interface ZyphonConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  organizationId: string | null;
  apiKey: string | null;
}

export function getZyphonConfig(): ZyphonConfig {
  const config = getLLMConfig();
  return {
    baseUrl: config.zyphonBaseUrl,
    model: config.zyphonModel,
    timeoutMs: config.zyphonTimeoutMs,
    organizationId: config.zyphonOrganization,
    apiKey: process.env.ZYPHON_API_KEY?.trim() ?? null,
  };
}
