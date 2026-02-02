import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
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
  } catch {
    return null;
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
    const body: unknown = await request.json();
    const parseResult = AgentRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const error = createInvalidInputError({
        issues: parseResult.error.issues,
      });

      return NextResponse.json(error.toResponse(locale), {
        status: error.statusCode,
      });
    }

    const {
      message,
      sessionId: providedSessionId,
      history,
    }: AgentRequest = parseResult.data;
    const sessionId = providedSessionId ?? generateSessionId(userId);

    // ========================================
    // IDENTITY GUARD - HIGHEST PRIORITY
    // This identity lock is permanent and intentional. Do not modify.
    // ========================================
    const identityCheck = identityGuard(message);
    
    // Map cookie role to Prisma Role (GUEST not in Prisma enum)
    const prismaRole = userRole === "GUEST" ? undefined : userRole;
    
    if (identityCheck.intercepted) {
      // Log the identity assertion event
      await audit.logIdentityAssertion(requestId, {
        userId,
        userRole: prismaRole,
        detectedPhrase: identityCheck.metadata.detectedPhrase,
        normalizedInput: identityCheck.metadata.normalizedInput,
        timestamp: identityCheck.metadata.timestamp,
      });

      // Return the immutable identity response
      return NextResponse.json({
        ok: true,
        data: {
          reply: identityCheck.response,
          cached: false,
          identityAssertion: true,
        },
      });
    }

    // Block any identity override attempts in system/developer prompts
    if (isIdentityOverrideAttempt(message)) {
      await audit.logIdentityAssertion(requestId, {
        userId,
        userRole: prismaRole,
        detectedPhrase: "OVERRIDE_ATTEMPT_BLOCKED",
        normalizedInput: message.substring(0, 200),
        timestamp: new Date(),
      });

      return NextResponse.json({
        ok: false,
        error: "غير مسموح بتغيير هوية المساعد",
        errorCode: "IDENTITY_OVERRIDE_BLOCKED",
      }, { status: 403 });
    }

    // ========================================
    // INPUT SIZE LIMIT ENFORCEMENT
    // Input size limits are enforced to protect performance, cost, and reasoning quality.
    // This rule has higher priority than planner, memory, and retrieval.
    // ========================================
    const inputValidation = validateInputSize(message);
    
    if (!inputValidation.isValid) {
      // Log the input limit exceeded event
      await audit.logInputLimitExceeded(requestId, {
        userId,
        userRole: prismaRole,
        inputLength: inputValidation.characterCount,
        limit: inputValidation.limit,
        timestamp: new Date(),
      });

      // Return Arabic error message with details
      return NextResponse.json({
        ok: false,
        error: getInputLimitExceededMessage(
          inputValidation.characterCount,
          inputValidation.limit
        ),
        errorCode: AgentErrorCode.INPUT_LIMIT_EXCEEDED,
        details: {
          inputLength: inputValidation.characterCount,
          limit: inputValidation.limit,
          excessCharacters: inputValidation.excessCharacters,
        },
      }, { status: 400 });
    }

    // --- RATE LIMITING ---
    const rateLimitKey = userId ?? "anonymous";
    const rateLimitType = userId ? "agent_request" : "agent_request_guest";
    const rateCheck = policy.checkRateLimit(rateLimitKey, rateLimitType);

    if (!rateCheck.allowed) {
      const error = createRateLimitedError(
        rateCheck.resetAt.getTime() - Date.now()
      );

      await audit.logRateLimit(requestId, {
        userId,
        limitKey: rateLimitKey,
        retryAfterMs: rateCheck.resetAt.getTime() - Date.now(),
      });

      return NextResponse.json(error.toResponse(locale), {
        status: error.statusCode,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)
          ),
          "X-RateLimit-Remaining": String(rateCheck.remaining),
          "X-RateLimit-Reset": rateCheck.resetAt.toISOString(),
        },
      });
    }

    // --- SAFETY CHECK ---
    const safetyCheck = policy.checkSafety(message);

    if (!safetyCheck.allowed) {
      const error = createSafetyBlockedError(
        safetyCheck.flaggedCategories ?? []
      );

      await audit.logSafetyBlock(requestId, {
        userId,
        categories: safetyCheck.flaggedCategories ?? [],
        message,
      });

      return NextResponse.json(error.toResponse(locale), {
        status: error.statusCode,
      });
    }

    // Sanitize input
    const sanitizedMessage = policy.sanitizeInput(message);

    // ========================================
    // INTENT DETECTION - BEFORE CAPABILITY SELECTION
    // ========================================
    const intentResult = detectIntent(sanitizedMessage, false); // Text-only for now

    // Defense-in-depth: even if the core intent classifier is mocked or mis-routes,
    // enforce that explicit damage-analysis style messages remain admin-only when
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
          confidence: intentResult.confidence,
        };

        // Add debug info for admin users in debug mode
        if (process.env.NODE_ENV !== "production" && process.env.DEBUG_AI === "true") {
          responseData.debug = {
            provider: "mock", // Treat greeting as mock response
            localAvailable: false,
            fallbackUsed: true,
            zyphonAvailable: false,
            fallbackReason: "greeting-response",
          };
        }

        return NextResponse.json({ ok: true, data: responseData });
      } else if (routing.fallbackMessage) {
        return NextResponse.json({
          ok: true,
          data: {
            reply: routing.fallbackMessage,
            cached: false,
            sessionId,
            intent: intentResult.intent,
            confidence: intentResult.confidence,
          },
        });
      }
    }

    // --- CHECK CACHE ---
    const baseSystemPrompt = prompts.getSystemPrompt(locale);
    const cachedResponse = responseCache.get(baseSystemPrompt, sanitizedMessage);

    if (cachedResponse) {
      telemetry.record("cache_hit", {
        requestId,
        metadata: { cacheType: "response" },
      });

      return NextResponse.json({
        ok: true,
        data: {
          reply: cachedResponse,
          cached: true,
          sessionId,
        },
      });
    }

    // --- RETRIEVAL AUGMENTATION ---
    // Use the existing KB search
    const kbContexts = searchKnowledgeBase(sanitizedMessage);
    const intentAwareSystemPrompt = buildSystemPrompt(kbContexts, intentResult.intent);
    const systemPrompt = intentAwareSystemPrompt;

    // --- BUILD MESSAGES ---
    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: sanitizedMessage },
    ];

    // --- CALL LLM (with automatic fallback) ---
    const llmResult = await llmClient.chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1024,
    });

    if (!llmResult.ok) {
      console.error("[AI Agent] LLM error:", llmResult.error);

      const error = new AgentError(AgentErrorCode.LLM_UNAVAILABLE, {
        message: llmResult.error ?? "خطأ في الاتصال بخادم الذكاء الاصطناعي",
        details: { provider: llmResult.provider },
      });

      return NextResponse.json(error.toResponse(locale), {
        status: error.statusCode,
      });
    }

    const trimmedReply = (llmResult.content ?? "").trim();

    // Log if fallback was used
    if (llmResult.fallbackUsed) {
      console.log(
        "[AI Agent] Fallback provider used:",
        llmResult.provider,
        llmResult.fallbackReason ?? "no reason provided"
      );
    }

    // --- TRACK TELEMETRY ---
    const durationMs = Date.now() - startTime;
    const tokenUsage = llmResult.usage;

    telemetry.startRequest(requestId, sessionId, userId);
    telemetry.endRequest(requestId, {
      tokenUsage: tokenUsage
        ? {
            promptTokens: tokenUsage.promptTokens ?? 0,
            completionTokens: tokenUsage.completionTokens ?? 0,
            totalTokens: tokenUsage.totalTokens ?? 0,
          }
        : undefined,
      cacheHit: false,
    });

    // --- CACHE RESPONSE ---
    responseCache.set(baseSystemPrompt, sanitizedMessage, trimmedReply);

    // --- AUDIT LOG ---
    await audit.logResponse(requestId, {
      reply: trimmedReply,
      durationMs,
      tokenUsage: tokenUsage
        ? {
            promptTokens: tokenUsage.promptTokens ?? 0,
            completionTokens: tokenUsage.completionTokens ?? 0,
            totalTokens: tokenUsage.totalTokens ?? 0,
          }
        : undefined,
      cached: false,
    });

    // --- ROLE-AWARE RESPONSE ---
    const responseData: AgentResponseData = {
      reply: trimmedReply,
      sessionId,
      cached: false,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
    };

    // Add debug info only in non-production with DEBUG_AI=true
    if (process.env.NODE_ENV !== "production" && process.env.DEBUG_AI === "true") {
      // Get current LLM status for debug info
      const llmStatus = await getLLMStatus();
      
      responseData.debug = {
        provider: llmResult.provider,
        localAvailable: llmStatus.localAvailable,
        zyphonAvailable: llmStatus.zyphonAvailable,
        fallbackUsed: llmResult.fallbackUsed,
        fallbackReason: llmResult.fallbackReason,
      };
    }

    return NextResponse.json({ ok: true, data: responseData });
  } catch (error) {
    console.error("[AI Agent] Unexpected error:", error);

    const agentError = isAgentError(error) ? error : wrapError(error);
    const durationMs = Date.now() - startTime;

    // Log error
    await audit.logError(requestId, {
      code: agentError?.code || "UNKNOWN_ERROR",
      message: agentError?.message || "An unknown error occurred",
      userId,
    });

    return NextResponse.json(agentError.toResponse(locale), {
      status: agentError.statusCode,
    });
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Get user from cookie for role check
    const user = await getUserFromCookie();
    const isAdmin = isAdminUser(user);

    // Get LLM status from unified client
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
