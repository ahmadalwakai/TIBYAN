/**
 * Background Layer Renderer
 * 
 * Renders solid color or gradient backgrounds.
 */

import type {
  BackgroundLayer,
  LayerRendererContext,
  LayerRendererResult,
} from "../types";

/**
 * Render background layer
 */
export function renderBackground(
  layer: BackgroundLayer,
  ctx: LayerRendererContext
): LayerRendererResult {
  const { canvas } = ctx;
  let svg = "";
  let elementCount = 0;

  if (layer.gradient) {
    const gradientId = `bg-gradient-${layer.id}`;
    
    if (layer.gradient.type === "linear") {
      const angle = layer.gradient.angle ?? 180;
      // Convert angle to x1,y1,x2,y2
      const angleRad = (angle - 90) * (Math.PI / 180);
      const x1 = 50 - 50 * Math.cos(angleRad);
      const y1 = 50 - 50 * Math.sin(angleRad);
      const x2 = 50 + 50 * Math.cos(angleRad);
      const y2 = 50 + 50 * Math.sin(angleRad);
      
      svg += `<defs><linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
      for (const stop of layer.gradient.stops) {
        svg += `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}"/>`;
        elementCount++;
      }
      svg += `</linearGradient></defs>`;
      svg += `<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="url(#${gradientId})"/>`;
    } else {
      // Radial gradient
      svg += `<defs><radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">`;
      for (const stop of layer.gradient.stops) {
        svg += `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}"/>`;
        elementCount++;
      }
      svg += `</radialGradient></defs>`;
      svg += `<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="url(#${gradientId})"/>`;
    }
    elementCount++;
  } else {
    svg = `<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="${layer.color}"/>`;
    elementCount = 1;
  }

  return { svg, elementCount };
}

export default renderBackground;
