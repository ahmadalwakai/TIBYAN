/**
 * LLM Configuration
 * =================
 * Centralized configuration for Groq API.
 * Supports: remote (Groq) and mock providers only.
 */

// ============================================
// Types
// ============================================

export type LLMProvider = "mock" | "remote" | "auto";

export interface LLMConfig {
  /** Active provider: remote (Groq), mock, or auto */
  provider: LLMProvider;
  /** Request timeout in milliseconds */
  timeoutMs: number;
}

// ============================================
// Environment Variables
// ============================================

function getEnvProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  if (provider === "mock" || provider === "remote") {
    return provider;
  }
  return "auto"; // Default: auto-detect (Groq if key exists, else mock)
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: getEnvProvider(),
  timeoutMs: getEnvNumber("LLM_TIMEOUT_MS", 120000),
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

// ============================================
// Logging
// ============================================

export function logLLMConfig(): void {
  console.log("[LLM Config]", {
    provider: currentConfig.provider,
    timeoutMs: currentConfig.timeoutMs,
    groqConfigured: !!process.env.GROQ_API_KEY,
  });
}
