/**
 * Validator Unit Tests
 * 
 * Tests for individual validators.
 */

import { describe, it, expect } from "vitest";
import {
  validateContrast,
  validateBounds,
  validateDominance,
  validateComplexity,
  calculateContrastRatio,
  suggestContrastFix,
  suggestDominanceFix,
  suggestComplexityFix,
} from "../validators";
import { getTheme } from "../themes";
import { getPreset } from "../presets";
import type { Layer, Canvas, MarkLayer, PatternLayer, CircuitLayer, BackgroundLayer } from "../types";

// ============================================
// Test Helpers
// ============================================

function createTestCanvas(width = 1024, height = 1024): Canvas {
  return { width, height, background: "#000000" };
}

function createTestLayers(): Layer[] {
  return [
    {
      id: "bg",
      type: "background",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 0,
      color: "#000000",
    } as BackgroundLayer,
    {
      id: "mark",
      type: "mark",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 3,
      renderer: "kufic-block-v2",
      text: "تبيان",
      color: "#FFFFFF",
      scale: 1,
      strokeWidth: 10,
      centered: true,
      glow: 0,
      blockSpacing: 0.05,
      cornerRadius: 0.1,
      shapeCount: 5,
      shapeType: "squares",
    } as MarkLayer,
    {
      id: "pattern",
      type: "pattern",
      enabled: true,
      opacity: 0.08,
      blendMode: "normal",
      zIndex: 1,
      patternType: "8-point-star",
      tileSize: 60,
      strokeWidth: 1,
      rotation: 0,
      density: 1,
    } as PatternLayer,
  ];
}

// ============================================
// Contrast Validator Tests
// ============================================

describe("Contrast Validator", () => {
  it("should calculate correct contrast ratio for pure black and white", () => {
    const ratio = calculateContrastRatio("#000000", "#FFFFFF");
    expect(ratio).toBeCloseTo(21, 1);
  });
  
  it("should calculate contrast ratio of 1 for same colors", () => {
    const ratio = calculateContrastRatio("#FF0000", "#FF0000");
    expect(ratio).toBe(1);
  });
  
  it("should pass validation for high contrast", () => {
    const layers = createTestLayers();
    const theme = getTheme("emerald");
    
    const issues = validateContrast(layers, theme);
    
    // White on black should pass
    expect(issues.filter(i => i.code === "LOW_CONTRAST")).toHaveLength(0);
  });
  
  it("should fail validation for low contrast", () => {
    const layers = createTestLayers();
    const markLayer = layers.find(l => l.id === "mark") as MarkLayer;
    markLayer.color = "#111111"; // Very dark on black background
    
    const theme = getTheme("emerald");
    const issues = validateContrast(layers, theme);
    
    expect(issues.filter(i => i.code === "LOW_CONTRAST").length).toBeGreaterThan(0);
  });
  
  it("should suggest white for dark backgrounds", () => {
    const suggestion = suggestContrastFix("#000000", "#333333", 4.5);
    expect(suggestion).toBe("#FFFFFF");
  });
  
  it("should suggest black for light backgrounds", () => {
    const suggestion = suggestContrastFix("#FFFFFF", "#CCCCCC", 4.5);
    expect(suggestion).toBe("#000000");
  });
});

// ============================================
// Bounds Validator Tests
// ============================================

describe("Bounds Validator", () => {
  it("should pass for centered elements", () => {
    const layers = createTestLayers();
    const canvas = createTestCanvas();
    
    const issues = validateBounds(layers, canvas);
    
    // Default centered mark should be in bounds
    const boundIssues = issues.filter(i => i.code === "OUT_OF_BOUNDS");
    expect(boundIssues).toHaveLength(0);
  });
  
  it("should warn for large accent on small canvas", () => {
    const layers: Layer[] = [
      {
        id: "accent",
        type: "accent",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        zIndex: 4,
        color: "#00A86B",
        style: "corners",
        lineWeight: 3,
        glow: 0,
        margin: 100, // Large margin
        cornerSize: 100, // Large corner
      },
    ];
    
    const canvas = createTestCanvas(256, 256); // Small canvas
    const issues = validateBounds(layers, canvas);
    
    // Should have bounds warning
    const boundIssues = issues.filter(i => i.code === "OUT_OF_BOUNDS");
    expect(boundIssues.length).toBeGreaterThan(0);
  });
});

// ============================================
// Dominance Validator Tests
// ============================================

describe("Dominance Validator", () => {
  it("should pass when mark has sufficient dominance", () => {
    const layers = createTestLayers();
    const canvas = createTestCanvas();
    const preset = getPreset("logo");
    
    const issues = validateDominance(layers, canvas, preset);
    
    // Default setup should have good dominance
    const domIssues = issues.filter(i => i.code === "LOW_DOMINANCE");
    expect(domIssues).toHaveLength(0);
  });
  
  it("should fail when mark is missing for logo preset", () => {
    const layers: Layer[] = [
      {
        id: "bg",
        type: "background",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        zIndex: 0,
        color: "#000000",
      } as BackgroundLayer,
    ];
    
    const canvas = createTestCanvas();
    const preset = getPreset("logo");
    
    const issues = validateDominance(layers, canvas, preset);
    
    const missingMark = issues.filter(i => i.code === "MISSING_MARK");
    expect(missingMark.length).toBeGreaterThan(0);
  });
  
  it("should pass without mark for pattern preset", () => {
    const layers: Layer[] = [
      {
        id: "bg",
        type: "background",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        zIndex: 0,
        color: "#000000",
      } as BackgroundLayer,
      {
        id: "pattern",
        type: "pattern",
        enabled: true,
        opacity: 0.15,
        blendMode: "normal",
        zIndex: 1,
        patternType: "8-point-star",
        tileSize: 64,
        strokeWidth: 1,
        rotation: 0,
        density: 1,
      } as PatternLayer,
    ];
    
    const canvas = createTestCanvas(512, 512);
    const preset = getPreset("pattern");
    
    const issues = validateDominance(layers, canvas, preset);
    
    // Pattern preset doesn't require mark
    const missingMark = issues.filter(i => i.code === "MISSING_MARK");
    expect(missingMark).toHaveLength(0);
  });
  
  it("should suggest fixes for low dominance", () => {
    const layers = createTestLayers();
    const fixes = suggestDominanceFix(layers, 0.3);
    
    expect(fixes.length).toBeGreaterThan(0);
    // Should suggest reducing pattern opacity or increasing mark scale
    expect(fixes.some(f => f.property === "opacity" || f.property === "scale")).toBe(true);
  });
});

// ============================================
// Complexity Validator Tests
// ============================================

describe("Complexity Validator", () => {
  it("should pass for simple designs", () => {
    const layers = createTestLayers();
    const canvas = createTestCanvas();
    const preset = getPreset("logo");
    
    const issues = validateComplexity(layers, canvas, preset);
    
    const complexIssues = issues.filter(i => i.code === "HIGH_COMPLEXITY");
    expect(complexIssues).toHaveLength(0);
  });
  
  it("should warn for high density patterns", () => {
    const layers: Layer[] = [
      {
        id: "pattern",
        type: "pattern",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        zIndex: 1,
        patternType: "8-point-star",
        tileSize: 10, // Very small tiles = many elements
        strokeWidth: 1,
        rotation: 0,
        density: 2, // High density
      } as PatternLayer,
    ];
    
    const canvas = createTestCanvas(2048, 2048); // Large canvas
    const preset = getPreset("logo");
    
    const issues = validateComplexity(layers, canvas, preset);
    
    const complexIssues = issues.filter(i => i.code === "HIGH_COMPLEXITY");
    expect(complexIssues.length).toBeGreaterThan(0);
  });
  
  it("should suggest fixes for high complexity", () => {
    const layers: Layer[] = [
      {
        id: "pattern",
        type: "pattern",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        zIndex: 1,
        patternType: "8-point-star",
        tileSize: 20,
        strokeWidth: 1,
        rotation: 0,
        density: 1,
      } as PatternLayer,
    ];
    
    const canvas = createTestCanvas();
    const fixes = suggestComplexityFix(layers, canvas, 500);
    
    expect(fixes.length).toBeGreaterThan(0);
    // Should suggest increasing tile size or reducing density
    expect(fixes.some(f => f.property === "tileSize" || f.property === "density")).toBe(true);
  });
});
