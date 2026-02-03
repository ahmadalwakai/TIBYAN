/**
 * Local LLM Provider
 * ==================
 * Connects to local llama-server for LLM inference.
 * No external API keys required.
 */

import { getLLMConfig } from "../config";
import { checkLLMHealth } from "../health";
import type { LLMMessage, LLMCompletionResult, LLMProvider } from "../types";

// ============================================
// Types
// ============================================

interface LlamaCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface LlamaCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

// ============================================
// Local Provider Implementation
// ============================================

export class LocalLLMProvider implements LLMProvider {
  readonly name = "local" as const;
  
  private cachedAvailability: boolean | null = null;

  /**
   * Check if local LLM is available
   */
  async checkAvailability(): Promise<boolean> {
    const health = await checkLLMHealth();
    this.cachedAvailability = health.available;
    return health.available;
  }

  get isAvailable(): boolean {
    return this.cachedAvailability ?? false;
  }

  /**
   * Generate a chat completion using local llama-server
   */
  async chatCompletion(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMCompletionResult> {
    const config = getLLMConfig();
    const startTime = Date.now();

    try {
      // Check availability first
      const health = await checkLLMHealth();
      if (!health.available) {
        return {
          ok: false,
          provider: "local",
          error: health.error || "LLM server unavailable",
          errorCode: health.errorCode === "CONNECTION_REFUSED" 
            ? "LLM_UNAVAILABLE" 
            : "LLM_ERROR",
          durationMs: Date.now() - startTime,
        };
      }

      const requestBody: LlamaCompletionRequest = {
        model: "local",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 256,
        stream: false,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      console.log(`[Local LLM] Sending request to ${config.baseUrl}/v1/chat/completions`);

      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`[Local LLM] API error ${response.status}: ${errorText}`);
        
        return {
          ok: false,
          provider: "local",
          error: `LLM API error: ${response.status}`,
          errorCode: "LLM_ERROR",
          durationMs,
        };
      }

      const data = (await response.json()) as LlamaCompletionResponse;

      if (data.error) {
        return {
          ok: false,
          provider: "local",
          error: data.error,
          errorCode: "LLM_ERROR",
          durationMs,
        };
      }

      const content = data.choices?.[0]?.message?.content || "";

      console.log(`[Local LLM] ✓ Response received (${durationMs}ms, ${content.length} chars)`);

      return {
        ok: true,
        provider: "local",
        content,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        durationMs,
        cached: false,
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      let errorMessage = "Unknown error";
      let errorCode = "LLM_ERROR";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = `Request timed out after ${config.timeoutMs}ms (${durationMs}ms elapsed, provider: local)`;
          errorCode = "LLM_TIMEOUT";
        } else if (
          error.message.includes("ECONNREFUSED") ||
          (error.cause as Error)?.message?.includes("ECONNREFUSED")
        ) {
          errorMessage = "Cannot connect to LLM server";
          errorCode = "LLM_UNAVAILABLE";
        } else {
          errorMessage = error.message;
        }
      }

      console.error(`[Local LLM] ✗ Error: ${errorMessage}`);

      return {
        ok: false,
        provider: "local",
        error: errorMessage,
        errorCode,
        durationMs,
      };
    }
  }

  /**
   * Stream completion from local LLM (async generator)
   */
  async *streamCompletion(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
  ): AsyncGenerator<{ ok: boolean; delta?: string; error?: string; done?: boolean }> {
    const config = getLLMConfig();
    const startTime = Date.now();

    try {
      const requestBody: LlamaCompletionRequest = {
        model: "local",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 256,
        stream: true,
      };

      if (process.env.NODE_ENV === "development") {
        console.log(`[Local LLM] Starting SSE stream to ${config.baseUrl}/v1/chat/completions`);
      }

      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: options?.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`[Local LLM] Stream error ${response.status}: ${errorText}`);
        yield {
          ok: false,
          error: `LLM API error: ${response.status}`,
        };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { ok: false, error: "No response stream" };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let deltaCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines only
        const lines = buffer.split("\n");
        // Keep incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          
          // Skip empty lines
          if (!trimmed) continue;
          
          // Handle [DONE] marker
          if (trimmed === "data: [DONE]") {
            if (process.env.NODE_ENV === "development") {
              console.log(`[Local LLM] Received [DONE] marker after ${deltaCount} deltas`);
            }
            continue;
          }

          // Only process data: lines
          if (trimmed.startsWith("data: ")) {
            try {
              const jsonStr = trimmed.slice(6).trim();
              
              // Skip if empty or just "[DONE]"
              if (!jsonStr || jsonStr === "[DONE]") continue;
              
              const data = JSON.parse(jsonStr);
              
              // Extract delta content
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                deltaCount++;
                yield { ok: true, delta };
              }

              // Check for completion
              if (data.choices?.[0]?.finish_reason) {
                yield { ok: true, done: true };
                break;
              }
            } catch (err) {
              // Log parse errors in dev only
              if (process.env.NODE_ENV === "development") {
                console.error("[Local LLM] Failed to parse SSE line:", trimmed.slice(0, 100));
              }
              // Continue processing other lines
            }
          }
          // Ignore non-data lines (event:, id:, etc.)
        }
      }

      const durationMs = Date.now() - startTime;
      if (process.env.NODE_ENV === "development") {
        console.log(`[Local LLM] ✓ Stream completed: ${deltaCount} deltas in ${durationMs}ms`);
      }

    } catch (error) {
      const durationMs = Date.now() - startTime;
      let errorMessage = "Unknown error";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = `Request aborted after ${durationMs}ms`;
          if (process.env.NODE_ENV === "development") {
            console.log(`[Local LLM] ⊗ Stream aborted by client (${durationMs}ms)`);
          }
        } else {
          errorMessage = error.message;
        }
      }

      if (process.env.NODE_ENV !== "development" || error instanceof Error && error.name !== "AbortError") {
        console.error(`[Local LLM] ✗ Stream error: ${errorMessage}`);
      }
      yield {
        ok: false,
        error: errorMessage,
      };
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const localProvider = new LocalLLMProvider();
