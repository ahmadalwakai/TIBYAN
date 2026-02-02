/**
 * AI Agent Skills Evaluation Tests
 * Tests for skill selection, output validation, and leakage detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SKILLS_REGISTRY,
  getAllSkillIds,
  getSkillById,
  getSkillsByCategory,
  getEnabledSkills,
  getAvailableSkills,
  matchSkill,
  validateSkillOutput,
  checkForLeakage,
  SKILL_STUDY_PLAN,
  SKILL_QUIZ_GENERATOR,
  SKILL_COURSE_SUMMARY,
  SKILL_FLASHCARDS,
  SKILL_STEP_BY_STEP_TUTOR,
  SKILL_EXAM_REVISION,
  SKILL_PROJECT_TROUBLESHOOTER,
  SKILL_CODE_REVIEW_CHECKLIST,
  SKILL_DAMAGE_ANALYZER,
} from "../skills";

describe("Skills Registry", () => {
  it("should have at least 9 skills registered", () => {
    expect(SKILLS_REGISTRY.length).toBeGreaterThanOrEqual(9);
  });

  it("should have 6 education skills", () => {
    const educationSkills = getSkillsByCategory("education");
    expect(educationSkills.length).toBe(6);
  });

  it("should have 2 system skills", () => {
    const systemSkills = getSkillsByCategory("system");
    expect(systemSkills.length).toBe(2);
  });

  it("should have 1 analysis skill (admin-only)", () => {
    const analysisSkills = getSkillsByCategory("analysis");
    expect(analysisSkills.length).toBe(1);
    expect(analysisSkills[0].requiresAdmin).toBe(true);
  });

  it("should return all skill IDs", () => {
    const ids = getAllSkillIds();
    expect(ids).toContain("study_plan");
    expect(ids).toContain("quiz_generator");
    expect(ids).toContain("course_summary");
    expect(ids).toContain("flashcards");
    expect(ids).toContain("step_by_step_tutor");
    expect(ids).toContain("exam_revision");
    expect(ids).toContain("project_troubleshooter");
    expect(ids).toContain("code_review_checklist");
    expect(ids).toContain("damage_analyzer");
  });
});

describe("Skill Definitions", () => {
  describe("SKILL_STUDY_PLAN", () => {
    it("should have correct structure", () => {
      expect(SKILL_STUDY_PLAN.id).toBe("study_plan");
      expect(SKILL_STUDY_PLAN.category).toBe("education");
      expect(SKILL_STUDY_PLAN.requiresAdmin).toBe(false);
      expect(SKILL_STUDY_PLAN.enabled).toBe(true);
    });

    it("should have Arabic name and description", () => {
      expect(SKILL_STUDY_PLAN.nameAr).toBeDefined();
      expect(SKILL_STUDY_PLAN.descriptionAr).toBeDefined();
      expect(SKILL_STUDY_PLAN.nameAr.length).toBeGreaterThan(0);
    });

    it("should have triggers with both languages", () => {
      expect(SKILL_STUDY_PLAN.triggers.keywords.length).toBeGreaterThan(0);
      expect(SKILL_STUDY_PLAN.triggers.keywordsAr.length).toBeGreaterThan(0);
    });

    it("should have at least one example", () => {
      expect(SKILL_STUDY_PLAN.examples.length).toBeGreaterThan(0);
      expect(SKILL_STUDY_PLAN.examples[0].inputAr).toBeDefined();
    });
  });

  describe("SKILL_QUIZ_GENERATOR", () => {
    it("should have correct structure", () => {
      expect(SKILL_QUIZ_GENERATOR.id).toBe("quiz_generator");
      expect(SKILL_QUIZ_GENERATOR.category).toBe("education");
    });

    it("should have JSON output schema", () => {
      expect(SKILL_QUIZ_GENERATOR.outputSchema.type).toBe("json");
    });
  });

  describe("SKILL_DAMAGE_ANALYZER", () => {
    it("should require admin", () => {
      expect(SKILL_DAMAGE_ANALYZER.requiresAdmin).toBe(true);
    });

    it("should require feature flag", () => {
      expect(SKILL_DAMAGE_ANALYZER.requiresFeatureFlag).toBe("AI_DAMAGE_ANALYZER_ENABLED");
    });

    it("should have safety rules", () => {
      expect(SKILL_DAMAGE_ANALYZER.safetyRules.length).toBeGreaterThan(0);
      const adminRule = SKILL_DAMAGE_ANALYZER.safetyRules.find(r => r.id === "admin_only");
      expect(adminRule).toBeDefined();
    });
  });
});

describe("getSkillById", () => {
  it("should return skill by ID", () => {
    const skill = getSkillById("study_plan");
    expect(skill).toBeDefined();
    expect(skill?.id).toBe("study_plan");
  });

  it("should return undefined for unknown ID", () => {
    const skill = getSkillById("unknown_skill");
    expect(skill).toBeUndefined();
  });
});

describe("getAvailableSkills", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return non-admin skills for regular users", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "true");
    const skills = getAvailableSkills(false);
    expect(skills.every(s => !s.requiresAdmin)).toBe(true);
    expect(skills.find(s => s.id === "damage_analyzer")).toBeUndefined();
  });

  it("should include admin skills for admin users when flag is on", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "true");
    const skills = getAvailableSkills(true);
    expect(skills.find(s => s.id === "damage_analyzer")).toBeDefined();
  });

  it("should exclude damage analyzer when feature flag is off", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "false");
    const skills = getAvailableSkills(true);
    expect(skills.find(s => s.id === "damage_analyzer")).toBeUndefined();
  });
});

describe("matchSkill", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should match study_plan for plan keywords", () => {
    const result = matchSkill("أريد خطة مذاكرة", false);
    expect(result.skillId).toBe("study_plan");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should match quiz_generator for quiz keywords", () => {
    const result = matchSkill("أنشئ اختبار للطلاب", false);
    expect(result.skillId).toBe("quiz_generator");
  });

  it("should match flashcards for flashcard keywords", () => {
    const result = matchSkill("أريد بطاقات للحفظ", false);
    expect(result.skillId).toBe("flashcards");
  });

  it("should not match damage_analyzer for non-admin", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "true");
    const result = matchSkill("حلل ضرر السيارة", false);
    expect(result.skillId).not.toBe("damage_analyzer");
  });

  it("should match damage_analyzer for admin when enabled", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "true");
    const result = matchSkill("حلل ضرر السيارة خدش", true);
    expect(result.skillId).toBe("damage_analyzer");
  });

  it("should return null skillId for no match", () => {
    const result = matchSkill("مرحبا كيف الحال", false);
    expect(result.skillId).toBeNull();
    expect(result.confidence).toBe(0);
  });
});

describe("validateSkillOutput", () => {
  it("should validate valid study_plan output", () => {
    const output = {
      planTitle: "خطة مذاكرة الرياضيات",
      duration: "أسبوعين",
      phases: [{ day: 1, tasks: ["مراجعة"] }],
      tips: ["نصيحة 1"],
    };
    const result = validateSkillOutput("study_plan", output);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject missing required fields", () => {
    const output = {
      planTitle: "خطة",
      // missing duration and phases
    };
    const result = validateSkillOutput("study_plan", output);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should reject non-object output for json schema", () => {
    const result = validateSkillOutput("quiz_generator", "not an object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Expected object output for skill quiz_generator");
  });

  it("should reject unknown skill ID", () => {
    const result = validateSkillOutput("unknown_skill", {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Unknown skill");
  });
});

describe("checkForLeakage", () => {
  it("should detect system prompt leakage", () => {
    const output = "Here is the response. [SYSTEM] You are an AI assistant...";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should detect DEBUG: prefix", () => {
    const output = "DEBUG: Internal error occurred";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should detect API_KEY exposure", () => {
    const output = "Your API_KEY is sk-123456";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should detect .env reference", () => {
    const output = "Check your .env file for settings";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should detect process.env reference", () => {
    const output = "Use process.env.SECRET to access";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should detect llama-server reference", () => {
    const output = "llama-server is not running";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should detect localhost URL", () => {
    const output = "Connect to localhost:8080";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should detect Bearer token", () => {
    const output = "Authorization: Bearer sk12345abc";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(true);
  });

  it("should pass clean output", () => {
    const output = "مرحباً! أنا مساعد تبيان التعليمي. كيف يمكنني مساعدتك؟";
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(false);
    expect(result.issues).toHaveLength(0);
  });

  it("should pass normal educational content", () => {
    const output = `
      خطة مذاكرة الرياضيات:
      1. مراجعة الجبر
      2. حل التمارين
      3. مراجعة الهندسة
    `;
    const result = checkForLeakage(output);
    expect(result.leaked).toBe(false);
  });
});

describe("Skill Examples Validation", () => {
  it("should have valid examples for all skills", () => {
    for (const skill of SKILLS_REGISTRY) {
      expect(skill.examples.length).toBeGreaterThan(0);
      for (const example of skill.examples) {
        expect(example.input.length).toBeGreaterThan(0);
        expect(example.inputAr.length).toBeGreaterThan(0);
        expect(example.expectedOutput.length).toBeGreaterThan(0);
        expect(example.expectedOutputAr.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Skill Safety Rules", () => {
  it("should have safety rules for education skills", () => {
    const educationSkills = getSkillsByCategory("education");
    for (const skill of educationSkills) {
      expect(skill.safetyRules.length).toBeGreaterThan(0);
    }
  });

  it("should have blocking safety rules for damage analyzer", () => {
    const blockingRules = SKILL_DAMAGE_ANALYZER.safetyRules.filter(
      (r) => r.enforcement === "block"
    );
    expect(blockingRules.length).toBeGreaterThan(0);
  });

  it("should have Arabic descriptions for all safety rules", () => {
    for (const skill of SKILLS_REGISTRY) {
      for (const rule of skill.safetyRules) {
        expect(rule.descriptionAr.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Skill Triggers", () => {
  it("should have minKeywordMatches >= 1 for all skills", () => {
    for (const skill of SKILLS_REGISTRY) {
      expect(skill.triggers.minKeywordMatches).toBeGreaterThanOrEqual(1);
    }
  });

  it("should have both English and Arabic keywords", () => {
    for (const skill of SKILLS_REGISTRY) {
      expect(skill.triggers.keywords.length).toBeGreaterThan(0);
      expect(skill.triggers.keywordsAr.length).toBeGreaterThan(0);
    }
  });
});

describe("Integration: Skill Selection for Representative Prompts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const testCases = [
    { prompt: "أحتاج خطة مذاكرة للفيزياء قبل الامتحان", expectedSkill: "study_plan" },
    { prompt: "أنشئ 5 أسئلة اختبار عن البرمجة", expectedSkill: "quiz_generator" },
    { prompt: "لخص الدرس الثالث من دورة القرآن", expectedSkill: "course_summary" },
    { prompt: "أريد بطاقات تعليمية للمفردات الإنجليزية", expectedSkill: "flashcards" },
    { prompt: "اشرح لي خطوة بخطوة كيف أحل المعادلات", expectedSkill: "step_by_step_tutor" },
    { prompt: "ساعدني في مراجعة للامتحان النهائي", expectedSkill: "exam_revision" },
    { prompt: "لدي خطأ في الكود لا يعمل", expectedSkill: "project_troubleshooter" },
    { prompt: "أعطني قائمة مراجعة كود", expectedSkill: "code_review_checklist" },
  ];

  for (const { prompt, expectedSkill } of testCases) {
    it(`should select "${expectedSkill}" for: "${prompt.substring(0, 30)}..."`, () => {
      const result = matchSkill(prompt, false);
      expect(result.skillId).toBe(expectedSkill);
    });
  }

  it("should select damage_analyzer for damage prompt (admin + flag)", () => {
    vi.stubEnv("AI_DAMAGE_ANALYZER_ENABLED", "true");
    const result = matchSkill("سيارتي فيها خدش وانبعاج ضرر", true);
    expect(result.skillId).toBe("damage_analyzer");
  });
});
