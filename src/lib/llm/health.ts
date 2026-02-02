/**
 * LLM Health Check
 * ================
 * Checks if the local llama-server is available and responsive.
 */

import { getLLMConfig } from "./config";

// ============================================
// Types
// ============================================

export interface HealthCheckResult {
  /** Whether the LLM server is available */
  available: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Error message if not available */
  error: string | null;
  /** Detailed error code */
  errorCode: "OK" | "TIMEOUT" | "CONNECTION_REFUSED" | "UNKNOWN_ERROR";
  /** Server info if available */
  serverInfo?: {
    status?: string;
    model?: string;
  };
}

// ============================================
// Health Check Cache
// ============================================

interface CachedHealth {
  result: HealthCheckResult;
  timestamp: number;
}

let cachedHealth: CachedHealth | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds

function isCacheValid(): boolean {
  if (!cachedHealth) return false;
  return Date.now() - cachedHealth.timestamp < CACHE_TTL_MS;
}

/**
 * Clear health cache (useful for testing or forcing re-check)
 */
export function clearHealthCache(): void {
  cachedHealth = null;
}

// ============================================
// Health Check Implementation
// ============================================

/**
 * Check if the local LLM server is healthy.
 * Returns cached result if recent (within 5s).
 * 
 * @param forceRefresh - Force a new health check, ignoring cache
 */
export async function checkLLMHealth(forceRefresh = false): Promise<HealthCheckResult> {
  // Return cached result if valid
  if (!forceRefresh && isCacheValid() && cachedHealth) {
    return cachedHealth.result;
  }

  const config = getLLMConfig();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.healthTimeoutMs);

    const response = await fetch(`${config.baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (response.ok) {
      let serverInfo: HealthCheckResult["serverInfo"];
      
      try {
        const data = await response.json();
        serverInfo = {
          status: data.status,
          model: data.model_loaded || data.model,
        };
      } catch {
        // Ignore JSON parse errors
      }

      const result: HealthCheckResult = {
        available: true,
        responseTimeMs,
        error: null,
        errorCode: "OK",
        serverInfo,
      };

      cachedHealth = { result, timestamp: Date.now() };
      console.log(`[LLM Health] ✓ Server available (${responseTimeMs}ms)`);
      return result;
    }

    // Server responded but with error status
    const result: HealthCheckResult = {
      available: false,
      responseTimeMs,
      error: `Server returned status ${response.status}`,
      errorCode: "UNKNOWN_ERROR",
    };

    cachedHealth = { result, timestamp: Date.now() };
    console.warn(`[LLM Health] ✗ Server error: ${response.status}`);
    return result;

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    let errorCode: HealthCheckResult["errorCode"] = "UNKNOWN_ERROR";
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorCode = "TIMEOUT";
        errorMessage = `Health check timed out after ${config.healthTimeoutMs}ms`;
      } else if (
        error.message.includes("ECONNREFUSED") ||
        error.cause?.toString().includes("ECONNREFUSED")
      ) {
        errorCode = "CONNECTION_REFUSED";
        errorMessage = `Cannot connect to ${config.baseUrl} - server not running`;
      } else {
        errorMessage = error.message;
      }
    }

    const result: HealthCheckResult = {
      available: false,
      responseTimeMs,
      error: errorMessage,
      errorCode,
    };

    cachedHealth = { result, timestamp: Date.now() };
    
    // Log with actionable message
    console.warn(`[LLM Health] ✗ ${errorMessage}`);
    if (errorCode === "CONNECTION_REFUSED") {
      console.warn("[LLM Health] → To fix: Start llama-server or set LLM_PROVIDER=mock");
    }

    return result;
  }
}

/**
 * Wait for LLM server to become healthy (with retries)
 */
export async function waitForLLMHealth(maxRetries?: number): Promise<HealthCheckResult> {
  const config = getLLMConfig();
  const retries = maxRetries ?? config.healthRetries;
  
  for (let i = 0; i < retries; i++) {
    const result = await checkLLMHealth(true);
    
    if (result.available) {
      return result;
    }

    if (i < retries - 1) {
      console.log(`[LLM Health] Retry ${i + 1}/${retries} in ${config.healthRetryDelayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, config.healthRetryDelayMs));
    }
  }

  // Final check
  return checkLLMHealth(true);
}

/**
 * Quick check if LLM is available (uses cache)
 */
export async function isLLMAvailable(): Promise<boolean> {
  const result = await checkLLMHealth();
  return result.available;
}
