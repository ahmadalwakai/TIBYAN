/**
 * Grid Layer Renderer
 * 
 * Renders subtle background grid (useful for social cards).
 */

import type {
  GridLayer,
  LayerRendererContext,
  LayerRendererResult,
} from "../types";

/**
 * Render grid layer
 */
export function renderGrid(
  layer: GridLayer,
  ctx: LayerRendererContext
): LayerRendererResult {
  const { canvas } = ctx;
  
  const cols = Math.ceil(canvas.width / layer.cellSize);
  const rows = Math.ceil(canvas.height / layer.cellSize);
  
  let lines = "";
  let elementCount = 0;
  
  // Vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = i * layer.cellSize;
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${canvas.height}" stroke="${layer.color}" stroke-width="${layer.lineWidth}"/>`;
    elementCount++;
  }
  
  // Horizontal lines
  for (let i = 0; i <= rows; i++) {
    const y = i * layer.cellSize;
    lines += `<line x1="0" y1="${y}" x2="${canvas.width}" y2="${y}" stroke="${layer.color}" stroke-width="${layer.lineWidth}"/>`;
    elementCount++;
  }
  
  const svg = `<g opacity="${layer.opacity}">${lines}</g>`;
  
  return { svg, elementCount };
}

export default renderGrid;
