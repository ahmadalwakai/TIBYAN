import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getLLMStatus, chatCompletion } from "@/lib/llm/client";
import type { LLMMessage } from "@/lib/llm/types";
import { searchKnowledgeBase, buildSystemPrompt } from "@/lib/ai/kb";
import {
  decodeUserData,
  type CookieUserData,
} from "@/lib/auth/cookie-encoding";
import {
  policy,
  prompts,
  telemetry,
  audit,
  responseCache,
  AgentError,
  AgentErrorCode,
  wrapError,
  isAgentError,
  createInvalidInputError,
  createRateLimitedError,
  createSafetyBlockedError,
  // Identity Lock (HIGHEST PRIORITY)
  identityGuard,
  isIdentityOverrideAttempt,
  // Input Size Limits
  validateInputSize,
  MAX_INPUT_CHARACTERS,
  generateRequestId,
} from "@/lib/ai-agent";

// Health check endpoint
export async function GET(request: NextRequest) {
    try {
      const user = await getUserFromCookie();
      const isAdmin = isAdminUser(user);
      const llmStatus = await getLLMStatus();
      const totals = telemetry.getTotals();

      interface HealthResponseData {
        status: string;
        provider: string;
        configuredProvider: string;
        localAvailable: boolean;
        zyphonAvailable: boolean;
        version: string;
        stats: {
          totalRequests: number;
          totalErrors: number;
          cacheHits: number;
        };
        message?: string;
      }

      const isFallback =
        llmStatus.configuredProvider === "auto" &&
        llmStatus.effectiveProvider !== "local";

      const responseData: HealthResponseData = {
        status: isFallback ? "fallback" : "connected",
        provider: llmStatus.effectiveProvider,
        configuredProvider: llmStatus.configuredProvider,
        localAvailable: llmStatus.localAvailable,
        zyphonAvailable: llmStatus.zyphonAvailable,
        version: "2.1.0",
        stats: {
          totalRequests: totals.requests,
          totalErrors: totals.errors,
          cacheHits: totals.cacheHits,
        },
      };

      if (isAdmin) {
        if (isFallback) {
          responseData.message = `llama-server غير متاح - يستخدم المزود البديل ${llmStatus.effectiveProvider}`;
        } else if (!llmStatus.localAvailable && llmStatus.configuredProvider === "local") {
          responseData.message = "llama-server غير متاح - يرجى التحقق من الخادم المحلي";
        }
      }

      return NextResponse.json({ ok: true, data: responseData });
    } catch (error) {
      console.error("[AI Agent] Health check error:", error);

      return NextResponse.json({
        ok: true,
        data: {
          status: "fallback",
          provider: "mock",
          configuredProvider: "auto",
          localAvailable: false,
          zyphonAvailable: false,
          version: "2.1.0",
          stats: {
            totalRequests: 0,
            totalErrors: 0,
            cacheHits: 0,
          },
          message: "llama-server غير متاح - يستخدم المزود البديل",
        },
      });
    }
}

// Determine if user has admin/debug privileges
function isAdminUser(user: CookieUserData | null): boolean {
  return user?.role === "ADMIN";
}

// Check if message is a simple greeting
function isGreetingMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Common greetings in English and Arabic
  const greetings = [
    "hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening",
    "مرحبا", "أهلا", "السلام عليكم", "صباح الخير", "مساء الخير", "هاي"
  ];
  
  // Check for exact matches or very short messages that are likely greetings
  return greetings.some(greeting => lowerMessage.includes(greeting)) || lowerMessage.length <= 10;
}

// Agent request schema
const AgentRequestSchema = z.object({
  message: z.string(),
  sessionId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

type AgentRequest = z.infer<typeof AgentRequestSchema>;

// Get user data from cookie
async function getUserFromCookie(): Promise<CookieUserData | null> {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user-data");
    if (!userDataCookie?.value) return null;
    return decodeUserData(userDataCookie.value);
  } catch {
    return null;
  }
}

// Generate a unique session ID
function generateSessionId(userId?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  const userPart = userId ? `_${userId.slice(0, 8)}` : '';
  return `session_${timestamp}_${random}${userPart}`;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Get user from cookie
  const user = await getUserFromCookie();
  const userId = user?.id;
  const userRole = user?.role;
  const locale =
    request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ??
    "ar";

  return NextResponse.json({ ok: true, data: { reply: "AI Agent is under development" } });
}

