/**
 * Ollama LLM Provider
 * ===================
 * Connects to local Ollama server for LLM inference.
 */

import { getLLMConfig } from "../config";
import type { LLMMessage, LLMCompletionResult, LLMProvider } from "../types";

// ============================================
// Types
// ============================================

interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

// ============================================
// Ollama Provider Implementation
// ============================================

export class OllamaLLMProvider implements LLMProvider {
  readonly name = "ollama" as const;
  
  private cachedAvailability: boolean | null = null;

  /**
   * Check if Ollama is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.cachedAvailability = response.ok;
      return response.ok;
    } catch {
      this.cachedAvailability = false;
      return false;
    }
  }

  get isAvailable(): boolean {
    return this.cachedAvailability ?? false;
  }

  /**
   * Generate a chat completion using Ollama
   */
  async chatCompletion(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMCompletionResult> {
    const config = getLLMConfig();
    const startTime = Date.now();
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const model = process.env.OLLAMA_MODEL || "llama3.1:70b";

    try {
      // Check availability first
      const available = await this.checkAvailability();
      if (!available) {
        return {
          ok: false,
          provider: "ollama",
          error: "Ollama server unavailable",
          errorCode: "LLM_UNAVAILABLE",
          durationMs: Date.now() - startTime,
        };
      }

      const requestBody: OllamaChatRequest = {
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
      };

      if (options?.temperature !== undefined) {
        requestBody.options = { temperature: options.temperature };
      }

      if (options?.maxTokens !== undefined) {
        requestBody.options = {
          ...requestBody.options,
          num_predict: options.maxTokens,
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      console.log(`[Ollama] Sending request to ${baseUrl}/api/chat with model ${model}`);

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          ok: false,
          provider: "ollama",
          error: `Ollama API error: ${response.status} ${errorText}`,
          errorCode: "LLM_API_ERROR",
          durationMs: Date.now() - startTime,
        };
      }

      const data: OllamaChatResponse = await response.json();

      if (!data.message?.content) {
        return {
          ok: false,
          provider: "ollama",
          error: "No content in response",
          errorCode: "LLM_INVALID_RESPONSE",
          durationMs: Date.now() - startTime,
        };
      }

      return {
        ok: true,
        provider: "ollama",
        content: data.message.content,
        usage: data.prompt_eval_count && data.eval_count ? {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: data.prompt_eval_count + data.eval_count,
        } : undefined,
        durationMs: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        ok: false,
        provider: "ollama",
        error: `Ollama request failed: ${errorMessage}`,
        errorCode: errorMessage.includes("aborted") ? "LLM_TIMEOUT" : "LLM_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const ollamaProvider = new OllamaLLMProvider();
