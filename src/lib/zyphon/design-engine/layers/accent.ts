/**
 * Accent Layer Renderer
 * 
 * Renders decorative accent elements (corners, frames, lines, etc.)
 */

import type {
  AccentLayer,
  LayerRendererContext,
  LayerRendererResult,
} from "../types";

/**
 * Render corner brackets
 */
function renderCorners(
  layer: AccentLayer,
  canvasWidth: number,
  canvasHeight: number
): string {
  const { color, lineWeight, margin, cornerSize } = layer;
  
  let decorations = "";
  
  // Top-left
  decorations += `<path d="M ${margin} ${margin + cornerSize} L ${margin} ${margin} L ${margin + cornerSize} ${margin}" fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  // Top-right
  decorations += `<path d="M ${canvasWidth - margin - cornerSize} ${margin} L ${canvasWidth - margin} ${margin} L ${canvasWidth - margin} ${margin + cornerSize}" fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  // Bottom-left
  decorations += `<path d="M ${margin} ${canvasHeight - margin - cornerSize} L ${margin} ${canvasHeight - margin} L ${margin + cornerSize} ${canvasHeight - margin}" fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  // Bottom-right
  decorations += `<path d="M ${canvasWidth - margin - cornerSize} ${canvasHeight - margin} L ${canvasWidth - margin} ${canvasHeight - margin} L ${canvasWidth - margin} ${canvasHeight - margin - cornerSize}" fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  return decorations;
}

/**
 * Render full frame
 */
function renderFrame(
  layer: AccentLayer,
  canvasWidth: number,
  canvasHeight: number
): string {
  const { color, lineWeight, margin } = layer;
  
  return `<rect x="${margin}" y="${margin}" width="${canvasWidth - margin * 2}" height="${canvasHeight - margin * 2}" fill="none" stroke="${color}" stroke-width="${lineWeight}"/>`;
}

/**
 * Render accent lines
 */
function renderLines(
  layer: AccentLayer,
  canvasWidth: number,
  canvasHeight: number
): string {
  const { color, lineWeight, margin } = layer;
  const centerY = canvasHeight / 2;
  const lineLength = 80;
  
  let lines = "";
  
  // Left center line
  lines += `<line x1="${margin * 2}" y1="${centerY}" x2="${margin * 2 + lineLength}" y2="${centerY}" stroke="${color}" stroke-width="${lineWeight * 0.5}" opacity="0.5"/>`;
  
  // Right center line
  lines += `<line x1="${canvasWidth - margin * 2 - lineLength}" y1="${centerY}" x2="${canvasWidth - margin * 2}" y2="${centerY}" stroke="${color}" stroke-width="${lineWeight * 0.5}" opacity="0.5"/>`;
  
  return lines;
}

/**
 * Render accent dots
 */
function renderDots(
  layer: AccentLayer,
  canvasWidth: number,
  canvasHeight: number
): string {
  const { color, margin, lineWeight } = layer;
  const radius = lineWeight;
  
  let dots = "";
  
  // Corner dots
  dots += `<circle cx="${margin}" cy="${margin}" r="${radius}" fill="${color}"/>`;
  dots += `<circle cx="${canvasWidth - margin}" cy="${margin}" r="${radius}" fill="${color}"/>`;
  dots += `<circle cx="${margin}" cy="${canvasHeight - margin}" r="${radius}" fill="${color}"/>`;
  dots += `<circle cx="${canvasWidth - margin}" cy="${canvasHeight - margin}" r="${radius}" fill="${color}"/>`;
  
  // Center dots
  dots += `<circle cx="${canvasWidth / 2}" cy="${margin}" r="${radius * 0.5}" fill="${color}"/>`;
  dots += `<circle cx="${canvasWidth / 2}" cy="${canvasHeight - margin}" r="${radius * 0.5}" fill="${color}"/>`;
  
  return dots;
}

/**
 * Render minimal accent (just subtle corner touches)
 */
function renderMinimal(
  layer: AccentLayer,
  canvasWidth: number,
  canvasHeight: number
): string {
  const { color, lineWeight, margin } = layer;
  const touchSize = 20;
  
  let accents = "";
  
  // Top-left touch
  accents += `<line x1="${margin}" y1="${margin}" x2="${margin + touchSize}" y2="${margin}" stroke="${color}" stroke-width="${lineWeight}"/>`;
  accents += `<line x1="${margin}" y1="${margin}" x2="${margin}" y2="${margin + touchSize}" stroke="${color}" stroke-width="${lineWeight}"/>`;
  
  // Bottom-right touch
  accents += `<line x1="${canvasWidth - margin}" y1="${canvasHeight - margin}" x2="${canvasWidth - margin - touchSize}" y2="${canvasHeight - margin}" stroke="${color}" stroke-width="${lineWeight}"/>`;
  accents += `<line x1="${canvasWidth - margin}" y1="${canvasHeight - margin}" x2="${canvasWidth - margin}" y2="${canvasHeight - margin - touchSize}" stroke="${color}" stroke-width="${lineWeight}"/>`;
  
  return accents;
}

/**
 * Render accent layer
 */
export function renderAccent(
  layer: AccentLayer,
  ctx: LayerRendererContext
): LayerRendererResult {
  const { canvas, seed } = ctx;
  
  let decorations = "";
  let elementCount = 0;
  
  switch (layer.style) {
    case "corners":
      decorations = renderCorners(layer, canvas.width, canvas.height);
      elementCount = 4;
      break;
    case "frame":
      decorations = renderFrame(layer, canvas.width, canvas.height);
      elementCount = 1;
      break;
    case "lines":
      decorations = renderLines(layer, canvas.width, canvas.height);
      decorations += renderCorners(layer, canvas.width, canvas.height);
      elementCount = 6;
      break;
    case "dots":
      decorations = renderDots(layer, canvas.width, canvas.height);
      elementCount = 6;
      break;
    case "minimal":
      decorations = renderMinimal(layer, canvas.width, canvas.height);
      elementCount = 4;
      break;
  }
  
  // Apply glow if specified
  if (layer.glow > 0) {
    const glowId = `accent-glow-${seed}`;
    const glowFilter = `<defs><filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="${layer.glow * 8}" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    decorations = glowFilter + `<g filter="url(#${glowId})">${decorations}</g>`;
  }
  
  const svg = `<g opacity="${layer.opacity}">${decorations}</g>`;
  
  return { svg, elementCount };
}

export default renderAccent;
