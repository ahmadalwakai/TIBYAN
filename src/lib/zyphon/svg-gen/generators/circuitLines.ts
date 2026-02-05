/**
 * Circuit Lines Generator
 * 
 * Generates randomized orthogonal circuit-board style lines
 * with nodes for a tech aesthetic.
 */

import type { CircuitPattern, Canvas } from "../types";

/**
 * Create a seeded random number generator
 */
function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

interface Point {
  x: number;
  y: number;
}

interface CircuitLine {
  points: Point[];
  hasNode: boolean;
}

/**
 * Generate a single circuit trace (orthogonal path)
 */
function generateCircuitTrace(
  startX: number,
  startY: number,
  maxLength: number,
  canvas: Canvas,
  rng: () => number
): CircuitLine {
  const points: Point[] = [{ x: startX, y: startY }];
  let currentX = startX;
  let currentY = startY;
  let direction = rng() > 0.5 ? "horizontal" : "vertical";
  
  const segments = 2 + Math.floor(rng() * 4);
  
  for (let i = 0; i < segments; i++) {
    const segmentLength = 30 + rng() * maxLength;
    
    if (direction === "horizontal") {
      const dx = (rng() > 0.5 ? 1 : -1) * segmentLength;
      currentX = Math.max(0, Math.min(canvas.w, currentX + dx));
      direction = "vertical";
    } else {
      const dy = (rng() > 0.5 ? 1 : -1) * segmentLength;
      currentY = Math.max(0, Math.min(canvas.h, currentY + dy));
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
 * Convert points to SVG polyline path
 */
function pointsToPath(points: Point[]): string {
  if (points.length < 2) return "";
  
  return points.map((p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(" ");
}

/**
 * Generate circuit pattern SVG elements
 */
export function generateCircuitLines(
  pattern: CircuitPattern,
  canvas: Canvas,
  seed: number
): string {
  if (!pattern.enabled) return "";
  
  const rng = createSeededRandom(seed + 1000); // Offset seed for variety
  const color = pattern.color || "#FFFFFF";
  const nodeRadius = pattern.nodeRadius;
  
  // Calculate number of traces based on density
  const numTraces = Math.floor(15 * pattern.density * (canvas.w / 1024));
  const maxSegmentLength = 100 * pattern.density;
  
  let paths = "";
  let nodes = "";
  
  for (let i = 0; i < numTraces; i++) {
    // Random starting position
    const startX = rng() * canvas.w;
    const startY = rng() * canvas.h;
    
    const trace = generateCircuitTrace(startX, startY, maxSegmentLength, canvas, rng);
    
    // Draw the path
    const pathD = pointsToPath(trace.points);
    if (pathD) {
      paths += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="1" stroke-linecap="square"/>`;
    }
    
    // Add nodes at some points
    if (trace.hasNode && trace.points.length > 0) {
      const nodePoint = trace.points[trace.points.length - 1];
      nodes += `<circle cx="${nodePoint.x}" cy="${nodePoint.y}" r="${nodeRadius}" fill="${color}"/>`;
      
      // Sometimes add a node at start too
      if (rng() > 0.5) {
        const startPoint = trace.points[0];
        nodes += `<circle cx="${startPoint.x}" cy="${startPoint.y}" r="${nodeRadius * 0.8}" fill="${color}"/>`;
      }
    }
    
    // Add junction nodes at corners
    for (let j = 1; j < trace.points.length - 1; j++) {
      if (rng() > 0.7) {
        const p = trace.points[j];
        nodes += `<rect x="${p.x - nodeRadius}" y="${p.y - nodeRadius}" width="${nodeRadius * 2}" height="${nodeRadius * 2}" fill="${color}"/>`;
      }
    }
  }
  
  // Add some standalone nodes
  const numStandaloneNodes = Math.floor(8 * pattern.density);
  for (let i = 0; i < numStandaloneNodes; i++) {
    const x = rng() * canvas.w;
    const y = rng() * canvas.h;
    const size = nodeRadius * (0.5 + rng() * 1.5);
    
    if (rng() > 0.5) {
      nodes += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`;
    } else {
      nodes += `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" fill="${color}"/>`;
    }
  }
  
  // Add some horizontal/vertical grid lines
  const numGridLines = Math.floor(4 * pattern.density);
  for (let i = 0; i < numGridLines; i++) {
    if (rng() > 0.5) {
      // Horizontal line
      const y = rng() * canvas.h;
      const x1 = rng() * canvas.w * 0.3;
      const x2 = x1 + rng() * canvas.w * 0.4;
      paths += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="0.5" stroke-dasharray="5,10"/>`;
    } else {
      // Vertical line
      const x = rng() * canvas.w;
      const y1 = rng() * canvas.h * 0.3;
      const y2 = y1 + rng() * canvas.h * 0.4;
      paths += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${color}" stroke-width="0.5" stroke-dasharray="5,10"/>`;
    }
  }
  
  return `<g opacity="${pattern.opacity}">${paths}${nodes}</g>`;
}
