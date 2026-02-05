/**
 * Design Engine Type Definitions
 * 
 * Core types for the scalable design generation system.
 * Supports multiple image types (logo, banner, pattern, social-card),
 * themes, and pluggable mark renderers.
 */

import { z } from "zod";

// ============================================
// Core Primitive Schemas
// ============================================

export const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const BoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

// ============================================
// Canvas Schema
// ============================================

export const CanvasSchema = z.object({
  width: z.number().min(64).max(4096).default(1024),
  height: z.number().min(64).max(4096).default(1024),
  background: ColorSchema.default("#000000"),
});

export type Canvas = z.infer<typeof CanvasSchema>;

// ============================================
// Layer Schemas
// ============================================

export const LayerTypeSchema = z.enum([
  "background",
  "pattern",
  "mark",
  "circuit",
  "accent",
  "text-fallback",
  "frame",
  "grid",
  "custom",
]);

export type LayerType = z.infer<typeof LayerTypeSchema>;

export const BaseLayerSchema = z.object({
  id: z.string(),
  type: LayerTypeSchema,
  enabled: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  blendMode: z.enum(["normal", "multiply", "screen", "overlay"]).default("normal"),
  zIndex: z.number().default(0),
});

// Background Layer
export const BackgroundLayerSchema = BaseLayerSchema.extend({
  type: z.literal("background"),
  color: ColorSchema,
  gradient: z.object({
    type: z.enum(["linear", "radial"]),
    stops: z.array(z.object({
      offset: z.number().min(0).max(1),
      color: ColorSchema,
    })),
    angle: z.number().optional(), // for linear
  }).optional(),
});

// Pattern Layer (Islamic geometric patterns)
export const PatternLayerSchema = BaseLayerSchema.extend({
  type: z.literal("pattern"),
  patternType: z.enum(["8-point-star", "6-point-star", "hexagonal", "octagonal", "arabesque", "muqarnas"]).default("8-point-star"),
  tileSize: z.number().min(20).max(200).default(60),
  strokeWidth: z.number().min(0.5).max(5).default(1),
  strokeColor: ColorSchema.optional(),
  fillColor: ColorSchema.optional(),
  rotation: z.number().default(0),
  density: z.number().min(0.1).max(2).default(1),
});

// Mark Layer (main visual element - abstract mark by default)
// CRITICAL: symbolic-mark is the default renderer for logo preset
// Text-based renderers (kufic-block-v2, text-fallback) are deprecated
export const MarkLayerSchema = BaseLayerSchema.extend({
  type: z.literal("mark"),
  renderer: z.enum([
    "symbolic-mark",      // PRIMARY: Abstract geometric marks (default)
    "kufic-block-v2",     // DEPRECATED: Text-based, only if explicitly requested
    "geometric-wordmark", // Abstract shapes
    "abstract-grid",      // Grid-based patterns
    "text-fallback",      // DEPRECATED: System font, only if explicitly requested
  ]).default("symbolic-mark"),
  text: z.string().optional(), // Semantic input only, NOT rendered as text
  color: ColorSchema,
  scale: z.number().min(0.1).max(5).default(1),
  strokeWidth: z.number().min(1).max(100).default(10),
  centered: z.boolean().default(true),
  glow: z.number().min(0).max(1).default(0),
  glowColor: ColorSchema.optional(),
  // For kufic-block-v2 (deprecated)
  blockSpacing: z.number().min(0).max(0.5).default(0.05),
  cornerRadius: z.number().min(0).max(0.5).default(0.1),
  // For geometric-wordmark
  shapeCount: z.number().min(3).max(20).default(5),
  shapeType: z.enum(["squares", "circles", "triangles", "mixed"]).default("squares"),
});

// Circuit Layer
export const CircuitLayerSchema = BaseLayerSchema.extend({
  type: z.literal("circuit"),
  density: z.number().min(0.1).max(1).default(0.35),
  color: ColorSchema,
  nodeRadius: z.number().min(1).max(10).default(3),
  lineWidth: z.number().min(0.5).max(3).default(1),
  maxSegments: z.number().min(2).max(10).default(5),
});

// Accent Layer (decorative elements: corners, frames, lines)
export const AccentLayerSchema = BaseLayerSchema.extend({
  type: z.literal("accent"),
  color: ColorSchema,
  style: z.enum(["corners", "frame", "lines", "dots", "minimal"]).default("corners"),
  lineWeight: z.number().min(1).max(20).default(3),
  glow: z.number().min(0).max(1).default(0),
  margin: z.number().min(10).max(200).default(40),
  cornerSize: z.number().min(20).max(200).default(60),
});

// Text Fallback Layer (system font)
export const TextFallbackLayerSchema = BaseLayerSchema.extend({
  type: z.literal("text-fallback"),
  text: z.string(),
  color: ColorSchema,
  fontSize: z.number().min(12).max(300).default(72),
  fontFamily: z.string().default("system-ui, Arial, sans-serif"),
  fontWeight: z.enum(["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"]).default("bold"),
  textAnchor: z.enum(["start", "middle", "end"]).default("middle"),
});

// Frame Layer (for social cards, banners)
export const FrameLayerSchema = BaseLayerSchema.extend({
  type: z.literal("frame"),
  strokeColor: ColorSchema,
  strokeWidth: z.number().min(1).max(20).default(2),
  cornerRadius: z.number().min(0).max(50).default(0),
  padding: z.number().min(0).max(100).default(20),
});

// Grid Layer (for social cards)
export const GridLayerSchema = BaseLayerSchema.extend({
  type: z.literal("grid"),
  color: ColorSchema,
  cellSize: z.number().min(10).max(200).default(50),
  lineWidth: z.number().min(0.1).max(2).default(0.5),
});

// Union of all layer types
export const LayerSchema = z.discriminatedUnion("type", [
  BackgroundLayerSchema,
  PatternLayerSchema,
  MarkLayerSchema,
  CircuitLayerSchema,
  AccentLayerSchema,
  TextFallbackLayerSchema,
  FrameLayerSchema,
  GridLayerSchema,
]);

export type Layer = z.infer<typeof LayerSchema>;
export type BackgroundLayer = z.infer<typeof BackgroundLayerSchema>;
export type PatternLayer = z.infer<typeof PatternLayerSchema>;
export type MarkLayer = z.infer<typeof MarkLayerSchema>;
export type CircuitLayer = z.infer<typeof CircuitLayerSchema>;
export type AccentLayer = z.infer<typeof AccentLayerSchema>;
export type TextFallbackLayer = z.infer<typeof TextFallbackLayerSchema>;
export type FrameLayer = z.infer<typeof FrameLayerSchema>;
export type GridLayer = z.infer<typeof GridLayerSchema>;

// ============================================
// Theme Schema
// ============================================

export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  colors: z.object({
    background: ColorSchema,
    backgroundAlt: ColorSchema.optional(),
    primary: ColorSchema,
    secondary: ColorSchema,
    accent: ColorSchema,
    text: ColorSchema,
    muted: ColorSchema.optional(),
  }),
  contrastTargets: z.object({
    markVsBackground: z.number().min(1).max(21).default(4.5),
    textVsBackground: z.number().min(1).max(21).default(4.5),
  }).default({ markVsBackground: 4.5, textVsBackground: 4.5 }),
});

export type Theme = z.infer<typeof ThemeSchema>;

// ============================================
// Preset Schema
// ============================================

export const PresetIdSchema = z.enum(["logo", "banner", "pattern", "social-card"]);
export type PresetId = z.infer<typeof PresetIdSchema>;

export const PresetSchema = z.object({
  id: PresetIdSchema,
  name: z.string(),
  description: z.string().optional(),
  canvas: z.object({
    width: z.number(),
    height: z.number(),
  }),
  layerOrder: z.array(LayerTypeSchema),
  defaultLayers: z.array(LayerSchema),
  constraints: z.object({
    // Dominance: main mark must be at least X% of visual weight
    minMarkDominance: z.number().min(0).max(1).default(0.2),
    // Max element count to avoid heavy SVG
    maxElementCount: z.number().min(100).max(10000).default(2000),
    // Require mark layer
    requireMark: z.boolean().default(true),
    // Allow text fallback
    allowTextFallback: z.boolean().default(true),
    // Tileable (for pattern preset)
    tileable: z.boolean().default(false),
    // Auto-adjust on validation failure
    autoAdjust: z.boolean().default(true),
  }),
  allowedStyles: z.array(z.string()).optional(),
});

export type Preset = z.infer<typeof PresetSchema>;

// ============================================
// Engine Spec (full specification for rendering)
// ============================================

export const EngineSpecSchema = z.object({
  presetId: PresetIdSchema,
  themeId: z.string(),
  canvas: CanvasSchema,
  layers: z.array(LayerSchema),
  seed: z.number().int().min(0).max(999999999).default(0),
  version: z.literal("2.0").default("2.0"),
  metadata: z.object({
    text: z.string().optional(),
    style: z.string().optional(),
    mood: z.string().optional(),
  }).optional(),
});

export type EngineSpec = z.infer<typeof EngineSpecSchema>;

// ============================================
// Engine Request (input from API/UI)
// ============================================

export const EngineRequestSchema = z.object({
  presetId: PresetIdSchema.default("logo"),
  themeId: z.string().default("emerald"),
  text: z.string().max(100).optional(), // Semantic input, NOT rendered as text
  seed: z.number().int().min(0).max(999999999).optional(),
  // Intensity sliders (0-1)
  patternIntensity: z.number().min(0).max(1).default(0.5),
  circuitIntensity: z.number().min(0).max(1).default(0.5),
  accentIntensity: z.number().min(0).max(1).default(0.5),
  // Override specific settings
  overrides: z.object({
    canvas: CanvasSchema.partial().optional(),
    // symbolic-mark is default; text-based only if explicitly requested
    markRenderer: z.enum([
      "symbolic-mark",      // DEFAULT: Abstract marks
      "kufic-block-v2",     // DEPRECATED: Only if explicitly requested
      "geometric-wordmark",
      "abstract-grid",
      "text-fallback",      // DEPRECATED: Only if explicitly requested
    ]).optional(),
  }).optional(),
});

// Use z.input for the request type to allow partial inputs with defaults
export type EngineRequest = z.input<typeof EngineRequestSchema>;

// ============================================
// Validation Result
// ============================================

export const ValidationIssueSchema = z.object({
  code: z.enum([
    "OUT_OF_BOUNDS",
    "LOW_CONTRAST",
    "LOW_DOMINANCE",
    "HIGH_COMPLEXITY",
    "MISSING_MARK",
    "INVALID_COLOR",
  ]),
  message: z.string(),
  severity: z.enum(["error", "warning"]),
  layer: z.string().optional(),
  autoFixable: z.boolean().default(false),
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  issues: z.array(ValidationIssueSchema),
  adjustments: z.array(z.object({
    layer: z.string(),
    property: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
  })).optional(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================
// Render Result
// ============================================

export const RenderResultSchema = z.object({
  svg: z.string(),
  spec: EngineSpecSchema,
  validation: ValidationResultSchema,
  stats: z.object({
    elementCount: z.number(),
    renderTimeMs: z.number(),
    layerCount: z.number(),
  }),
});

export type RenderResult = z.infer<typeof RenderResultSchema>;

// ============================================
// Mark Renderer Interface
// ============================================

export interface MarkRendererContext {
  canvas: Canvas;
  layer: MarkLayer;
  theme: Theme;
  seed: number;
}

export interface MarkRendererResult {
  svg: string;
  bounds: { x: number; y: number; width: number; height: number };
  elementCount: number;
}

export interface MarkRenderer {
  id: string;
  name: string;
  supportedScripts: ("arabic" | "latin" | "abstract")[];
  render(ctx: MarkRendererContext): MarkRendererResult;
}

// ============================================
// Layer Renderer Interface
// ============================================

export interface LayerRendererContext {
  canvas: Canvas;
  theme: Theme;
  seed: number;
  allLayers: Layer[];
}

export interface LayerRendererResult {
  svg: string;
  elementCount: number;
}

export interface LayerRenderer<T extends Layer = Layer> {
  type: LayerType;
  render(layer: T, ctx: LayerRendererContext): LayerRendererResult;
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// ============================================
// Re-export compatibility types for legacy code
// ============================================

/** @deprecated Use EngineSpec instead */
export type LegacyDesignSpec = {
  canvas: { w: number; h: number; bg: string };
  text: {
    value: string;
    strokeWidth: number;
    geometryStyle: string;
    centered: boolean;
    color?: string;
    scale: number;
  };
  patterns?: {
    islamic?: { enabled: boolean; opacity: number; tile: string; scale: number; color?: string };
    circuit?: { enabled: boolean; opacity: number; density: number; color?: string; nodeRadius: number };
  };
  accent?: { color: string; lineWeight: number; glow: number };
  seed: number;
};
