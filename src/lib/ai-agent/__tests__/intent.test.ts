/**
 * AI Agent Intent Classification Tests
 * Tests for intent detection and routing system
 * 
 * Includes 30+ Arabic-heavy cases with diacritics/tatweel/mixed lang/edge overlaps
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  detectIntent,
  routeIntentToCapability,
  intentRequiresAdmin,
  intentRequiresFeatureFlag,
  getIntentDisplayName,
  normalizeArabicText,
  isDamageAnalyzerEnabled,
} from "../intent";
import { UserIntent } from "../types";

describe("Arabic Text Normalization", () => {
  it("should remove Arabic diacritics (tashkeel)", () => {
    const withDiacritics = "مُسَاعَدَةٌ فِي الدِّرَاسَةِ";
    const normalized = normalizeArabicText(withDiacritics);
    expect(normalized).not.toContain("ُ");
    expect(normalized).not.toContain("َ");
    expect(normalized).not.toContain("ِ");
    expect(normalized).not.toContain("ٌ");
  });

  it("should remove tatweel (kashida)", () => {
    const withTatweel = "مـــساعـــدة";
    const normalized = normalizeArabicText(withTatweel);
    expect(normalized).toBe("مساعده");
  });

  it("should normalize alef variants", () => {
    expect(normalizeArabicText("أحمد")).toBe("احمد");
    expect(normalizeArabicText("إسلام")).toBe("اسلام");
    expect(normalizeArabicText("آمال")).toBe("امال");
  });

  it("should normalize alef maksura to ya", () => {
    expect(normalizeArabicText("مذاكرى")).toBe("مذاكري");
    expect(normalizeArabicText("على")).toBe("علي");
  });

  it("should normalize taa marbuta to haa", () => {
    expect(normalizeArabicText("مدرسة")).toBe("مدرسه");
    expect(normalizeArabicText("دراسة")).toBe("دراسه");
  });

  it("should handle mixed Arabic/English text", () => {
    const mixed = "أريد help في math";
    const normalized = normalizeArabicText(mixed);
    expect(normalized).toContain("اريد");
    expect(normalized).toContain("help");
  });
});

describe("Intent Detection - EDUCATION_GENERAL", () => {
  it("should detect general education questions", () => {
    const result = detectIntent("ساعدني في فهم الرياضيات");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("should detect subject-specific questions", () => {
    const result = detectIntent("ما هو فيزياء الكم");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("should detect learning requests", () => {
    const result = detectIntent("أريد تعلم البرمجة");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  // Arabic with diacritics
  it("should detect education with diacritics: مُسَاعَدَة", () => {
    const result = detectIntent("أُرِيدُ مُسَاعَدَةً فِي الفِيزِيَاءِ");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  // Arabic with tatweel
  it("should detect education with tatweel: مـــساعـــدة", () => {
    const result = detectIntent("أريد مـــساعـــدة في الـــدراســـة");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  // Mixed language
  it("should detect education in mixed language", () => {
    const result = detectIntent("I need help in الرياضيات");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  // Edge cases for Arabic normalization
  it("should handle complex Arabic with all diacritics", () => {
    const result = detectIntent("أُرِيدُ مُسَاعَدَةً فِي الفِيزِيَاءِ وَالرِّيَاضِيَّاتِ");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  it("should handle zero-width characters", () => {
    const result = detectIntent("مساعدة‌‍‎‏في الدراسة");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  it("should handle Arabic numerals vs English", () => {
    const result = detectIntent("درس رقم ٥ في الرياضيات");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  it("should handle dialects vs classical Arabic", () => {
    const result = detectIntent("بدي مساعدة بالفيزيا"); // Levantine dialect
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  it("should handle typos and misspellings", () => {
    const result = detectIntent("مسعدة في الرياضيت");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  // NEW STRICT THRESHOLDS: Must stay EDUCATION_GENERAL
  it("STRICT: should stay EDUCATION_GENERAL for study without plan", () => {
    expect(detectIntent("أريد مذاكرة الرياضيات").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("ساعدني في دراسة الفيزياء").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("كيف أذاكر الكيمياء").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("مساعدة في تعلم البرمجة").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("شرح موضوع الرياضيات").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("فهم درس الفيزياء").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("تعليم النحو العربي").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("أريد تعلم التاريخ").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("دراسة الأحياء").intent).toBe(UserIntent.EDUCATION_GENERAL);
    expect(detectIntent("مذاكرة علوم الكمبيوتر").intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  it("STRICT: should become STUDY_PLAN only with explicit plan patterns", () => {
    expect(detectIntent("اعمل لي خطة مذاكرة للرياضيات").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("أريد جدول دراسي للفيزياء").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("خطة مذاكرة لمدة شهر").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("برنامج مذاكرة للكيمياء").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("تنظيم وقت الدراسة").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("جدولة المذاكرة لأسبوع").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("تخطيط للدراسة").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("مذاكرة مع خطة منتظمة").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("اريد خطة للأحياء").intent).toBe(UserIntent.STUDY_PLAN);
    expect(detectIntent("جدول للمراجعة").intent).toBe(UserIntent.STUDY_PLAN);
  });
});

describe("Intent Detection - STUDY_PLAN", () => {
  it("should detect study plan requests", () => {
    const result = detectIntent("خطة مذاكرة رياضيات");
    expect(result.intent).toBe(UserIntent.STUDY_PLAN);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("should detect study planning keywords", () => {
    const result = detectIntent("كيف أرتب جدول المذاكرة");
    expect(result.intent).toBe(UserIntent.STUDY_PLAN);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("should require both education and planning keywords", () => {
    const result = detectIntent("خطة سفر");
    expect(result.intent).not.toBe(UserIntent.STUDY_PLAN);
  });

  // With diacritics
  it("should detect study plan with diacritics: خُطَّةُ مُذَاكَرَةٍ", () => {
    const result = detectIntent("خُطَّةُ مُذَاكَرَةٍ لِلرِّيَاضِيَّاتِ");
    expect(result.intent).toBe(UserIntent.STUDY_PLAN);
  });

  // Edge: study plan vs general
  it("should prioritize study plan over general education", () => {
    const result = detectIntent("أحتاج خطة لدراسة الرياضيات");
    expect(result.intent).toBe(UserIntent.STUDY_PLAN);
  });
});

describe("Intent Detection - QUIZ_HELP", () => {
  it("should detect quiz help requests", () => {
    const result = detectIntent("ساعدني في حل تمرين الرياضيات");
    expect(result.intent).toBe(UserIntent.QUIZ_HELP);
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("should detect exam preparation", () => {
    const result = detectIntent("كيف أحضر لاختبار الفيزياء");
    expect(result.intent).toBe(UserIntent.QUIZ_HELP);
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  // With diacritics
  it("should detect quiz with diacritics: اِخْتِبَارٌ", () => {
    const result = detectIntent("أُرِيدُ حَلَّ اِخْتِبَارِ الكِيمِيَاءِ");
    expect(result.intent).toBe(UserIntent.QUIZ_HELP);
  });
});

describe("Intent Detection - COURSE_SUMMARY", () => {
  it("should detect summary requests", () => {
    const result = detectIntent("لخص درس الرياضيات");
    expect(result.intent).toBe(UserIntent.COURSE_SUMMARY);
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("should detect summary keywords", () => {
    const result = detectIntent("أعطني ملخص المادة");
    expect(result.intent).toBe(UserIntent.COURSE_SUMMARY);
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  // With diacritics
  it("should detect summary with diacritics: مُلَخَّصٌ", () => {
    const result = detectIntent("أُرِيدُ مُلَخَّصًا لِلدَّرْسِ");
    expect(result.intent).toBe(UserIntent.COURSE_SUMMARY);
  });
});

describe("Intent Detection - FLASHCARDS (new)", () => {
  it("should detect flashcard requests", () => {
    const result = detectIntent("أنشئ بطاقات تعليمية للمفردات");
    expect(result.intent).toBe(UserIntent.FLASHCARDS);
  });

  it("should detect flashcard with حفظ keyword", () => {
    const result = detectIntent("أريد بطاقات للحفظ");
    expect(result.intent).toBe(UserIntent.FLASHCARDS);
  });

  it("should detect flashcard with diacritics", () => {
    const result = detectIntent("بِطَاقَاتٌ لِلْحِفْظِ");
    expect(result.intent).toBe(UserIntent.FLASHCARDS);
  });
});

describe("Intent Detection - STEP_BY_STEP_TUTOR (new)", () => {
  it("should detect step-by-step requests", () => {
    const result = detectIntent("اشرح لي خطوة بخطوة كيف أحل المعادلة");
    expect(result.intent).toBe(UserIntent.STEP_BY_STEP_TUTOR);
  });

  it("should detect detailed explanation requests", () => {
    const result = detectIntent("وضح بالتفصيل درس الفيزياء");
    expect(result.intent).toBe(UserIntent.STEP_BY_STEP_TUTOR);
  });
});

describe("Intent Detection - EXAM_REVISION (new)", () => {
  it("should detect exam revision requests", () => {
    const result = detectIntent("مراجعة للامتحان النهائي في الرياضيات");
    expect(result.intent).toBe(UserIntent.EXAM_REVISION);
  });

  it("should detect preparation requests", () => {
    const result = detectIntent("استعداد لاختبار الفيزياء الفصلي");
    expect(result.intent).toBe(UserIntent.EXAM_REVISION);
  });
});

describe("Intent Detection - PROJECT_TROUBLESHOOTER (new)", () => {
  it("should detect error troubleshooting", () => {
    const result = detectIntent("لدي خطأ في الكود لا يعمل");
    expect(result.intent).toBe(UserIntent.PROJECT_TROUBLESHOOTER);
  });

  it("should detect English debugging keywords", () => {
    const result = detectIntent("I have a bug to fix");
    expect(result.intent).toBe(UserIntent.PROJECT_TROUBLESHOOTER);
  });
});

describe("Intent Detection - CODE_REVIEW (new)", () => {
  it("should detect code review requests", () => {
    const result = detectIntent("أريد مراجعة كود قائمة الجودة");
    expect(result.intent).toBe(UserIntent.CODE_REVIEW);
  });

  it("should detect checklist requests", () => {
    const result = detectIntent("give me a code review checklist");
    expect(result.intent).toBe(UserIntent.CODE_REVIEW);
  });
});

describe("Intent Detection - DAMAGE_ANALYZER", () => {
  beforeEach(() => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should detect explicit damage keywords", () => {
    const result = detectIntent("سيارتي فيها خدش");
    expect(result.intent).toBe(UserIntent.DAMAGE_ANALYZER);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("should detect multiple damage keywords", () => {
    const result = detectIntent("حادث سيارة انبعاج تصليح");
    expect(result.intent).toBe(UserIntent.DAMAGE_ANALYZER);
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("should not activate on single weak keywords", () => {
    const result = detectIntent("تحليل المشكلة");
    expect(result.intent).not.toBe(UserIntent.DAMAGE_ANALYZER);
  });

  it("should not activate on educational analysis", () => {
    const result = detectIntent("حلل هذا التمرين الرياضي");
    expect(result.intent).not.toBe(UserIntent.DAMAGE_ANALYZER);
  });

  it("should detect explicit damage analysis requests", () => {
    const result = detectIntent("حلل هذه الصور للضرر");
    expect(result.intent).toBe(UserIntent.DAMAGE_ANALYZER);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  // Edge: damage with diacritics
  it("should detect damage with diacritics: ضَرَرٌ", () => {
    const result = detectIntent("سَيَّارَتِي فِيهَا ضَرَرٌ وَخَدْشٌ");
    expect(result.intent).toBe(UserIntent.DAMAGE_ANALYZER);
  });
});

describe("Intent Detection - DAMAGE_ANALYZER Feature Flag", () => {
  beforeEach(() => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should NOT detect damage when feature flag is off", () => {
    const result = detectIntent("سيارتي فيها خدش وانبعاج");
    // Should fall through to another intent or UNKNOWN
    expect(result.intent).not.toBe(UserIntent.DAMAGE_ANALYZER);
  });

  it("should return UNKNOWN for damage requests when disabled", () => {
    const result = detectIntent("حادث سيارة تصادم");
    // Damage keywords alone shouldn't match education
    expect(result.intent).toBe(UserIntent.UNKNOWN);
  });
});

describe("Intent Detection - UNKNOWN", () => {
  it("should return unknown for ambiguous input", () => {
    const result = detectIntent("مرحبا");
    expect(result.intent).toBe(UserIntent.UNKNOWN);
  });

  it("should return unknown for empty input", () => {
    const result = detectIntent("");
    expect(result.intent).toBe(UserIntent.UNKNOWN);
  });

  it("should return unknown for non-educational topics", () => {
    const result = detectIntent("ما هو الطقس اليوم");
    expect(result.intent).toBe(UserIntent.UNKNOWN);
  });

  it("should return unknown for random text", () => {
    const result = detectIntent("xyz abc 123");
    expect(result.intent).toBe(UserIntent.UNKNOWN);
  });
});

describe("Intent Detection - Edge Cases", () => {
  // Edge overlap: quiz vs exam revision
  it("should distinguish quiz help from exam revision", () => {
    const quizResult = detectIntent("حل تمرين رياضيات");
    const examResult = detectIntent("مراجعة للامتحان النهائي في الرياضيات");
    
    expect(quizResult.intent).toBe(UserIntent.QUIZ_HELP);
    expect(examResult.intent).toBe(UserIntent.EXAM_REVISION);
  });

  // Edge: very long input
  it("should handle very long input", () => {
    const longText = "أريد مساعدة في ".repeat(100) + "الرياضيات";
    const result = detectIntent(longText);
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  // Edge: special characters
  it("should handle special characters", () => {
    const result = detectIntent("أريد مساعدة! في الرياضيات؟؟؟");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });

  // Edge: numbers mixed with Arabic
  it("should handle Arabic with numbers", () => {
    const result = detectIntent("أريد حل تمرين رقم 5 في الرياضيات");
    expect(result.intent).toBe(UserIntent.QUIZ_HELP);
  });

  // Edge: all uppercase English
  it("should handle uppercase English", () => {
    const result = detectIntent("I NEED HELP WITH MATH");
    expect(result.intent).toBe(UserIntent.EDUCATION_GENERAL);
  });
});

describe("Intent Routing", () => {
  it("should route EDUCATION_GENERAL to educational_assistant", () => {
    const routing = routeIntentToCapability(UserIntent.EDUCATION_GENERAL);
    expect(routing.capabilityName).toBe("educational_assistant");
    expect(routing.requiresImages).toBe(false);
    expect(routing.skillId).toBe("step_by_step_tutor");
  });

  it("should route STUDY_PLAN to study_planner", () => {
    const routing = routeIntentToCapability(UserIntent.STUDY_PLAN);
    expect(routing.capabilityName).toBe("study_planner");
    expect(routing.skillId).toBe("study_plan");
    expect(routing.requiresImages).toBe(false);
  });

  it("should route QUIZ_HELP to quiz_helper", () => {
    const routing = routeIntentToCapability(UserIntent.QUIZ_HELP);
    expect(routing.capabilityName).toBe("quiz_helper");
    expect(routing.skillId).toBe("quiz_generator");
    expect(routing.requiresImages).toBe(false);
  });

  it("should route COURSE_SUMMARY to course_summarizer", () => {
    const routing = routeIntentToCapability(UserIntent.COURSE_SUMMARY);
    expect(routing.capabilityName).toBe("course_summarizer");
    expect(routing.skillId).toBe("course_summary");
    expect(routing.requiresImages).toBe(false);
  });

  it("should route FLASHCARDS to flashcard_generator", () => {
    const routing = routeIntentToCapability(UserIntent.FLASHCARDS);
    expect(routing.capabilityName).toBe("flashcard_generator");
    expect(routing.skillId).toBe("flashcards");
  });

  it("should route STEP_BY_STEP_TUTOR to step_by_step_tutor", () => {
    const routing = routeIntentToCapability(UserIntent.STEP_BY_STEP_TUTOR);
    expect(routing.capabilityName).toBe("step_by_step_tutor");
    expect(routing.skillId).toBe("step_by_step_tutor");
  });

  it("should route EXAM_REVISION to exam_revision_assistant", () => {
    const routing = routeIntentToCapability(UserIntent.EXAM_REVISION);
    expect(routing.capabilityName).toBe("exam_revision_assistant");
    expect(routing.skillId).toBe("exam_revision");
  });

  it("should route PROJECT_TROUBLESHOOTER to project_troubleshooter", () => {
    const routing = routeIntentToCapability(UserIntent.PROJECT_TROUBLESHOOTER);
    expect(routing.capabilityName).toBe("project_troubleshooter");
    expect(routing.skillId).toBe("project_troubleshooter");
  });

  it("should route CODE_REVIEW to code_review_checklist", () => {
    const routing = routeIntentToCapability(UserIntent.CODE_REVIEW);
    expect(routing.capabilityName).toBe("code_review_checklist");
    expect(routing.skillId).toBe("code_review_checklist");
  });

  it("should route DAMAGE_ANALYZER to damage_analyzer", () => {
    const routing = routeIntentToCapability(UserIntent.DAMAGE_ANALYZER);
    expect(routing.capabilityName).toBe("damage_analyzer");
    expect(routing.skillId).toBe("damage_analyzer");
    expect(routing.requiresImages).toBe(true);
  });

  it("should route UNKNOWN to clarification_helper", () => {
    const routing = routeIntentToCapability(UserIntent.UNKNOWN);
    expect(routing.capabilityName).toBe("clarification_helper");
    expect(routing.requiresImages).toBe(false);
    expect(routing.fallbackMessage).toBeDefined();
  });
});

describe("Admin Requirements", () => {
  it("should require admin for DAMAGE_ANALYZER", () => {
    expect(intentRequiresAdmin(UserIntent.DAMAGE_ANALYZER)).toBe(true);
  });

  it("should not require admin for educational intents", () => {
    expect(intentRequiresAdmin(UserIntent.EDUCATION_GENERAL)).toBe(false);
    expect(intentRequiresAdmin(UserIntent.STUDY_PLAN)).toBe(false);
    expect(intentRequiresAdmin(UserIntent.QUIZ_HELP)).toBe(false);
    expect(intentRequiresAdmin(UserIntent.COURSE_SUMMARY)).toBe(false);
    expect(intentRequiresAdmin(UserIntent.FLASHCARDS)).toBe(false);
    expect(intentRequiresAdmin(UserIntent.STEP_BY_STEP_TUTOR)).toBe(false);
    expect(intentRequiresAdmin(UserIntent.EXAM_REVISION)).toBe(false);
  });

  it("should not require admin for system skills", () => {
    expect(intentRequiresAdmin(UserIntent.PROJECT_TROUBLESHOOTER)).toBe(false);
    expect(intentRequiresAdmin(UserIntent.CODE_REVIEW)).toBe(false);
  });
});

describe("Feature Flag Requirements", () => {
  it("should require feature flag for DAMAGE_ANALYZER", () => {
    expect(intentRequiresFeatureFlag(UserIntent.DAMAGE_ANALYZER)).toBe("AI_DAMAGE_ANALYZER_ENABLED");
  });

  it("should not require feature flag for education intents", () => {
    expect(intentRequiresFeatureFlag(UserIntent.EDUCATION_GENERAL)).toBeNull();
    expect(intentRequiresFeatureFlag(UserIntent.STUDY_PLAN)).toBeNull();
    expect(intentRequiresFeatureFlag(UserIntent.QUIZ_HELP)).toBeNull();
  });
});

describe("Intent Display Names", () => {
  it("should return correct Arabic display names", () => {
    expect(getIntentDisplayName(UserIntent.EDUCATION_GENERAL)).toBe("مساعدة تعليمية عامة");
    expect(getIntentDisplayName(UserIntent.STUDY_PLAN)).toBe("تخطيط الدراسة");
    expect(getIntentDisplayName(UserIntent.QUIZ_HELP)).toBe("مساعدة في الاختبارات");
    expect(getIntentDisplayName(UserIntent.COURSE_SUMMARY)).toBe("تلخيص الدروس");
    expect(getIntentDisplayName(UserIntent.FLASHCARDS)).toBe("البطاقات التعليمية");
    expect(getIntentDisplayName(UserIntent.STEP_BY_STEP_TUTOR)).toBe("شرح خطوة بخطوة");
    expect(getIntentDisplayName(UserIntent.EXAM_REVISION)).toBe("مراجعة الامتحانات");
    expect(getIntentDisplayName(UserIntent.PROJECT_TROUBLESHOOTER)).toBe("استكشاف أخطاء المشاريع");
    expect(getIntentDisplayName(UserIntent.CODE_REVIEW)).toBe("مراجعة الكود");
    expect(getIntentDisplayName(UserIntent.DAMAGE_ANALYZER)).toBe("تحليل الأضرار");
    expect(getIntentDisplayName(UserIntent.UNKNOWN)).toBe("غير محدد");
  });
});

describe("isDamageAnalyzerEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return true when env is true", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "true");
    expect(isDamageAnalyzerEnabled()).toBe(true);
  });

  it("should return false when env is false", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "false");
    expect(isDamageAnalyzerEnabled()).toBe(false);
  });

  it("should return false when env is undefined", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "");
    expect(isDamageAnalyzerEnabled()).toBe(false);
  });
});