/**
 * Render Pipeline
 * 
 * Orchestrates layer rendering in the correct order.
 */

import type {
  EngineSpec,
  Canvas,
  Layer,
  Theme,
  Preset,
  RenderResult,
  LayerRendererContext,
} from "../types";
import { renderLayer } from "../layers";
import { validateAndFix } from "../validators";
import { getTheme } from "../themes";
import { getPreset } from "../presets";
import { composeSvg } from "./svg";

/**
 * Build rendering context
 */
function buildContext(
  canvas: Canvas,
  theme: Theme,
  seed: number,
  allLayers: Layer[]
): LayerRendererContext {
  return {
    canvas,
    theme,
    seed,
    allLayers,
  };
}

/**
 * Sort layers by z-index
 */
function sortLayers(layers: Layer[]): Layer[] {
  return [...layers].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

/**
 * Render all layers in order
 */
function renderAllLayers(
  layers: Layer[],
  ctx: LayerRendererContext
): { svgParts: string[]; totalElements: number } {
  const sortedLayers = sortLayers(layers);
  const svgParts: string[] = [];
  let totalElements = 0;
  
  for (const layer of sortedLayers) {
    const result = renderLayer(layer, ctx);
    if (result.svg) {
      svgParts.push(result.svg);
    }
    totalElements += result.elementCount;
  }
  
  return { svgParts, totalElements };
}

/**
 * Main render function
 */
export function render(spec: EngineSpec): RenderResult {
  const startTime = performance.now();
  
  // Get theme and preset
  const theme = getTheme(spec.themeId);
  const preset = getPreset(spec.presetId);
  
  // Validate and potentially auto-fix
  const { result: validation, layers: validatedLayers } = validateAndFix(
    spec.layers,
    spec.canvas,
    theme,
    preset
  );
  
  // Build context
  const ctx = buildContext(spec.canvas, theme, spec.seed, validatedLayers);
  
  // Render all layers
  const { svgParts, totalElements } = renderAllLayers(validatedLayers, ctx);
  
  // Compose final SVG
  const svg = composeSvg(spec.canvas, svgParts);
  
  const renderTimeMs = performance.now() - startTime;
  
  return {
    svg,
    spec: {
      ...spec,
      layers: validatedLayers,
    },
    validation,
    stats: {
      elementCount: totalElements,
      renderTimeMs,
      layerCount: validatedLayers.filter((l) => l.enabled).length,
    },
  };
}

/**
 * Quick render without validation (for preview)
 */
export function renderQuick(spec: EngineSpec): string {
  const theme = getTheme(spec.themeId);
  const ctx = buildContext(spec.canvas, theme, spec.seed, spec.layers);
  const { svgParts } = renderAllLayers(spec.layers, ctx);
  return composeSvg(spec.canvas, svgParts);
}

export default render;
