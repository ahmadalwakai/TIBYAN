/**
 * AI Agent - Planner
 * Task decomposition and step execution state machine
 */

import type { Role } from "@prisma/client";
import type {
  ExecutionPlan,
  PlanStep,
  TaskStatus,
  ToolContext,
  ToolResult,
} from "./types";
import { capabilities } from "./capabilities";
import { policy } from "./policy";
import { telemetry, generateRequestId } from "./telemetry";
import { audit } from "./audit";
import {
  AgentError,
  AgentErrorCode,
  createInternalError,
} from "./errors";

// ============================================
// Planner Configuration
// ============================================

interface PlannerConfig {
  maxStepsPerPlan: number;
  stepTimeoutMs: number;
  allowParallelExecution: boolean;
}

const DEFAULT_CONFIG: PlannerConfig = {
  maxStepsPerPlan: 10,
  stepTimeoutMs: 30_000, // 30 seconds per step
  allowParallelExecution: false, // Sequential by default for safety
};

// ============================================
// Plan Store (In-Memory)
// ============================================

const planStore = new Map<string, ExecutionPlan>();

// Cleanup old plans periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [id, plan] of planStore.entries()) {
      if (now - plan.createdAt.getTime() > maxAge) {
        planStore.delete(id);
      }
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}

// ============================================
// Planner Class
// ============================================

class AgentPlanner {
  private config: PlannerConfig;

  constructor(config: Partial<PlannerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================
  // Plan Creation
  // ==========================================

  /**
   * Create a new execution plan
   */
  createPlan(
    goal: string,
    steps: Array<{
      toolName: string;
      parameters: Record<string, unknown>;
      dependsOn?: string[];
    }>,
    sessionId: string
  ): ExecutionPlan {
    if (steps.length > this.config.maxStepsPerPlan) {
      throw new AgentError(AgentErrorCode.PLAN_CREATION_FAILED, {
        message: `Plan exceeds maximum steps (${this.config.maxStepsPerPlan})`,
        details: { stepCount: steps.length },
      });
    }

    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();

    const planSteps: PlanStep[] = steps.map((step, index) => ({
      id: `step_${index + 1}`,
      toolName: step.toolName,
      parameters: step.parameters,
      status: "pending" as TaskStatus,
      dependsOn: step.dependsOn,
      createdAt: now,
    }));

    const plan: ExecutionPlan = {
      id: planId,
      sessionId,
      goal,
      steps: planSteps,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    planStore.set(planId, plan);

    return plan;
  }

  /**
   * Get a plan by ID
   */
  getPlan(planId: string): ExecutionPlan | undefined {
    return planStore.get(planId);
  }

  /**
   * Delete a plan
   */
  deletePlan(planId: string): boolean {
    return planStore.delete(planId);
  }

  // ==========================================
  // Plan Execution
  // ==========================================

  /**
   * Execute a plan step by step
   */
  async executePlan(
    planId: string,
    context: ToolContext
  ): Promise<{
    plan: ExecutionPlan;
    results: Array<{ stepId: string; result: ToolResult }>;
  }> {
    const plan = planStore.get(planId);
    if (!plan) {
      throw new AgentError(AgentErrorCode.PLAN_EXECUTION_FAILED, {
        message: "Plan not found",
        details: { planId },
      });
    }

    const requestId = generateRequestId();
    telemetry.startRequest(requestId, context.sessionId, context.userId);

    // Log plan execution start
    await audit.logPlan(requestId, "execute", {
      planId: plan.id,
      goal: plan.goal,
      stepCount: plan.steps.length,
      userId: context.userId,
    });

    plan.status = "in-progress";
    plan.updatedAt = new Date();

    const results: Array<{ stepId: string; result: ToolResult }> = [];

    try {
      for (const step of plan.steps) {
        // Check if dependencies are met
        if (step.dependsOn && step.dependsOn.length > 0) {
          const dependenciesMet = step.dependsOn.every((depId) => {
            const depStep = plan.steps.find((s) => s.id === depId);
            return depStep?.status === "completed";
          });

          if (!dependenciesMet) {
            step.status = "failed";
            plan.status = "failed";
            throw new AgentError(AgentErrorCode.STEP_FAILED, {
              message: "Dependencies not met",
              details: { stepId: step.id, dependsOn: step.dependsOn },
            });
          }
        }

        // Execute step
        const result = await this.executeStep(step, context, requestId);
        results.push({ stepId: step.id, result });

        // Check if step failed
        if (!result.ok) {
          plan.status = "failed";
          plan.updatedAt = new Date();
          break;
        }
      }

      // Mark plan as completed if all steps succeeded
      if (plan.status !== "failed") {
        plan.status = "completed";
        plan.updatedAt = new Date();
      }

      telemetry.endRequest(requestId);

      return { plan, results };
    } catch (error) {
      plan.status = "failed";
      plan.updatedAt = new Date();

      if (error instanceof AgentError) {
        await audit.logError(requestId, {
          code: error.code,
          message: error.message,
          userId: context.userId,
          userRole: context.userRole,
        });
      }

      telemetry.endRequest(requestId, { error: true });
      throw error;
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: PlanStep,
    context: ToolContext,
    requestId: string
  ): Promise<ToolResult> {
    step.status = "in-progress";
    step.startedAt = new Date();

    // Check if tool exists
    if (!capabilities.has(step.toolName)) {
      step.status = "failed";
      step.completedAt = new Date();
      step.result = {
        ok: false,
        error: `Tool not found: ${step.toolName}`,
        durationMs: 0,
      };
      return step.result;
    }

    // Check permission
    const toolDef = capabilities.getDefinition(step.toolName);
    if (toolDef) {
      try {
        policy.enforceToolPolicy(context, step.toolName, toolDef.requiredRoles);
      } catch (error) {
        step.status = "failed";
        step.completedAt = new Date();
        step.result = {
          ok: false,
          error: error instanceof AgentError ? error.userMessage : "Permission denied",
          durationMs: 0,
        };
        return step.result;
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(
        () => capabilities.execute(step.toolName, step.parameters, context),
        this.config.stepTimeoutMs
      );

      step.status = result.ok ? "completed" : "failed";
      step.completedAt = new Date();
      step.result = result;

      // Log tool execution
      telemetry.recordToolCall(
        requestId,
        step.toolName,
        result.durationMs,
        result.ok
      );

      return result;
    } catch (error) {
      step.status = "failed";
      step.completedAt = new Date();

      const errorMessage =
        error instanceof AgentError
          ? error.userMessage
          : "Tool execution failed";

      step.result = {
        ok: false,
        error: errorMessage,
        durationMs: Date.now() - (step.startedAt?.getTime() ?? Date.now()),
      };

      return step.result;
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new AgentError(AgentErrorCode.TOOL_TIMEOUT)),
          timeoutMs
        )
      ),
    ]);
  }

  // ==========================================
  // Plan Analysis from Natural Language
  // ==========================================

  /**
   * Analyze a natural language request and create a plan
   * This is a simplified version - in production, use LLM to generate plan
   */
  analyzeAndCreatePlan(
    request: string,
    sessionId: string,
    userRole?: Role
  ): ExecutionPlan | null {
    const lowerRequest = request.toLowerCase();

    // Detect study plan request
    if (
      lowerRequest.includes("خطة دراس") ||
      lowerRequest.includes("study plan") ||
      lowerRequest.includes("جدول")
    ) {
      return this.createPlan(
        "إنشاء خطة دراسية للمستخدم",
        [
          {
            toolName: "get_study_plan",
            parameters: { userId: "current" },
          },
        ],
        sessionId
      );
    }

    // Detect course summary request
    if (
      lowerRequest.includes("ملخص الدورة") ||
      lowerRequest.includes("course summary")
    ) {
      const courseIdMatch = request.match(/course[_-]?id[:\s]+(\w+)/i);
      if (courseIdMatch) {
        return this.createPlan(
          "الحصول على ملخص الدورة",
          [
            {
              toolName: "get_course_summary",
              parameters: { courseId: courseIdMatch[1] },
            },
          ],
          sessionId
        );
      }
    }

    // Detect lesson summarization request
    if (
      lowerRequest.includes("لخص الدرس") ||
      lowerRequest.includes("summarize lesson") ||
      lowerRequest.includes("ملخص الدرس")
    ) {
      const lessonIdMatch = request.match(/lesson[_-]?id[:\s]+(\w+)/i);
      if (lessonIdMatch) {
        return this.createPlan(
          "تلخيص محتوى الدرس",
          [
            {
              toolName: "summarize_lesson",
              parameters: { lessonId: lessonIdMatch[1], format: "brief" },
            },
          ],
          sessionId
        );
      }
    }

    // Detect quiz generation request (teacher/admin only)
    if (
      (lowerRequest.includes("أنشئ اختبار") ||
        lowerRequest.includes("generate quiz") ||
        lowerRequest.includes("ولد اختبار")) &&
      (userRole === "INSTRUCTOR" || userRole === "ADMIN")
    ) {
      const lessonIdMatch = request.match(/lesson[_-]?id[:\s]+(\w+)/i);
      if (lessonIdMatch) {
        return this.createPlan(
          "توليد اختبار من محتوى الدرس",
          [
            {
              toolName: "generate_quiz",
              parameters: { lessonId: lessonIdMatch[1], questionCount: 5 },
            },
          ],
          sessionId
        );
      }
    }

    // Detect learning insights request (admin only)
    if (
      (lowerRequest.includes("تحليلات") ||
        lowerRequest.includes("insights") ||
        lowerRequest.includes("إحصائيات")) &&
      userRole === "ADMIN"
    ) {
      return this.createPlan(
        "الحصول على تحليلات التعلم",
        [
          {
            toolName: "get_learning_insights",
            parameters: { timeRange: "30d" },
          },
        ],
        sessionId
      );
    }

    // No matching plan
    return null;
  }

  // ==========================================
  // Plan Status Management
  // ==========================================

  /**
   * Cancel a plan
   */
  cancelPlan(planId: string): boolean {
    const plan = planStore.get(planId);
    if (!plan || plan.status === "completed" || plan.status === "failed") {
      return false;
    }

    plan.status = "cancelled";
    plan.updatedAt = new Date();

    // Cancel any in-progress steps
    for (const step of plan.steps) {
      if (step.status === "pending" || step.status === "in-progress") {
        step.status = "cancelled";
      }
    }

    return true;
  }

  /**
   * Get plan status summary
   */
  getPlanStatus(planId: string): {
    status: TaskStatus;
    completedSteps: number;
    totalSteps: number;
    failedStep?: string;
  } | null {
    const plan = planStore.get(planId);
    if (!plan) return null;

    const completedSteps = plan.steps.filter(
      (s) => s.status === "completed"
    ).length;

    const failedStep = plan.steps.find((s) => s.status === "failed");

    return {
      status: plan.status,
      completedSteps,
      totalSteps: plan.steps.length,
      failedStep: failedStep?.id,
    };
  }

  // ==========================================
  // Multi-Step Plan Templates
  // ==========================================

  /**
   * Create a study session plan
   */
  createStudySessionPlan(
    userId: string,
    courseId: string,
    sessionId: string
  ): ExecutionPlan {
    return this.createPlan(
      "جلسة دراسة شاملة",
      [
        {
          toolName: "get_course_summary",
          parameters: { courseId },
        },
        {
          toolName: "get_study_plan",
          parameters: { userId },
          dependsOn: ["step_1"],
        },
      ],
      sessionId
    );
  }

  /**
   * Create a lesson review plan
   */
  createLessonReviewPlan(
    lessonId: string,
    includeQuiz: boolean,
    sessionId: string
  ): ExecutionPlan {
    const steps: Array<{
      toolName: string;
      parameters: Record<string, unknown>;
      dependsOn?: string[];
    }> = [
      {
        toolName: "summarize_lesson",
        parameters: { lessonId, format: "detailed" },
      },
    ];

    if (includeQuiz) {
      steps.push({
        toolName: "generate_quiz",
        parameters: { lessonId, questionCount: 5 },
        dependsOn: ["step_1"],
      });
    }

    return this.createPlan("مراجعة الدرس", steps, sessionId);
  }
}

// ============================================
// Global Planner Instance
// ============================================

export const planner = new AgentPlanner();

// ============================================
// Exports
// ============================================

export { AgentPlanner };
export type { PlannerConfig };
