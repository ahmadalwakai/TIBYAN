/**
 * Geometric Pattern Layer Renderer
 * 
 * Renders Islamic geometric patterns.
 */

import type {
  PatternLayer,
  LayerRendererContext,
  LayerRendererResult,
} from "../types";

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
 * Generate a 6-point star
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
 * Generate a hexagon
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
 * Generate an octagon
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
 * Generate arabesque pattern element
 */
function generateArabesque(cx: number, cy: number, radius: number): string {
  // Creates interlocking curved pattern
  const r = radius;
  return `
    M ${cx - r} ${cy}
    Q ${cx - r/2} ${cy - r}, ${cx} ${cy - r/2}
    Q ${cx + r/2} ${cy}, ${cx} ${cy + r/2}
    Q ${cx - r/2} ${cy + r}, ${cx - r} ${cy}
    M ${cx + r} ${cy}
    Q ${cx + r/2} ${cy - r}, ${cx} ${cy - r/2}
    Q ${cx - r/2} ${cy}, ${cx} ${cy + r/2}
    Q ${cx + r/2} ${cy + r}, ${cx + r} ${cy}
  `;
}

/**
 * Generate muqarnas-like pattern
 */
function generateMuqarnas(cx: number, cy: number, radius: number): string {
  const r = radius;
  return `
    M ${cx} ${cy - r}
    L ${cx + r * 0.7} ${cy - r * 0.3}
    L ${cx + r} ${cy}
    L ${cx + r * 0.7} ${cy + r * 0.3}
    L ${cx} ${cy + r}
    L ${cx - r * 0.7} ${cy + r * 0.3}
    L ${cx - r} ${cy}
    L ${cx - r * 0.7} ${cy - r * 0.3}
    Z
  `;
}

/**
 * Render geometric pattern layer
 */
export function renderGeometricPattern(
  layer: PatternLayer,
  ctx: LayerRendererContext
): LayerRendererResult {
  const { canvas, theme } = ctx;
  
  const color = layer.strokeColor || theme.colors.primary;
  const fillColor = layer.fillColor;
  const baseSize = layer.tileSize * layer.density;
  const outerRadius = baseSize * 0.45;
  const innerRadius = baseSize * 0.25;
  const rotation = layer.rotation;
  
  const cols = Math.ceil(canvas.width / baseSize) + 2;
  const rows = Math.ceil(canvas.height / baseSize) + 2;
  
  let paths = "";
  let elementCount = 0;
  
  const offsetX = -baseSize / 2;
  const offsetY = -baseSize / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xOffset = row % 2 === 0 ? 0 : baseSize / 2;
      const cx = offsetX + col * baseSize + xOffset;
      const cy = offsetY + row * baseSize * 0.866;
      
      if (cx < -baseSize || cx > canvas.width + baseSize) continue;
      if (cy < -baseSize || cy > canvas.height + baseSize) continue;
      
      let pathD: string;
      
      switch (layer.patternType) {
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
        case "arabesque":
          pathD = generateArabesque(cx, cy, outerRadius);
          break;
        case "muqarnas":
          pathD = generateMuqarnas(cx, cy, outerRadius);
          break;
        default:
          pathD = generate8PointStar(cx, cy, outerRadius, innerRadius);
      }
      
      const fill = fillColor ? `fill="${fillColor}"` : `fill="none"`;
      const transform = rotation ? `transform="rotate(${rotation} ${cx} ${cy})"` : "";
      paths += `<path d="${pathD}" ${fill} stroke="${color}" stroke-width="${layer.strokeWidth}" ${transform}/>`;
      elementCount++;
    }
  }
  
  // Add connecting lines for richer pattern
  let connectors = "";
  if (layer.patternType === "8-point-star" || layer.patternType === "octagonal") {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const xOffset = row % 2 === 0 ? 0 : baseSize / 2;
        const x1 = offsetX + col * baseSize + xOffset + outerRadius;
        const y1 = offsetY + row * baseSize * 0.866;
        const x2 = offsetX + (col + 1) * baseSize + xOffset - outerRadius;
        
        if (x1 > 0 && x2 < canvas.width && y1 > 0 && y1 < canvas.height) {
          connectors += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}" stroke="${color}" stroke-width="0.5"/>`;
          elementCount++;
        }
      }
    }
  }
  
  const svg = `<g opacity="${layer.opacity}">${paths}${connectors}</g>`;
  
  return { svg, elementCount };
}

export default renderGeometricPattern;
