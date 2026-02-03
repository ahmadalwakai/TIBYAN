/**
 * Remote LLM Provider
 * ===================
 * Connects to external OpenAI-compatible API for production use.
 * Requires REMOTE_LLM_BASE_URL and REMOTE_LLM_API_KEY environment variables.
 */

import type { LLMMessage, LLMCompletionResult, LLMProvider, LLMProviderName } from "../types";

// ============================================
// Configuration
// ============================================

interface RemoteConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

function getRemoteConfig(): RemoteConfig | null {
  const baseUrl = process.env.REMOTE_LLM_BASE_URL;
  const apiKey = process.env.REMOTE_LLM_API_KEY;
  
  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""), // Remove trailing slash
    apiKey,
    model: process.env.REMOTE_LLM_MODEL || "gpt-4o-mini",
    timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || "30000", 10),
  };
}

// ============================================
// Types
// ============================================

interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id?: string;
  choices?: Array<{
    message?: { content?: string; role?: string };
    finish_reason?: string;
    index?: number;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

// ============================================
// Remote Provider Implementation
// ============================================

export class RemoteLLMProvider implements LLMProvider {
  readonly name: LLMProviderName = "remote" as LLMProviderName;
  
  private config: RemoteConfig | null = null;
  private cachedAvailability: boolean | null = null;

  constructor() {
    this.config = getRemoteConfig();
  }

  /**
   * Check if remote LLM is configured
   */
  async checkAvailability(): Promise<boolean> {
    this.config = getRemoteConfig();
    
    if (!this.config) {
      console.warn("[Remote LLM] Not configured: missing REMOTE_LLM_BASE_URL or REMOTE_LLM_API_KEY");
      this.cachedAvailability = false;
      return false;
    }

    // Optionally verify with a minimal health check
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.cachedAvailability = response.ok;
      return response.ok;
    } catch (error) {
      // Some providers don't support /models endpoint, assume available if configured
      console.log("[Remote LLM] Health check failed (may still work):", error);
      this.cachedAvailability = true;
      return true;
    }
  }

  get isAvailable(): boolean {
    return this.cachedAvailability ?? false;
  }

  /**
   * Generate a chat completion using remote API
   */
  async chatCompletion(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMCompletionResult> {
    const startTime = Date.now();
    this.config = getRemoteConfig();

    if (!this.config) {
      return {
        ok: false,
        provider: "remote" as LLMProviderName,
        error: "Remote LLM not configured. Set REMOTE_LLM_BASE_URL and REMOTE_LLM_API_KEY.",
        errorCode: "LLM_NOT_CONFIGURED",
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const requestBody: ChatCompletionRequest = {
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
        stream: false,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      console.log(`[Remote LLM] Sending request to ${this.config.baseUrl}/chat/completions`);

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`[Remote LLM] API error ${response.status}:`, errorText);
        
        return {
          ok: false,
          provider: "remote" as LLMProviderName,
          error: `Remote LLM API error: ${response.status}`,
          errorCode: response.status === 401 ? "LLM_AUTH_ERROR" : "LLM_API_ERROR",
          durationMs: Date.now() - startTime,
        };
      }

      const data = (await response.json()) as ChatCompletionResponse;

      if (data.error) {
        return {
          ok: false,
          provider: "remote" as LLMProviderName,
          error: data.error.message || "Unknown API error",
          errorCode: "LLM_API_ERROR",
          durationMs: Date.now() - startTime,
        };
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return {
          ok: false,
          provider: "remote" as LLMProviderName,
          error: "No content in response",
          errorCode: "LLM_EMPTY_RESPONSE",
          durationMs: Date.now() - startTime,
        };
      }

      return {
        ok: true,
        provider: "remote" as LLMProviderName,
        content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
          totalTokens: data.usage.total_tokens ?? 0,
        } : undefined,
        durationMs: Date.now() - startTime,
      };

    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      
      console.error("[Remote LLM] Request failed:", error);

      return {
        ok: false,
        provider: "remote" as LLMProviderName,
        error: isAbort 
          ? `Request timed out after ${this.config.timeoutMs}ms` 
          : (error instanceof Error ? error.message : "Unknown error"),
        errorCode: isAbort ? "LLM_TIMEOUT" : "LLM_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Stream completion using remote API
   */
  async *streamCompletion(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      signal?: AbortSignal;
    }
  ): AsyncGenerator<{ ok: boolean; delta?: string; error?: string; done?: boolean }> {
    this.config = getRemoteConfig();

    if (!this.config) {
      yield { ok: false, error: "Remote LLM not configured" };
      return;
    }

    try {
      const requestBody: ChatCompletionRequest = {
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
        stream: true,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      // Combine with external signal if provided
      if (options?.signal) {
        options.signal.addEventListener("abort", () => controller.abort());
      }

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        yield { ok: false, error: `Remote LLM API error: ${response.status}` };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { ok: false, error: "No response body" };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              yield { ok: true, delta };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      yield { ok: true, done: true };

    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      yield { 
        ok: false, 
        error: isAbort ? "Request aborted" : (error instanceof Error ? error.message : "Unknown error") 
      };
    }
  }
}

// Singleton instance
export const remoteProvider = new RemoteLLMProvider();
