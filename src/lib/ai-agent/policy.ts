/**
 * AI Agent - Policy Engine
 * Validation, safety rules, rate limits, and RBAC checks
 */

import type { Role } from "@prisma/client";
import type {
  SafetyCheckResult,
  RateLimitResult,
  PermissionCheckResult,
  ToolContext,
} from "./types";
import {
  AgentError,
  AgentErrorCode,
  createRateLimitedError,
  createSafetyBlockedError,
  createPermissionDeniedError,
} from "./errors";

// ============================================
// Rate Limit Configuration
// ============================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General agent requests
  agent_request: { maxRequests: 30, windowMs: 60_000 }, // 30/min
  agent_request_guest: { maxRequests: 10, windowMs: 60_000 }, // 10/min for guests

  // Tool-specific limits
  tool_generate_quiz: { maxRequests: 10, windowMs: 3600_000 }, // 10/hour
  tool_summarize_lesson: { maxRequests: 20, windowMs: 3600_000 }, // 20/hour
  tool_get_learning_insights: { maxRequests: 30, windowMs: 3600_000 }, // 30/hour
};

// In-memory rate limit store
// In production, use Redis for distributed rate limiting
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60_000); // Every minute
}

// ============================================
// Safety Rules
// ============================================

// Blocked patterns (prompt injection, harmful content)
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  // Prompt injection attempts
  {
    pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
    category: "prompt_injection",
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|above|prior)/i,
    category: "prompt_injection",
  },
  {
    pattern: /forget\s+(everything|all)\s+(you|we)\s+(know|learned)/i,
    category: "prompt_injection",
  },
  {
    pattern: /you\s+are\s+now\s+(a|an|the)/i,
    category: "prompt_injection",
  },
  {
    pattern: /pretend\s+(you\s+are|to\s+be)/i,
    category: "prompt_injection",
  },
  {
    pattern: /act\s+as\s+(if|though|a)/i,
    category: "prompt_injection",
  },
  {
    pattern: /system\s*:\s*/i,
    category: "prompt_injection",
  },
  {
    pattern: /\[\s*INST\s*\]/i,
    category: "prompt_injection",
  },
  {
    pattern: /<\|.*?\|>/i,
    category: "prompt_injection",
  },

  // Code execution attempts
  {
    pattern: /exec\s*\(|eval\s*\(/i,
    category: "code_injection",
  },
  {
    pattern: /import\s+os|subprocess|__import__/i,
    category: "code_injection",
  },

  // Personal data extraction
  {
    pattern: /give\s+me\s+(all\s+)?(user|student|teacher)\s+(data|info|details)/i,
    category: "data_extraction",
  },
  {
    pattern: /list\s+all\s+(emails?|passwords?|users?)/i,
    category: "data_extraction",
  },

  // SQL injection (even though we use Prisma, block for safety)
  {
    pattern: /;\s*(DROP|DELETE|UPDATE|INSERT)\s+/i,
    category: "sql_injection",
  },
];

// Allowed topics for educational context
const ALLOWED_TOPICS = [
  "quran",
  "قرآن",
  "arabic",
  "عربي",
  "islamic",
  "إسلام",
  "course",
  "دورة",
  "lesson",
  "درس",
  "study",
  "دراسة",
  "teacher",
  "معلم",
  "student",
  "طالب",
  "education",
  "تعليم",
];

// ============================================
// Permission Matrix
// ============================================

type Permission =
  | "agent:use"
  | "agent:tools:basic"
  | "agent:tools:advanced"
  | "agent:tools:admin"
  | "agent:memory:read"
  | "agent:memory:write"
  | "agent:audit:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  STUDENT: ["agent:use", "agent:tools:basic", "agent:memory:read"],
  MEMBER: ["agent:use", "agent:tools:basic", "agent:memory:read"],
  INSTRUCTOR: [
    "agent:use",
    "agent:tools:basic",
    "agent:tools:advanced",
    "agent:memory:read",
    "agent:memory:write",
  ],
  ADMIN: [
    "agent:use",
    "agent:tools:basic",
    "agent:tools:advanced",
    "agent:tools:admin",
    "agent:memory:read",
    "agent:memory:write",
    "agent:audit:read",
  ],
};

// ============================================
// Policy Class
// ============================================

class AgentPolicy {
  // ==========================================
  // Rate Limiting
  // ==========================================

  /**
   * Check rate limit for a specific key
   */
  checkRateLimit(
    identifier: string,
    limitKey: string = "agent_request"
  ): RateLimitResult {
    const config = RATE_LIMITS[limitKey] ?? RATE_LIMITS.agent_request;
    const key = `${limitKey}:${identifier}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    // No entry or expired
    if (!entry || now > entry.resetAt) {
      const resetAt = now + config.windowMs;
      rateLimitStore.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(resetAt),
      };
    }

    // Increment and check
    entry.count++;
    rateLimitStore.set(key, entry);

    if (entry.count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.resetAt),
        retryAfterMs: entry.resetAt - now,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: new Date(entry.resetAt),
    };
  }

  /**
   * Enforce rate limit (throws if exceeded)
   */
  enforceRateLimit(identifier: string, limitKey?: string): void {
    const result = this.checkRateLimit(identifier, limitKey);
    if (!result.allowed) {
      throw createRateLimitedError(result.retryAfterMs ?? 60_000);
    }
  }

  // ==========================================
  // Safety Checks
  // ==========================================

  /**
   * Check message for safety violations
   */
  checkSafety(message: string): SafetyCheckResult {
    const flaggedCategories: string[] = [];

    // Check blocked patterns
    for (const { pattern, category } of BLOCKED_PATTERNS) {
      if (pattern.test(message)) {
        flaggedCategories.push(category);
      }
    }

    if (flaggedCategories.length > 0) {
      return {
        allowed: false,
        reason: "Message contains blocked content",
        reasonAr: "الرسالة تحتوي على محتوى محظور",
        flaggedCategories,
      };
    }

    return { allowed: true };
  }

  /**
   * Enforce safety (throws if blocked)
   */
  enforceSafety(message: string): void {
    const result = this.checkSafety(message);
    if (!result.allowed) {
      throw createSafetyBlockedError(result.flaggedCategories);
    }
  }

  /**
   * Sanitize input (remove potential injection patterns)
   */
  sanitizeInput(input: string): string {
    let sanitized = input;

    // Remove common injection patterns
    sanitized = sanitized.replace(/\[\s*INST\s*\]/gi, "");
    sanitized = sanitized.replace(/<\|.*?\|>/gi, "");
    sanitized = sanitized.replace(/system\s*:\s*/gi, "");

    // Trim excessive whitespace
    sanitized = sanitized.replace(/\s+/g, " ").trim();

    // Limit length
    if (sanitized.length > 2000) {
      sanitized = sanitized.slice(0, 2000);
    }

    return sanitized;
  }

  // ==========================================
  // Permission Checks
  // ==========================================

  /**
   * Check if role has permission
   */
  hasPermission(role: Role | undefined, permission: Permission): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  }

  /**
   * Check multiple permissions
   */
  checkPermissions(
    role: Role | undefined,
    requiredPermissions: Permission[]
  ): PermissionCheckResult {
    if (!role) {
      return {
        allowed: false,
        missingPermissions: requiredPermissions,
        reason: "No role assigned",
      };
    }

    const userPermissions = ROLE_PERMISSIONS[role] ?? [];
    const missing = requiredPermissions.filter(
      (p) => !userPermissions.includes(p)
    );

    if (missing.length > 0) {
      return {
        allowed: false,
        missingPermissions: missing,
        reason: `Missing permissions: ${missing.join(", ")}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Enforce permissions (throws if denied)
   */
  enforcePermissions(
    role: Role | undefined,
    requiredPermissions: Permission[]
  ): void {
    const result = this.checkPermissions(role, requiredPermissions);
    if (!result.allowed) {
      throw createPermissionDeniedError(result.missingPermissions);
    }
  }

  /**
   * Check if user can use agent
   */
  canUseAgent(role: Role | undefined): boolean {
    return this.hasPermission(role, "agent:use");
  }

  /**
   * Check if user can use a specific tool
   */
  canUseTool(role: Role | undefined, toolRequiredRoles: Role[]): boolean {
    if (!role) return false;

    // If tool has no role requirements, anyone with agent:use can use it
    if (toolRequiredRoles.length === 0) {
      return this.hasPermission(role, "agent:use");
    }

    return toolRequiredRoles.includes(role);
  }

  // ==========================================
  // Combined Policy Enforcement
  // ==========================================

  /**
   * Apply all policies to a request
   */
  enforceAll(context: ToolContext, message: string): void {
    // 1. Rate limit check
    const limitKey = context.userId
      ? "agent_request"
      : "agent_request_guest";
    this.enforceRateLimit(context.userId ?? context.sessionId, limitKey);

    // 2. Permission check (must be able to use agent)
    this.enforcePermissions(context.userRole, ["agent:use"]);

    // 3. Safety check
    this.enforceSafety(message);
  }

  /**
   * Apply tool-specific policies
   */
  enforceToolPolicy(
    context: ToolContext,
    toolName: string,
    toolRequiredRoles: Role[]
  ): void {
    // Rate limit for tool
    const toolLimitKey = `tool_${toolName}`;
    if (RATE_LIMITS[toolLimitKey]) {
      this.enforceRateLimit(
        context.userId ?? context.sessionId,
        toolLimitKey
      );
    }

    // Permission check for tool
    if (!this.canUseTool(context.userRole, toolRequiredRoles)) {
      throw createPermissionDeniedError(
        toolRequiredRoles.map((r) => `role:${r}`)
      );
    }
  }

  // ==========================================
  // Content Moderation
  // ==========================================

  /**
   * Check if message is relevant to educational context
   */
  isEducationallyRelevant(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return ALLOWED_TOPICS.some((topic) => lowerMessage.includes(topic));
  }

  /**
   * Get message length limits based on role
   */
  getMessageLimits(role: Role | undefined): { maxLength: number; maxHistory: number } {
    switch (role) {
      case "ADMIN":
        return { maxLength: 4000, maxHistory: 50 };
      case "INSTRUCTOR":
        return { maxLength: 3000, maxHistory: 40 };
      case "STUDENT":
      case "MEMBER":
        return { maxLength: 2000, maxHistory: 30 };
      default:
        return { maxLength: 1000, maxHistory: 10 };
    }
  }
}

// ============================================
// Global Policy Instance
// ============================================

export const policy = new AgentPolicy();

// ============================================
// Middleware Helper
// ============================================

/**
 * Create a policy-enforced handler wrapper
 */
export function withPolicy<T>(
  handler: (context: ToolContext) => Promise<T>,
  options?: {
    requiredPermissions?: Permission[];
    rateLimitKey?: string;
  }
): (context: ToolContext) => Promise<T> {
  return async (context: ToolContext) => {
    // Apply rate limit
    if (options?.rateLimitKey) {
      policy.enforceRateLimit(
        context.userId ?? context.sessionId,
        options.rateLimitKey
      );
    }

    // Apply permissions
    if (options?.requiredPermissions) {
      policy.enforcePermissions(context.userRole, options.requiredPermissions);
    }

    return handler(context);
  };
}

// ============================================
// Exports
// ============================================

export type { Permission, RateLimitConfig };
export { RATE_LIMITS, ROLE_PERMISSIONS };
