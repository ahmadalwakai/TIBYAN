/**
 * AI Agent - Prompt Templates
 * Versioned and localized prompt templates (Arabic-first)
 */

import type { PromptTemplate, CompiledPrompt } from "./types";

// ============================================
// Template Registry
// ============================================

const templates: Map<string, PromptTemplate[]> = new Map();

// ============================================
// Built-in Templates
// ============================================

// System prompt template - Arabic
const systemPromptAr: PromptTemplate = {
  id: "system_prompt_ar",
  name: "System Prompt (Arabic)",
  version: 1,
  locale: "ar",
  template: `أنت مساعد ذكي لمعهد تبيان للتعليم الإسلامي والعربي.

## هويتك
- اسمك: مساعد تبيان
- دورك: مساعدة الطلاب وأولياء الأمور في الاستفسارات المتعلقة بالتعليم
- أسلوبك: ودود، محترم، موجز، دقيق

## قواعد المحادثة
1. أجب دائماً باللغة العربية الفصحى إلا إذا طلب المستخدم لغة أخرى
2. كن موجزاً ومفيداً - لا تطل في الإجابات
3. إذا لم تعرف الإجابة، اقترح التواصل مع فريق الدعم
4. لا تختلق معلومات غير موجودة
5. احترم خصوصية المستخدمين - لا تطلب معلومات شخصية حساسة

## معلومات عن تبيان
- معهد تبيان هو منصة تعليمية إسلامية وعربية
- الجمهور المستهدف: الأطفال العرب في ألمانيا وأوروبا (5-16 سنة)
- المواد: القرآن الكريم، اللغة العربية، العلوم الإسلامية
- اللغات المدعومة: العربية، الإنجليزية، الألمانية، الفرنسية، الإسبانية، السويدية، التركية

{{#if context}}
## معلومات إضافية ذات صلة
{{context}}
{{/if}}

{{#if userInfo}}
## معلومات المستخدم الحالي
- الدور: {{userInfo.role}}
- الاسم: {{userInfo.name}}
{{/if}}`,
  variables: ["context", "userInfo"],
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// System prompt template - English
const systemPromptEn: PromptTemplate = {
  id: "system_prompt_en",
  name: "System Prompt (English)",
  version: 1,
  locale: "en",
  template: `You are an intelligent assistant for Tibyan Academy for Islamic and Arabic education.

## Your Identity
- Name: Tibyan Assistant
- Role: Helping students and parents with education-related inquiries
- Style: Friendly, respectful, concise, accurate

## Conversation Rules
1. Default to Arabic unless the user requests another language
2. Be concise and helpful - don't provide overly long answers
3. If you don't know the answer, suggest contacting the support team
4. Never make up information
5. Respect user privacy - don't ask for sensitive personal information

## About Tibyan
- Tibyan Academy is an Islamic and Arabic educational platform
- Target audience: Arab children in Germany and Europe (ages 5-16)
- Subjects: Quran, Arabic language, Islamic sciences
- Supported languages: Arabic, English, German, French, Spanish, Swedish, Turkish

{{#if context}}
## Relevant Additional Information
{{context}}
{{/if}}

{{#if userInfo}}
## Current User Information
- Role: {{userInfo.role}}
- Name: {{userInfo.name}}
{{/if}}`,
  variables: ["context", "userInfo"],
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Summarization prompt
const summarizationPromptAr: PromptTemplate = {
  id: "summarization_ar",
  name: "Lesson Summarization (Arabic)",
  version: 1,
  locale: "ar",
  template: `أنت خبير في تلخيص المحتوى التعليمي للأطفال.

## المهمة
لخص محتوى الدرس التالي بشكل مناسب للأطفال.

## محتوى الدرس
العنوان: {{lessonTitle}}
الدورة: {{courseName}}

{{content}}

## التعليمات
{{#if format === "brief"}}
- قدم ملخصاً مختصراً (3-5 جمل)
- استخدم لغة بسيطة مناسبة للأطفال
{{/if}}
{{#if format === "detailed"}}
- قدم ملخصاً تفصيلياً مع العناوين الفرعية
- اشرح المفاهيم الصعبة بأسلوب مبسط
{{/if}}
{{#if format === "bullet"}}
- قدم النقاط الرئيسية في قائمة مرقمة
- كل نقطة يجب أن تكون واضحة ومختصرة
{{/if}}

## المخرجات المطلوبة
1. ملخص الدرس
2. النقاط الرئيسية (3-5 نقاط)`,
  variables: ["lessonTitle", "courseName", "content", "format"],
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Quiz generation prompt
const quizGenerationPromptAr: PromptTemplate = {
  id: "quiz_generation_ar",
  name: "Quiz Generation (Arabic)",
  version: 1,
  locale: "ar",
  template: `أنت معلم خبير في إنشاء أسئلة اختبار تعليمية للأطفال.

## المهمة
أنشئ {{questionCount}} أسئلة اختيار من متعدد من محتوى الدرس التالي.

## محتوى الدرس
العنوان: {{lessonTitle}}
{{content}}

## تعليمات إنشاء الأسئلة
1. كل سؤال يجب أن يكون واضحاً ومباشراً
2. استخدم لغة بسيطة مناسبة للأطفال
3. قدم 4 خيارات لكل سؤال
4. تأكد أن هناك إجابة واحدة صحيحة فقط
5. الخيارات الخاطئة يجب أن تكون معقولة وليست سخيفة

## صيغة المخرجات (JSON)
[
  {
    "question": "نص السؤال",
    "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
    "correctIndex": 0,
    "explanation": "شرح مختصر للإجابة الصحيحة"
  }
]`,
  variables: ["questionCount", "lessonTitle", "content"],
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Study plan prompt
const studyPlanPromptAr: PromptTemplate = {
  id: "study_plan_ar",
  name: "Study Plan Generation (Arabic)",
  version: 1,
  locale: "ar",
  template: `أنت مستشار تعليمي متخصص في التخطيط الدراسي للأطفال.

## المهمة
أنشئ خطة دراسية مخصصة للطالب.

## معلومات الطالب
- الدورات المسجلة: {{enrolledCourses}}
- التقدم الحالي: {{progress}}
{{#if deadline}}
- الموعد النهائي: {{deadline}}
{{/if}}

## تعليمات
1. قسم الخطة إلى أيام/أسابيع حسب الحاجة
2. حدد وقتاً معقولاً للدراسة (30-60 دقيقة للأطفال)
3. اقترح فترات راحة
4. ضع أولوية للدورات الأقل تقدماً
5. اجعل الخطة مرنة وقابلة للتعديل

## صيغة المخرجات
خطة دراسية منظمة مع:
- جدول يومي/أسبوعي
- أهداف واضحة لكل فترة
- نصائح للتحفيز`,
  variables: ["enrolledCourses", "progress", "deadline"],
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Feedback prompt
const feedbackPromptAr: PromptTemplate = {
  id: "feedback_ar",
  name: "Assignment Feedback (Arabic)",
  version: 1,
  locale: "ar",
  template: `أنت معلم يقدم ملاحظات بناءة على واجبات الطلاب.

## المهمة
قدم ملاحظات على إجابة الطالب وفق معايير التقييم.

## معايير التقييم
{{rubric}}

## إجابة الطالب
{{studentAnswer}}

## تعليمات
1. كن إيجابياً وداعماً
2. ابدأ بنقاط القوة
3. قدم اقتراحات محددة للتحسين
4. استخدم لغة مشجعة مناسبة للأطفال
5. لا تكن قاسياً أو محبطاً

## صيغة الملاحظات
1. نقاط القوة (ما أحسنت فيه)
2. مجالات التحسين (ما يمكنك تطويره)
3. نصائح للمرة القادمة
4. الدرجة المقترحة (إن طُلب)`,
  variables: ["rubric", "studentAnswer"],
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Register built-in templates
const builtInTemplates = [
  systemPromptAr,
  systemPromptEn,
  summarizationPromptAr,
  quizGenerationPromptAr,
  studyPlanPromptAr,
  feedbackPromptAr,
];

for (const template of builtInTemplates) {
  const existing = templates.get(template.id) ?? [];
  existing.push(template);
  templates.set(template.id, existing);
}

// ============================================
// Prompt Manager Class
// ============================================

class PromptManager {
  /**
   * Get template by ID and locale
   */
  getTemplate(id: string, locale: string = "ar"): PromptTemplate | null {
    const versions = templates.get(`${id}_${locale}`) ?? templates.get(id);
    if (!versions || versions.length === 0) return null;

    // Get active version with highest version number
    const active = versions
      .filter((t) => t.isActive)
      .sort((a, b) => b.version - a.version)[0];

    return active ?? null;
  }

  /**
   * Get all versions of a template
   */
  getAllVersions(id: string): PromptTemplate[] {
    return templates.get(id) ?? [];
  }

  /**
   * Compile a template with variables
   */
  compile(
    templateId: string,
    variables: Record<string, unknown>,
    locale: string = "ar"
  ): CompiledPrompt | null {
    const template = this.getTemplate(templateId, locale);
    if (!template) return null;

    let content = template.template;

    // Simple variable substitution
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      content = content.replace(placeholder, String(value ?? ""));
    }

    // Handle conditionals {{#if condition}}...{{/if}}
    content = this.processConditionals(content, variables);

    // Clean up any remaining unmatched placeholders
    content = content.replace(/\{\{#if[^}]*\}\}[\s\S]*?\{\{\/if\}\}/g, "");
    content = content.replace(/\{\{[^}]+\}\}/g, "");

    // Clean up extra whitespace
    content = content.replace(/\n{3,}/g, "\n\n").trim();

    return {
      templateId: template.id,
      templateVersion: template.version,
      content,
      locale: template.locale,
      variables,
      compiledAt: new Date(),
    };
  }

  /**
   * Process conditional blocks
   */
  private processConditionals(
    template: string,
    variables: Record<string, unknown>
  ): string {
    // Handle {{#if variable}}...{{/if}}
    const ifPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(ifPattern, (_, variable, content) => {
      const value = variables[variable];

      // Check if variable is truthy
      if (value && value !== "" && value !== false) {
        return content;
      }

      return "";
    });
  }

  /**
   * Register a new template
   */
  register(template: PromptTemplate): void {
    const existing = templates.get(template.id) ?? [];
    existing.push(template);
    templates.set(template.id, existing);
  }

  /**
   * Create a new version of existing template
   */
  createVersion(
    id: string,
    updates: Partial<Pick<PromptTemplate, "template" | "variables">>
  ): PromptTemplate | null {
    const versions = templates.get(id);
    if (!versions || versions.length === 0) return null;

    const latest = versions.sort((a, b) => b.version - a.version)[0];

    const newVersion: PromptTemplate = {
      ...latest,
      ...updates,
      version: latest.version + 1,
      updatedAt: new Date(),
    };

    // Deactivate old versions
    for (const v of versions) {
      v.isActive = false;
    }

    versions.push(newVersion);
    return newVersion;
  }

  /**
   * Get the system prompt for chat
   */
  getSystemPrompt(
    locale: string = "ar",
    context?: string,
    userInfo?: { role: string; name: string }
  ): string {
    const compiled = this.compile(`system_prompt_${locale}`, {
      context,
      userInfo,
    });

    return compiled?.content ?? this.getDefaultSystemPrompt(locale);
  }

  /**
   * Default system prompt fallback
   */
  private getDefaultSystemPrompt(locale: string): string {
    if (locale === "ar") {
      return `أنت مساعد ذكي لمعهد تبيان للتعليم الإسلامي والعربي.
مهمتك: مساعدة الطلاب وأولياء الأمور بالإجابة على استفساراتهم.
أسلوبك: ودود، محترم، موجز، دقيق.
اللغة: العربية الفصحى.`;
    }

    return `You are an intelligent assistant for Tibyan Academy for Islamic and Arabic education.
Your role: Help students and parents with their inquiries.
Style: Friendly, respectful, concise, accurate.`;
  }

  /**
   * Get summarization prompt
   */
  getSummarizationPrompt(
    lessonTitle: string,
    courseName: string,
    content: string,
    format: "brief" | "detailed" | "bullet" = "brief"
  ): string {
    const compiled = this.compile("summarization_ar", {
      lessonTitle,
      courseName,
      content,
      format,
    });

    return compiled?.content ?? "";
  }

  /**
   * Get quiz generation prompt
   */
  getQuizPrompt(
    lessonTitle: string,
    content: string,
    questionCount: number = 5
  ): string {
    const compiled = this.compile("quiz_generation_ar", {
      lessonTitle,
      content,
      questionCount,
    });

    return compiled?.content ?? "";
  }

  /**
   * Get study plan prompt
   */
  getStudyPlanPrompt(
    enrolledCourses: string,
    progress: string,
    deadline?: string
  ): string {
    const compiled = this.compile("study_plan_ar", {
      enrolledCourses,
      progress,
      deadline,
    });

    return compiled?.content ?? "";
  }

  /**
   * List all registered template IDs
   */
  listTemplates(): string[] {
    return Array.from(templates.keys());
  }
}

// ============================================
// Global Instance
// ============================================

export const prompts = new PromptManager();

// ============================================
// Exports
// ============================================

export { PromptManager };
export type { PromptTemplate, CompiledPrompt };
