/**
 * AI Agent Module - Public Exports
 * Central entry point for all AI agent functionality
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ============================================
// Types
// ============================================
export type {
  // Core types
  LLMProvider,
  MessageRole,
  AgentMessage,
  ConversationHistory,

  // Intent types
  IntentDetectionResult,
  IntentResult,

  // Tool types
  ToolParameter,
  ToolDefinition,
  ToolContext,
  ToolResult,

  // Policy types
  SafetyCheckResult,
  RateLimitResult,
  PermissionCheckResult,

  // Planner types
  TaskStatus,
  PlanStep,
  ExecutionPlan,

  // Memory types
  PreferenceCategory,
  UserPreference,
  MemoryEntry,

  // Telemetry types
  TelemetryEventType,
  TelemetryEvent,
  TokenUsage,
  RequestMetrics,

  // Audit types
  AgentAuditAction,
  AgentAuditEntry,

  // Cache types
  CacheEntry,
  CacheStats,

  // Prompt types
  PromptTemplate,
  CompiledPrompt,

  // API types
  AgentApiResponse,
  AgentChatResponse,

  // Config types
  AgentConfig,

  // Routing metadata
  RoutingMetadata,
} from "./types";

export { DEFAULT_AGENT_CONFIG, UserIntent } from "./types";

// ============================================
// Intent Detection
// ============================================
export {
  detectIntent,
  routeIntentToCapability,
  intentRequiresAdmin,
  intentRequiresFeatureFlag,
  getIntentDisplayName,
  normalizeArabicText,
  isDamageAnalyzerEnabled,
} from "./intent";

// ============================================
// Skills Registry
// ============================================
export {
  SKILLS_REGISTRY,
  getAllSkillIds,
  getSkillById,
  getSkillsByCategory,
  getEnabledSkills,
  getAvailableSkills,
  matchSkill,
  validateSkillOutput,
  checkForLeakage,
  // Individual skill exports
  SKILL_STUDY_PLAN,
  SKILL_QUIZ_GENERATOR,
  SKILL_COURSE_SUMMARY,
  SKILL_FLASHCARDS,
  SKILL_STEP_BY_STEP_TUTOR,
  SKILL_EXAM_REVISION,
  SKILL_PROJECT_TROUBLESHOOTER,
  SKILL_CODE_REVIEW_CHECKLIST,
  SKILL_DAMAGE_ANALYZER,
} from "./skills";

export type {
  SkillDefinition,
  SkillId,
  SkillTrigger,
  SkillSafetyRule,
  SkillExample,
  SkillOutputSchema,
  SkillRequiredInput,
} from "./skills";

// ============================================
// Errors
// ============================================
export {
  AgentError,
  AgentErrorCode,
  isAgentError,
  wrapError,
  safeErrorLog,
  // Factory functions
  createInvalidInputError,
  createUnauthorizedError,
  createPermissionDeniedError,
  createRateLimitedError,
  createSafetyBlockedError,
  createLLMError,
  createLLMTimeoutError,
  createLLMUnavailableError,
  createToolNotFoundError,
  createToolExecutionError,
  createInternalError,
} from "./errors";

export type { AgentErrorCodeType } from "./errors";

// ============================================
// Capabilities (Tool Registry)
// ============================================
export { capabilities, defineToolDef, defineParam } from "./capabilities";

export type { ToolHandler } from "./capabilities";

// ============================================
// Policy (RBAC, Safety, Rate Limits)
// ============================================
export { policy, withPolicy, RATE_LIMITS, ROLE_PERMISSIONS } from "./policy";

export type { Permission, RateLimitConfig } from "./policy";

// ============================================
// Cache
// ============================================
export {
  agentCache,
  responseCache,
  retrievalCache,
  toolCache,
  sessionCache,
  cached,
  AgentCache,
} from "./cache";

export type { CacheConfig } from "./cache";

// ============================================
// Telemetry
// ============================================
export { telemetry } from "./telemetry";

// ============================================
// Audit
// ============================================
export { audit, AgentAudit } from "./audit";

export type { AuditConfig } from "./audit";

// ============================================
// Memory
// ============================================
export { memory, AgentMemory } from "./memory";

export type { MemoryConfig, AgentPreferences } from "./memory";

// ============================================
// Retrieval
// ============================================
export { retrieval, AgentRetrieval, KNOWLEDGE_BASE } from "./retrieval";

export type { RetrievalResult, RetrievalOptions, KBEntry } from "./retrieval";

// ============================================
// Planner
// ============================================
export { planner, AgentPlanner } from "./planner";

export type { PlannerConfig } from "./planner";

// ============================================
// Prompts
// ============================================
export { prompts, PromptManager } from "./prompts";

// ============================================
// Image Generation (Stable Diffusion)
// ============================================
export { imageGeneration, handleGenerateImage } from "./image-generation";

export type {
  ImageGenerationConfig,
  ImageGenerationParams,
  GeneratedImage,
  GenerateImageToolParams,
} from "./image-generation";

// ============================================
// Vision (Image Understanding)
// ============================================
export {
  vision,
  VisionService,
  handleAnalyzeImage,
  handleExtractText,
  handleAskAboutImage,
} from "./vision";

export type {
  VisionConfig,
  ImageInput,
  VisionAnalysisResult,
  OCRResult,
  AnalyzeImageParams,
  ExtractTextParams,
  AskAboutImageParams,
} from "./vision";

// ============================================
// PDF (Read, Create, Edit)
// ============================================
export {
  pdf,
  PDFService,
  handleReadPDF,
  handleCreatePDF,
  handleEditPDF,
  handleMergePDFs,
} from "./pdf";

export type {
  PDFMetadata,
  PDFPageInfo,
  PDFReadResult,
  PDFCreateOptions,
  TextContent,
  PDFPage,
  ReadPDFParams,
  CreatePDFParams,
  EditPDFParams,
  MergePDFsParams,
} from "./pdf";

// ============================================
// Identity Lock (HIGHEST PRIORITY)
// This identity lock is permanent and intentional. Do not modify.
// ============================================
export {
  CREATOR_IDENTITY_RESPONSE,
  identityGuard,
  detectIdentityQuery,
  isIdentityOverrideAttempt,
} from "./identity.lock";

export type {
  IdentityGuardResult,
  IdentityDetectionResult,
} from "./identity.lock";

// ============================================
// Input Size Limits
// Input size limits are enforced to protect performance, cost, and reasoning quality.
// ============================================
export {
  MAX_INPUT_CHARACTERS,
  MAX_DAMAGE_ANALYZER_IMAGES,
  normalizeInput,
  validateInputSize,
  getInputLimitExceededMessage,
  getImageLimitExceededMessage,
  getNoImagesProvidedMessage,
} from "./limits";

export type {
  InputSizeValidation,
  InputCharacterLimit,
  DamageAnalyzerImageLimit,
} from "./limits";

export {
  InputLimitExceededError,
  createInputLimitExceededError,
  isInputLimitExceededError,
  NoImagesProvidedError,
  ImageLimitExceededError,
  createNoImagesProvidedError,
  createImageLimitExceededError,
  isNoImagesProvidedError,
  isImageLimitExceededError,
} from "./errors";

// ============================================
// Language Guard (Prevents CJK/Chinese responses)
// ============================================
export {
  languageGuard,
  detectLanguage,
  containsCJK,
  isArabicText,
  isEnglishText,
  sanitizeHistory,
  determineSessionLanguage,
  generateLanguageGuard,
  generateLanguageGuardMessage,
  filterStreamChunk,
  getLanguageFallbackMessage,
  generateLanguageDebugInfo,
  logLanguageDebug,
} from "./languageGuard";

export type {
  AllowedLanguage,
  DetectedLanguage,
  LanguageDetectionResult,
  SessionLanguageLock,
  SanitizedHistory,
  StreamFilterResult,
  LanguageDebugInfo,
} from "./languageGuard";

// ============================================
// Validators
// ============================================
export {
  validateDamageAnalyzerImages,
  validateDamageAnalyzerImagesSafe,
} from "./validators";

export type { ImageCountValidation } from "./validators";

// ============================================
// Convenience Helpers
// ============================================

import { agentCache } from "./cache";
import { telemetry as telemetryInstance } from "./telemetry";
// import { audit as auditInstance } from "./audit"; // Lazy loaded to avoid DB in tests
import type { ToolContext } from "./types";

/**
 * Lazy load audit to avoid DB import in tests
 */
let auditInstance: any = null;
function getAuditInstance() {
  if (!auditInstance && process.env.NODE_ENV !== 'test') {
    const { audit } = require('./audit');
    auditInstance = audit;
  }
  if (!auditInstance) {
    auditInstance = { setEnabled: () => {}, log: () => {} };
  }
  return auditInstance;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initialize the AI agent with custom configuration
 */
export function initializeAgent(config?: {
  enableCache?: boolean;
  enableTelemetry?: boolean;
  enableAudit?: boolean;
  defaultLocale?: string;
  maxTokens?: number;
  modelId?: string;
}): {
  defaultLocale: string;
  maxTokens: number;
  modelId: string;
} {
  // Apply configuration
  if (config?.enableCache === false) {
    agentCache.clear();
  }

  if (config?.enableTelemetry === false) {
    telemetryInstance.setEnabled(false);
  }

  if (config?.enableAudit === false) {
    getAuditInstance().setEnabled(false);
  }

  const result = {
    defaultLocale: config?.defaultLocale ?? "ar",
    maxTokens: config?.maxTokens ?? 1024,
    modelId: config?.modelId ?? "local-llama",
  };

  console.log("[AI Agent] Initialized with config:", result);
  return result;
}

/**
 * Create a request context for tool execution
 */
export function createContext(options: {
  sessionId: string;
  userId?: string;
  userRole?: import("@prisma/client").Role;
  locale?: string;
  requestId?: string;
}): ToolContext {
  return {
    sessionId: options.sessionId,
    userId: options.userId,
    userRole: options.userRole,
    locale: options.locale ?? "ar",
    requestId: options.requestId ?? generateRequestId(),
  };
}
