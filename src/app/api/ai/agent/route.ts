import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getLLMStatus, chatCompletion, chatCompletionStream } from "@/lib/llm/client";

// Force Node.js runtime (uses cookies, streaming)
export const runtime = "nodejs";
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
  // Language Guard (Prevents CJK/Chinese responses)
  languageGuard,
  detectLanguage,
  containsCJK,
  sanitizeHistory,
  determineSessionLanguage,
  generateLanguageGuardMessage,
  filterStreamChunk,
  getLanguageFallbackMessage,
  generateLanguageDebugInfo,
  logLanguageDebug,
  type AllowedLanguage,
} from "@/lib/ai-agent";

// Health check endpoint
export async function GET(request: NextRequest) {
    try {
      const user = await getUserFromCookie();
      const isAdmin = isAdminUser(user);
      const totals = telemetry.getTotals();

      // Public response (no infrastructure details)
      interface PublicHealthResponse {
        status: string;
        version: string;
        stats: {
          totalRequests: number;
          totalErrors: number;
          cacheHits: number;
        };
      }

      const publicResponse: PublicHealthResponse = {
        status: "online",
        version: "2.1.0",
        stats: {
          totalRequests: totals.requests,
          totalErrors: totals.errors,
          cacheHits: totals.cacheHits,
        },
      };

      // Admin-only: include debug info
      if (isAdmin && process.env.DEBUG_AI === "true") {
        const llmStatus = await getLLMStatus();
        const isFallback =
          llmStatus.configuredProvider === "auto" &&
          llmStatus.effectiveProvider === "mock";

        return NextResponse.json({
          ok: true,
          data: {
            ...publicResponse,
            debug: {
              provider: llmStatus.effectiveProvider,
              configuredProvider: llmStatus.configuredProvider,
              groqAvailable: llmStatus.groqAvailable,
              isFallback,
              message: isFallback
                ? "GROQ_API_KEY not set - using mock responses"
                : !llmStatus.groqAvailable && llmStatus.configuredProvider === "remote"
                ? "Groq API not configured - set GROQ_API_KEY"
                : undefined,
            },
          },
        });
      }

      return NextResponse.json({ ok: true, data: publicResponse });
    } catch (error) {
      console.error("[AI Agent] Health check error:", error);

      return NextResponse.json({
        ok: true,
        data: {
          status: "online",
          version: "2.1.0",
          stats: {
            totalRequests: 0,
            totalErrors: 0,
            cacheHits: 0,
          },
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

// Agent request schema - preferences for user customization
const PreferencesSchema = z.object({
  customInstructions: z.string().max(800).optional(),
  displayName: z.string().max(50).optional(),
  role: z.string().max(20).optional(),
  level: z.string().max(20).optional(),
  goals: z.string().max(300).optional(),
  tone: z.enum(["professional", "friendly", "strict"]).optional(),
  verbosity: z.enum(["short", "balanced", "detailed"]).optional(),
  format: z.enum(["paragraphs", "bullets", "step_by_step"]).optional(),
  languageMode: z.enum(["auto", "locked_ar", "locked_en"]).optional(),
  strictNoThirdLanguage: z.boolean().optional(),
}).optional();

// Agent request schema
const AgentRequestSchema = z.object({
  message: z.string(),
  sessionId: z.string().optional(),
  stream: z.boolean().optional().default(false),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
  preferences: PreferencesSchema,
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

  try {
    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body",
          errorCode: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    const parsed = AgentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request format",
          errorCode: "INVALID_INPUT",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { message, sessionId, history = [], stream = false, preferences } = parsed.data;

    // Check if streaming is enabled
    const streamingEnabled = process.env.LLM_STREAMING_ENABLED === "true" && stream;

    // Input size validation
    const sizeCheck = validateInputSize(message);
    if (!sizeCheck.isValid) {
      return NextResponse.json(
        {
          ok: false,
          error: `Input too large: ${sizeCheck.characterCount}/${sizeCheck.limit} characters`,
          errorCode: "INPUT_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    // Identity lock check (HIGHEST PRIORITY)
    const identityCheck = identityGuard(message);
    if (identityCheck.intercepted) {
      return NextResponse.json({
        ok: true,
        data: {
          reply: identityCheck.response || "Security policy enforced",
          provider: "identity-lock",
          sessionId: sessionId || generateSessionId(userId),
        },
      });
    }

    // Rate limit check
    const rateLimitCheck = await policy.checkRateLimit(userId || "anonymous");
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Rate limit exceeded",
          errorCode: "RATE_LIMITED",
          retryAfter: rateLimitCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Token budget management
    const MAX_RESPONSE_TOKENS = 256;
    const MAX_HISTORY_TOKENS = 900;
    const TARGET_TOTAL_TOKENS = 3000;

    // Helper: Estimate tokens (rough approximation)
    const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

    // Helper: Truncate messages to fit budget
    const truncateMessagesToBudget = (messages: Array<{ role: string; content: string }>, budgetTokens: number): Array<{ role: string; content: string }> => {
      const truncated = [];
      let currentTokens = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msgTokens = estimateTokens(messages[i].content);
        if (currentTokens + msgTokens > budgetTokens) break;
        truncated.unshift(messages[i]);
        currentTokens += msgTokens;
      }
      return truncated;
    };

    // ================================================================
    // LANGUAGE GUARD: Session Language Lock & History Sanitization
    // ================================================================
    const effectiveSessionId = sessionId || generateSessionId(userId);
    
    // Determine session language - respect user's language lock preference
    let sessionLanguage: AllowedLanguage;
    if (preferences?.languageMode === "locked_ar") {
      sessionLanguage = "ar";
    } else if (preferences?.languageMode === "locked_en") {
      sessionLanguage = "en";
    } else {
      // Auto mode: determine from message
      sessionLanguage = determineSessionLanguage(effectiveSessionId, message);
    }
    
    // Sanitize history: REMOVE any messages containing CJK characters
    const sanitizationResult = sanitizeHistory(
      history.map(h => ({ role: h.role, content: h.content }))
    );
    
    // Log sanitization in development
    if (process.env.NODE_ENV === "development" && sanitizationResult.removedCount > 0) {
      console.log(`[Language Guard] SANITIZED ${sanitizationResult.removedCount} messages with CJK content:`);
      sanitizationResult.sanitizationLog.forEach(log => console.log(`  ${log}`));
    }

    // Truncate sanitized history to fit budget
    const truncatedHistory = truncateMessagesToBudget(
      sanitizationResult.messages,
      MAX_HISTORY_TOKENS
    );
    
    // Build system prompt and estimate tokens
    const systemPrompt = buildSystemPrompt([], { isAdmin: userRole === "ADMIN" });
    const systemTokens = estimateTokens(systemPrompt);
    const userTokens = estimateTokens(message);
    const historyTokens = truncatedHistory.reduce((sum, h) => sum + estimateTokens(h.content), 0);

    // Calculate total estimated tokens
    const totalEstimatedTokens = systemTokens + historyTokens + userTokens + MAX_RESPONSE_TOKENS;

    // Log token usage in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Token Budget] System: ${systemTokens}, History: ${historyTokens}, User: ${userTokens}, Response: ${MAX_RESPONSE_TOKENS}, Total: ${totalEstimatedTokens}`);
    }

    // ================================================================
    // BUILD USER PREFERENCES BLOCK (if provided)
    // ================================================================
    let userPreferencesBlock = "";
    if (preferences) {
      const prefParts: string[] = [];
      
      if (preferences.displayName) {
        prefParts.push(`- Name: ${preferences.displayName}`);
      }
      if (preferences.role) {
        prefParts.push(`- Role: ${preferences.role}`);
      }
      if (preferences.level) {
        prefParts.push(`- Level: ${preferences.level}`);
      }
      if (preferences.goals) {
        prefParts.push(`- Goals: ${preferences.goals}`);
      }
      if (preferences.tone || preferences.verbosity || preferences.format) {
        const styleParts: string[] = [];
        if (preferences.tone) styleParts.push(`tone=${preferences.tone}`);
        if (preferences.verbosity) styleParts.push(`verbosity=${preferences.verbosity}`);
        if (preferences.format) styleParts.push(`format=${preferences.format}`);
        prefParts.push(`- Writing style: ${styleParts.join(", ")}`);
      }
      if (preferences.customInstructions) {
        prefParts.push(`- Custom instructions: ${preferences.customInstructions}`);
      }
      
      if (prefParts.length > 0) {
        userPreferencesBlock = `\n\nUser Preferences:\n${prefParts.join("\n")}`;
      }
    }

    // ================================================================
    // LANGUAGE GUARD: Inject language guard message after system prompt
    // This is regenerated PER REQUEST, not cached
    // ================================================================
    let languageGuardContent = generateLanguageGuardMessage(sessionLanguage).content;
    
    // Add strict language lock if preference is set
    if (preferences?.languageMode === "locked_ar") {
      languageGuardContent += "\n\nCRITICAL: Respond ONLY in Arabic. Even if the user writes in English, reply in Arabic.";
    } else if (preferences?.languageMode === "locked_en") {
      languageGuardContent += "\n\nCRITICAL: Respond ONLY in English. Even if the user writes in Arabic, reply in English.";
    }
    
    // Add no third language guard
    if (preferences?.strictNoThirdLanguage !== false) {
      languageGuardContent += "\n\nNEVER respond in any language other than Arabic or English. No Chinese, Japanese, Korean, or any other language.";
    }
    
    const languageGuardMsg: LLMMessage = {
      role: "system" as const,
      content: languageGuardContent,
    };

    // Build conversation history with LANGUAGE GUARD and USER PREFERENCES
    const messages: LLMMessage[] = [
      { role: "system" as const, content: systemPrompt + userPreferencesBlock },
      languageGuardMsg, // CRITICAL: Language enforcement immediately after system prompt
      ...truncatedHistory.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: message },
    ];

    // ================================================================
    // DEBUG LOGGING: Log full message payload for verification
    // ================================================================
    if (process.env.NODE_ENV === "development") {
      const debugInfo = generateLanguageDebugInfo(
        effectiveSessionId,
        message,
        history.length,
        sanitizationResult.removedCount
      );
      logLanguageDebug("AI Agent Request", debugInfo);
      
      // Log full messages array structure (without full content for brevity)
      console.log(`[AI Agent] Messages payload (${messages.length} messages):`);
      messages.forEach((msg, idx) => {
        const preview = msg.content.substring(0, 80).replace(/\n/g, " ");
        const langDetect = detectLanguage(msg.content);
        console.log(`  [${idx}] ${msg.role}: "${preview}..." | lang=${langDetect.language} ar=${langDetect.arabicRatio.toFixed(2)} cjk=${langDetect.hasCJK}`);
      });
    }

    // STREAMING MODE
    if (streamingEnabled) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[AI Agent] Starting SSE stream for session ${effectiveSessionId}, language=${sessionLanguage}`);
      }

      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Verify abort signal is propagated
            if (request.signal.aborted) {
              if (process.env.NODE_ENV === "development") {
                console.log("[AI Agent] Request already aborted before streaming");
              }
              controller.close();
              return;
            }

            const generator = chatCompletionStream(messages, {
              temperature: 0.7,
              maxTokens: MAX_RESPONSE_TOKENS,
              signal: request.signal,
            });

            let fullContent = "";
            let chunkCount = 0;
            let cjkAborted = false;

            for await (const chunk of generator) {
              // Check for abort
              if (request.signal.aborted) {
                if (process.env.NODE_ENV === "development") {
                  console.log("[AI Agent] Stream aborted by client");
                }
                controller.close();
                return;
              }

              if (chunk.ok && chunk.delta) {
                // ================================================================
                // LANGUAGE GUARD: Filter streaming output for CJK characters
                // ================================================================
                const filterResult = filterStreamChunk(chunk.delta, sessionLanguage);
                
                if (filterResult.cjkDetected) {
                  // ABORT: CJK detected in stream
                  cjkAborted = true;
                  if (process.env.NODE_ENV === "development") {
                    console.error(`[Language Guard] CJK DETECTED IN STREAM! Chunk: "${chunk.delta.substring(0, 50)}"`);
                    console.error(`[Language Guard] Full content so far: "${fullContent.substring(0, 100)}..."`);
                  }
                  
                  // Send fallback message
                  const fallbackMsg = getLanguageFallbackMessage(sessionLanguage);
                  const fallbackData = JSON.stringify({ delta: fallbackMsg });
                  controller.enqueue(encoder.encode(`data: ${fallbackData}\n\n`));
                  
                  // End stream immediately
                  const doneData = JSON.stringify({
                    done: true,
                    provider: "local",
                    sessionId: effectiveSessionId,
                    languageError: true,
                    abortedDueToCJK: true,
                  });
                  controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  controller.close();
                  return;
                }

                fullContent += chunk.delta;
                chunkCount++;
                
                // Log chunk language in development (every 5th chunk to reduce spam)
                if (process.env.NODE_ENV === "development" && chunkCount % 5 === 0) {
                  const chunkLang = detectLanguage(fullContent);
                  console.log(`[Stream] Chunk ${chunkCount}: lang=${chunkLang.language} cjk=${chunkLang.hasCJK}`);
                }
                
                // Send delta as SSE
                const data = JSON.stringify({ delta: chunk.delta });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } else if (!chunk.ok) {
                // Send error event
                const errorData = JSON.stringify({ message: chunk.error || "Stream error" });
                controller.enqueue(encoder.encode(`event: error\ndata: ${errorData}\n\n`));
                break;
              }
            }

            // Final CJK check on complete content
            if (!cjkAborted && containsCJK(fullContent)) {
              if (process.env.NODE_ENV === "development") {
                console.error(`[Language Guard] CJK detected in FINAL content! Replacing response.`);
              }
              // This shouldn't happen if chunk filtering works, but safety net
              const fallbackMsg = getLanguageFallbackMessage(sessionLanguage);
              const fallbackData = JSON.stringify({ 
                done: true,
                provider: "local",
                sessionId: effectiveSessionId,
                languageError: true,
                replacedContent: fallbackMsg,
              });
              controller.enqueue(encoder.encode(`data: ${fallbackData}\n\n`));
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              return;
            }

            // Send completion metadata
            const doneData = JSON.stringify({
              done: true,
              provider: "local",
              sessionId: effectiveSessionId,
              tokensEstimate: Math.ceil(fullContent.length / 4),
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

            if (process.env.NODE_ENV === "development") {
              const finalLang = detectLanguage(fullContent);
              console.log(`[AI Agent] Stream completed: ${chunkCount} chunks, ${fullContent.length} chars, lang=${finalLang.language}, hasCJK=${finalLang.hasCJK}`);
            }

            // Audit log
            if (userId) {
              await audit.log({
                userId,
                userRole: (user?.role === "STUDENT" || user?.role === "INSTRUCTOR" || user?.role === "ADMIN") ? user.role : undefined,
                action: "AGENT_REQUEST",
                requestId,
                sessionId: sessionId,
                metadata: {
                  provider: "local",
                  streaming: true,
                  chunks: chunkCount,
                },
              });
            }

            controller.close();
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.error("[AI Agent] Streaming error:", error);
            }
            const errorData = JSON.stringify({
              message: error instanceof Error ? error.message : "Stream error"
            });
            controller.enqueue(encoder.encode(`event: error\ndata: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // NON-STREAMING MODE (original behavior)
    const result = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: MAX_RESPONSE_TOKENS,
    });

    // ================================================================
    // LANGUAGE GUARD: Check non-streaming response for CJK
    // ================================================================
    let finalContent = result.content || "";
    let languageError = false;
    
    if (result.ok && result.content && containsCJK(result.content)) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[Language Guard] CJK detected in non-streaming response!`);
        console.error(`[Language Guard] Content preview: "${result.content.substring(0, 100)}..."`);
      }
      finalContent = getLanguageFallbackMessage(sessionLanguage);
      languageError = true;
    }
    
    if (process.env.NODE_ENV === "development" && result.ok) {
      const responseLang = detectLanguage(finalContent);
      console.log(`[AI Agent] Non-streaming response: lang=${responseLang.language}, hasCJK=${responseLang.hasCJK}, languageError=${languageError}`);
    }

    // Audit log
    if (userId) {
      await audit.log({
        userId,
        userRole: (user?.role === "STUDENT" || user?.role === "INSTRUCTOR" || user?.role === "ADMIN") ? user.role : undefined,
        action: "AGENT_REQUEST",
        requestId,
        sessionId: effectiveSessionId,
        metadata: {
          provider: result.provider,
          fallbackUsed: result.fallbackUsed,
          tokensUsed: result.usage?.totalTokens,
          cached: result.cached,
          languageError,
        },
      });
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          errorCode: result.errorCode,
          provider: result.provider,
          fallbackUsed: result.fallbackUsed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        reply: finalContent,
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
        sessionId: effectiveSessionId,
        usage: result.usage,
        cached: result.cached,
        languageError,
      },
    });

  } catch (error) {
    console.error("[AI Agent] POST error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

