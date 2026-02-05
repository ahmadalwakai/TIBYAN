/**
 * Design Engine Unit Tests
 * 
 * Tests for the scalable SVG generation system.
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  createSpec,
  render,
  renderQuick,
  getTheme,
  getPreset,
  listThemeIds,
  listPresetIds,
  validateSpec,
  calculateContrastRatio,
  normalizeSvg,
  type EngineRequest,
  type EngineSpec,
} from "@/lib/zyphon/design-engine";
import { fromLegacySpec, toLegacySpec, renderLegacy } from "@/lib/zyphon/design-engine/adapter";

// ============================================
// Types Tests
// ============================================

describe("Design Engine Types", () => {
  it("should create valid EngineSpec from EngineRequest", () => {
    const request: EngineRequest = {
      presetId: "logo",
      themeId: "emerald",
      text: "تبيان",
      seed: 12345,
      patternIntensity: 0.5,
      circuitIntensity: 0.5,
      accentIntensity: 0.5,
    };
    
    const spec = createSpec(request);
    
    expect(spec.presetId).toBe("logo");
    expect(spec.themeId).toBe("emerald");
    expect(spec.version).toBe("2.0");
    expect(spec.seed).toBe(12345);
    expect(spec.layers.length).toBeGreaterThan(0);
  });
  
  it("should generate random seed if not provided", () => {
    const spec1 = createSpec({ presetId: "logo", themeId: "emerald" });
    const spec2 = createSpec({ presetId: "logo", themeId: "emerald" });
    
    // Seeds should be different (with very high probability)
    expect(spec1.seed).not.toBe(spec2.seed);
  });
});

// ============================================
// Theme Tests
// ============================================

describe("Themes", () => {
  it("should list all theme IDs", () => {
    const ids = listThemeIds();
    expect(ids).toContain("emerald");
    expect(ids).toContain("gold");
    expect(ids).toContain("sapphire");
    expect(ids).toContain("monochrome");
  });
  
  it("should get theme by ID", () => {
    const emerald = getTheme("emerald");
    expect(emerald.id).toBe("emerald");
    expect(emerald.colors.primary).toBe("#00A86B");
  });
  
  it("should fallback to emerald for unknown theme", () => {
    const theme = getTheme("nonexistent");
    expect(theme.id).toBe("emerald");
  });
});

// ============================================
// Preset Tests
// ============================================

describe("Presets", () => {
  it("should list all preset IDs", () => {
    const ids = listPresetIds();
    expect(ids).toContain("logo");
    expect(ids).toContain("banner");
    expect(ids).toContain("pattern");
    expect(ids).toContain("social-card");
  });
  
  it("should get preset by ID", () => {
    const logo = getPreset("logo");
    expect(logo.id).toBe("logo");
    expect(logo.canvas.width).toBe(1024);
    expect(logo.canvas.height).toBe(1024);
  });
  
  it("should have different canvas sizes for different presets", () => {
    const logo = getPreset("logo");
    const banner = getPreset("banner");
    const socialCard = getPreset("social-card");
    
    expect(logo.canvas.width).toBe(1024);
    expect(banner.canvas.width).toBe(1920);
    expect(socialCard.canvas.width).toBe(1200);
  });
  
  it("should not require mark for pattern preset", () => {
    const pattern = getPreset("pattern");
    expect(pattern.constraints.requireMark).toBe(false);
  });
});

// ============================================
// Validator Tests
// ============================================

describe("Validators", () => {
  describe("Contrast Validator", () => {
    it("should calculate correct contrast ratio for black/white", () => {
      const ratio = calculateContrastRatio("#000000", "#FFFFFF");
      expect(ratio).toBeCloseTo(21, 0);
    });
    
    it("should calculate correct contrast ratio for similar colors", () => {
      const ratio = calculateContrastRatio("#333333", "#444444");
      expect(ratio).toBeLessThan(2);
    });
  });
  
  it("should validate spec and return issues", () => {
    const spec = createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "تبيان",
    });
    
    const theme = getTheme("emerald");
    const preset = getPreset("logo");
    
    const result = validateSpec(spec.layers, spec.canvas, theme, preset);
    
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(Array.isArray(result.issues)).toBe(true);
  });
});

// ============================================
// Render Tests
// ============================================

describe("Render Pipeline", () => {
  it("should render valid SVG", () => {
    const spec = createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "تبيان",
      seed: 12345,
    });
    
    const result = render(spec);
    
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("</svg>");
    expect(result.stats.elementCount).toBeGreaterThan(0);
    expect(result.stats.layerCount).toBeGreaterThan(0);
  });
  
  it("should produce deterministic output with same seed", () => {
    const request: EngineRequest = {
      presetId: "logo",
      themeId: "emerald",
      text: "تبيان",
      seed: 12345,
    };
    
    const spec1 = createSpec(request);
    const spec2 = createSpec(request);
    
    const result1 = render(spec1);
    const result2 = render(spec2);
    
    expect(normalizeSvg(result1.svg)).toBe(normalizeSvg(result2.svg));
  });
  
  it("should render different presets", () => {
    const presetIds = ["logo", "banner", "pattern", "social-card"] as const;
    
    for (const presetId of presetIds) {
      const spec = createSpec({
        presetId,
        themeId: "emerald",
        seed: 12345,
      });
      
      const result = render(spec);
      expect(result.svg).toContain("<svg");
    }
  });
  
  it("should render different themes", () => {
    const themeIds = ["emerald", "gold", "sapphire", "monochrome"];
    
    for (const themeId of themeIds) {
      const spec = createSpec({
        presetId: "logo",
        themeId,
        seed: 12345,
      });
      
      const result = render(spec);
      expect(result.svg).toContain("<svg");
    }
  });
  
  it("should quick render without validation", () => {
    const spec = createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "تبيان",
      seed: 12345,
    });
    
    const svg = renderQuick(spec);
    
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });
});

// ============================================
// Adapter Tests (Legacy Compatibility)
// ============================================

describe("Legacy Adapter", () => {
  const legacySpec = {
    canvas: { w: 1024, h: 1024, bg: "#000000" },
    text: {
      value: "تبيان",
      strokeWidth: 10,
      geometryStyle: "kufic-block",
      centered: true,
      scale: 1,
    },
    patterns: {
      islamic: { enabled: true, opacity: 0.08, tile: "8-point-star", scale: 1 },
      circuit: { enabled: true, opacity: 0.18, density: 0.35, nodeRadius: 3 },
    },
    accent: { color: "#00A86B", lineWeight: 3, glow: 0 },
    seed: 12345,
  };
  
  it("should convert legacy spec to engine spec", () => {
    const engineSpec = fromLegacySpec(legacySpec);
    
    expect(engineSpec.version).toBe("2.0");
    expect(engineSpec.canvas.width).toBe(1024);
    expect(engineSpec.canvas.height).toBe(1024);
    expect(engineSpec.seed).toBe(12345);
  });
  
  it("should convert engine spec back to legacy spec", () => {
    const engineSpec = fromLegacySpec(legacySpec);
    const backToLegacy = toLegacySpec(engineSpec);
    
    expect(backToLegacy.canvas.w).toBe(1024);
    expect(backToLegacy.text.value).toBe("تبيان");
  });
  
  it("should render legacy spec using new engine", () => {
    const svg = renderLegacy(legacySpec);
    
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });
});

// ============================================
// Fixture Tests
// ============================================

import fixtureLogoEmerald from "../../../../../fixtures/design-specs/logo-emerald.json";
import fixtureBannerGold from "../../../../../fixtures/design-specs/banner-gold.json";
import fixturePatternSapphire from "../../../../../fixtures/design-specs/pattern-sapphire.json";
import fixtureSocialCardEmerald from "../../../../../fixtures/design-specs/social-card-emerald.json";
import fixtureLogoMonochrome from "../../../../../fixtures/design-specs/logo-monochrome.json";

describe("Fixture Rendering", () => {
  const fixtures: Array<{ name: string; data: EngineRequest }> = [
    { name: "logo-emerald", data: fixtureLogoEmerald as unknown as EngineRequest },
    { name: "banner-gold", data: fixtureBannerGold as unknown as EngineRequest },
    { name: "pattern-sapphire", data: fixturePatternSapphire as unknown as EngineRequest },
    { name: "social-card-emerald", data: fixtureSocialCardEmerald as unknown as EngineRequest },
    { name: "logo-monochrome", data: fixtureLogoMonochrome as unknown as EngineRequest },
  ];
  
  for (const fixture of fixtures) {
    it(`should render fixture: ${fixture.name}`, () => {
      const spec = createSpec(fixture.data);
      const result = render(spec);
      
      expect(result.svg).toContain("<svg");
      expect(result.validation.valid || result.validation.issues.every(i => i.severity === "warning")).toBe(true);
    });
  }
});

// ============================================
// Edge Cases
// ============================================

describe("Edge Cases", () => {
  it("should handle empty text", () => {
    const spec = createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "",
    });
    
    const result = render(spec);
    expect(result.svg).toContain("<svg");
  });
  
  it("should handle very long text", () => {
    const spec = createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "هذا نص طويل جداً لاختبار النظام",
    });
    
    const result = render(spec);
    expect(result.svg).toContain("<svg");
  });
  
  it("should handle extreme intensity values", () => {
    const spec = createSpec({
      presetId: "logo",
      themeId: "emerald",
      patternIntensity: 0,
      circuitIntensity: 0,
      accentIntensity: 0,
    });
    
    const result = render(spec);
    expect(result.svg).toContain("<svg");
  });
  
  it("should handle pattern preset without text", () => {
    const spec = createSpec({
      presetId: "pattern",
      themeId: "sapphire",
    });
    
    const result = render(spec);
    expect(result.svg).toContain("<svg");
    expect(result.validation.valid).toBe(true);
  });
});

// ============================================
// Symbolic Mark Tests
// ============================================

describe("Symbolic Mark Renderer", () => {
  it("should use symbolic-mark as default renderer for logo preset", () => {
    const preset = getPreset("logo");
    const markLayer = preset.defaultLayers.find(l => l.type === "mark");
    expect(markLayer).toBeDefined();
    if (markLayer && markLayer.type === "mark") {
      expect(markLayer.renderer).toBe("symbolic-mark");
    }
  });
  
  it("should render abstract shapes, not text characters", () => {
    const spec = createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "تبيان", // Arabic text as semantic input, NOT rendered
    });
    
    const result = render(spec);
    
    // Should contain rect or line elements (abstract shapes)
    const hasAbstractShapes = 
      result.svg.includes("<rect") || 
      result.svg.includes("<line");
    expect(hasAbstractShapes).toBe(true);
    
    // Should NOT contain text elements in the mark layer
    // (text-fallback and system fonts are deprecated for logo preset)
    expect(result.svg).not.toMatch(/<text[^>]*>تبيان<\/text>/);
  });
  
  it("should produce deterministic output for same seed", () => {
    const request = {
      presetId: "logo" as const,
      themeId: "emerald",
      text: "علامة",
      seed: 42,
    };
    
    const result1 = render(createSpec(request));
    const result2 = render(createSpec(request));
    
    expect(result1.svg).toBe(result2.svg);
  });
  
  it("should produce different output for different seeds", () => {
    const result1 = render(createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "علامة",
      seed: 100,
    }));
    
    const result2 = render(createSpec({
      presetId: "logo",
      themeId: "emerald",
      text: "علامة",
      seed: 200,
    }));
    
    expect(result1.svg).not.toBe(result2.svg);
  });
  
  it("should have pattern and circuit layers disabled by default for logo", () => {
    const preset = getPreset("logo");
    
    const patternLayer = preset.defaultLayers.find(l => l.type === "pattern");
    const circuitLayer = preset.defaultLayers.find(l => l.type === "circuit");
    
    expect(patternLayer?.enabled).toBe(false);
    expect(circuitLayer?.enabled).toBe(false);
  });
  
  it("should not allow text fallback for logo preset constraints", () => {
    const preset = getPreset("logo");
    expect(preset.constraints.allowTextFallback).toBe(false);
  });
  
  it("should have higher dominance requirement for logo preset", () => {
    const preset = getPreset("logo");
    expect(preset.constraints.minMarkDominance).toBeGreaterThanOrEqual(0.4);
  });
});
