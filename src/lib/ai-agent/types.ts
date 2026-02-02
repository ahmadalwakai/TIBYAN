/**
 * AI Agent - Shared Types
 * Central type definitions for the entire AI agent system
 */

import type { Role } from "@prisma/client";

// ============================================
// Core Agent Types
// ============================================

/** Supported LLM providers */
export type LLMProvider = "llama-local" | "openai" | "anthropic";

/** Message roles in conversation */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/** Single message in conversation */
export interface AgentMessage {
  role: MessageRole;
  content: string;
  name?: string; // For tool messages
  toolCallId?: string;
}

/** Agent conversation history */
export interface ConversationHistory {
  messages: AgentMessage[];
  sessionId: string;
  userId?: string;
  startedAt: Date;
  lastActivityAt: Date;
}

// ============================================
// Intent Types
// ============================================

/** Supported user intents */
export enum UserIntent {
  // Education intents
  EDUCATION_GENERAL = "EDUCATION_GENERAL",
  STUDY_PLAN = "STUDY_PLAN",
  QUIZ_HELP = "QUIZ_HELP",
  COURSE_SUMMARY = "COURSE_SUMMARY",
  FLASHCARDS = "FLASHCARDS",
  STEP_BY_STEP_TUTOR = "STEP_BY_STEP_TUTOR",
  EXAM_REVISION = "EXAM_REVISION",
  // System intents
  PROJECT_TROUBLESHOOTER = "PROJECT_TROUBLESHOOTER",
  CODE_REVIEW = "CODE_REVIEW",
  // Analysis intents (admin-only)
  DAMAGE_ANALYZER = "DAMAGE_ANALYZER",
  // Default
  UNKNOWN = "UNKNOWN",
}

/** Intent detection result */
export interface IntentDetectionResult {
  intent: UserIntent;
  confidence: number; // 0-1
  keywords: string[];
  requiresImages: boolean;
  metadata?: Record<string, unknown>;
}

/** Back-compat alias: intent detection result */
export type IntentResult = IntentDetectionResult;

/** Routing metadata for structured logging */
export interface RoutingMetadata {
  requestId: string;
  intent: UserIntent;
  keywordCounts: Record<string, number>;
  flags: {
    isAdmin: boolean;
    damageAnalyzerEnabled: boolean;
    hasImages: boolean;
  };
  provider: string;
  latencyMs?: number;
  skillId?: string;
}

// ============================================
// Capability/Tool Types
// ============================================

/** Parameter type for tool definitions */
export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  enum?: string[];
  default?: unknown;
}

/** Tool definition schema */
export interface ToolDefinition {
  name: string;
  description: string;
  descriptionAr: string;
  parameters: ToolParameter[];
  requiredRoles: Role[];
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
  enabled: boolean;
}

/** Tool execution context */
export interface ToolContext {
  userId?: string;
  userRole?: Role;
  sessionId: string;
  locale: string;
  requestId: string;
}

/** Tool execution result */
export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  durationMs: number;
}

// ============================================
// Policy Types
// ============================================

/** Safety check result */
export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  reasonAr?: string;
  flaggedCategories?: string[];
}

/** Rate limit check result */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

/** RBAC permission check */
export interface PermissionCheckResult {
  allowed: boolean;
  missingPermissions?: string[];
  reason?: string;
}

// ============================================
// Planner Types
// ============================================

/** Task execution status */
export type TaskStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed"
  | "cancelled";

/** Single step in a plan */
export interface PlanStep {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  status: TaskStatus;
  result?: ToolResult;
  dependsOn?: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/** Execution plan */
export interface ExecutionPlan {
  id: string;
  sessionId: string;
  goal: string;
  steps: PlanStep[];
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Memory Types
// ============================================

/** User preference categories */
export type PreferenceCategory =
  | "language"
  | "learning_style"
  | "notification"
  | "accessibility"
  | "agent";

/** User preference entry */
export interface UserPreference {
  category: PreferenceCategory;
  key: string;
  value: unknown;
  updatedAt: Date;
}

/** Session memory entry */
export interface MemoryEntry {
  id: string;
  sessionId: string;
  key: string;
  value: unknown;
  expiresAt?: Date;
  createdAt: Date;
}

// ============================================
// Telemetry Types
// ============================================

/** Telemetry event types */
export type TelemetryEventType =
  | "request_start"
  | "request_end"
  | "tool_call"
  | "llm_call"
  | "cache_hit"
  | "cache_miss"
  | "error"
  | "rate_limit"
  | "safety_block";

/** Telemetry event */
export interface TelemetryEvent {
  type: TelemetryEventType;
  requestId: string;
  sessionId?: string;
  userId?: string;
  timestamp: Date;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/** Token usage tracking */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

/** Request metrics */
export interface RequestMetrics {
  requestId: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  tokenUsage?: TokenUsage;
  cacheHit: boolean;
  toolCalls: number;
  errorCount: number;
}

// ============================================
// Audit Types
// ============================================

/** Agent audit action types */
export type AgentAuditAction =
  | "AGENT_REQUEST"
  | "AGENT_RESPONSE"
  | "TOOL_EXECUTE"
  | "SAFETY_BLOCK"
  | "RATE_LIMIT_HIT"
  | "PERMISSION_DENIED"
  | "MEMORY_WRITE"
  | "MEMORY_READ"
  | "PLAN_CREATE"
  | "PLAN_EXECUTE"
  | "IDENTITY_ASSERTION_EVENT"
  | "INPUT_LIMIT_EXCEEDED"
  | "DAMAGE_ANALYZER_IMAGE_LIMIT_EXCEEDED"
  | "ERROR";

/** Audit log entry */
export interface AgentAuditEntry {
  id: string;
  action: AgentAuditAction;
  requestId: string;
  sessionId?: string;
  userId?: string;
  userRole?: Role;
  toolName?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
  tokenUsage?: TokenUsage;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================
// Cache Types
// ============================================

/** Cache entry */
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
  hits: number;
}

/** Cache statistics */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

// ============================================
// Prompt Types
// ============================================

/** Prompt template */
export interface PromptTemplate {
  id: string;
  name: string;
  version: number;
  locale: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Compiled prompt */
export interface CompiledPrompt {
  templateId: string;
  templateVersion: number;
  content: string;
  locale: string;
  variables: Record<string, unknown>;
  compiledAt: Date;
}

// ============================================
// API Response Types
// ============================================

/** Standard API response */
export interface AgentApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  requestId?: string;
}

/** Agent chat response */
export interface AgentChatResponse {
  reply: string;
  sessionId: string;
  toolsUsed?: string[];
  tokenUsage?: TokenUsage;
  cached: boolean;
}

// ============================================
// Configuration Types
// ============================================

/** Agent configuration */
export interface AgentConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  enableCache: boolean;
  enableTelemetry: boolean;
  enableAudit: boolean;
  defaultLocale: string;
}

/** Default agent configuration */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  provider: "llama-local",
  model: "local-llama",
  temperature: 0.7,
  maxTokens: 1024,
  timeout: 120_000,
  enableCache: true,
  enableTelemetry: true,
  enableAudit: true,
  defaultLocale: "ar",
};
