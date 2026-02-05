/**
 * Islamic Pattern Generator
 * 
 * Generates geometric Islamic patterns (8-point stars, etc.)
 * as low-opacity SVG paths for background decoration.
 */

import type { IslamicPattern, Canvas } from "../types";

/**
 * Generate an 8-point star path
 */
function generate8PointStar(cx: number, cy: number, outerRadius: number, innerRadius: number): string {
  const points: string[] = [];
  const numPoints = 8;
  
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI * i) / numPoints - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(" L ")} Z`;
}

/**
 * Generate a 6-point star (Star of David shape)
 */
function generate6PointStar(cx: number, cy: number, outerRadius: number, innerRadius: number): string {
  const points: string[] = [];
  const numPoints = 6;
  
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI * i) / numPoints - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(" L ")} Z`;
}

/**
 * Generate a hexagonal pattern element
 */
function generateHexagon(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * i) / 3 - Math.PI / 6;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(" L ")} Z`;
}

/**
 * Generate an octagonal pattern element
 */
function generateOctagon(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * i) / 4 - Math.PI / 8;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(" L ")} Z`;
}

/**
 * Generate Islamic geometric pattern SVG elements
 */
export function generateIslamicPattern(
  pattern: IslamicPattern,
  canvas: Canvas,
  seed: number
): string {
  if (!pattern.enabled) return "";
  
  const color = pattern.color || "#FFFFFF";
  const baseSize = 60 * pattern.scale;
  const outerRadius = baseSize * 0.45;
  const innerRadius = baseSize * 0.25;
  
  // Calculate grid
  const cols = Math.ceil(canvas.w / baseSize) + 2;
  const rows = Math.ceil(canvas.h / baseSize) + 2;
  
  let paths = "";
  
  // Offset to center the pattern
  const offsetX = -baseSize / 2;
  const offsetY = -baseSize / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Offset every other row for interlocking pattern
      const xOffset = row % 2 === 0 ? 0 : baseSize / 2;
      const cx = offsetX + col * baseSize + xOffset;
      const cy = offsetY + row * baseSize * 0.866; // √3/2 for hexagonal packing
      
      // Skip if outside canvas (with margin)
      if (cx < -baseSize || cx > canvas.w + baseSize) continue;
      if (cy < -baseSize || cy > canvas.h + baseSize) continue;
      
      let pathD: string;
      
      switch (pattern.tile) {
        case "8-point-star":
          pathD = generate8PointStar(cx, cy, outerRadius, innerRadius);
          break;
        case "6-point-star":
          pathD = generate6PointStar(cx, cy, outerRadius, innerRadius);
          break;
        case "hexagonal":
          pathD = generateHexagon(cx, cy, outerRadius);
          break;
        case "octagonal":
          pathD = generateOctagon(cx, cy, outerRadius);
          break;
        default:
          pathD = generate8PointStar(cx, cy, outerRadius, innerRadius);
      }
      
      paths += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="1"/>`;
    }
  }
  
  // Additional connecting lines for richer pattern
  let connectors = "";
  
  if (pattern.tile === "8-point-star" || pattern.tile === "octagonal") {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const xOffset = row % 2 === 0 ? 0 : baseSize / 2;
        const x1 = offsetX + col * baseSize + xOffset + outerRadius;
        const y1 = offsetY + row * baseSize * 0.866;
        const x2 = offsetX + (col + 1) * baseSize + xOffset - outerRadius;
        const y2 = y1;
        
        if (x1 > 0 && x2 < canvas.w && y1 > 0 && y1 < canvas.h) {
          connectors += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.5"/>`;
        }
      }
    }
  }
  
  return `<g opacity="${pattern.opacity}">${paths}${connectors}</g>`;
}
