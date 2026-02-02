/**
 * Zyphon LLM Provider
 * ===================
 * Secure remote provider that connects to Zyphon's hosted educator models.
 */

import { getZyphonConfig } from "../config";
import type { LLMMessage, LLMCompletionResult, LLMProvider } from "../types";

interface ZyphonChatChoice {
  message?: { role?: string; content?: string };
  finish_reason?: string;
}

interface ZyphonUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface ZyphonErrorBody {
  message?: string;
  code?: string;
  type?: string;
}

interface ZyphonChatResponse {
  choices?: ZyphonChatChoice[];
  usage?: ZyphonUsage;
  error?: ZyphonErrorBody;
}

export class ZyphonLLMProvider implements LLMProvider {
  readonly name = "zyphon" as const;

  get isAvailable(): boolean {
    const { apiKey } = getZyphonConfig();
    return Boolean(apiKey);
  }

  private buildUrl(path: string): string {
    const { baseUrl } = getZyphonConfig();
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedBase}${path}`;
  }

  async chatCompletion(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMCompletionResult> {
    const zyphonConfig = getZyphonConfig();
    const startTime = Date.now();

    if (!zyphonConfig.apiKey) {
      return {
        ok: false,
        provider: "zyphon",
        error: "Zyphon API key not configured",
        errorCode: "AUTH_REQUIRED",
        durationMs: Date.now() - startTime,
      };
    }

    const body = {
      model: zyphonConfig.model,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), zyphonConfig.timeoutMs);

    try {
      const response = await fetch(this.buildUrl("/chat/completions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${zyphonConfig.apiKey}`,
          ...(zyphonConfig.organizationId
            ? { "X-Organization-Id": zyphonConfig.organizationId }
            : {}),
          "User-Agent": "Tibyan-AI-Agent/1.0",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      const payload = (await response.json().catch(() => null)) as ZyphonChatResponse | null;

      if (!response.ok) {
        const errorMessage =
          payload?.error?.message ||
          `Zyphon API error: ${response.status}`;

        return {
          ok: false,
          provider: "zyphon",
          error: errorMessage,
          errorCode: payload?.error?.code || String(response.status),
          durationMs,
        };
      }

      if (!payload?.choices?.length) {
        return {
          ok: false,
          provider: "zyphon",
          error: "Zyphon response missing choices",
          errorCode: "INVALID_RESPONSE",
          durationMs,
        };
      }

      const content = payload.choices[0]?.message?.content?.trim() ?? "";

      return {
        ok: true,
        provider: "zyphon",
        content,
        usage: {
          promptTokens: payload.usage?.prompt_tokens ?? 0,
          completionTokens: payload.usage?.completion_tokens ?? 0,
          totalTokens: payload.usage?.total_tokens ?? 0,
        },
        durationMs,
        cached: false,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (error instanceof Error && error.name === "AbortError") {
        return {
          ok: false,
          provider: "zyphon",
          error: `Zyphon request timed out after ${zyphonConfig.timeoutMs}ms`,
          errorCode: "TIMEOUT",
          durationMs,
        };
      }

      return {
        ok: false,
        provider: "zyphon",
        error: error instanceof Error ? error.message : "Unknown Zyphon error",
        errorCode: "UNKNOWN_ERROR",
        durationMs,
      };
    }
  }
}

export const zyphonProvider = new ZyphonLLMProvider();
