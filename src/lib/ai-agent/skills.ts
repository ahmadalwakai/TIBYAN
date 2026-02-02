/**
 * AI Agent - Skills Registry
 * Typed, structured skill definitions for deterministic intent routing
 * and capability expansion (education-focused + system skills)
 */

import { z } from "zod";

// ============================================
// Skill Schema Types (Zod validated)
// ============================================

/** Safety rule for a skill */
export interface SkillSafetyRule {
  id: string;
  description: string;
  descriptionAr: string;
  enforcement: "block" | "warn" | "audit";
}

/** Example input/output for a skill */
export interface SkillExample {
  input: string;
  inputAr: string;
  expectedOutput: string;
  expectedOutputAr: string;
}

/** Trigger pattern for skill matching */
export interface SkillTrigger {
  keywords: string[];
  keywordsAr: string[];
  patterns?: RegExp[];
  minKeywordMatches: number;
  requiresContext?: string[];
}

/** Output schema definition for a skill */
export interface SkillOutputSchema {
  type: "text" | "json" | "structured";
  fields?: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    required: boolean;
    description: string;
  }>;
  maxLength?: number;
}

/** Required input definition for a skill */
export interface SkillRequiredInput {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "file" | "image";
  description: string;
  descriptionAr: string;
  optional: boolean;
  validation?: z.ZodType<unknown>;
}

/** Full skill definition */
export interface SkillDefinition {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: "education" | "system" | "utility" | "analysis";
  triggers: SkillTrigger;
  requiredInputs: SkillRequiredInput[];
  outputSchema: SkillOutputSchema;
  safetyRules: SkillSafetyRule[];
  examples: SkillExample[];
  requiresAdmin: boolean;
  requiresFeatureFlag?: string;
  enabled: boolean;
  version: string;
}

// ============================================
// Education Skills (6 required)
// ============================================

export const SKILL_STUDY_PLAN: SkillDefinition = {
  id: "study_plan",
  name: "Study Plan Generator",
  nameAr: "مُنشئ خطة المذاكرة",
  description: "Creates personalized study plans based on subject, time available, and learning goals",
  descriptionAr: "ينشئ خطط دراسية مخصصة بناءً على المادة والوقت المتاح وأهداف التعلم",
  category: "education",
  triggers: {
    keywords: ["plan", "schedule", "study", "organize", "prepare", "revision"],
    keywordsAr: ["خطة", "جدول", "مذاكرة", "دراسة", "تنظيم", "إعداد", "مراجعة", "تحضير", "برنامج", "توزيع"],
    minKeywordMatches: 1,
    requiresContext: ["subject", "education"],
  },
  requiredInputs: [
    {
      name: "subject",
      type: "string",
      description: "Subject or topic to study",
      descriptionAr: "المادة أو الموضوع للدراسة",
      optional: false,
    },
    {
      name: "duration",
      type: "string",
      description: "Available time for study",
      descriptionAr: "الوقت المتاح للدراسة",
      optional: true,
    },
    {
      name: "level",
      type: "string",
      description: "Academic level (basic/intermediate/advanced)",
      descriptionAr: "المستوى الدراسي",
      optional: true,
    },
  ],
  outputSchema: {
    type: "structured",
    fields: [
      { name: "planTitle", type: "string", required: true, description: "Title of the study plan" },
      { name: "duration", type: "string", required: true, description: "Total duration" },
      { name: "phases", type: "array", required: true, description: "Study phases with tasks" },
      { name: "tips", type: "array", required: false, description: "Study tips" },
    ],
    maxLength: 3000,
  },
  safetyRules: [
    {
      id: "no_academic_dishonesty",
      description: "Must not provide direct exam answers or encourage cheating",
      descriptionAr: "يجب عدم تقديم إجابات امتحان مباشرة أو تشجيع الغش",
      enforcement: "block",
    },
  ],
  examples: [
    {
      input: "I need a study plan for math exam in 2 weeks",
      inputAr: "أحتاج خطة مذاكرة للرياضيات قبل الامتحان بأسبوعين",
      expectedOutput: "A structured 2-week study plan with daily topics and review sessions",
      expectedOutputAr: "خطة دراسية منظمة لأسبوعين مع مواضيع يومية وجلسات مراجعة",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

export const SKILL_QUIZ_GENERATOR: SkillDefinition = {
  id: "quiz_generator",
  name: "Quiz Generator",
  nameAr: "مُنشئ الاختبارات",
  description: "Generates quiz questions based on lesson content or topic",
  descriptionAr: "ينشئ أسئلة اختبار بناءً على محتوى الدرس أو الموضوع",
  category: "education",
  triggers: {
    keywords: ["quiz", "test", "questions", "exam", "assessment", "practice"],
    keywordsAr: ["اختبار", "كويز", "أسئلة", "امتحان", "تمرين", "تقييم", "اختبر", "سؤال"],
    minKeywordMatches: 1,
    requiresContext: ["education"],
  },
  requiredInputs: [
    {
      name: "topic",
      type: "string",
      description: "Topic or lesson content for quiz generation",
      descriptionAr: "الموضوع أو محتوى الدرس لإنشاء الاختبار",
      optional: false,
    },
    {
      name: "questionCount",
      type: "number",
      description: "Number of questions to generate",
      descriptionAr: "عدد الأسئلة المطلوبة",
      optional: true,
    },
    {
      name: "difficulty",
      type: "string",
      description: "Difficulty level (easy/medium/hard)",
      descriptionAr: "مستوى الصعوبة",
      optional: true,
    },
  ],
  outputSchema: {
    type: "json",
    fields: [
      { name: "questions", type: "array", required: true, description: "Array of quiz questions" },
      { name: "totalPoints", type: "number", required: false, description: "Total quiz points" },
    ],
    maxLength: 5000,
  },
  safetyRules: [
    {
      id: "educational_only",
      description: "Questions must be educational and appropriate",
      descriptionAr: "يجب أن تكون الأسئلة تعليمية ومناسبة",
      enforcement: "block",
    },
  ],
  examples: [
    {
      input: "Generate 5 questions about photosynthesis",
      inputAr: "أنشئ 5 أسئلة عن عملية البناء الضوئي",
      expectedOutput: "5 multiple choice questions with answers",
      expectedOutputAr: "5 أسئلة اختيار من متعدد مع الإجابات",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

export const SKILL_COURSE_SUMMARY: SkillDefinition = {
  id: "course_summary",
  name: "Course Summarizer",
  nameAr: "مُلخص الدورات",
  description: "Generates concise summaries of course content or lessons",
  descriptionAr: "ينشئ ملخصات موجزة لمحتوى الدورات أو الدروس",
  category: "education",
  triggers: {
    keywords: ["summary", "summarize", "main points", "key concepts", "overview"],
    keywordsAr: ["ملخص", "لخص", "خلاصة", "نقاط", "أساسيات", "مهم", "رئيسي", "ألخص", "أوجز", "تلخيص"],
    minKeywordMatches: 1,
    requiresContext: ["lesson", "course", "content"],
  },
  requiredInputs: [
    {
      name: "content",
      type: "string",
      description: "Content to summarize",
      descriptionAr: "المحتوى للتلخيص",
      optional: false,
    },
    {
      name: "format",
      type: "string",
      description: "Summary format (bullet/paragraph/outline)",
      descriptionAr: "شكل الملخص",
      optional: true,
    },
  ],
  outputSchema: {
    type: "structured",
    fields: [
      { name: "summary", type: "string", required: true, description: "Main summary text" },
      { name: "keyPoints", type: "array", required: true, description: "Key points list" },
      { name: "concepts", type: "array", required: false, description: "Important concepts" },
    ],
    maxLength: 2000,
  },
  safetyRules: [
    {
      id: "preserve_accuracy",
      description: "Summary must accurately reflect original content",
      descriptionAr: "يجب أن يعكس الملخص المحتوى الأصلي بدقة",
      enforcement: "warn",
    },
  ],
  examples: [
    {
      input: "Summarize this chapter about World War II",
      inputAr: "لخص هذا الفصل عن الحرب العالمية الثانية",
      expectedOutput: "Concise summary with key dates and events",
      expectedOutputAr: "ملخص موجز مع التواريخ والأحداث الرئيسية",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

export const SKILL_FLASHCARDS: SkillDefinition = {
  id: "flashcards",
  name: "Flashcard Generator",
  nameAr: "مُنشئ البطاقات التعليمية",
  description: "Creates flashcards for memorization and active recall practice",
  descriptionAr: "ينشئ بطاقات تعليمية للحفظ وممارسة الاستذكار النشط",
  category: "education",
  triggers: {
    keywords: ["flashcard", "cards", "memorize", "recall", "review cards"],
    keywordsAr: ["بطاقات", "فلاش", "حفظ", "استذكار", "تذكر", "مراجعة", "بطاقة"],
    minKeywordMatches: 1,
    requiresContext: ["study", "learn"],
  },
  requiredInputs: [
    {
      name: "topic",
      type: "string",
      description: "Topic for flashcard generation",
      descriptionAr: "الموضوع لإنشاء البطاقات",
      optional: false,
    },
    {
      name: "count",
      type: "number",
      description: "Number of flashcards to generate",
      descriptionAr: "عدد البطاقات المطلوبة",
      optional: true,
    },
  ],
  outputSchema: {
    type: "json",
    fields: [
      { name: "cards", type: "array", required: true, description: "Array of front/back pairs" },
      { name: "topic", type: "string", required: true, description: "Topic name" },
    ],
    maxLength: 3000,
  },
  safetyRules: [
    {
      id: "factual_accuracy",
      description: "Flashcard content must be factually accurate",
      descriptionAr: "يجب أن يكون محتوى البطاقات صحيحاً واقعياً",
      enforcement: "warn",
    },
  ],
  examples: [
    {
      input: "Create flashcards for Arabic vocabulary",
      inputAr: "أنشئ بطاقات لمفردات اللغة العربية",
      expectedOutput: "10 flashcards with Arabic words and meanings",
      expectedOutputAr: "10 بطاقات بكلمات عربية ومعانيها",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

export const SKILL_STEP_BY_STEP_TUTOR: SkillDefinition = {
  id: "step_by_step_tutor",
  name: "Step-by-Step Tutor",
  nameAr: "المُعلم خطوة بخطوة",
  description: "Provides step-by-step explanations and guided problem solving",
  descriptionAr: "يقدم شروحات خطوة بخطوة وحل مشاكل موجّه",
  category: "education",
  triggers: {
    keywords: ["explain", "step by step", "solve", "understand", "teach"],
    keywordsAr: ["شرح", "خطوة", "حل", "فهم", "علم", "وضح", "أفهم", "أشرح"],
    minKeywordMatches: 1,
    requiresContext: ["problem", "question", "concept"],
  },
  requiredInputs: [
    {
      name: "question",
      type: "string",
      description: "Question or problem to explain",
      descriptionAr: "السؤال أو المشكلة للشرح",
      optional: false,
    },
    {
      name: "level",
      type: "string",
      description: "Explanation complexity level",
      descriptionAr: "مستوى تعقيد الشرح",
      optional: true,
    },
  ],
  outputSchema: {
    type: "structured",
    fields: [
      { name: "steps", type: "array", required: true, description: "Step-by-step explanation" },
      { name: "finalAnswer", type: "string", required: false, description: "Final answer if applicable" },
      { name: "tips", type: "array", required: false, description: "Additional tips" },
    ],
    maxLength: 4000,
  },
  safetyRules: [
    {
      id: "educational_guidance",
      description: "Must guide learning, not just give answers",
      descriptionAr: "يجب توجيه التعلم وليس فقط إعطاء الإجابات",
      enforcement: "warn",
    },
  ],
  examples: [
    {
      input: "How do I solve quadratic equations step by step?",
      inputAr: "كيف أحل المعادلات التربيعية خطوة بخطوة؟",
      expectedOutput: "Detailed steps for solving quadratic equations",
      expectedOutputAr: "خطوات مفصلة لحل المعادلات التربيعية",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

export const SKILL_EXAM_REVISION: SkillDefinition = {
  id: "exam_revision",
  name: "Exam Revision Assistant",
  nameAr: "مساعد مراجعة الامتحانات",
  description: "Helps with exam preparation through targeted revision strategies",
  descriptionAr: "يساعد في التحضير للامتحانات من خلال استراتيجيات المراجعة المستهدفة",
  category: "education",
  triggers: {
    keywords: ["exam", "revision", "prepare", "test prep", "final", "midterm"],
    keywordsAr: ["امتحان", "مراجعة", "تحضير", "نهائي", "فصلي", "اختبار", "استعداد"],
    minKeywordMatches: 2,
    requiresContext: ["exam", "test", "preparation"],
  },
  requiredInputs: [
    {
      name: "subject",
      type: "string",
      description: "Subject to revise for",
      descriptionAr: "المادة للمراجعة",
      optional: false,
    },
    {
      name: "examDate",
      type: "string",
      description: "When is the exam",
      descriptionAr: "موعد الامتحان",
      optional: true,
    },
    {
      name: "weakAreas",
      type: "string",
      description: "Areas needing more focus",
      descriptionAr: "المجالات التي تحتاج تركيز أكثر",
      optional: true,
    },
  ],
  outputSchema: {
    type: "structured",
    fields: [
      { name: "revisionPlan", type: "object", required: true, description: "Revision schedule" },
      { name: "focusAreas", type: "array", required: true, description: "Priority areas" },
      { name: "practiceQuestions", type: "array", required: false, description: "Practice questions" },
      { name: "tips", type: "array", required: false, description: "Exam tips" },
    ],
    maxLength: 3500,
  },
  safetyRules: [
    {
      id: "no_exam_leakage",
      description: "Must not claim to provide actual exam questions",
      descriptionAr: "يجب عدم الادعاء بتقديم أسئلة الامتحان الفعلية",
      enforcement: "block",
    },
  ],
  examples: [
    {
      input: "Help me revise for my biology final next week",
      inputAr: "ساعدني في المراجعة لامتحان الأحياء النهائي الأسبوع القادم",
      expectedOutput: "Revision plan with priority topics and practice tips",
      expectedOutputAr: "خطة مراجعة مع المواضيع ذات الأولوية ونصائح للتدريب",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

// ============================================
// System Skills (2 required - safe, non-invasive)
// ============================================

export const SKILL_PROJECT_TROUBLESHOOTER: SkillDefinition = {
  id: "project_troubleshooter",
  name: "Project Troubleshooter",
  nameAr: "مُستكشف مشاكل المشاريع",
  description: "Helps diagnose and suggest solutions for common project issues (read-only, non-invasive)",
  descriptionAr: "يساعد في تشخيص واقتراح حلول لمشاكل المشاريع الشائعة (قراءة فقط، غير تدخلي)",
  category: "system",
  triggers: {
    keywords: ["error", "bug", "issue", "problem", "fix", "debug", "troubleshoot", "not working"],
    keywordsAr: ["خطأ", "مشكلة", "إصلاح", "تصحيح", "لا يعمل", "علة", "عطل"],
    minKeywordMatches: 1,
    requiresContext: ["code", "project", "technical"],
  },
  requiredInputs: [
    {
      name: "errorDescription",
      type: "string",
      description: "Description of the error or issue",
      descriptionAr: "وصف الخطأ أو المشكلة",
      optional: false,
    },
    {
      name: "context",
      type: "string",
      description: "Additional context (stack trace, environment)",
      descriptionAr: "سياق إضافي (تتبع الأخطاء، البيئة)",
      optional: true,
    },
  ],
  outputSchema: {
    type: "structured",
    fields: [
      { name: "diagnosis", type: "string", required: true, description: "Problem diagnosis" },
      { name: "possibleCauses", type: "array", required: true, description: "Possible causes" },
      { name: "suggestedFixes", type: "array", required: true, description: "Suggested solutions" },
      { name: "preventionTips", type: "array", required: false, description: "Prevention tips" },
    ],
    maxLength: 2500,
  },
  safetyRules: [
    {
      id: "read_only",
      description: "Must not suggest destructive operations or direct file modifications",
      descriptionAr: "يجب عدم اقتراح عمليات مدمرة أو تعديلات مباشرة على الملفات",
      enforcement: "block",
    },
    {
      id: "no_credentials",
      description: "Must not request or process credentials/secrets",
      descriptionAr: "يجب عدم طلب أو معالجة بيانات الاعتماد أو الأسرار",
      enforcement: "block",
    },
  ],
  examples: [
    {
      input: "I'm getting a TypeError: Cannot read property 'map' of undefined",
      inputAr: "أحصل على خطأ TypeError: Cannot read property 'map' of undefined",
      expectedOutput: "Diagnosis pointing to uninitialized array with suggested null checks",
      expectedOutputAr: "تشخيص يشير إلى مصفوفة غير مُهيأة مع اقتراح فحوصات القيمة الفارغة",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

export const SKILL_CODE_REVIEW_CHECKLIST: SkillDefinition = {
  id: "code_review_checklist",
  name: "Code Review Checklist",
  nameAr: "قائمة مراجعة الكود",
  description: "Generates code review checklist and best practice reminders (educational, non-invasive)",
  descriptionAr: "ينشئ قائمة مراجعة الكود وتذكيرات بأفضل الممارسات (تعليمي، غير تدخلي)",
  category: "system",
  triggers: {
    keywords: ["review", "code review", "checklist", "best practices", "quality", "standards"],
    keywordsAr: ["مراجعة", "كود", "قائمة", "ممارسات", "جودة", "معايير", "فحص"],
    minKeywordMatches: 1,
    requiresContext: ["code", "development"],
  },
  requiredInputs: [
    {
      name: "codeType",
      type: "string",
      description: "Type of code (frontend/backend/api/database)",
      descriptionAr: "نوع الكود",
      optional: true,
    },
    {
      name: "language",
      type: "string",
      description: "Programming language",
      descriptionAr: "لغة البرمجة",
      optional: true,
    },
  ],
  outputSchema: {
    type: "structured",
    fields: [
      { name: "checklist", type: "array", required: true, description: "Review checklist items" },
      { name: "bestPractices", type: "array", required: true, description: "Best practices" },
      { name: "commonIssues", type: "array", required: false, description: "Common issues to watch" },
    ],
    maxLength: 2000,
  },
  safetyRules: [
    {
      id: "educational_only",
      description: "Must provide guidance, not automated fixes",
      descriptionAr: "يجب تقديم التوجيه وليس الإصلاحات الآلية",
      enforcement: "warn",
    },
  ],
  examples: [
    {
      input: "Give me a code review checklist for React components",
      inputAr: "أعطني قائمة مراجعة كود لمكونات React",
      expectedOutput: "Checklist covering props validation, hooks usage, accessibility",
      expectedOutputAr: "قائمة تغطي التحقق من الخصائص، استخدام الـ hooks، إمكانية الوصول",
    },
  ],
  requiresAdmin: false,
  enabled: true,
  version: "1.0.0",
};

// ============================================
// Damage Analyzer (Admin-only, feature-flagged)
// ============================================

export const SKILL_DAMAGE_ANALYZER: SkillDefinition = {
  id: "damage_analyzer",
  name: "Damage Analyzer",
  nameAr: "مُحلل الأضرار",
  description: "Analyzes images for damage assessment (admin-only, requires feature flag)",
  descriptionAr: "يحلل الصور لتقييم الأضرار (للمشرفين فقط، يتطلب علم الميزة)",
  category: "analysis",
  triggers: {
    keywords: ["damage", "accident", "scratch", "dent", "repair", "analyze damage"],
    keywordsAr: ["ضرر", "حادث", "خدش", "انبعاج", "تصليح", "إصلاح", "تصادم", "سيارة"],
    minKeywordMatches: 2,
    requiresContext: ["image", "vehicle"],
  },
  requiredInputs: [
    {
      name: "images",
      type: "image",
      description: "Images to analyze for damage",
      descriptionAr: "الصور لتحليل الأضرار",
      optional: false,
    },
    {
      name: "context",
      type: "string",
      description: "Additional context about the damage",
      descriptionAr: "سياق إضافي عن الضرر",
      optional: true,
    },
  ],
  outputSchema: {
    type: "structured",
    fields: [
      { name: "damageScore", type: "number", required: false, description: "Severity score 0-10" },
      { name: "damageAreas", type: "array", required: true, description: "Identified damage areas" },
      { name: "recommendations", type: "array", required: true, description: "Action recommendations" },
    ],
    maxLength: 2000,
  },
  safetyRules: [
    {
      id: "admin_only",
      description: "Must only be accessible to admin users",
      descriptionAr: "يجب أن يكون متاحاً للمشرفين فقط",
      enforcement: "block",
    },
    {
      id: "feature_flag",
      description: "Must be gated by AI_DAMAGE_ANALYZER_ENABLED env flag",
      descriptionAr: "يجب أن يكون مشروطاً بعلم AI_DAMAGE_ANALYZER_ENABLED",
      enforcement: "block",
    },
    {
      id: "no_liability",
      description: "Must include disclaimer about non-professional assessment",
      descriptionAr: "يجب تضمين إخلاء مسؤولية عن التقييم غير المهني",
      enforcement: "warn",
    },
  ],
  examples: [
    {
      input: "Analyze these car damage images",
      inputAr: "حلل صور ضرر السيارة هذه",
      expectedOutput: "Damage assessment with severity and repair suggestions",
      expectedOutputAr: "تقييم الأضرار مع الشدة واقتراحات الإصلاح",
    },
  ],
  requiresAdmin: true,
  requiresFeatureFlag: "AI_DAMAGE_ANALYZER_ENABLED",
  enabled: true,
  version: "1.0.0",
};

// ============================================
// Skills Registry
// ============================================

/** All registered skills */
export const SKILLS_REGISTRY: readonly SkillDefinition[] = [
  // Education skills (6)
  SKILL_STUDY_PLAN,
  SKILL_QUIZ_GENERATOR,
  SKILL_COURSE_SUMMARY,
  SKILL_FLASHCARDS,
  SKILL_STEP_BY_STEP_TUTOR,
  SKILL_EXAM_REVISION,
  // System skills (2)
  SKILL_PROJECT_TROUBLESHOOTER,
  SKILL_CODE_REVIEW_CHECKLIST,
  // Analysis skills (1, admin-only)
  SKILL_DAMAGE_ANALYZER,
] as const;

/** Skill IDs type */
export type SkillId = typeof SKILLS_REGISTRY[number]["id"];

/** Get all skill IDs */
export function getAllSkillIds(): SkillId[] {
  return SKILLS_REGISTRY.map((s) => s.id) as SkillId[];
}

/** Get skill by ID */
export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILLS_REGISTRY.find((s) => s.id === id);
}

/** Get skills by category */
export function getSkillsByCategory(category: SkillDefinition["category"]): SkillDefinition[] {
  return SKILLS_REGISTRY.filter((s) => s.category === category);
}

/** Get enabled skills */
export function getEnabledSkills(): SkillDefinition[] {
  return SKILLS_REGISTRY.filter((s) => s.enabled);
}

/** Get skills available to user (respects admin requirements) */
export function getAvailableSkills(isAdmin: boolean): SkillDefinition[] {
  return SKILLS_REGISTRY.filter((s) => {
    if (!s.enabled) return false;
    if (s.requiresAdmin && !isAdmin) return false;
    if (s.requiresFeatureFlag) {
      const flagEnabled = process.env[s.requiresFeatureFlag] === "true";
      if (!flagEnabled) return false;
    }
    return true;
  });
}

/**
 * Match message to best skill based on triggers
 * Returns skill ID and match confidence
 */
export function matchSkill(
  message: string,
  isAdmin: boolean = false
): { skillId: SkillId | null; confidence: number; matchedKeywords: string[] } {
  const normalizedMessage = message.toLowerCase();
  const availableSkills = getAvailableSkills(isAdmin);

  let bestMatch: { skill: SkillDefinition; score: number; keywords: string[] } | null = null;

  for (const skill of availableSkills) {
    const { keywords, keywordsAr, minKeywordMatches } = skill.triggers;
    const allKeywords = [...keywords, ...keywordsAr];

    const matchedKeywords = allKeywords.filter(
      (kw) => normalizedMessage.includes(kw.toLowerCase())
    );

    if (matchedKeywords.length >= minKeywordMatches) {
      const score = matchedKeywords.length / allKeywords.length;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { skill, score, keywords: matchedKeywords };
      }
    }
  }

  if (bestMatch) {
    return {
      skillId: bestMatch.skill.id as SkillId,
      confidence: Math.min(bestMatch.score * 2, 1), // Scale to 0-1
      matchedKeywords: bestMatch.keywords,
    };
  }

  return { skillId: null, confidence: 0, matchedKeywords: [] };
}

/**
 * Validate skill output against schema (basic shape check)
 */
export function validateSkillOutput(
  skillId: string,
  output: unknown
): { valid: boolean; errors: string[] } {
  const skill = getSkillById(skillId);
  if (!skill) {
    return { valid: false, errors: [`Unknown skill: ${skillId}`] };
  }

  const errors: string[] = [];
  const { outputSchema } = skill;

  // Basic type check
  if (outputSchema.type === "json" || outputSchema.type === "structured") {
    if (typeof output !== "object" || output === null) {
      errors.push(`Expected object output for skill ${skillId}`);
      return { valid: false, errors };
    }

    // Check required fields
    if (outputSchema.fields) {
      for (const field of outputSchema.fields) {
        if (field.required && !(field.name in (output as Record<string, unknown>))) {
          errors.push(`Missing required field: ${field.name}`);
        }
      }
    }
  }

  // Length check
  if (outputSchema.maxLength) {
    const outputStr = typeof output === "string" ? output : JSON.stringify(output);
    if (outputStr.length > outputSchema.maxLength) {
      errors.push(`Output exceeds max length of ${outputSchema.maxLength}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if output contains forbidden leakage
 */
export function checkForLeakage(output: string): { leaked: boolean; issues: string[] } {
  const issues: string[] = [];

  // Forbidden patterns that should never appear in user-facing output
  const forbiddenPatterns = [
    /system\s*prompt/i,
    /\[SYSTEM\]/i,
    /DEBUG:/i,
    /INTERNAL:/i,
    /API_KEY/i,
    /SECRET/i,
    /\.env/i,
    /process\.env/i,
    /llama-server/i,
    /localhost:\d+/i,
    /127\.0\.0\.1/i,
    /Bearer\s+[a-zA-Z0-9]/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(output)) {
      issues.push(`Potential leakage detected: ${pattern.source}`);
    }
  }

  return { leaked: issues.length > 0, issues };
}
