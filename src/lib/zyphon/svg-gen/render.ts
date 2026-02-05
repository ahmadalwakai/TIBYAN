/**
 * SVG Render Composer
 * 
 * Composes all layers into a final SVG string.
 * Order: background -> patterns -> circuit -> text -> accent
 */

import type { DesignSpec } from "./types";
import { generateKuficText } from "./generators/kuficText";
import { generateIslamicPattern } from "./generators/islamicPattern";
import { generateCircuitLines } from "./generators/circuitLines";

/**
 * Generate accent decorations (corner elements, frame, etc.)
 */
function generateAccentDecorations(spec: DesignSpec): string {
  const { canvas, accent, seed } = spec;
  if (!accent) return "";
  
  const { color, lineWeight, glow } = accent;
  const margin = 40;
  const cornerSize = 60;
  
  let decorations = "";
  
  // Corner brackets
  // Top-left
  decorations += `<path d="M ${margin} ${margin + cornerSize} L ${margin} ${margin} L ${margin + cornerSize} ${margin}" 
    fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  // Top-right
  decorations += `<path d="M ${canvas.w - margin - cornerSize} ${margin} L ${canvas.w - margin} ${margin} L ${canvas.w - margin} ${margin + cornerSize}" 
    fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  // Bottom-left
  decorations += `<path d="M ${margin} ${canvas.h - margin - cornerSize} L ${margin} ${canvas.h - margin} L ${margin + cornerSize} ${canvas.h - margin}" 
    fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  // Bottom-right
  decorations += `<path d="M ${canvas.w - margin - cornerSize} ${canvas.h - margin} L ${canvas.w - margin} ${canvas.h - margin} L ${canvas.w - margin} ${canvas.h - margin - cornerSize}" 
    fill="none" stroke="${color}" stroke-width="${lineWeight}" stroke-linecap="square"/>`;
  
  // Optional subtle center line accents
  const centerY = canvas.h / 2;
  const lineLength = 80;
  
  decorations += `<line x1="${margin * 2}" y1="${centerY}" x2="${margin * 2 + lineLength}" y2="${centerY}" 
    stroke="${color}" stroke-width="${lineWeight * 0.5}" opacity="0.5"/>`;
  decorations += `<line x1="${canvas.w - margin * 2 - lineLength}" y1="${centerY}" x2="${canvas.w - margin * 2}" y2="${centerY}" 
    stroke="${color}" stroke-width="${lineWeight * 0.5}" opacity="0.5"/>`;
  
  // Add glow filter if needed
  if (glow > 0) {
    const glowId = `accent-glow-${seed}`;
    const glowFilter = `
      <defs>
        <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${glow * 8}" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;
    return glowFilter + `<g filter="url(#${glowId})">${decorations}</g>`;
  }
  
  return decorations;
}

/**
 * Render complete SVG from DesignSpec
 */
export function renderSvg(spec: DesignSpec): string {
  const { canvas, text, patterns, accent, seed } = spec;
  
  // Start SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
    width="${canvas.w}" 
    height="${canvas.h}" 
    viewBox="0 0 ${canvas.w} ${canvas.h}">`;
  
  // Background
  svg += `<rect x="0" y="0" width="${canvas.w}" height="${canvas.h}" fill="${canvas.bg}"/>`;
  
  // Islamic pattern layer (if enabled)
  if (patterns?.islamic?.enabled) {
    svg += generateIslamicPattern(patterns.islamic, canvas, seed);
  }
  
  // Circuit pattern layer (if enabled)
  if (patterns?.circuit?.enabled) {
    svg += generateCircuitLines(patterns.circuit, canvas, seed);
  }
  
  // Main text layer
  svg += generateKuficText(text, accent, canvas, seed);
  
  // Accent decorations
  svg += generateAccentDecorations(spec);
  
  // Close SVG
  svg += "</svg>";
  
  return svg;
}

/**
 * Render SVG with error handling
 */
export function safeRenderSvg(spec: DesignSpec): { svg: string; error?: string } {
  try {
    const svg = renderSvg(spec);
    return { svg };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown render error";
    // Return a fallback error SVG
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#1a1a1a"/>
      <text x="256" y="256" text-anchor="middle" fill="#ff4444" font-size="16">Render Error</text>
    </svg>`;
    return { svg: fallbackSvg, error: errorMessage };
  }
}
