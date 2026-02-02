/**
 * AI Agent Tests - Capabilities Module
 * Test file for tool registry
 */

import { describe, it, expect, beforeEach } from "vitest";
import { capabilities, defineToolDef, defineParam } from "../capabilities";
import type { ToolContext } from "../types";

// Create a fresh registry for testing
describe("Capabilities Registry", () => {
  const testContext: ToolContext = {
    sessionId: "test-session",
    userId: "test-user",
    userRole: "STUDENT",
    locale: "ar",
    requestId: "test-request",
  };

  describe("getDefinition", () => {
    it("should return definition for registered tool", () => {
      const def = capabilities.getDefinition("get_course_summary");
      expect(def).toBeDefined();
      expect(def?.name).toBe("get_course_summary");
    });

    it("should return undefined for unregistered tool", () => {
      const def = capabilities.getDefinition("nonexistent_tool");
      expect(def).toBeUndefined();
    });
  });

  describe("getAllDefinitions", () => {
    it("should return all enabled tools", () => {
      const defs = capabilities.getAllDefinitions();
      expect(defs.length).toBeGreaterThan(0);
      expect(defs.every((d) => d.enabled)).toBe(true);
    });

    it("should filter by role", () => {
      const studentDefs = capabilities.getAllDefinitions("STUDENT");
      const adminDefs = capabilities.getAllDefinitions("ADMIN");

      // Admin should have access to more tools
      expect(adminDefs.length).toBeGreaterThanOrEqual(studentDefs.length);
    });

    it("should include tools with no role requirements for any role", () => {
      const studentDefs = capabilities.getAllDefinitions("STUDENT");
      const noRoleTools = studentDefs.filter(
        (d) => d.requiredRoles.length === 0
      );
      expect(noRoleTools.length).toBeGreaterThan(0);
    });
  });

  describe("has", () => {
    it("should return true for registered tools", () => {
      expect(capabilities.has("get_course_summary")).toBe(true);
    });

    it("should return false for unregistered tools", () => {
      expect(capabilities.has("fake_tool")).toBe(false);
    });
  });

  describe("checkPermission", () => {
    it("should allow access to tools with no role requirements", () => {
      expect(capabilities.checkPermission("get_course_summary", "STUDENT")).toBe(
        true
      );
    });

    it("should deny access to admin tools for students", () => {
      expect(
        capabilities.checkPermission("get_learning_insights", "STUDENT")
      ).toBe(false);
    });

    it("should allow admin access to admin tools", () => {
      expect(
        capabilities.checkPermission("get_learning_insights", "ADMIN")
      ).toBe(true);
    });

    it("should deny access without role", () => {
      expect(capabilities.checkPermission("get_course_summary", undefined)).toBe(
        false
      );
    });
  });

  describe("execute", () => {
    it("should execute tool and return result", async () => {
      const result = await capabilities.execute(
        "get_course_summary",
        { courseId: "test-123" },
        testContext
      );

      expect(result.ok).toBe(true);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("should throw for nonexistent tool", async () => {
      await expect(
        capabilities.execute("fake_tool", {}, testContext)
      ).rejects.toThrow();
    });

    it("should throw for permission denied", async () => {
      await expect(
        capabilities.execute("get_learning_insights", { timeRange: "30d" }, {
          ...testContext,
          userRole: "STUDENT",
        })
      ).rejects.toThrow();
    });

    it("should validate required parameters", async () => {
      await expect(
        capabilities.execute("get_course_summary", {}, testContext) // Missing courseId
      ).rejects.toThrow();
    });
  });

  describe("getOpenAITools", () => {
    it("should return OpenAI-compatible tool format", () => {
      const tools = capabilities.getOpenAITools("STUDENT");

      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0]).toHaveProperty("type", "function");
      expect(tools[0]).toHaveProperty("function.name");
      expect(tools[0]).toHaveProperty("function.description");
      expect(tools[0]).toHaveProperty("function.parameters");
    });

    it("should include required parameters in schema", () => {
      const tools = capabilities.getOpenAITools("STUDENT");
      const courseTool = tools.find(
        (t) => t.function.name === "get_course_summary"
      );

      expect(courseTool?.function.parameters.required).toContain("courseId");
    });
  });
});

describe("Helper Functions", () => {
  describe("defineToolDef", () => {
    it("should create tool definition with defaults", () => {
      const def = defineToolDef("test_tool", {
        description: "A test tool",
        descriptionAr: "أداة اختبار",
        parameters: [],
      });

      expect(def.name).toBe("test_tool");
      expect(def.enabled).toBe(true);
      expect(def.requiredRoles).toEqual([]);
    });

    it("should apply custom options", () => {
      const def = defineToolDef("admin_tool", {
        description: "Admin tool",
        descriptionAr: "أداة المسؤول",
        parameters: [],
        requiredRoles: ["ADMIN"],
        enabled: false,
      });

      expect(def.requiredRoles).toEqual(["ADMIN"]);
      expect(def.enabled).toBe(false);
    });
  });

  describe("defineParam", () => {
    it("should create required parameter", () => {
      const param = defineParam("id", "string", "The ID", { required: true });

      expect(param.name).toBe("id");
      expect(param.type).toBe("string");
      expect(param.required).toBe(true);
    });

    it("should create optional parameter with default", () => {
      const param = defineParam("limit", "number", "Max results", {
        default: 10,
      });

      expect(param.required).toBe(false);
      expect(param.default).toBe(10);
    });

    it("should create parameter with enum", () => {
      const param = defineParam("format", "string", "Output format", {
        enum: ["json", "xml", "csv"],
      });

      expect(param.enum).toEqual(["json", "xml", "csv"]);
    });
  });
});

describe("Built-in Tools", () => {
  it("should have get_course_summary registered", () => {
    expect(capabilities.has("get_course_summary")).toBe(true);
  });

  it("should have search_lessons registered", () => {
    expect(capabilities.has("search_lessons")).toBe(true);
  });

  it("should have get_study_plan registered", () => {
    expect(capabilities.has("get_study_plan")).toBe(true);
  });

  it("should have generate_quiz registered", () => {
    expect(capabilities.has("generate_quiz")).toBe(true);
  });

  it("should have get_learning_insights registered", () => {
    expect(capabilities.has("get_learning_insights")).toBe(true);
  });

  it("should have summarize_lesson registered", () => {
    expect(capabilities.has("summarize_lesson")).toBe(true);
  });
});
