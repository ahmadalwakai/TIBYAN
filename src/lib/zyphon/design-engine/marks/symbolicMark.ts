/**
 * Symbolic Mark Generator
 * 
 * Creates abstract logo marks without rendering any text or letters.
 * Produces strong, balanced geometric compositions using:
 * - Rectilinear strokes
 * - Controlled angles (0°, 45°, 90°)
 * - Strong negative space
 * - Mathematical symmetry
 * 
 * CRITICAL: This generator NEVER draws text, characters, or letter-like shapes.
 */

import type {
  MarkRenderer,
  MarkRendererContext,
  MarkRendererResult,
} from "../types";
import { createSeededRandom } from "../types";

// ============================================
// Types
// ============================================

export interface SymbolicMarkInput {
  textLength: number;
  rhythm: "compact" | "balanced" | "extended";
  weight: "light" | "medium" | "bold";
  symmetry: "vertical" | "radial" | "none";
  seed: number;
}

interface Primitive {
  type: "line" | "rect";
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  strokeWidth: number;
  angle: number; // 0, 45, or 90
}

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // Mark must occupy 60-75% of canvas
  MIN_COVERAGE: 0.60,
  MAX_COVERAGE: 0.75,
  
  // Maximum 12 primitives
  MAX_PRIMITIVES: 12,
  
  // Allowed angles
  ALLOWED_ANGLES: [0, 45, 90] as const,
  
  // Rhythm spacing multipliers
  RHYTHM: {
    compact: 0.7,
    balanced: 1.0,
    extended: 1.3,
  },
  
  // Weight stroke multipliers
  WEIGHT: {
    light: 0.6,
    medium: 1.0,
    bold: 1.5,
  },
} as const;

// ============================================
// Primitive Generators
// ============================================

function generateHorizontalBar(
  cx: number,
  cy: number,
  length: number,
  strokeWidth: number
): Primitive {
  return {
    type: "rect",
    x1: cx - length / 2,
    y1: cy - strokeWidth / 2,
    width: length,
    height: strokeWidth,
    strokeWidth,
    angle: 0,
  };
}

function generateVerticalBar(
  cx: number,
  cy: number,
  length: number,
  strokeWidth: number
): Primitive {
  return {
    type: "rect",
    x1: cx - strokeWidth / 2,
    y1: cy - length / 2,
    width: strokeWidth,
    height: length,
    strokeWidth,
    angle: 90,
  };
}

function generateDiagonalLine(
  cx: number,
  cy: number,
  length: number,
  strokeWidth: number,
  direction: 1 | -1
): Primitive {
  const offset = length / (2 * Math.SQRT2);
  return {
    type: "line",
    x1: cx - offset,
    y1: cy - offset * direction,
    x2: cx + offset,
    y2: cy + offset * direction,
    strokeWidth,
    angle: direction === 1 ? 45 : -45,
  };
}

function generateSquareBlock(
  cx: number,
  cy: number,
  size: number,
  strokeWidth: number
): Primitive {
  return {
    type: "rect",
    x1: cx - size / 2,
    y1: cy - size / 2,
    width: size,
    height: size,
    strokeWidth,
    angle: 0,
  };
}

// ============================================
// Symmetry Enforcers
// ============================================

function enforceVerticalSymmetry(
  primitives: Primitive[],
  centerX: number
): Primitive[] {
  const result: Primitive[] = [];
  
  for (const p of primitives) {
    result.push(p);
    
    // Mirror across vertical center
    const mirrored = { ...p };
    if (p.type === "rect") {
      const pRight = p.x1 + (p.width ?? 0);
      const distFromCenter = (p.x1 + pRight) / 2 - centerX;
      mirrored.x1 = centerX - distFromCenter - (p.width ?? 0) / 2;
    } else if (p.type === "line") {
      mirrored.x1 = 2 * centerX - (p.x1 ?? 0);
      mirrored.x2 = 2 * centerX - (p.x2 ?? 0);
      // Flip diagonal direction
      if (p.angle === 45 || p.angle === -45) {
        mirrored.angle = -p.angle;
      }
    }
    
    // Don't duplicate center elements
    if (Math.abs((p.x1 ?? 0) - mirrored.x1) > 5) {
      result.push(mirrored);
    }
  }
  
  return result;
}

function enforceRadialSymmetry(
  primitives: Primitive[],
  centerX: number,
  centerY: number
): Primitive[] {
  const result: Primitive[] = [];
  
  for (const p of primitives) {
    // Add 4-way rotational symmetry
    for (let rotation = 0; rotation < 4; rotation++) {
      const angle = rotation * 90;
      const rotated = rotatePrimitive(p, centerX, centerY, angle);
      result.push(rotated);
    }
  }
  
  return result;
}

function rotatePrimitive(
  p: Primitive,
  cx: number,
  cy: number,
  angle: number
): Primitive {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const rotatePoint = (x: number, y: number): [number, number] => {
    const dx = x - cx;
    const dy = y - cy;
    return [
      cx + dx * cos - dy * sin,
      cy + dx * sin + dy * cos,
    ];
  };
  
  if (p.type === "rect") {
    const [nx, ny] = rotatePoint(p.x1 + (p.width ?? 0) / 2, p.y1 + (p.height ?? 0) / 2);
    
    // Swap width/height for 90/270 rotations
    const isVerticalSwap = angle === 90 || angle === 270;
    const w = isVerticalSwap ? p.height ?? 0 : p.width ?? 0;
    const h = isVerticalSwap ? p.width ?? 0 : p.height ?? 0;
    
    return {
      ...p,
      x1: nx - w / 2,
      y1: ny - h / 2,
      width: w,
      height: h,
      angle: (p.angle + angle) % 360,
    };
  } else {
    const [nx1, ny1] = rotatePoint(p.x1 ?? 0, p.y1 ?? 0);
    const [nx2, ny2] = rotatePoint(p.x2 ?? 0, p.y2 ?? 0);
    
    return {
      ...p,
      x1: nx1,
      y1: ny1,
      x2: nx2,
      y2: ny2,
      angle: (p.angle + angle) % 360,
    };
  }
}

// ============================================
// Mark Composition Algorithms
// ============================================

/**
 * Generate a balanced abstract composition based on input parameters
 */
function generateComposition(
  input: SymbolicMarkInput,
  canvasWidth: number,
  canvasHeight: number,
  color: string
): Primitive[] {
  const rng = createSeededRandom(input.seed);
  
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Calculate target coverage area
  const targetCoverage = CONFIG.MIN_COVERAGE + (CONFIG.MAX_COVERAGE - CONFIG.MIN_COVERAGE) * rng();
  const markSize = Math.min(canvasWidth, canvasHeight) * Math.sqrt(targetCoverage);
  
  // Apply rhythm spacing
  const spacing = markSize * 0.15 * CONFIG.RHYTHM[input.rhythm];
  
  // Apply weight to strokes
  const baseStrokeWidth = markSize * 0.08;
  const strokeWidth = baseStrokeWidth * CONFIG.WEIGHT[input.weight];
  
  // Determine number of primitives (3-12 based on textLength influence)
  const baseCount = Math.min(CONFIG.MAX_PRIMITIVES, 3 + Math.floor(input.textLength / 2));
  const primitiveCount = Math.min(CONFIG.MAX_PRIMITIVES, baseCount);
  
  // Select composition style based on seed
  const compositionStyle = Math.floor(rng() * 5);
  
  let primitives: Primitive[] = [];
  
  switch (compositionStyle) {
    case 0:
      primitives = generateCrossComposition(centerX, centerY, markSize, strokeWidth, spacing, rng);
      break;
    case 1:
      primitives = generateStackedComposition(centerX, centerY, markSize, strokeWidth, spacing, primitiveCount, rng);
      break;
    case 2:
      primitives = generateAngularComposition(centerX, centerY, markSize, strokeWidth, spacing, rng);
      break;
    case 3:
      primitives = generateFrameComposition(centerX, centerY, markSize, strokeWidth, spacing, rng);
      break;
    case 4:
    default:
      primitives = generateModularComposition(centerX, centerY, markSize, strokeWidth, spacing, primitiveCount, rng);
      break;
  }
  
  // Apply symmetry
  switch (input.symmetry) {
    case "vertical":
      primitives = enforceVerticalSymmetry(primitives, centerX);
      break;
    case "radial":
      primitives = enforceRadialSymmetry(primitives, centerX, centerY);
      break;
    case "none":
      // Keep as-is but ensure visual balance
      primitives = ensureVisualBalance(primitives, centerX, centerY);
      break;
  }
  
  // Limit to max primitives
  return primitives.slice(0, CONFIG.MAX_PRIMITIVES);
}

/**
 * Cross-based composition: strong + shape
 */
function generateCrossComposition(
  cx: number,
  cy: number,
  size: number,
  strokeWidth: number,
  spacing: number,
  rng: () => number
): Primitive[] {
  const primitives: Primitive[] = [];
  const armLength = size * 0.4;
  
  // Central cross
  primitives.push(generateHorizontalBar(cx, cy, armLength, strokeWidth));
  primitives.push(generateVerticalBar(cx, cy, armLength, strokeWidth));
  
  // Optional corner accents
  if (rng() > 0.5) {
    const offset = armLength * 0.4;
    primitives.push(generateSquareBlock(cx - offset, cy - offset, strokeWidth * 1.5, strokeWidth));
    primitives.push(generateSquareBlock(cx + offset, cy - offset, strokeWidth * 1.5, strokeWidth));
  }
  
  return primitives;
}

/**
 * Stacked horizontal bars composition
 */
function generateStackedComposition(
  cx: number,
  cy: number,
  size: number,
  strokeWidth: number,
  spacing: number,
  count: number,
  rng: () => number
): Primitive[] {
  const primitives: Primitive[] = [];
  const barCount = Math.min(5, Math.max(2, Math.floor(count / 2)));
  const totalHeight = (barCount - 1) * (strokeWidth + spacing);
  const startY = cy - totalHeight / 2;
  
  for (let i = 0; i < barCount; i++) {
    const y = startY + i * (strokeWidth + spacing);
    // Vary bar lengths for visual interest
    const lengthFactor = 0.6 + rng() * 0.4;
    const barLength = size * 0.5 * lengthFactor;
    primitives.push(generateHorizontalBar(cx, y, barLength, strokeWidth));
  }
  
  // Add vertical connector
  if (rng() > 0.4) {
    primitives.push(generateVerticalBar(cx, cy, totalHeight + strokeWidth * 2, strokeWidth * 0.6));
  }
  
  return primitives;
}

/**
 * Angular/diagonal composition
 */
function generateAngularComposition(
  cx: number,
  cy: number,
  size: number,
  strokeWidth: number,
  spacing: number,
  rng: () => number
): Primitive[] {
  const primitives: Primitive[] = [];
  const lineLength = size * 0.35;
  
  // X-shaped diagonals
  primitives.push(generateDiagonalLine(cx, cy, lineLength, strokeWidth, 1));
  primitives.push(generateDiagonalLine(cx, cy, lineLength, strokeWidth, -1));
  
  // Horizontal or vertical accent
  if (rng() > 0.5) {
    primitives.push(generateHorizontalBar(cx, cy, lineLength * 0.8, strokeWidth * 0.7));
  } else {
    primitives.push(generateVerticalBar(cx, cy, lineLength * 0.8, strokeWidth * 0.7));
  }
  
  return primitives;
}

/**
 * Frame/border composition
 */
function generateFrameComposition(
  cx: number,
  cy: number,
  size: number,
  strokeWidth: number,
  spacing: number,
  rng: () => number
): Primitive[] {
  const primitives: Primitive[] = [];
  const halfSize = size * 0.35;
  
  // Open frame (not closed square)
  // Top bar
  primitives.push(generateHorizontalBar(cx, cy - halfSize, halfSize * 1.5, strokeWidth));
  // Bottom bar
  primitives.push(generateHorizontalBar(cx, cy + halfSize, halfSize * 1.5, strokeWidth));
  
  // Partial vertical bars
  const vertLength = halfSize * (0.5 + rng() * 0.4);
  primitives.push({
    type: "rect",
    x1: cx - halfSize * 0.75 - strokeWidth / 2,
    y1: cy - vertLength / 2,
    width: strokeWidth,
    height: vertLength,
    strokeWidth,
    angle: 90,
  });
  
  // Center element
  if (rng() > 0.5) {
    primitives.push(generateSquareBlock(cx, cy, strokeWidth * 2, strokeWidth));
  }
  
  return primitives;
}

/**
 * Modular grid-based composition
 */
function generateModularComposition(
  cx: number,
  cy: number,
  size: number,
  strokeWidth: number,
  spacing: number,
  count: number,
  rng: () => number
): Primitive[] {
  const primitives: Primitive[] = [];
  const gridSize = 3;
  const cellSize = size / gridSize * 0.4;
  const startX = cx - cellSize * (gridSize - 1) / 2;
  const startY = cy - cellSize * (gridSize - 1) / 2;
  
  // Create pattern based on seed
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (primitives.length >= count) break;
      
      const cellX = startX + col * cellSize;
      const cellY = startY + row * cellSize;
      
      // Deterministic pattern: not all cells filled
      const shouldFill = ((row + col) % 2 === 0) || rng() > 0.6;
      
      if (shouldFill) {
        if (rng() > 0.5) {
          primitives.push(generateSquareBlock(cellX, cellY, strokeWidth * 1.2, strokeWidth));
        } else {
          // Small bar
          const isHorizontal = rng() > 0.5;
          if (isHorizontal) {
            primitives.push(generateHorizontalBar(cellX, cellY, cellSize * 0.8, strokeWidth * 0.8));
          } else {
            primitives.push(generateVerticalBar(cellX, cellY, cellSize * 0.8, strokeWidth * 0.8));
          }
        }
      }
    }
  }
  
  return primitives;
}

/**
 * Ensure visual balance without symmetry
 */
function ensureVisualBalance(
  primitives: Primitive[],
  cx: number,
  cy: number
): Primitive[] {
  if (primitives.length === 0) return primitives;
  
  // Calculate center of mass
  let massX = 0;
  let massY = 0;
  let totalMass = 0;
  
  for (const p of primitives) {
    const px = p.type === "rect" ? (p.x1 + (p.width ?? 0) / 2) : ((p.x1 + (p.x2 ?? 0)) / 2);
    const py = p.type === "rect" ? (p.y1 + (p.height ?? 0) / 2) : ((p.y1 + (p.y2 ?? 0)) / 2);
    const mass = p.strokeWidth;
    
    massX += px * mass;
    massY += py * mass;
    totalMass += mass;
  }
  
  if (totalMass === 0) return primitives;
  
  const comX = massX / totalMass;
  const comY = massY / totalMass;
  
  // Shift all primitives to center the composition
  const shiftX = cx - comX;
  const shiftY = cy - comY;
  
  return primitives.map(p => ({
    ...p,
    x1: p.x1 + shiftX,
    y1: p.y1 + shiftY,
    x2: p.x2 !== undefined ? p.x2 + shiftX : undefined,
    y2: p.y2 !== undefined ? p.y2 + shiftY : undefined,
  }));
}

// ============================================
// SVG Renderer
// ============================================

function primitivesToSvg(primitives: Primitive[], color: string): string {
  let svg = "";
  
  for (const p of primitives) {
    if (p.type === "rect") {
      svg += `<rect x="${p.x1.toFixed(2)}" y="${p.y1.toFixed(2)}" width="${(p.width ?? 0).toFixed(2)}" height="${(p.height ?? 0).toFixed(2)}" fill="${color}"/>`;
    } else if (p.type === "line") {
      svg += `<line x1="${(p.x1).toFixed(2)}" y1="${(p.y1).toFixed(2)}" x2="${(p.x2 ?? 0).toFixed(2)}" y2="${(p.y2 ?? 0).toFixed(2)}" stroke="${color}" stroke-width="${p.strokeWidth.toFixed(2)}" stroke-linecap="square"/>`;
    }
  }
  
  return svg;
}

function calculateBounds(primitives: Primitive[]): { x: number; y: number; width: number; height: number } {
  if (primitives.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const p of primitives) {
    if (p.type === "rect") {
      minX = Math.min(minX, p.x1);
      minY = Math.min(minY, p.y1);
      maxX = Math.max(maxX, p.x1 + (p.width ?? 0));
      maxY = Math.max(maxY, p.y1 + (p.height ?? 0));
    } else {
      minX = Math.min(minX, p.x1, p.x2 ?? 0);
      minY = Math.min(minY, p.y1, p.y2 ?? 0);
      maxX = Math.max(maxX, p.x1, p.x2 ?? 0);
      maxY = Math.max(maxY, p.y1, p.y2 ?? 0);
    }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ============================================
// Coverage Validator
// ============================================

function validateCoverage(
  bounds: { width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const markArea = bounds.width * bounds.height;
  const canvasArea = canvasWidth * canvasHeight;
  const coverage = markArea / canvasArea;
  
  return coverage >= CONFIG.MIN_COVERAGE * 0.8 && coverage <= CONFIG.MAX_COVERAGE * 1.2;
}

// ============================================
// Main Renderer
// ============================================

/**
 * Parse input from mark layer to SymbolicMarkInput
 */
function parseSymbolicInput(
  text: string | undefined,
  scale: number,
  seed: number
): SymbolicMarkInput {
  const textLength = text?.length ?? 5;
  
  // Derive rhythm from scale
  const rhythm: SymbolicMarkInput["rhythm"] = 
    scale < 0.8 ? "compact" : scale > 1.2 ? "extended" : "balanced";
  
  // Derive weight from seed modulo
  const weightIndex = seed % 3;
  const weight: SymbolicMarkInput["weight"] = 
    weightIndex === 0 ? "light" : weightIndex === 1 ? "medium" : "bold";
  
  // Derive symmetry from seed
  const symmetryIndex = Math.floor(seed / 3) % 3;
  const symmetry: SymbolicMarkInput["symmetry"] = 
    symmetryIndex === 0 ? "vertical" : symmetryIndex === 1 ? "radial" : "none";
  
  return {
    textLength,
    rhythm,
    weight,
    symmetry,
    seed,
  };
}

/**
 * Symbolic Mark Renderer
 * 
 * Creates abstract logo marks. NEVER renders text or letters.
 */
export const symbolicMarkRenderer: MarkRenderer = {
  id: "symbolic-mark",
  name: "Symbolic Mark",
  supportedScripts: ["abstract"],
  
  render(ctx: MarkRendererContext): MarkRendererResult {
    const { canvas, layer, seed } = ctx;
    const color = layer.color;
    
    // Parse input parameters
    const input = parseSymbolicInput(layer.text, layer.scale, seed);
    
    // Generate composition
    let primitives = generateComposition(input, canvas.width, canvas.height, color);
    
    // Validate coverage and regenerate if needed
    let bounds = calculateBounds(primitives);
    let attempts = 0;
    
    while (!validateCoverage(bounds, canvas.width, canvas.height) && attempts < 3) {
      // Adjust scale and regenerate
      const adjustedInput: SymbolicMarkInput = {
        ...input,
        seed: input.seed + attempts + 1,
        rhythm: attempts === 1 ? "extended" : attempts === 2 ? "compact" : input.rhythm,
      };
      primitives = generateComposition(adjustedInput, canvas.width, canvas.height, color);
      bounds = calculateBounds(primitives);
      attempts++;
    }
    
    // Generate SVG
    const svg = primitivesToSvg(primitives, color);
    
    // Apply glow if specified
    let finalSvg = svg;
    if (layer.glow > 0) {
      const glowId = `symbolic-glow-${seed}`;
      const glowColor = layer.glowColor || color;
      const glowDef = `<defs><filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="${layer.glow * 10}" result="blur"/><feFlood flood-color="${glowColor}" flood-opacity="0.5" result="color"/><feComposite in="color" in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
      finalSvg = glowDef + `<g filter="url(#${glowId})">${svg}</g>`;
    }
    
    return {
      svg: finalSvg,
      bounds,
      elementCount: primitives.length,
    };
  },
};

export default symbolicMarkRenderer;
