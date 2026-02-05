/**
 * Layers Index
 * 
 * Exports all layer renderers.
 */

export { renderBackground } from "./background";
export { renderMainMark, getMarkRenderer, registerMarkRenderer } from "./mainMark";
export { renderGeometricPattern } from "./geometricPattern";
export { renderCircuit } from "./circuit";
export { renderAccent } from "./accent";
export { renderFrame } from "./frame";
export { renderGrid } from "./grid";

import { renderBackground } from "./background";
import { renderMainMark } from "./mainMark";
import { renderGeometricPattern } from "./geometricPattern";
import { renderCircuit } from "./circuit";
import { renderAccent } from "./accent";
import { renderFrame } from "./frame";
import { renderGrid } from "./grid";
import type {
  Layer,
  LayerType,
  LayerRendererContext,
  LayerRendererResult,
  BackgroundLayer,
  PatternLayer,
  MarkLayer,
  CircuitLayer,
  AccentLayer,
  FrameLayer,
  GridLayer,
} from "../types";

/**
 * Render a single layer
 */
export function renderLayer(
  layer: Layer,
  ctx: LayerRendererContext
): LayerRendererResult {
  if (!layer.enabled) {
    return { svg: "", elementCount: 0 };
  }
  
  switch (layer.type) {
    case "background":
      return renderBackground(layer as BackgroundLayer, ctx);
    case "pattern":
      return renderGeometricPattern(layer as PatternLayer, ctx);
    case "mark":
      return renderMainMark(layer as MarkLayer, ctx);
    case "circuit":
      return renderCircuit(layer as CircuitLayer, ctx);
    case "accent":
      return renderAccent(layer as AccentLayer, ctx);
    case "frame":
      return renderFrame(layer as FrameLayer, ctx);
    case "grid":
      return renderGrid(layer as GridLayer, ctx);
    default:
      return { svg: "", elementCount: 0 };
  }
}

/**
 * Get layer renderer by type
 */
export function getLayerRenderer(type: LayerType) {
  const renderers: Record<string, typeof renderBackground | typeof renderMainMark | typeof renderGeometricPattern | typeof renderCircuit | typeof renderAccent | typeof renderFrame | typeof renderGrid | null> = {
    background: renderBackground,
    pattern: renderGeometricPattern,
    mark: renderMainMark,
    circuit: renderCircuit,
    accent: renderAccent,
    frame: renderFrame,
    grid: renderGrid,
    // Unsupported layer types return null (handled at render time)
    "text-fallback": null,
    "custom": null,
  };
  
  return renderers[type] || null;
}
