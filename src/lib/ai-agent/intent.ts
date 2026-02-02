/**
 * AI Agent - Intent Classification
 * Explicit intent detection and classification system
 * Ensures proper routing of user queries to appropriate capabilities
 * 
 * Features:
 * - Arabic diacritics/tatweel normalization
 * - Strict damage analyzer gating
 * - Feature flag support
 */

import { UserIntent, type IntentDetectionResult } from "./types";

// ============================================
// Arabic Text Normalization
// ============================================

/**
 * Normalize Arabic text by removing diacritics, tatweel, and normalizing characters
 * This improves keyword matching reliability
 */
export function normalizeArabicText(text: string): string {
  return text
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Remove tatweel (kashida)
    .replace(/\u0640/g, "")
    // Normalize alef variants to bare alef
    .replace(/[أإآٱ]/g, "ا")
    // Normalize alef maksura to ya
    .replace(/ى/g, "ي")
    // Normalize taa marbuta to haa
    .replace(/ة/g, "ه")
    // Remove zero-width characters
    .replace(/[\u200B-\u200F\u202A-\u202E]/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ============================================
// Intent Classification Rules
// ============================================

/** Keywords that strongly indicate educational intent */
const EDUCATION_KEYWORDS = [
  "درس", "دروس", "ماده", "موضوع", "شرح", "فهم", "سوال", "اسئله",
  "رياضيات", "فيزياء", "كيمياء", "احياء", "تاريخ", "جغرافيا", "لغه",
  "انجليزي", "عربي", "فرنسي", "الماني", "تركي", "اسباني",
  "برمجه", "حاسوب", "علوم", "ادب", "فلسفه", "اقتصاد",
  "مساعده", "ساعدني", "ساعد", "احتاج", "اريد",
  "الصف", "الثانوي", "الاساسي", "الجامعي", "الدراسي", "المدرسه", "الجامعه",
  "تعلم", "تعليم", "دراسه", "مذاكره", "مراجعه", "افهم", "اتعلم"
];

/** Keywords that indicate study plan intent */
const STUDY_PLAN_KEYWORDS = [
  "خطه", "جدول", "برنامج", "توزيع", "تنظيم", "اعداد", "تحضير",
  "ارتب", "اخطط", "اعد", "احضر", "جدوله", "تخطيط", "مخطط"
];

/** Keywords that indicate quiz/coursework help */
const QUIZ_KEYWORDS = [
  "اختبار", "امتحان", "كويز", "تمرين", "واجب", "مشروع",
  "حل", "اجابه", "تصحيح", "تقييم", "درجه", "نتيجه",
  "احل", "اجيب", "اصحح", "اقيم", "احسب", "احلل"
];

/** Keywords that indicate course summary intent */
const SUMMARY_KEYWORDS = [
  "لخص", "ملخص", "خلاصه", "نقاط", "اساسيات", "مهم", "رئيسي",
  "الخص", "اركز", "اوجز", "تلخيص"
];

/** Keywords for flashcards intent */
const FLASHCARD_KEYWORDS = [
  "بطاقات", "فلاش", "حفظ", "استذكار", "تذكر", "بطاقه", "كارت", "كروت"
];

/** Keywords for step-by-step tutor intent */
const TUTOR_KEYWORDS = [
  "خطوه", "خطوات", "وضح", "بالتفصيل", "علمني", "اشرح", "شرح مفصل"
];

/** Keywords for exam revision intent */
const EXAM_REVISION_KEYWORDS = [
  "مراجعه نهائي", "مراجعه فصلي", "امتحان نهائي", "امتحان فصلي", "استعداد امتحان", "تحضير نهائي"
];

/** Keywords for project troubleshooter (system skill) */
const TROUBLESHOOT_KEYWORDS = [
  "خطا", "مشكله", "اصلاح", "لا يعمل", "عطل", "bug", "error", "fix", "debug"
];

/** Keywords for code review (system skill) */
const CODE_REVIEW_KEYWORDS = [
  "مراجعه كود", "قائمة كود", "ممارسات برمجة", "جودة كود", "معايير كود", 
  "review code", "code checklist", "code review", "review checklist", "checklist"
];

/** Keywords that EXPLICITLY indicate damage analysis (opt-in only) */
const DAMAGE_KEYWORDS = [
  "ضرر", "حادث", "سياره", "سيارتي", "خدش", "انبعاج", "تصليح",
  "صيانه", "اصلاح", "حادث مرور", "تصادم", "كسر", "زجاج",
  "طلاء", "هيكل", "محرك", "اطار", "عجله", "مرايا"
];

// ============================================
// Feature Flag Check
// ============================================

/**
 * Check if damage analyzer feature is enabled
 * Default: false for safety
 */
export function isDamageAnalyzerEnabled(): boolean {
  return process.env.AI_DAMAGE_ANALYZER_ENABLED === "true";
}

// ============================================
// Intent Detection Function
// ============================================

/**
 * Detect user intent from message content
 * Uses explicit keyword matching with priority rules
 * Applies Arabic text normalization for robust matching
 */
export function detectIntent(
  message: string,
  hasImages: boolean = false
): IntentDetectionResult {
  // Normalize Arabic text (remove diacritics, tatweel, normalize chars)
  const normalizedMessage = normalizeArabicText(message);

  // Check for damage analyzer intent FIRST (highest priority for safety)
  // Only if feature flag is enabled
  if (isDamageAnalyzerEnabled()) {
    const damageMatch = checkDamageIntent(normalizedMessage, hasImages);
    if (damageMatch.intent === UserIntent.DAMAGE_ANALYZER) {
      return damageMatch;
    }
  }

  // Check for flashcards intent (new)
  const flashcardMatch = checkFlashcardIntent(normalizedMessage);
  if (flashcardMatch.intent === UserIntent.FLASHCARDS) {
    return flashcardMatch;
  }

  // Check for exam revision intent (new)
  const examRevisionMatch = checkExamRevisionIntent(normalizedMessage);
  if (examRevisionMatch.intent === UserIntent.EXAM_REVISION) {
    return examRevisionMatch;
  }

  // Check for step-by-step tutor intent (new)
  const tutorMatch = checkTutorIntent(normalizedMessage);
  if (tutorMatch.intent === UserIntent.STEP_BY_STEP_TUTOR) {
    return tutorMatch;
  }

  // Check for quiz/coursework help
  const quizMatch = checkQuizIntent(normalizedMessage);
  if (quizMatch.intent === UserIntent.QUIZ_HELP) {
    return quizMatch;
  }

  // Check for study plan intent
  const studyPlanMatch = checkStudyPlanIntent(normalizedMessage);
  if (studyPlanMatch.intent === UserIntent.STUDY_PLAN) {
    return studyPlanMatch;
  }

  // Check for course summary intent
  const summaryMatch = checkSummaryIntent(normalizedMessage);
  if (summaryMatch.intent === UserIntent.COURSE_SUMMARY) {
    return summaryMatch;
  }

  // Check for system skills (lower priority than education)
  const troubleshootMatch = checkTroubleshootIntent(normalizedMessage);
  if (troubleshootMatch.intent === UserIntent.PROJECT_TROUBLESHOOTER) {
    return troubleshootMatch;
  }

  const codeReviewMatch = checkCodeReviewIntent(normalizedMessage);
  if (codeReviewMatch.intent === UserIntent.CODE_REVIEW) {
    return codeReviewMatch;
  }

  // Check for general education intent
  const educationMatch = checkEducationIntent(normalizedMessage);
  if (educationMatch.intent === UserIntent.EDUCATION_GENERAL) {
    return educationMatch;
  }

  // Default to unknown - will trigger clarification
  return {
    intent: UserIntent.UNKNOWN,
    confidence: 0,
    keywords: [],
    requiresImages: false,
    metadata: {
      reason: "no_matching_keywords",
      normalizedMessage: normalizedMessage.substring(0, 100)
    }
  };
}

// ============================================
// Intent Check Functions
// ============================================

/**
 * Check for damage analyzer intent
 * VERY STRICT: Only activate if explicit damage keywords + images OR explicit damage keywords
 * OR explicit analysis requests for damage
 */
function checkDamageIntent(message: string, hasImages: boolean): IntentDetectionResult {
  const damageKeywordCount = countMatchingKeywords(message, DAMAGE_KEYWORDS);

  // Check for explicit analysis requests for damage (e.g., "analyze images for damage")
  const hasAnalysisRequest = message.includes("حلل") && (message.includes("الضرر") || message.includes("ضرر")) ||
                            /\b(analyze|assess|check|review|examine)\b.*\b(damage|damaged)\b/i.test(message);

  // Must have at least 2 damage keywords OR 1 keyword + images OR explicit analysis request
  const hasStrongDamageSignal = damageKeywordCount >= 2 || (damageKeywordCount >= 1 && hasImages) || hasAnalysisRequest;

  if (hasStrongDamageSignal) {
    return {
      intent: UserIntent.DAMAGE_ANALYZER,
      confidence: Math.min(0.9 + (damageKeywordCount * 0.05), 1.0),
      keywords: findMatchingKeywords(message, DAMAGE_KEYWORDS),
      requiresImages: !hasImages && !hasAnalysisRequest, // If no images and not explicit analysis request, suggest providing them
      metadata: {
        damageKeywordCount,
        hasImages,
        hasAnalysisRequest
      }
    };
  }

  return {
    intent: UserIntent.UNKNOWN,
    confidence: 0,
    keywords: [],
    requiresImages: false
  };
}

/**
 * Check for study plan intent - STRICT THRESHOLDS
 * Only when: explicit "خطة/plan/جدول" + subject mention OR timeframe OR "مذاكرة" + "خطة"
 */
function checkStudyPlanIntent(message: string): IntentDetectionResult {
  const explicitPlanCount = countMatchingKeywords(message, ["خطه", "جدول", "برنامج", "تنظيم", "تخطيط", "جدوله"]);
  const normalized = normalizeArabicText(message);
  const subjectMentioned = countMatchingKeywords(message, [
    "رياضيات", "فيزياء", "كيمياء", "احياء", "تاريخ", "جغرافيا", "لغه",
    "انجليزي", "عربي", "فرنسي", "الماني", "تركي", "اسباني", "برمجه", "حاسوب", "علوم"
  ]);
  const timeframeMentioned = /(يوم|اسبوع|شهر|ساعه|دقيقه|وقت|زمن|مده|فتره|لمده)/.test(normalized);
  const studyWithPlan = message.includes("مذاكره") && explicitPlanCount >= 1;
  const hasGeneralStudyWord = /(دراسه|دراسة|مذاكره|مذاكرة|مراجعه|مراجعة)/.test(normalized);

  // STRICT: Must have explicit planning keywords AND (subject OR timeframe OR study+plan)
  if (explicitPlanCount >= 1 && (subjectMentioned >= 1 || timeframeMentioned || studyWithPlan || hasGeneralStudyWord)) {
    return {
      intent: UserIntent.STUDY_PLAN,
      confidence: Math.min(0.8 + (explicitPlanCount * 0.1), 0.95),
      keywords: [
        ...findMatchingKeywords(message, ["خطه", "جدول", "برنامج", "تنظيم"])
      ],
      requiresImages: false,
      metadata: {
        explicitPlanCount,
        subjectMentioned: subjectMentioned >= 1,
        timeframeMentioned,
        studyWithPlan
      }
    };
  }

  return {
    intent: UserIntent.UNKNOWN,
    confidence: 0,
    keywords: [],
    requiresImages: false
  };
}

/**
 * Check for quiz/coursework help intent
 */
function checkQuizIntent(message: string): IntentDetectionResult {
  const educationCount = countMatchingKeywords(message, EDUCATION_KEYWORDS);
  const quizCount = countMatchingKeywords(message, QUIZ_KEYWORDS);

  if (educationCount >= 1 && quizCount >= 1) {
    return {
      intent: UserIntent.QUIZ_HELP,
      confidence: Math.min(0.75 + (quizCount * 0.1), 0.9),
      keywords: [
        ...findMatchingKeywords(message, EDUCATION_KEYWORDS),
        ...findMatchingKeywords(message, QUIZ_KEYWORDS)
      ],
      requiresImages: false,
      metadata: {
        educationKeywordCount: educationCount,
        quizKeywordCount: quizCount
      }
    };
  }

  return {
    intent: UserIntent.UNKNOWN,
    confidence: 0,
    keywords: [],
    requiresImages: false
  };
}

/**
 * Check for course summary intent
 */
function checkSummaryIntent(message: string): IntentDetectionResult {
  const educationCount = countMatchingKeywords(message, EDUCATION_KEYWORDS);
  const summaryCount = countMatchingKeywords(message, SUMMARY_KEYWORDS);

  if (educationCount >= 1 && summaryCount >= 1) {
    return {
      intent: UserIntent.COURSE_SUMMARY,
      confidence: Math.min(0.7 + (summaryCount * 0.15), 0.9),
      keywords: [
        ...findMatchingKeywords(message, EDUCATION_KEYWORDS),
        ...findMatchingKeywords(message, SUMMARY_KEYWORDS)
      ],
      requiresImages: false,
      metadata: {
        educationKeywordCount: educationCount,
        summaryKeywordCount: summaryCount
      }
    };
  }

  return {
    intent: UserIntent.UNKNOWN,
    confidence: 0,
    keywords: [],
    requiresImages: false
  };
}

/**
 * Check for general education intent - PERMISSIVE DEFAULT
 * Should catch most education questions that don't have specific planning/exam requirements
 */
function checkEducationIntent(message: string): IntentDetectionResult {
  const normalized = normalizeArabicText(message);
  const educationCount = countMatchingKeywords(message, EDUCATION_KEYWORDS);
  const hasSubject = /\b(رياضيات|فيزياء|كيمياء|احياء|تاريخ|جغرافيا|لغه|انجليزي|عربي|math|physics|chemistry|biology|رياضيت|كيميا|فيزيا)\b/i.test(normalized);
  const hasEducationAction = /\b(ساعدني|مساعده|مساعدة|مسعدة|شرح|فهم|تعلم|علمني|اريد|احتاج|help|explain|teach)\b/i.test(normalized);
  const hasGeneralStudy = /\b(دراسه|مذاكره|تعليم|دراسة|مذاكرة)\b/.test(normalized);
  const hasQuestionWords = /\b(what|how|why)\b/i.test(message);
  // Lightweight typo tolerance for common educational phrases
  const typoEducationSignal = /مسعده|رياضيت/.test(normalized);

  // PERMISSIVE: Any education keyword OR subject + action OR general study terms OR question about subjects
  if (
    educationCount >= 1 ||
    typoEducationSignal ||
    (hasSubject && hasEducationAction) ||
    hasGeneralStudy ||
    (hasQuestionWords && hasSubject)
  ) {
    // Special case: exclude weather questions and very non-educational topics
    const isNonEducational = /\b(طقس|weather|طبخ|cooking|سياسة|politics)\b/i.test(normalized);

    if (!isNonEducational) {
      return {
        intent: UserIntent.EDUCATION_GENERAL,
        confidence: Math.min(0.7 + (educationCount * 0.05), 0.85),
        keywords: findMatchingKeywords(message, EDUCATION_KEYWORDS),
        requiresImages: false,
        metadata: {
          educationKeywordCount: educationCount,
          hasSubject,
          hasEducationAction,
          hasGeneralStudy,
          hasQuestionWords,
          typoEducationSignal
        }
      };
    }
  }

  return {
    intent: UserIntent.UNKNOWN,
    confidence: 0,
    keywords: [],
    requiresImages: false
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Count matching keywords in message (uses normalized text)
 */
function countMatchingKeywords(message: string, keywords: string[]): number {
  const normalizedMessage = normalizeArabicText(message);
  return keywords.filter((keyword) => {
    const normalizedKeyword = normalizeArabicText(keyword);
    return (
      normalizedMessage.includes(normalizedKeyword) ||
      new RegExp(`\\b${normalizedKeyword}\\b`, "i").test(normalizedMessage)
    );
  }).length;
}

/**
 * Find matching keywords in message (uses normalized text)
 */
function findMatchingKeywords(message: string, keywords: string[]): string[] {
  const normalizedMessage = normalizeArabicText(message);
  return keywords.filter((keyword) => {
    const normalizedKeyword = normalizeArabicText(keyword);
    return (
      normalizedMessage.includes(normalizedKeyword) ||
      new RegExp(`\\b${normalizedKeyword}\\b`, "i").test(normalizedMessage)
    );
  });
}

// ============================================
// New Intent Check Functions
// ============================================

/**
 * Check for flashcard intent
 */
function checkFlashcardIntent(message: string): IntentDetectionResult {
  const educationCount = countMatchingKeywords(message, EDUCATION_KEYWORDS);
  const flashcardCount = countMatchingKeywords(message, FLASHCARD_KEYWORDS);

  if (flashcardCount >= 1) {
    return {
      intent: UserIntent.FLASHCARDS,
      confidence: Math.min(0.75 + flashcardCount * 0.15, 0.95),
      keywords: [
        ...findMatchingKeywords(message, FLASHCARD_KEYWORDS),
        ...findMatchingKeywords(message, EDUCATION_KEYWORDS),
      ],
      requiresImages: false,
      metadata: { flashcardKeywordCount: flashcardCount, educationCount },
    };
  }

  return { intent: UserIntent.UNKNOWN, confidence: 0, keywords: [], requiresImages: false };
}

/**
 * Check for exam revision intent - STRICT THRESHOLDS
 * Only when: explicit "مراجعة" + exam/test mention OR "قبل الامتحان"
 */
function checkExamRevisionIntent(message: string): IntentDetectionResult {
  const normalized = normalizeArabicText(message);
  const hasReviewKeyword = normalized.includes("مراجعه");
  const hasExamKeyword =
    normalized.includes("امتحان") ||
    normalized.includes("اختبار") ||
    normalized.includes("exam") ||
    normalized.includes("نهائي") ||
    normalized.includes("فصلي");
  const hasPreparationPhrase =
    normalized.includes("استعداد") && (normalized.includes("امتحان") || normalized.includes("اختبار"));

  // STRICT: Must have explicit review keyword AND exam mention, OR preparation phrase
  if ((hasReviewKeyword && hasExamKeyword) || hasPreparationPhrase) {
    return {
      intent: UserIntent.EXAM_REVISION,
      confidence: 0.85,
      keywords: ["مراجعة", "امتحان"],
      requiresImages: false,
      metadata: { hasReviewKeyword, hasExamKeyword, hasPreparationPhrase }
    };
  }

  return { intent: UserIntent.UNKNOWN, confidence: 0, keywords: [], requiresImages: false };
}

/**
 * Check for step-by-step tutor intent
 */
function checkTutorIntent(message: string): IntentDetectionResult {
  const educationCount = countMatchingKeywords(message, EDUCATION_KEYWORDS);
  const tutorCount = countMatchingKeywords(message, TUTOR_KEYWORDS);

  if (tutorCount >= 1 && educationCount >= 1) {
    return {
      intent: UserIntent.STEP_BY_STEP_TUTOR,
      confidence: Math.min(0.75 + tutorCount * 0.1, 0.9),
      keywords: [
        ...findMatchingKeywords(message, TUTOR_KEYWORDS),
        ...findMatchingKeywords(message, EDUCATION_KEYWORDS),
      ],
      requiresImages: false,
      metadata: { tutorKeywordCount: tutorCount, educationCount },
    };
  }

  return { intent: UserIntent.UNKNOWN, confidence: 0, keywords: [], requiresImages: false };
}

/**
 * Check for project troubleshooter intent (system skill)
 */
function checkTroubleshootIntent(message: string): IntentDetectionResult {
  const troubleshootCount = countMatchingKeywords(message, TROUBLESHOOT_KEYWORDS);

  if (troubleshootCount >= 1) {
    return {
      intent: UserIntent.PROJECT_TROUBLESHOOTER,
      confidence: Math.min(0.7 + troubleshootCount * 0.1, 0.85),
      keywords: findMatchingKeywords(message, TROUBLESHOOT_KEYWORDS),
      requiresImages: false,
      metadata: { troubleshootKeywordCount: troubleshootCount },
    };
  }

  return { intent: UserIntent.UNKNOWN, confidence: 0, keywords: [], requiresImages: false };
}

/**
 * Check for code review intent (system skill)
 */
function checkCodeReviewIntent(message: string): IntentDetectionResult {
  const codeReviewCount = countMatchingKeywords(message, CODE_REVIEW_KEYWORDS);

  if (codeReviewCount >= 1) {
    return {
      intent: UserIntent.CODE_REVIEW,
      confidence: Math.min(0.7 + codeReviewCount * 0.1, 0.85),
      keywords: findMatchingKeywords(message, CODE_REVIEW_KEYWORDS),
      requiresImages: false,
      metadata: { codeReviewKeywordCount: codeReviewCount },
    };
  }

  return { intent: UserIntent.UNKNOWN, confidence: 0, keywords: [], requiresImages: false };
}

// ============================================
// Intent-based Routing (Updated)
// ============================================

/**
 * Route intent to appropriate capability
 */
export function routeIntentToCapability(intent: UserIntent): {
  capabilityName: string;
  skillId: string;
  requiresImages: boolean;
  fallbackMessage?: string;
} {
  switch (intent) {
    case UserIntent.EDUCATION_GENERAL:
      return {
        capabilityName: "educational_assistant",
        skillId: "step_by_step_tutor",
        requiresImages: false,
      };

    case UserIntent.STUDY_PLAN:
      return {
        capabilityName: "study_planner",
        skillId: "study_plan",
        requiresImages: false,
      };

    case UserIntent.QUIZ_HELP:
      return {
        capabilityName: "quiz_helper",
        skillId: "quiz_generator",
        requiresImages: false,
      };

    case UserIntent.COURSE_SUMMARY:
      return {
        capabilityName: "course_summarizer",
        skillId: "course_summary",
        requiresImages: false,
      };

    case UserIntent.FLASHCARDS:
      return {
        capabilityName: "flashcard_generator",
        skillId: "flashcards",
        requiresImages: false,
      };

    case UserIntent.STEP_BY_STEP_TUTOR:
      return {
        capabilityName: "step_by_step_tutor",
        skillId: "step_by_step_tutor",
        requiresImages: false,
      };

    case UserIntent.EXAM_REVISION:
      return {
        capabilityName: "exam_revision_assistant",
        skillId: "exam_revision",
        requiresImages: false,
      };

    case UserIntent.PROJECT_TROUBLESHOOTER:
      return {
        capabilityName: "project_troubleshooter",
        skillId: "project_troubleshooter",
        requiresImages: false,
      };

    case UserIntent.CODE_REVIEW:
      return {
        capabilityName: "code_review_checklist",
        skillId: "code_review_checklist",
        requiresImages: false,
      };

    case UserIntent.DAMAGE_ANALYZER:
      return {
        capabilityName: "damage_analyzer",
        skillId: "damage_analyzer",
        requiresImages: true,
      };

    case UserIntent.UNKNOWN:
    default:
      return {
        capabilityName: "clarification_helper",
        skillId: "step_by_step_tutor",
        requiresImages: false,
        fallbackMessage:
          "عذراً، لم أفهم طلبك بوضوح. هل يمكنك توضيح ما تحتاجه من المساعدة؟ هل هو مساعدة في الدراسة أم شيء آخر؟",
      };
  }
}

/**
 * Check if intent requires admin role
 * Education intents NEVER route to damage analyzer unless explicit
 */
export function intentRequiresAdmin(intent: UserIntent): boolean {
  // Only damage analyzer requires admin AND feature flag
  if (intent === UserIntent.DAMAGE_ANALYZER) {
    return true;
  }
  return false;
}

/**
 * Check if intent requires feature flag
 */
export function intentRequiresFeatureFlag(intent: UserIntent): string | null {
  if (intent === UserIntent.DAMAGE_ANALYZER) {
    return "AI_DAMAGE_ANALYZER_ENABLED";
  }
  return null;
}

/**
 * Get intent display name in Arabic
 */
export function getIntentDisplayName(intent: UserIntent): string {
  switch (intent) {
    case UserIntent.EDUCATION_GENERAL:
      return "مساعدة تعليمية عامة";
    case UserIntent.STUDY_PLAN:
      return "تخطيط الدراسة";
    case UserIntent.QUIZ_HELP:
      return "مساعدة في الاختبارات";
    case UserIntent.COURSE_SUMMARY:
      return "تلخيص الدروس";
    case UserIntent.FLASHCARDS:
      return "البطاقات التعليمية";
    case UserIntent.STEP_BY_STEP_TUTOR:
      return "شرح خطوة بخطوة";
    case UserIntent.EXAM_REVISION:
      return "مراجعة الامتحانات";
    case UserIntent.PROJECT_TROUBLESHOOTER:
      return "استكشاف أخطاء المشاريع";
    case UserIntent.CODE_REVIEW:
      return "مراجعة الكود";
    case UserIntent.DAMAGE_ANALYZER:
      return "تحليل الأضرار";
    case UserIntent.UNKNOWN:
      return "غير محدد";
    default:
      return "غير معروف";
  }
}