/**
 * AI Chat API Route
 * 
 * Single endpoint for AI chat completions using Groq.
 * POST /api/ai
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion, getGroqStatus, type ChatMessage } from "@/lib/groqClient";

// Force Node.js runtime (required for server-side env vars)
export const runtime = "nodejs";

// ============================================
// Request Validation
// ============================================

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(32000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  model: z.string().optional(),
  maxTokens: z.number().min(50).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ============================================
// Response Types
// ============================================

interface SuccessResponse {
  ok: true;
  reply: string;
}

interface ErrorResponse {
  ok: false;
  error: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

// ============================================
// GET - Health Check
// ============================================

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const status = getGroqStatus();
  
  if (!status.configured) {
    return NextResponse.json(
      { ok: false, error: "GROQ_API_KEY not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    reply: `AI service online. Model: ${status.model}`,
  });
}

// ============================================
// POST - Chat Completion
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  // 1. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // 2. Validate request
  const parseResult = ChatRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return NextResponse.json(
      { ok: false, error: `Validation error: ${issues}` },
      { status: 400 }
    );
  }

  const { messages, model, maxTokens, temperature }: ChatRequest = parseResult.data;

  // 3. Call Groq API
  try {
    const reply = await chatCompletion(messages as ChatMessage[], {
      model,
      maxTokens,
      temperature,
    });

    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    // Log error server-side
    console.error("[AI API Error]", error);

    // Determine error message
    const message = error instanceof Error ? error.message : "Unknown error";
    
    // Check if it's a configuration error (missing API key)
    if (message.includes("Missing GROQ_API_KEY")) {
      return NextResponse.json(
        { ok: false, error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { ok: false, error: `AI request failed: ${message}` },
      { status: 500 }
    );
  }
}
