/**
 * AI Agent - Capabilities Registry
 * Central registry of agent tools/actions with strict typing
 */

import type { Role } from "@prisma/client";
import type {
  ToolDefinition,
  ToolParameter,
  ToolContext,
  ToolResult,
} from "./types";
import {
  AgentError,
  AgentErrorCode,
  createToolNotFoundError,
  createToolExecutionError,
  createPermissionDeniedError,
} from "./errors";

// ============================================
// Tool Handler Type
// ============================================

export type ToolHandler<TParams = Record<string, unknown>, TResult = unknown> = (
  params: TParams,
  context: ToolContext
) => Promise<ToolResult<TResult>>;

// ============================================
// Registered Tool (Definition + Handler)
// ============================================

interface RegisteredTool<TParams = Record<string, unknown>, TResult = unknown> {
  definition: ToolDefinition;
  handler: ToolHandler<TParams, TResult>;
}

// ============================================
// Capabilities Registry Class
// ============================================

class CapabilitiesRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * Register a new tool
   */
  register<TParams = Record<string, unknown>, TResult = unknown>(
    definition: ToolDefinition,
    handler: ToolHandler<TParams, TResult>
  ): void {
    if (this.tools.has(definition.name)) {
      console.warn(
        `[Capabilities] Tool "${definition.name}" already registered, overwriting`
      );
    }

    this.tools.set(definition.name, {
      definition,
      handler: handler as ToolHandler,
    });
  }

  /**
   * Get tool definition by name
   */
  getDefinition(name: string): ToolDefinition | undefined {
    return this.tools.get(name)?.definition;
  }

  /**
   * Get all tool definitions (optionally filtered by role)
   */
  getAllDefinitions(userRole?: Role): ToolDefinition[] {
    const definitions: ToolDefinition[] = [];

    for (const tool of this.tools.values()) {
      if (!tool.definition.enabled) continue;

      // Filter by role if provided
      if (userRole) {
        const hasPermission =
          tool.definition.requiredRoles.length === 0 ||
          tool.definition.requiredRoles.includes(userRole);
        if (!hasPermission) continue;
      }

      definitions.push(tool.definition);
    }

    return definitions;
  }

  /**
   * Check if tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Check if user has permission to use tool
   */
  checkPermission(name: string, userRole?: Role): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;

    if (!tool.definition.enabled) return false;

    // Must be authenticated (have a role)
    if (!userRole) return false;

    // If no required roles, anyone authenticated can use
    if (tool.definition.requiredRoles.length === 0) return true;

    // Check if user has required role
    return tool.definition.requiredRoles.includes(userRole);
  }

  /**
   * Execute a tool
   */
  async execute(
    name: string,
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    const tool = this.tools.get(name);
    if (!tool) {
      throw createToolNotFoundError(name);
    }

    if (!tool.definition.enabled) {
      throw new AgentError(AgentErrorCode.TOOL_DISABLED, {
        details: { toolName: name },
      });
    }

    // Check permission
    if (!this.checkPermission(name, context.userRole)) {
      throw createPermissionDeniedError([
        ...tool.definition.requiredRoles.map((r) => `role:${r}`),
      ]);
    }

    // Validate parameters
    const validationError = this.validateParameters(
      params,
      tool.definition.parameters
    );
    if (validationError) {
      throw new AgentError(AgentErrorCode.INVALID_PARAMETERS, {
        message: validationError,
        details: { toolName: name, params },
      });
    }

    try {
      const result = await tool.handler(params, context);
      return {
        ...result,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof AgentError) {
        throw error;
      }
      throw createToolExecutionError(
        name,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate parameters against tool schema
   */
  private validateParameters(
    params: Record<string, unknown>,
    schema: ToolParameter[]
  ): string | null {
    for (const param of schema) {
      const value = params[param.name];

      // Check required
      if (param.required && (value === undefined || value === null)) {
        return `Missing required parameter: ${param.name}`;
      }

      // Skip validation if not provided and not required
      if (value === undefined || value === null) continue;

      // Type checking
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== param.type) {
        return `Invalid type for ${param.name}: expected ${param.type}, got ${actualType}`;
      }

      // Enum validation
      if (param.enum && !param.enum.includes(String(value))) {
        return `Invalid value for ${param.name}: must be one of ${param.enum.join(", ")}`;
      }
    }

    return null;
  }

  /**
   * Get OpenAI-compatible tool definitions for LLM
   */
  getOpenAITools(userRole?: Role): OpenAITool[] {
    return this.getAllDefinitions(userRole).map((def) => ({
      type: "function" as const,
      function: {
        name: def.name,
        description: def.description,
        parameters: {
          type: "object" as const,
          properties: def.parameters.reduce(
            (acc, param) => {
              acc[param.name] = {
                type: param.type,
                description: param.description,
                enum: param.enum,
              };
              return acc;
            },
            {} as Record<string, unknown>
          ),
          required: def.parameters
            .filter((p) => p.required)
            .map((p) => p.name),
        },
      },
    }));
  }

  /**
   * Get tool count
   */
  get size(): number {
    return this.tools.size;
  }

  /**
   * Clear all tools (for testing)
   */
  clear(): void {
    this.tools.clear();
  }
}

// OpenAI tool format
interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// ============================================
// Global Registry Instance
// ============================================

export const capabilities = new CapabilitiesRegistry();

// ============================================
// Built-in Tools
// ============================================

// Tool: Get Course Summary
capabilities.register<{ courseId: string }, { summary: string }>(
  {
    name: "get_course_summary",
    description: "Get a summary of a course including lessons and progress",
    descriptionAr: "الحصول على ملخص الدورة بما في ذلك الدروس والتقدم",
    parameters: [
      {
        name: "courseId",
        type: "string",
        description: "The course ID",
        required: true,
      },
    ],
    requiredRoles: [], // Anyone can use
    enabled: true,
  },
  async (params, _context) => {
    // Implementation will be added - placeholder
    return {
      ok: true,
      data: { summary: `Course ${params.courseId} summary` },
      durationMs: 0,
    };
  }
);

// Tool: Search Lessons
capabilities.register<
  { query: string; courseId?: string },
  { results: Array<{ lessonId: string; title: string; excerpt: string }> }
>(
  {
    name: "search_lessons",
    description: "Search for lessons by keyword",
    descriptionAr: "البحث في الدروس بالكلمات المفتاحية",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: true,
      },
      {
        name: "courseId",
        type: "string",
        description: "Optional course ID to limit search",
        required: false,
      },
    ],
    requiredRoles: [],
    enabled: true,
  },
  async (params, _context) => {
    return {
      ok: true,
      data: { results: [] },
      durationMs: 0,
    };
  }
);

// Tool: Get Study Plan
capabilities.register<
  { userId: string },
  { plan: Array<{ day: string; tasks: string[] }> }
>(
  {
    name: "get_study_plan",
    description: "Generate a personalized study plan for the student",
    descriptionAr: "إنشاء خطة دراسية مخصصة للطالب",
    parameters: [
      {
        name: "userId",
        type: "string",
        description: "The user ID",
        required: true,
      },
    ],
    requiredRoles: ["STUDENT", "INSTRUCTOR", "ADMIN"],
    enabled: true,
  },
  async (params, _context) => {
    return {
      ok: true,
      data: { plan: [] },
      durationMs: 0,
    };
  }
);

// Tool: Generate Quiz
capabilities.register<
  { lessonId: string; questionCount: number },
  { questions: Array<{ question: string; options: string[]; answer: number }> }
>(
  {
    name: "generate_quiz",
    description: "Generate quiz questions from lesson content",
    descriptionAr: "توليد أسئلة اختبار من محتوى الدرس",
    parameters: [
      {
        name: "lessonId",
        type: "string",
        description: "The lesson ID",
        required: true,
      },
      {
        name: "questionCount",
        type: "number",
        description: "Number of questions to generate",
        required: false,
        default: 5,
      },
    ],
    requiredRoles: ["INSTRUCTOR", "ADMIN"],
    enabled: true,
  },
  async (params, _context) => {
    return {
      ok: true,
      data: { questions: [] },
      durationMs: 0,
    };
  }
);

// Tool: Get Learning Insights (Admin only)
capabilities.register<
  { timeRange: string },
  {
    totalStudents: number;
    activeStudents: number;
    completionRate: number;
    dropOffPoints: Array<{ lessonId: string; dropRate: number }>;
  }
>(
  {
    name: "get_learning_insights",
    description: "Get learning analytics and insights for admin dashboard",
    descriptionAr: "الحصول على تحليلات ورؤى التعلم للوحة المسؤول",
    parameters: [
      {
        name: "timeRange",
        type: "string",
        description: "Time range for analytics (7d, 30d, 90d)",
        required: true,
        enum: ["7d", "30d", "90d"],
      },
    ],
    requiredRoles: ["ADMIN"],
    enabled: true,
  },
  async (_params, _context) => {
    return {
      ok: true,
      data: {
        totalStudents: 0,
        activeStudents: 0,
        completionRate: 0,
        dropOffPoints: [],
      },
      durationMs: 0,
    };
  }
);

// Tool: Summarize Lesson
capabilities.register<
  { lessonId: string; format: string },
  { summary: string; keyPoints: string[] }
>(
  {
    name: "summarize_lesson",
    description: "Generate a summary of lesson content with key points",
    descriptionAr: "إنشاء ملخص لمحتوى الدرس مع النقاط الرئيسية",
    parameters: [
      {
        name: "lessonId",
        type: "string",
        description: "The lesson ID to summarize",
        required: true,
      },
      {
        name: "format",
        type: "string",
        description: "Summary format (brief, detailed, bullet)",
        required: false,
        enum: ["brief", "detailed", "bullet"],
        default: "brief",
      },
    ],
    requiredRoles: [],
    enabled: true,
  },
  async (params, _context) => {
    return {
      ok: true,
      data: {
        summary: `Summary of lesson ${params.lessonId}`,
        keyPoints: [],
      },
      durationMs: 0,
    };
  }
);

// Tool: Generate Image (Stable Diffusion)
capabilities.register<
  {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    style?: "realistic" | "anime" | "artistic" | "photograph";
  },
  { images: Array<{ url: string; seed: number }> }
>(
  {
    name: "generate_image",
    description: "Generate an image from a text description using AI",
    descriptionAr: "إنشاء صورة من وصف نصي باستخدام الذكاء الاصطناعي",
    parameters: [
      {
        name: "prompt",
        type: "string",
        description: "Description of the image to generate (in English for best results)",
        required: true,
      },
      {
        name: "negative_prompt",
        type: "string",
        description: "Things to avoid in the image",
        required: false,
      },
      {
        name: "width",
        type: "number",
        description: "Image width (max 1024)",
        required: false,
        default: 512,
      },
      {
        name: "height",
        type: "number",
        description: "Image height (max 1024)",
        required: false,
        default: 512,
      },
      {
        name: "steps",
        type: "number",
        description: "Number of diffusion steps (10-50)",
        required: false,
        default: 25,
      },
      {
        name: "style",
        type: "string",
        description: "Image style preset",
        required: false,
        enum: ["realistic", "anime", "artistic", "photograph"],
      },
    ],
    requiredRoles: [], // Available to all users
    rateLimit: {
      maxCalls: 10,
      windowMs: 60 * 60 * 1000, // 10 images per hour
    },
    enabled: true,
  },
  async (params, context) => {
    // Dynamic import to avoid loading if not used
    const { handleGenerateImage } = await import("./image-generation");
    return handleGenerateImage(params, context);
  }
);

// ============================================
// Vision Tools (Image Understanding)
// ============================================

// Tool: Analyze Image
capabilities.register<
  { image_base64?: string; image_url?: string; prompt?: string },
  { description: string; detectedObjects?: string[]; detectedText?: string[]; isAppropriate: boolean }
>(
  {
    name: "analyze_image",
    description: "Analyze an image and describe its contents, detect objects and text",
    descriptionAr: "تحليل صورة ووصف محتوياتها، اكتشاف الكائنات والنصوص",
    parameters: [
      {
        name: "image_base64",
        type: "string",
        description: "Base64 encoded image data",
        required: false,
      },
      {
        name: "image_url",
        type: "string",
        description: "URL of the image to analyze",
        required: false,
      },
      {
        name: "prompt",
        type: "string",
        description: "Custom prompt for specific analysis (optional)",
        required: false,
      },
    ],
    requiredRoles: [],
    rateLimit: { maxCalls: 20, windowMs: 60 * 60 * 1000 },
    enabled: true,
  },
  async (params, context) => {
    const { handleAnalyzeImage } = await import("./vision");
    return handleAnalyzeImage(params, context);
  }
);

// Tool: Extract Text from Image (OCR)
capabilities.register<
  { image_base64?: string; image_url?: string },
  { text: string; blocks: Array<{ text: string; confidence: number }>; language?: string }
>(
  {
    name: "extract_text_from_image",
    description: "Extract text from an image using OCR (supports Arabic and English)",
    descriptionAr: "استخراج النص من صورة باستخدام OCR (يدعم العربية والإنجليزية)",
    parameters: [
      {
        name: "image_base64",
        type: "string",
        description: "Base64 encoded image data",
        required: false,
      },
      {
        name: "image_url",
        type: "string",
        description: "URL of the image",
        required: false,
      },
    ],
    requiredRoles: [],
    rateLimit: { maxCalls: 30, windowMs: 60 * 60 * 1000 },
    enabled: true,
  },
  async (params, context) => {
    const { handleExtractText } = await import("./vision");
    return handleExtractText(params, context);
  }
);

// Tool: Ask Question About Image
capabilities.register<
  { image_base64?: string; image_url?: string; question: string },
  { answer: string }
>(
  {
    name: "ask_about_image",
    description: "Ask a question about an image and get an answer",
    descriptionAr: "طرح سؤال عن صورة والحصول على إجابة",
    parameters: [
      {
        name: "image_base64",
        type: "string",
        description: "Base64 encoded image data",
        required: false,
      },
      {
        name: "image_url",
        type: "string",
        description: "URL of the image",
        required: false,
      },
      {
        name: "question",
        type: "string",
        description: "Question to ask about the image",
        required: true,
      },
    ],
    requiredRoles: [],
    rateLimit: { maxCalls: 20, windowMs: 60 * 60 * 1000 },
    enabled: true,
  },
  async (params, context) => {
    const { handleAskAboutImage } = await import("./vision");
    return handleAskAboutImage(params, context);
  }
);

// ============================================
// PDF Tools
// ============================================

// Tool: Read PDF
capabilities.register<
  { pdf_base64?: string; pdf_url?: string },
  { text: string; pageCount: number; metadata: Record<string, unknown> }
>(
  {
    name: "read_pdf",
    description: "Read and extract text content from a PDF file",
    descriptionAr: "قراءة واستخراج المحتوى النصي من ملف PDF",
    parameters: [
      {
        name: "pdf_base64",
        type: "string",
        description: "Base64 encoded PDF data",
        required: false,
      },
      {
        name: "pdf_url",
        type: "string",
        description: "URL of the PDF file",
        required: false,
      },
    ],
    requiredRoles: [],
    rateLimit: { maxCalls: 20, windowMs: 60 * 60 * 1000 },
    enabled: true,
  },
  async (params, context) => {
    const { handleReadPDF } = await import("./pdf");
    const result = await handleReadPDF(params, context);
    if (!result.ok || !result.data) {
      return {
        ok: result.ok,
        error: result.error,
        errorCode: result.errorCode,
        durationMs: result.durationMs,
      } as ToolResult<{ text: string; pageCount: number; metadata: Record<string, unknown> }>;
    }
    // Transform to expected shape
    return {
      ok: true,
      durationMs: result.durationMs,
      data: {
        text: result.data.text,
        pageCount: result.data.pageCount,
        metadata: { ...result.data.metadata } as Record<string, unknown>,
      },
    };
  }
);

// Tool: Create PDF
capabilities.register<
  {
    title?: string;
    author?: string;
    content: Array<{ text: string; fontSize?: number; bold?: boolean; alignment?: string }>;
    page_size?: string;
  },
  { base64: string; pageCount: number }
>(
  {
    name: "create_pdf",
    description: "Create a new PDF document with text content",
    descriptionAr: "إنشاء مستند PDF جديد مع محتوى نصي",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "PDF document title",
        required: false,
      },
      {
        name: "author",
        type: "string",
        description: "PDF author name",
        required: false,
      },
      {
        name: "content",
        type: "array",
        description: "Array of text content blocks with optional formatting",
        required: true,
      },
      {
        name: "page_size",
        type: "string",
        description: "Page size (A4, LETTER, LEGAL)",
        required: false,
        enum: ["A4", "LETTER", "LEGAL"],
        default: "A4",
      },
    ],
    requiredRoles: [],
    rateLimit: { maxCalls: 10, windowMs: 60 * 60 * 1000 },
    enabled: true,
  },
  async (params, context) => {
    const { handleCreatePDF } = await import("./pdf");
    return handleCreatePDF(
      params as Parameters<typeof handleCreatePDF>[0],
      context
    );
  }
);

// Tool: Edit PDF
capabilities.register<
  {
    pdf_base64: string;
    add_text?: Array<{ page: number; text: string; x: number; y: number; fontSize?: number }>;
    delete_pages?: number[];
    rotate_pages?: Array<{ page: number; degrees: number }>;
    new_title?: string;
    new_author?: string;
  },
  { base64: string; pageCount: number }
>(
  {
    name: "edit_pdf",
    description: "Edit an existing PDF: add text, delete pages, rotate pages, update metadata",
    descriptionAr: "تعديل ملف PDF موجود: إضافة نص، حذف صفحات، تدوير صفحات، تحديث البيانات الوصفية",
    parameters: [
      {
        name: "pdf_base64",
        type: "string",
        description: "Base64 encoded PDF to edit",
        required: true,
      },
      {
        name: "add_text",
        type: "array",
        description: "Text to add at specific positions",
        required: false,
      },
      {
        name: "delete_pages",
        type: "array",
        description: "Page numbers to delete (1-based)",
        required: false,
      },
      {
        name: "rotate_pages",
        type: "array",
        description: "Pages to rotate with degrees (90, 180, 270)",
        required: false,
      },
      {
        name: "new_title",
        type: "string",
        description: "New document title",
        required: false,
      },
      {
        name: "new_author",
        type: "string",
        description: "New author name",
        required: false,
      },
    ],
    requiredRoles: [],
    rateLimit: { maxCalls: 10, windowMs: 60 * 60 * 1000 },
    enabled: true,
  },
  async (params, context) => {
    const { handleEditPDF } = await import("./pdf");
    return handleEditPDF(
      params as Parameters<typeof handleEditPDF>[0],
      context
    );
  }
);

// Tool: Merge PDFs
capabilities.register<
  { pdfs: string[]; title?: string },
  { base64: string; pageCount: number }
>(
  {
    name: "merge_pdfs",
    description: "Merge multiple PDF files into one document",
    descriptionAr: "دمج عدة ملفات PDF في مستند واحد",
    parameters: [
      {
        name: "pdfs",
        type: "array",
        description: "Array of base64 encoded PDFs to merge",
        required: true,
      },
      {
        name: "title",
        type: "string",
        description: "Title for the merged PDF",
        required: false,
      },
    ],
    requiredRoles: [],
    rateLimit: { maxCalls: 5, windowMs: 60 * 60 * 1000 },
    enabled: true,
  },
  async (params, context) => {
    const { handleMergePDFs } = await import("./pdf");
    return handleMergePDFs(params, context);
  }
);

// ============================================
// Helper Functions
// ============================================

/**
 * Create a tool definition helper
 */
export function defineToolDef(
  name: string,
  options: {
    description: string;
    descriptionAr: string;
    parameters: ToolParameter[];
    requiredRoles?: Role[];
    rateLimit?: { maxCalls: number; windowMs: number };
    enabled?: boolean;
  }
): ToolDefinition {
  return {
    name,
    description: options.description,
    descriptionAr: options.descriptionAr,
    parameters: options.parameters,
    requiredRoles: options.requiredRoles ?? [],
    rateLimit: options.rateLimit,
    enabled: options.enabled ?? true,
  };
}

/**
 * Create tool parameter helper
 */
export function defineParam(
  name: string,
  type: ToolParameter["type"],
  description: string,
  options?: {
    required?: boolean;
    enum?: string[];
    default?: unknown;
  }
): ToolParameter {
  return {
    name,
    type,
    description,
    required: options?.required ?? false,
    enum: options?.enum,
    default: options?.default,
  };
}
