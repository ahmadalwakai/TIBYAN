/**
 * Groq Client - Single Source of Truth for AI
 * 
 * Direct integration with Groq API for LLM inference.
 * PRODUCTION: Fails loudly if GROQ_API_KEY is missing.
 */

import { z } from "zod";

// ============================================
// Types
// ============================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqChoice {
  index: number;
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: string;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================
// Configuration
// ============================================

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

// ============================================
// Validation Schemas
// ============================================

const GroqResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.literal("assistant"),
        content: z.string(),
      }),
      finish_reason: z.string(),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

// ============================================
// API Key Validation
// ============================================

function getApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY environment variable. " +
      "Set it in your .env file or Vercel environment settings. " +
      "Get a key at https://console.groq.com"
    );
  }
  return apiKey;
}

// ============================================
// Chat Completion
// ============================================

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Send a chat completion request to Groq.
 * Returns only the assistant's text response.
 * 
 * @param messages Array of chat messages
 * @param options Optional configuration
 * @returns Assistant's response text
 * @throws Error if GROQ_API_KEY is missing or API call fails
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Groq API error (${response.status}): ${errorText}`
    );
  }

  const rawData: unknown = await response.json();
  
  // Validate response structure
  const parseResult = GroqResponseSchema.safeParse(rawData);
  if (!parseResult.success) {
    throw new Error(
      `Invalid Groq API response: ${parseResult.error.message}`
    );
  }

  const data: GroqResponse = parseResult.data;
  const assistantMessage = data.choices[0]?.message?.content;

  if (!assistantMessage) {
    throw new Error("Groq API returned empty response");
  }

  return assistantMessage;
}

// ============================================
// Health Check
// ============================================

export interface GroqStatus {
  configured: boolean;
  model: string;
}

/**
 * Check if Groq is configured (API key present).
 * Does NOT make an API call.
 */
export function getGroqStatus(): GroqStatus {
  return {
    configured: !!process.env.GROQ_API_KEY,
    model: DEFAULT_MODEL,
  };
}
