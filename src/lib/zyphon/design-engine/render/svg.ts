/**
 * SVG Composer
 * 
 * Handles SVG composition and escaping.
 */

import type { Canvas } from "../types";

/**
 * Escape XML special characters
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Compose SVG from parts
 */
export function composeSvg(canvas: Canvas, parts: string[]): string {
  const header = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`;
  const footer = "</svg>";
  
  return header + parts.join("") + footer;
}

/**
 * Wrap content in SVG element
 */
export function wrapSvg(
  content: string,
  width: number,
  height: number,
  options?: {
    preserveAspectRatio?: string;
    className?: string;
    id?: string;
  }
): string {
  const attrs: string[] = [
    `xmlns="http://www.w3.org/2000/svg"`,
    `width="${width}"`,
    `height="${height}"`,
    `viewBox="0 0 ${width} ${height}"`,
  ];
  
  if (options?.preserveAspectRatio) {
    attrs.push(`preserveAspectRatio="${options.preserveAspectRatio}"`);
  }
  if (options?.className) {
    attrs.push(`class="${options.className}"`);
  }
  if (options?.id) {
    attrs.push(`id="${options.id}"`);
  }
  
  return `<svg ${attrs.join(" ")}>${content}</svg>`;
}

/**
 * Create a group element with optional attributes
 */
export function createGroup(
  content: string,
  options?: {
    id?: string;
    opacity?: number;
    transform?: string;
    filter?: string;
  }
): string {
  const attrs: string[] = [];
  
  if (options?.id) attrs.push(`id="${options.id}"`);
  if (options?.opacity !== undefined) attrs.push(`opacity="${options.opacity}"`);
  if (options?.transform) attrs.push(`transform="${options.transform}"`);
  if (options?.filter) attrs.push(`filter="${options.filter}"`);
  
  return `<g ${attrs.join(" ")}>${content}</g>`;
}

/**
 * Create defs element
 */
export function createDefs(content: string): string {
  return `<defs>${content}</defs>`;
}

/**
 * Create filter for glow effect
 */
export function createGlowFilter(id: string, blur: number, color?: string): string {
  if (color) {
    return `
      <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur"/>
        <feFlood flood-color="${color}" flood-opacity="0.5" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  }
  
  return `
    <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
}

/**
 * Create gradient definition
 */
export function createLinearGradient(
  id: string,
  stops: Array<{ offset: number; color: string; opacity?: number }>,
  angle = 0
): string {
  const angleRad = (angle - 90) * (Math.PI / 180);
  const x1 = 50 - 50 * Math.cos(angleRad);
  const y1 = 50 - 50 * Math.sin(angleRad);
  const x2 = 50 + 50 * Math.cos(angleRad);
  const y2 = 50 + 50 * Math.sin(angleRad);
  
  const stopsStr = stops
    .map((s) => {
      const opacity = s.opacity !== undefined ? ` stop-opacity="${s.opacity}"` : "";
      return `<stop offset="${s.offset * 100}%" stop-color="${s.color}"${opacity}/>`;
    })
    .join("");
  
  return `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stopsStr}</linearGradient>`;
}

/**
 * Create radial gradient definition
 */
export function createRadialGradient(
  id: string,
  stops: Array<{ offset: number; color: string; opacity?: number }>,
  cx = 50,
  cy = 50,
  r = 50
): string {
  const stopsStr = stops
    .map((s) => {
      const opacity = s.opacity !== undefined ? ` stop-opacity="${s.opacity}"` : "";
      return `<stop offset="${s.offset * 100}%" stop-color="${s.color}"${opacity}/>`;
    })
    .join("");
  
  return `<radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="${r}%">${stopsStr}</radialGradient>`;
}

/**
 * Normalize SVG string for comparison (testing)
 */
export function normalizeSvg(svg: string): string {
  return svg
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

export default {
  escapeXml,
  composeSvg,
  wrapSvg,
  createGroup,
  createDefs,
  createGlowFilter,
  createLinearGradient,
  createRadialGradient,
  normalizeSvg,
};
