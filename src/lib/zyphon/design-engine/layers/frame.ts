/**
 * Frame Layer Renderer
 * 
 * Renders frame/border elements (useful for social cards, banners).
 */

import type {
  FrameLayer,
  LayerRendererContext,
  LayerRendererResult,
} from "../types";

/**
 * Render frame layer
 */
export function renderFrame(
  layer: FrameLayer,
  ctx: LayerRendererContext
): LayerRendererResult {
  const { canvas } = ctx;
  
  const x = layer.padding;
  const y = layer.padding;
  const width = canvas.width - layer.padding * 2;
  const height = canvas.height - layer.padding * 2;
  
  const svg = `<g opacity="${layer.opacity}"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${layer.strokeColor}" stroke-width="${layer.strokeWidth}" rx="${layer.cornerRadius}"/></g>`;
  
  return { svg, elementCount: 1 };
}

export default renderFrame;
