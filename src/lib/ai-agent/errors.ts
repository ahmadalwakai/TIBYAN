/**
 * AI Agent - Typed Error Taxonomy
 * Structured errors with user-safe messages in Arabic
 */

// ============================================
// Error Codes
// ============================================

export const AgentErrorCode = {
  // Request/Input errors (4xx)
  INVALID_INPUT: "AGENT_INVALID_INPUT",
  MESSAGE_TOO_LONG: "AGENT_MESSAGE_TOO_LONG",
  MESSAGE_EMPTY: "AGENT_MESSAGE_EMPTY",
  INPUT_LIMIT_EXCEEDED: "AGENT_INPUT_LIMIT_EXCEEDED",
  NO_IMAGES_PROVIDED: "AGENT_NO_IMAGES_PROVIDED",
  IMAGE_LIMIT_EXCEEDED: "AGENT_IMAGE_LIMIT_EXCEEDED",
  INVALID_SESSION: "AGENT_INVALID_SESSION",
  INVALID_TOOL: "AGENT_INVALID_TOOL",
  INVALID_PARAMETERS: "AGENT_INVALID_PARAMETERS",

  // Auth/Permission errors
  UNAUTHORIZED: "AGENT_UNAUTHORIZED",
  PERMISSION_DENIED: "AGENT_PERMISSION_DENIED",
  ROLE_REQUIRED: "AGENT_ROLE_REQUIRED",

  // Rate limiting
  RATE_LIMITED: "AGENT_RATE_LIMITED",
  QUOTA_EXCEEDED: "AGENT_QUOTA_EXCEEDED",

  // Safety
  SAFETY_BLOCKED: "AGENT_SAFETY_BLOCKED",
  CONTENT_FILTERED: "AGENT_CONTENT_FILTERED",
  PROMPT_INJECTION: "AGENT_PROMPT_INJECTION",

  // LLM/Provider errors (5xx)
  LLM_UNAVAILABLE: "AGENT_LLM_UNAVAILABLE",
  LLM_TIMEOUT: "AGENT_LLM_TIMEOUT",
  LLM_ERROR: "AGENT_LLM_ERROR",
  LLM_INVALID_RESPONSE: "AGENT_LLM_INVALID_RESPONSE",

  // Tool execution errors
  TOOL_EXECUTION_FAILED: "AGENT_TOOL_EXECUTION_FAILED",
  TOOL_NOT_FOUND: "AGENT_TOOL_NOT_FOUND",
  TOOL_DISABLED: "AGENT_TOOL_DISABLED",
  TOOL_TIMEOUT: "AGENT_TOOL_TIMEOUT",

  // System errors
  INTERNAL_ERROR: "AGENT_INTERNAL_ERROR",
  DATABASE_ERROR: "AGENT_DATABASE_ERROR",
  CACHE_ERROR: "AGENT_CACHE_ERROR",
  CONFIG_ERROR: "AGENT_CONFIG_ERROR",

  // Planning errors
  PLAN_CREATION_FAILED: "AGENT_PLAN_CREATION_FAILED",
  PLAN_EXECUTION_FAILED: "AGENT_PLAN_EXECUTION_FAILED",
  STEP_FAILED: "AGENT_STEP_FAILED",
} as const;

export type AgentErrorCodeType =
  (typeof AgentErrorCode)[keyof typeof AgentErrorCode];

// ============================================
// User-Safe Messages (Arabic)
// ============================================

const ERROR_MESSAGES_AR: Record<AgentErrorCodeType, string> = {
  [AgentErrorCode.INVALID_INPUT]: "البيانات المدخلة غير صالحة",
  [AgentErrorCode.MESSAGE_TOO_LONG]: "الرسالة طويلة جداً، يرجى اختصارها",
  [AgentErrorCode.MESSAGE_EMPTY]: "يرجى كتابة رسالة",
  [AgentErrorCode.INPUT_LIMIT_EXCEEDED]: "تم تجاوز الحد الأقصى لحجم المدخلات",
  [AgentErrorCode.NO_IMAGES_PROVIDED]: "لم يتم تقديم أي صور",
  [AgentErrorCode.IMAGE_LIMIT_EXCEEDED]: "تم تجاوز الحد الأقصى لعدد الصور",
  [AgentErrorCode.INVALID_SESSION]: "الجلسة غير صالحة، يرجى تحديث الصفحة",
  [AgentErrorCode.INVALID_TOOL]: "الأداة المطلوبة غير متوفرة",
  [AgentErrorCode.INVALID_PARAMETERS]: "معاملات غير صالحة للأداة",

  [AgentErrorCode.UNAUTHORIZED]: "يرجى تسجيل الدخول للاستمرار",
  [AgentErrorCode.PERMISSION_DENIED]: "ليس لديك صلاحية لهذا الإجراء",
  [AgentErrorCode.ROLE_REQUIRED]: "هذه الميزة غير متاحة لحسابك",

  [AgentErrorCode.RATE_LIMITED]:
    "عدد الطلبات كثير جداً، يرجى الانتظار قليلاً",
  [AgentErrorCode.QUOTA_EXCEEDED]: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً",

  [AgentErrorCode.SAFETY_BLOCKED]: "لا يمكن معالجة هذا الطلب لأسباب أمنية",
  [AgentErrorCode.CONTENT_FILTERED]: "المحتوى غير مناسب",
  [AgentErrorCode.PROMPT_INJECTION]: "تم اكتشاف محتوى غير آمن",

  [AgentErrorCode.LLM_UNAVAILABLE]:
    "خدمة الذكاء الاصطناعي غير متاحة حالياً",
  [AgentErrorCode.LLM_TIMEOUT]:
    "انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى",
  [AgentErrorCode.LLM_ERROR]: "حدث خطأ في خدمة الذكاء الاصطناعي",
  [AgentErrorCode.LLM_INVALID_RESPONSE]:
    "رد غير متوقع من خدمة الذكاء الاصطناعي",

  [AgentErrorCode.TOOL_EXECUTION_FAILED]: "فشل تنفيذ الأداة",
  [AgentErrorCode.TOOL_NOT_FOUND]: "الأداة المطلوبة غير موجودة",
  [AgentErrorCode.TOOL_DISABLED]: "هذه الأداة معطلة حالياً",
  [AgentErrorCode.TOOL_TIMEOUT]: "انتهت مهلة تنفيذ الأداة",

  [AgentErrorCode.INTERNAL_ERROR]: "حدث خطأ داخلي، يرجى المحاولة لاحقاً",
  [AgentErrorCode.DATABASE_ERROR]: "خطأ في قاعدة البيانات",
  [AgentErrorCode.CACHE_ERROR]: "خطأ في التخزين المؤقت",
  [AgentErrorCode.CONFIG_ERROR]: "خطأ في إعدادات النظام",

  [AgentErrorCode.PLAN_CREATION_FAILED]: "فشل إنشاء خطة التنفيذ",
  [AgentErrorCode.PLAN_EXECUTION_FAILED]: "فشل تنفيذ الخطة",
  [AgentErrorCode.STEP_FAILED]: "فشلت إحدى خطوات التنفيذ",
};

const ERROR_MESSAGES_EN: Record<AgentErrorCodeType, string> = {
  [AgentErrorCode.INVALID_INPUT]: "Invalid input data",
  [AgentErrorCode.MESSAGE_TOO_LONG]: "Message is too long",
  [AgentErrorCode.MESSAGE_EMPTY]: "Please enter a message",
  [AgentErrorCode.INPUT_LIMIT_EXCEEDED]: "Input size limit exceeded",
  [AgentErrorCode.NO_IMAGES_PROVIDED]: "No images provided",
  [AgentErrorCode.IMAGE_LIMIT_EXCEEDED]: "Image limit exceeded",
  [AgentErrorCode.INVALID_SESSION]: "Invalid session, please refresh",
  [AgentErrorCode.INVALID_TOOL]: "Requested tool is not available",
  [AgentErrorCode.INVALID_PARAMETERS]: "Invalid tool parameters",

  [AgentErrorCode.UNAUTHORIZED]: "Please sign in to continue",
  [AgentErrorCode.PERMISSION_DENIED]:
    "You don't have permission for this action",
  [AgentErrorCode.ROLE_REQUIRED]: "This feature is not available for your account",

  [AgentErrorCode.RATE_LIMITED]: "Too many requests, please wait",
  [AgentErrorCode.QUOTA_EXCEEDED]: "Quota exceeded, please try later",

  [AgentErrorCode.SAFETY_BLOCKED]:
    "This request cannot be processed for safety reasons",
  [AgentErrorCode.CONTENT_FILTERED]: "Content is inappropriate",
  [AgentErrorCode.PROMPT_INJECTION]: "Unsafe content detected",

  [AgentErrorCode.LLM_UNAVAILABLE]: "AI service is currently unavailable",
  [AgentErrorCode.LLM_TIMEOUT]: "Connection timed out, please try again",
  [AgentErrorCode.LLM_ERROR]: "AI service error",
  [AgentErrorCode.LLM_INVALID_RESPONSE]: "Unexpected AI response",

  [AgentErrorCode.TOOL_EXECUTION_FAILED]: "Tool execution failed",
  [AgentErrorCode.TOOL_NOT_FOUND]: "Requested tool not found",
  [AgentErrorCode.TOOL_DISABLED]: "This tool is currently disabled",
  [AgentErrorCode.TOOL_TIMEOUT]: "Tool execution timed out",

  [AgentErrorCode.INTERNAL_ERROR]: "Internal error, please try later",
  [AgentErrorCode.DATABASE_ERROR]: "Database error",
  [AgentErrorCode.CACHE_ERROR]: "Cache error",
  [AgentErrorCode.CONFIG_ERROR]: "System configuration error",

  [AgentErrorCode.PLAN_CREATION_FAILED]: "Failed to create execution plan",
  [AgentErrorCode.PLAN_EXECUTION_FAILED]: "Plan execution failed",
  [AgentErrorCode.STEP_FAILED]: "A step in execution failed",
};

// ============================================
// Error Class
// ============================================

export class AgentError extends Error {
  readonly code: AgentErrorCodeType;
  readonly statusCode: number;
  readonly userMessage: string;
  readonly userMessageAr: string;
  readonly details?: Record<string, unknown>;
  readonly isRetryable: boolean;

  constructor(
    code: AgentErrorCodeType,
    options?: {
      message?: string;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    const statusCode = getStatusCode(code);
    const userMessageAr = ERROR_MESSAGES_AR[code];
    const userMessageEn = ERROR_MESSAGES_EN[code];

    super(options?.message ?? userMessageEn);

    this.name = "AgentError";
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessageEn;
    this.userMessageAr = userMessageAr;
    this.details = options?.details;
    this.isRetryable = isRetryableError(code);

    if (options?.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace in V8
    Error.captureStackTrace?.(this, AgentError);
  }

  /**
   * Get user-safe message based on locale
   */
  getUserMessage(locale: string = "ar"): string {
    return locale === "ar" ? this.userMessageAr : this.userMessage;
  }

  /**
   * Convert to API response format
   */
  toResponse(locale: string = "ar"): {
    ok: false;
    error: string;
    errorCode: string;
  } {
    return {
      ok: false,
      error: this.getUserMessage(locale),
      errorCode: this.code,
    };
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function getStatusCode(code: AgentErrorCodeType): number {
  // 4xx Client errors
  if (
    code === AgentErrorCode.INVALID_INPUT ||
    code === AgentErrorCode.MESSAGE_TOO_LONG ||
    code === AgentErrorCode.MESSAGE_EMPTY ||
    code === AgentErrorCode.INPUT_LIMIT_EXCEEDED ||
    code === AgentErrorCode.NO_IMAGES_PROVIDED ||
    code === AgentErrorCode.IMAGE_LIMIT_EXCEEDED ||
    code === AgentErrorCode.INVALID_SESSION ||
    code === AgentErrorCode.INVALID_TOOL ||
    code === AgentErrorCode.INVALID_PARAMETERS
  ) {
    return 400;
  }

  if (code === AgentErrorCode.UNAUTHORIZED) {
    return 401;
  }

  if (
    code === AgentErrorCode.PERMISSION_DENIED ||
    code === AgentErrorCode.ROLE_REQUIRED ||
    code === AgentErrorCode.SAFETY_BLOCKED ||
    code === AgentErrorCode.CONTENT_FILTERED ||
    code === AgentErrorCode.PROMPT_INJECTION
  ) {
    return 403;
  }

  if (code === AgentErrorCode.TOOL_NOT_FOUND) {
    return 404;
  }

  if (
    code === AgentErrorCode.RATE_LIMITED ||
    code === AgentErrorCode.QUOTA_EXCEEDED
  ) {
    return 429;
  }

  // 5xx Server errors
  if (
    code === AgentErrorCode.LLM_UNAVAILABLE ||
    code === AgentErrorCode.LLM_ERROR ||
    code === AgentErrorCode.LLM_INVALID_RESPONSE
  ) {
    return 502;
  }

  if (
    code === AgentErrorCode.LLM_TIMEOUT ||
    code === AgentErrorCode.TOOL_TIMEOUT
  ) {
    return 504;
  }

  return 500; // Default to internal server error
}

function isRetryableError(code: AgentErrorCodeType): boolean {
  const retryableCodes: AgentErrorCodeType[] = [
    AgentErrorCode.LLM_UNAVAILABLE,
    AgentErrorCode.LLM_TIMEOUT,
    AgentErrorCode.LLM_ERROR,
    AgentErrorCode.TOOL_TIMEOUT,
    AgentErrorCode.DATABASE_ERROR,
    AgentErrorCode.CACHE_ERROR,
    AgentErrorCode.RATE_LIMITED,
  ];

  return retryableCodes.includes(code);
}

// ============================================
// Error Factory Functions
// ============================================

export function createInvalidInputError(
  details?: Record<string, unknown>
): AgentError {
  return new AgentError(AgentErrorCode.INVALID_INPUT, { details });
}

export function createUnauthorizedError(): AgentError {
  return new AgentError(AgentErrorCode.UNAUTHORIZED);
}

export function createPermissionDeniedError(
  missingPermissions?: string[]
): AgentError {
  return new AgentError(AgentErrorCode.PERMISSION_DENIED, {
    details: { missingPermissions },
  });
}

export function createRateLimitedError(retryAfterMs: number): AgentError {
  return new AgentError(AgentErrorCode.RATE_LIMITED, {
    details: { retryAfterMs },
  });
}

export function createSafetyBlockedError(
  flaggedCategories?: string[]
): AgentError {
  return new AgentError(AgentErrorCode.SAFETY_BLOCKED, {
    details: { flaggedCategories },
  });
}

export function createLLMError(cause?: Error): AgentError {
  return new AgentError(AgentErrorCode.LLM_ERROR, { cause });
}

export function createLLMTimeoutError(): AgentError {
  return new AgentError(AgentErrorCode.LLM_TIMEOUT);
}

export function createLLMUnavailableError(): AgentError {
  return new AgentError(AgentErrorCode.LLM_UNAVAILABLE);
}

export function createToolNotFoundError(toolName: string): AgentError {
  return new AgentError(AgentErrorCode.TOOL_NOT_FOUND, {
    details: { toolName },
  });
}

export function createToolExecutionError(
  toolName: string,
  cause?: Error
): AgentError {
  return new AgentError(AgentErrorCode.TOOL_EXECUTION_FAILED, {
    details: { toolName },
    cause,
  });
}

export function createInternalError(cause?: Error): AgentError {
  return new AgentError(AgentErrorCode.INTERNAL_ERROR, { cause });
}

// ============================================
// Input Limit Exceeded Error
// ============================================

/**
 * Typed error for input size limit violations.
 * Input size limits are enforced to protect performance, cost, and reasoning quality.
 */
export class InputLimitExceededError extends AgentError {
  readonly inputLength: number;
  readonly limit: number;
  readonly excessCharacters: number;

  constructor(inputLength: number, limit: number) {
    super(AgentErrorCode.INPUT_LIMIT_EXCEEDED, {
      details: {
        inputLength,
        limit,
        excessCharacters: inputLength - limit,
      },
    });

    this.name = "InputLimitExceededError";
    this.inputLength = inputLength;
    this.limit = limit;
    this.excessCharacters = inputLength - limit;

    Error.captureStackTrace?.(this, InputLimitExceededError);
  }
}

/**
 * Create an InputLimitExceededError with detailed metrics.
 * Input size limits are enforced to protect performance, cost, and reasoning quality.
 */
export function createInputLimitExceededError(
  inputLength: number,
  limit: number
): InputLimitExceededError {
  return new InputLimitExceededError(inputLength, limit);
}

/**
 * Check if error is an InputLimitExceededError
 */
export function isInputLimitExceededError(
  error: unknown
): error is InputLimitExceededError {
  return error instanceof InputLimitExceededError;
}

// ============================================
// Image Limit Errors (Damage Analyzer)
// ============================================

/**
 * Typed error when no images are provided for Damage Analyzer.
 */
export class NoImagesProvidedError extends AgentError {
  constructor() {
    super(AgentErrorCode.NO_IMAGES_PROVIDED, {
      details: {
        providedCount: 0,
      },
    });

    this.name = "NoImagesProvidedError";
    Error.captureStackTrace?.(this, NoImagesProvidedError);
  }
}

/**
 * Typed error when image count exceeds limit for Damage Analyzer.
 */
export class ImageLimitExceededError extends AgentError {
  readonly providedCount: number;
  readonly limit: number;

  constructor(providedCount: number, limit: number) {
    super(AgentErrorCode.IMAGE_LIMIT_EXCEEDED, {
      details: {
        providedCount,
        limit,
        excessImages: providedCount - limit,
      },
    });

    this.name = "ImageLimitExceededError";
    this.providedCount = providedCount;
    this.limit = limit;

    Error.captureStackTrace?.(this, ImageLimitExceededError);
  }
}

/**
 * Create a NoImagesProvidedError.
 */
export function createNoImagesProvidedError(): NoImagesProvidedError {
  return new NoImagesProvidedError();
}

/**
 * Create an ImageLimitExceededError with count details.
 */
export function createImageLimitExceededError(
  providedCount: number,
  limit: number
): ImageLimitExceededError {
  return new ImageLimitExceededError(providedCount, limit);
}

/**
 * Check if error is a NoImagesProvidedError
 */
export function isNoImagesProvidedError(
  error: unknown
): error is NoImagesProvidedError {
  return error instanceof NoImagesProvidedError;
}

/**
 * Check if error is an ImageLimitExceededError
 */
export function isImageLimitExceededError(
  error: unknown
): error is ImageLimitExceededError {
  return error instanceof ImageLimitExceededError;
}

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Check if error is an AgentError
 */
export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

/**
 * Wrap unknown error as AgentError
 */
export function wrapError(error: unknown): AgentError {
  if (isAgentError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === "AbortError") {
      return createLLMTimeoutError();
    }

    if (
      error.message.includes("fetch") ||
      error.message.includes("ECONNREFUSED")
    ) {
      return createLLMUnavailableError();
    }

    return createInternalError(error);
  }

  return createInternalError();
}

/**
 * Safe error logging (no sensitive data)
 */
export function safeErrorLog(error: AgentError): Record<string, unknown> {
  return {
    code: error.code,
    statusCode: error.statusCode,
    isRetryable: error.isRetryable,
    // Exclude potentially sensitive details
  };
}
