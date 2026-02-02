/**
 * AI Agent - Audit Trail
 * Records all agent actions to database for compliance and debugging
 */

import { db } from "@/lib/db";
import type { Role } from "@prisma/client";
import type { AgentAuditAction, AgentAuditEntry, TokenUsage } from "./types";

// ============================================
// Audit Configuration
// ============================================

interface AuditConfig {
  enabled: boolean;
  logToConsole: boolean;
  batchSize: number;
  flushIntervalMs: number;
}

const DEFAULT_CONFIG: AuditConfig = {
  enabled: true,
  logToConsole: process.env.NODE_ENV === "development",
  batchSize: 10,
  flushIntervalMs: 5000, // 5 seconds
};

// ============================================
// Audit Queue (Batch writes for performance)
// ============================================

interface AuditQueueEntry {
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

const auditQueue: AuditQueueEntry[] = [];
let flushTimer: NodeJS.Timeout | null = null;

// ============================================
// Audit Class
// ============================================

class AgentAudit {
  private config: AuditConfig;

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startFlushTimer();
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (typeof setInterval !== "undefined" && !flushTimer) {
      flushTimer = setInterval(() => {
        this.flush().catch(console.error);
      }, this.config.flushIntervalMs);

      if (flushTimer.unref) {
        flushTimer.unref();
      }
    }
  }

  /**
   * Log an audit entry
   */
  async log(entry: Omit<AuditQueueEntry, "createdAt">): Promise<void> {
    if (!this.config.enabled) return;

    const fullEntry: AuditQueueEntry = {
      ...entry,
      createdAt: new Date(),
    };

    // Log to console in development
    if (this.config.logToConsole) {
      console.log(`[Agent Audit] ${entry.action}`, {
        requestId: entry.requestId,
        toolName: entry.toolName,
        durationMs: entry.durationMs,
        errorCode: entry.errorCode,
      });
    }

    // Add to queue
    auditQueue.push(fullEntry);

    // Flush if batch size reached
    if (auditQueue.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Flush audit queue to database
   */
  async flush(): Promise<void> {
    if (auditQueue.length === 0) return;

    const entries = auditQueue.splice(0, this.config.batchSize);

    try {
      // Use existing AuditLog model with agent-specific actions
      await db.auditLog.createMany({
        data: entries.map((entry) => ({
          action: entry.action,
          actorUserId: entry.userId,
          entityType: "AGENT",
          entityId: entry.requestId,
          // Cast to Prisma-compatible JSON by serializing and parsing
          metadata: JSON.parse(JSON.stringify({
            sessionId: entry.sessionId,
            userRole: entry.userRole,
            toolName: entry.toolName,
            input: this.sanitizeForStorage(entry.input),
            output: this.sanitizeForStorage(entry.output),
            errorCode: entry.errorCode,
            errorMessage: entry.errorMessage,
            durationMs: entry.durationMs,
            tokenUsage: entry.tokenUsage,
            ...entry.metadata,
          })),
        })),
      });
    } catch (error) {
      console.error("[Agent Audit] Failed to flush audit log:", error);
      // Re-add failed entries to queue (at the front)
      auditQueue.unshift(...entries);
    }
  }

  /**
   * Sanitize data for storage (remove sensitive info)
   */
  private sanitizeForStorage(
    data: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined {
    if (!data) return undefined;

    const sanitized = { ...data };

    // Remove potentially sensitive fields
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "apiKey",
      "authorization",
    ];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }

    // Truncate large values
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === "string" && value.length > 1000) {
        sanitized[key] = value.slice(0, 1000) + "...[truncated]";
      }
    }

    return sanitized;
  }

  // ==========================================
  // Convenience Methods
  // ==========================================

  /**
   * Log agent request start
   */
  async logRequest(
    requestId: string,
    input: {
      message: string;
      sessionId?: string;
      userId?: string;
      userRole?: Role;
    }
  ): Promise<void> {
    await this.log({
      action: "AGENT_REQUEST",
      requestId,
      sessionId: input.sessionId,
      userId: input.userId,
      userRole: input.userRole,
      input: { message: input.message },
    });
  }

  /**
   * Log agent response
   */
  async logResponse(
    requestId: string,
    output: {
      reply: string;
      durationMs: number;
      tokenUsage?: TokenUsage;
      cached?: boolean;
    }
  ): Promise<void> {
    await this.log({
      action: "AGENT_RESPONSE",
      requestId,
      durationMs: output.durationMs,
      tokenUsage: output.tokenUsage,
      output: {
        replyLength: output.reply.length,
        cached: output.cached,
      },
    });
  }

  /**
   * Log tool execution
   */
  async logToolExecution(
    requestId: string,
    tool: {
      name: string;
      params: Record<string, unknown>;
      result: Record<string, unknown>;
      durationMs: number;
      success: boolean;
      userId?: string;
      userRole?: Role;
    }
  ): Promise<void> {
    await this.log({
      action: "TOOL_EXECUTE",
      requestId,
      toolName: tool.name,
      userId: tool.userId,
      userRole: tool.userRole,
      input: tool.params,
      output: tool.success ? tool.result : undefined,
      durationMs: tool.durationMs,
      errorCode: tool.success ? undefined : "TOOL_FAILED",
    });
  }

  /**
   * Log safety block
   */
  async logSafetyBlock(
    requestId: string,
    details: {
      userId?: string;
      userRole?: Role;
      categories: string[];
      message?: string;
    }
  ): Promise<void> {
    await this.log({
      action: "SAFETY_BLOCK",
      requestId,
      userId: details.userId,
      userRole: details.userRole,
      metadata: {
        categories: details.categories,
        messageLength: details.message?.length,
      },
    });
  }

  /**
   * Log rate limit hit
   */
  async logRateLimit(
    requestId: string,
    details: {
      userId?: string;
      userRole?: Role;
      limitKey: string;
      retryAfterMs: number;
    }
  ): Promise<void> {
    await this.log({
      action: "RATE_LIMIT_HIT",
      requestId,
      userId: details.userId,
      userRole: details.userRole,
      metadata: {
        limitKey: details.limitKey,
        retryAfterMs: details.retryAfterMs,
      },
    });
  }

  /**
   * Log permission denied
   */
  async logPermissionDenied(
    requestId: string,
    details: {
      userId?: string;
      userRole?: Role;
      requiredPermissions: string[];
      resource?: string;
    }
  ): Promise<void> {
    await this.log({
      action: "PERMISSION_DENIED",
      requestId,
      userId: details.userId,
      userRole: details.userRole,
      metadata: {
        requiredPermissions: details.requiredPermissions,
        resource: details.resource,
      },
    });
  }

  /**
   * Log error
   */
  async logError(
    requestId: string,
    error: {
      code: string;
      message: string;
      userId?: string;
      userRole?: Role;
      stack?: string;
    }
  ): Promise<void> {
    await this.log({
      action: "ERROR",
      requestId,
      userId: error.userId,
      userRole: error.userRole,
      errorCode: error.code,
      errorMessage: error.message,
      metadata: {
        stack: error.stack?.slice(0, 500), // Truncate stack trace
      },
    });
  }

  /**
   * Log memory operation
   */
  async logMemoryOperation(
    requestId: string,
    operation: "read" | "write",
    details: {
      sessionId: string;
      userId?: string;
      key: string;
    }
  ): Promise<void> {
    await this.log({
      action: operation === "read" ? "MEMORY_READ" : "MEMORY_WRITE",
      requestId,
      sessionId: details.sessionId,
      userId: details.userId,
      metadata: { key: details.key },
    });
  }

  /**
   * Log plan creation/execution
   */
  async logPlan(
    requestId: string,
    action: "create" | "execute",
    details: {
      planId: string;
      goal: string;
      stepCount: number;
      userId?: string;
    }
  ): Promise<void> {
    await this.log({
      action: action === "create" ? "PLAN_CREATE" : "PLAN_EXECUTE",
      requestId,
      userId: details.userId,
      metadata: {
        planId: details.planId,
        goal: details.goal,
        stepCount: details.stepCount,
      },
    });
  }

  /**
   * Log identity assertion event
   * This identity lock is permanent and intentional. Do not modify.
   */
  async logIdentityAssertion(
    requestId: string,
    details: {
      userId?: string;
      userRole?: Role;
      detectedPhrase: string | null;
      normalizedInput: string;
      timestamp: Date;
    }
  ): Promise<void> {
    await this.log({
      action: "IDENTITY_ASSERTION_EVENT",
      requestId,
      userId: details.userId,
      userRole: details.userRole,
      metadata: {
        detectedPhrase: details.detectedPhrase,
        normalizedInput: details.normalizedInput,
        triggeredAt: details.timestamp.toISOString(),
        securityNote: "Identity assertion triggered - immutable response sent",
      },
    });

    // Always log to console for security visibility
    console.log(`[IDENTITY_ASSERTION] User: ${details.userId || "anonymous"}, Pattern: ${details.detectedPhrase}`);
  }

  /**
   * Log input limit exceeded event.
   * Input size limits are enforced to protect performance, cost, and reasoning quality.
   */
  async logInputLimitExceeded(
    requestId: string,
    details: {
      userId?: string;
      userRole?: Role;
      inputLength: number;
      limit: number;
      timestamp: Date;
    }
  ): Promise<void> {
    await this.log({
      action: "INPUT_LIMIT_EXCEEDED",
      requestId,
      userId: details.userId,
      userRole: details.userRole,
      metadata: {
        inputLength: details.inputLength,
        limit: details.limit,
        excessCharacters: details.inputLength - details.limit,
        triggeredAt: details.timestamp.toISOString(),
        securityNote: "Input size limit exceeded - request rejected without processing",
      },
    });

    // Always log to console for security visibility
    console.log(
      `[INPUT_LIMIT_EXCEEDED] User: ${details.userId || "anonymous"}, ` +
      `Size: ${details.inputLength.toLocaleString()} / ${details.limit.toLocaleString()}`
    );
  }

  /**
   * Log damage analyzer image limit exceeded event.
   * Enforced BEFORE any image decoding, OCR, vision inference, or AI reasoning.
   */
  async logDamageAnalyzerImageLimitExceeded(
    requestId: string,
    details: {
      userId?: string;
      userRole?: Role;
      providedCount: number;
      limit: number;
      timestamp: Date;
    }
  ): Promise<void> {
    await this.log({
      action: "DAMAGE_ANALYZER_IMAGE_LIMIT_EXCEEDED",
      requestId,
      userId: details.userId,
      userRole: details.userRole,
      metadata: {
        providedCount: details.providedCount,
        limit: details.limit,
        excessImages: details.providedCount - details.limit,
        triggeredAt: details.timestamp.toISOString(),
        securityNote: "Damage analyzer image limit exceeded - request rejected without processing",
      },
    });

    // Always log to console for security visibility
    console.log(
      `[DAMAGE_ANALYZER_IMAGE_LIMIT] User: ${details.userId || "anonymous"}, ` +
      `Images: ${details.providedCount} / ${details.limit}`
    );
  }

  // ==========================================
  // Query Methods
  // ==========================================

  /**
   * Get audit entries for a user
   */
  async getByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: AgentAuditAction;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AgentAuditEntry[]> {
    const logs = await db.auditLog.findMany({
      where: {
        actorUserId: userId,
        entityType: "AGENT",
        action: options?.action,
        createdAt: {
          gte: options?.startDate,
          lte: options?.endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });

    type AuditLogRow = { id: string; action: string; entityId: string | null; actorUserId: string | null; metadata: unknown; createdAt: Date };
    return logs.map((log: AuditLogRow) => this.mapToAuditEntry(log));
  }

  /**
   * Get audit entries for a request
   */
  async getByRequest(requestId: string): Promise<AgentAuditEntry[]> {
    const logs = await db.auditLog.findMany({
      where: {
        entityId: requestId,
        entityType: "AGENT",
      },
      orderBy: { createdAt: "asc" },
    });

    type AuditLogRow = { id: string; action: string; entityId: string | null; actorUserId: string | null; metadata: unknown; createdAt: Date };
    return logs.map((log: AuditLogRow) => this.mapToAuditEntry(log));
  }

  /**
   * Get recent audit entries
   */
  async getRecent(limit: number = 100): Promise<AgentAuditEntry[]> {
    const logs = await db.auditLog.findMany({
      where: { entityType: "AGENT" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    type AuditLogRow = { id: string; action: string; entityId: string | null; actorUserId: string | null; metadata: unknown; createdAt: Date };
    return logs.map((log: AuditLogRow) => this.mapToAuditEntry(log));
  }

  /**
   * Get audit statistics
   */
  async getStats(startDate?: Date, endDate?: Date) {
    const where = {
      entityType: "AGENT" as const,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [totalCount, actionCounts] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.groupBy({
        by: ["action"],
        where,
        _count: true,
      }),
    ]);

    return {
      total: totalCount,
      byAction: Object.fromEntries(
        actionCounts.map((ac: { action: string; _count: number }) => [ac.action, ac._count])
      ),
    };
  }

  /**
   * Map database record to AuditEntry
   */
  private mapToAuditEntry(log: {
    id: string;
    action: string;
    entityId: string | null;
    actorUserId: string | null;
    metadata: unknown;
    createdAt: Date;
  }): AgentAuditEntry {
    const metadata = (log.metadata as Record<string, unknown>) ?? {};

    return {
      id: log.id,
      action: log.action as AgentAuditAction,
      requestId: log.entityId ?? "",
      sessionId: metadata.sessionId as string | undefined,
      userId: log.actorUserId ?? undefined,
      userRole: metadata.userRole as Role | undefined,
      toolName: metadata.toolName as string | undefined,
      input: metadata.input as Record<string, unknown> | undefined,
      output: metadata.output as Record<string, unknown> | undefined,
      errorCode: metadata.errorCode as string | undefined,
      errorMessage: metadata.errorMessage as string | undefined,
      durationMs: metadata.durationMs as number | undefined,
      tokenUsage: metadata.tokenUsage as TokenUsage | undefined,
      metadata,
      createdAt: log.createdAt,
    };
  }

  /**
   * Enable/disable audit
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Force flush all pending entries
   */
  async forceFlush(): Promise<void> {
    while (auditQueue.length > 0) {
      await this.flush();
    }
  }
}

// ============================================
// Global Audit Instance
// ============================================

export const audit = new AgentAudit();

// ============================================
// Exports
// ============================================

export { AgentAudit };
export type { AuditConfig };
