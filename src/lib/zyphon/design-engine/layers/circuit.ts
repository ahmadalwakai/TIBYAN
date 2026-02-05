/**
 * Circuit Layer Renderer
 * 
 * Renders circuit-board style lines with nodes.
 */

import type {
  CircuitLayer,
  LayerRendererContext,
  LayerRendererResult,
} from "../types";
import { createSeededRandom } from "../types";

interface Point {
  x: number;
  y: number;
}

interface CircuitTrace {
  points: Point[];
  hasNode: boolean;
}

/**
 * Generate a single circuit trace
 */
function generateCircuitTrace(
  startX: number,
  startY: number,
  maxLength: number,
  maxSegments: number,
  canvasWidth: number,
  canvasHeight: number,
  rng: () => number
): CircuitTrace {
  const points: Point[] = [{ x: startX, y: startY }];
  let currentX = startX;
  let currentY = startY;
  let direction: "horizontal" | "vertical" = rng() > 0.5 ? "horizontal" : "vertical";
  
  const segments = 2 + Math.floor(rng() * (maxSegments - 2));
  
  for (let i = 0; i < segments; i++) {
    const segmentLength = 30 + rng() * maxLength;
    
    if (direction === "horizontal") {
      const dx = (rng() > 0.5 ? 1 : -1) * segmentLength;
      currentX = Math.max(0, Math.min(canvasWidth, currentX + dx));
      direction = "vertical";
    } else {
      const dy = (rng() > 0.5 ? 1 : -1) * segmentLength;
      currentY = Math.max(0, Math.min(canvasHeight, currentY + dy));
      direction = "horizontal";
    }
    
    points.push({ x: currentX, y: currentY });
  }
  
  return {
    points,
    hasNode: rng() > 0.6,
  };
}

/**
 * Convert points to SVG path
 */
function pointsToPath(points: Point[]): string {
  if (points.length < 2) return "";
  return points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(" ");
}

/**
 * Render circuit layer
 */
export function renderCircuit(
  layer: CircuitLayer,
  ctx: LayerRendererContext
): LayerRendererResult {
  const { canvas, seed } = ctx;
  
  const rng = createSeededRandom(seed + 1000);
  const color = layer.color;
  const nodeRadius = layer.nodeRadius;
  const lineWidth = layer.lineWidth;
  
  const numTraces = Math.floor(15 * layer.density * (canvas.width / 1024));
  const maxSegmentLength = 100 * layer.density;
  
  let paths = "";
  let nodes = "";
  let elementCount = 0;
  
  for (let i = 0; i < numTraces; i++) {
    const startX = rng() * canvas.width;
    const startY = rng() * canvas.height;
    
    const trace = generateCircuitTrace(
      startX,
      startY,
      maxSegmentLength,
      layer.maxSegments,
      canvas.width,
      canvas.height,
      rng
    );
    
    const pathD = pointsToPath(trace.points);
    if (pathD) {
      paths += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${lineWidth}" stroke-linecap="square"/>`;
      elementCount++;
    }
    
    if (trace.hasNode && trace.points.length > 0) {
      const nodePoint = trace.points[trace.points.length - 1];
      nodes += `<circle cx="${nodePoint.x}" cy="${nodePoint.y}" r="${nodeRadius}" fill="${color}"/>`;
      elementCount++;
      
      if (rng() > 0.5) {
        const startPoint = trace.points[0];
        nodes += `<circle cx="${startPoint.x}" cy="${startPoint.y}" r="${nodeRadius * 0.8}" fill="${color}"/>`;
        elementCount++;
      }
    }
    
    for (let j = 1; j < trace.points.length - 1; j++) {
      if (rng() > 0.7) {
        const p = trace.points[j];
        nodes += `<rect x="${p.x - nodeRadius}" y="${p.y - nodeRadius}" width="${nodeRadius * 2}" height="${nodeRadius * 2}" fill="${color}"/>`;
        elementCount++;
      }
    }
  }
  
  // Standalone nodes
  const numStandaloneNodes = Math.floor(8 * layer.density);
  for (let i = 0; i < numStandaloneNodes; i++) {
    const x = rng() * canvas.width;
    const y = rng() * canvas.height;
    const size = nodeRadius * (0.5 + rng() * 1.5);
    
    if (rng() > 0.5) {
      nodes += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`;
    } else {
      nodes += `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" fill="${color}"/>`;
    }
    elementCount++;
  }
  
  // Grid lines
  const numGridLines = Math.floor(4 * layer.density);
  for (let i = 0; i < numGridLines; i++) {
    if (rng() > 0.5) {
      const y = rng() * canvas.height;
      const x1 = rng() * canvas.width * 0.3;
      const x2 = x1 + rng() * canvas.width * 0.4;
      paths += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="0.5" stroke-dasharray="5,10"/>`;
    } else {
      const x = rng() * canvas.width;
      const y1 = rng() * canvas.height * 0.3;
      const y2 = y1 + rng() * canvas.height * 0.4;
      paths += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${color}" stroke-width="0.5" stroke-dasharray="5,10"/>`;
    }
    elementCount++;
  }
  
  const svg = `<g opacity="${layer.opacity}">${paths}${nodes}</g>`;
  
  return { svg, elementCount };
}

export default renderCircuit;
