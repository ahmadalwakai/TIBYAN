/**
 * Design Engine - Main Entry Point
 * 
 * Scalable SVG generation system supporting multiple image types,
 * styles, colors, and extensible mark renderers.
 * 
 * @example
 * ```typescript
 * import { createSpec, render } from "@/lib/zyphon/design-engine";
 * 
 * const spec = createSpec({
 *   presetId: "logo",
 *   themeId: "emerald",
 *   text: "تبيان",
 * });
 * 
 * const result = render(spec);
 * console.log(result.svg);
 * ```
 */

// Export types
export type {
  Canvas,
  Layer,
  LayerType,
  BackgroundLayer,
  PatternLayer,
  MarkLayer,
  CircuitLayer,
  AccentLayer,
  TextFallbackLayer,
  FrameLayer,
  GridLayer,
  Theme,
  Preset,
  PresetId,
  EngineSpec,
  EngineRequest,
  ValidationIssue,
  ValidationResult,
  RenderResult,
  MarkRenderer,
  MarkRendererContext,
  MarkRendererResult,
  LayerRenderer,
  LayerRendererContext,
  LayerRendererResult,
  LegacyDesignSpec,
} from "./types";

// Export schemas
export {
  CanvasSchema,
  LayerSchema,
  ThemeSchema,
  PresetSchema,
  EngineSpecSchema,
  EngineRequestSchema,
  ValidationResultSchema,
  createSeededRandom,
} from "./types";

// Export themes
export {
  emeraldTheme,
  goldTheme,
  sapphireTheme,
  monochromeTheme,
  getTheme,
  listThemeIds,
  registerTheme,
} from "./themes";

// Export presets
export {
  logoPreset,
  bannerPreset,
  patternPreset,
  socialCardPreset,
  getPreset,
  listPresetIds,
  registerPreset,
} from "./presets";

// Export layer utilities
export {
  renderLayer,
  renderBackground,
  renderMainMark,
  renderGeometricPattern,
  renderCircuit,
  renderAccent,
  renderFrame,
  renderGrid,
  getMarkRenderer,
  registerMarkRenderer,
} from "./layers";

// Export symbolic mark renderer
export { symbolicMarkRenderer } from "./marks";
export type { SymbolicMarkInput } from "./marks";

// Export validators
export {
  validateSpec,
  validateAndFix,
  validateContrast,
  validateBounds,
  validateDominance,
  validateComplexity,
  calculateContrastRatio,
} from "./validators";

// Export render pipeline
export {
  render,
  renderQuick,
  composeSvg,
  escapeXml,
  normalizeSvg,
} from "./render";

// Export registry
export {
  getAllPresets,
  getAllThemes,
  getRegistrySummary,
  validateRegistryIds,
} from "./registry";

// Import for spec builder
import type { EngineSpec, EngineRequest, Layer, PresetId } from "./types";
import { EngineRequestSchema, createSeededRandom } from "./types";
import { getPreset } from "./presets";
import { getTheme } from "./themes";

/**
 * Create an EngineSpec from a request
 */
export function createSpec(request: EngineRequest): EngineSpec {
  // Validate request
  const validated = EngineRequestSchema.parse(request);
  
  // Get preset and theme
  const preset = getPreset(validated.presetId);
  const theme = getTheme(validated.themeId);
  
  // Generate seed if not provided
  const seed = validated.seed ?? Math.floor(Math.random() * 999999999);
  
  // Clone default layers
  const layers = JSON.parse(JSON.stringify(preset.defaultLayers)) as Layer[];
  
  // Apply theme colors to layers
  for (const layer of layers) {
    if (layer.type === "background") {
      layer.color = theme.colors.background;
    }
    if (layer.type === "mark") {
      layer.color = theme.colors.text;
      if (validated.text) {
        layer.text = validated.text;
      }
      if (validated.overrides?.markRenderer) {
        layer.renderer = validated.overrides.markRenderer;
      }
    }
    if (layer.type === "pattern") {
      layer.strokeColor = theme.colors.primary;
      layer.opacity = 0.05 + validated.patternIntensity * 0.15;
    }
    if (layer.type === "circuit") {
      layer.color = theme.colors.text;
      layer.density = 0.1 + validated.circuitIntensity * 0.4;
      layer.opacity = 0.05 + validated.circuitIntensity * 0.2;
    }
    if (layer.type === "accent") {
      layer.color = theme.colors.accent;
      layer.opacity = 0.5 + validated.accentIntensity * 0.5;
    }
    if (layer.type === "frame") {
      layer.strokeColor = theme.colors.muted || theme.colors.secondary;
    }
    if (layer.type === "grid") {
      layer.color = theme.colors.muted || theme.colors.text;
    }
  }
  
  // Apply canvas overrides
  const canvas = {
    width: validated.overrides?.canvas?.width ?? preset.canvas.width,
    height: validated.overrides?.canvas?.height ?? preset.canvas.height,
    background: validated.overrides?.canvas?.background ?? theme.colors.background,
  };
  
  return {
    presetId: validated.presetId,
    themeId: validated.themeId,
    canvas,
    layers,
    seed,
    version: "2.0",
    metadata: {
      text: validated.text,
    },
  };
}

/**
 * Create and render in one call
 */
export function createAndRender(request: EngineRequest) {
  const { render } = require("./render");
  const spec = createSpec(request);
  return render(spec);
}

// Default export
export default {
  createSpec,
  createAndRender,
};
