/**
 * Main Mark Layer Renderer
 * 
 * Pluggable mark renderer system supporting multiple renderer types:
 * - kufic-block-v2: Grid-based Arabic text rendering
 * - geometric-wordmark: Abstract geometric marks
 * - abstract-grid: Pure geometric patterns
 * - text-fallback: System font fallback
 */

import type {
  MarkLayer,
  LayerRendererContext,
  LayerRendererResult,
  MarkRenderer,
  MarkRendererContext,
  MarkRendererResult,
  Canvas,
} from "../types";
import { createSeededRandom } from "../types";
import { symbolicMarkRenderer } from "../marks/symbolicMark";

// ============================================
// Character Pattern Map for Kufic Block V2
// ============================================

interface CharacterPattern {
  width: number;
  height: number;
  blocks: number[][];
}

// Enhanced Kufic patterns - more Arabic characters
const KUFIC_PATTERNS: Record<string, CharacterPattern> = {
  // ت - Ta
  "ت": {
    width: 5, height: 7,
    blocks: [
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
  },
  // ِ - Kasra
  "ِ": {
    width: 2, height: 2,
    blocks: [[0, 0], [1, 1]],
  },
  // ب - Ba
  "ب": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
    ],
  },
  // ي - Ya
  "ي": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [0, 1, 0, 1, 0],
    ],
  },
  // ا - Alef
  "ا": {
    width: 3, height: 7,
    blocks: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  // ن - Nun
  "ن": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
  },
  // م - Meem
  "م": {
    width: 5, height: 7,
    blocks: [
      [1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
  },
  // س - Seen
  "س": {
    width: 6, height: 7,
    blocks: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1, 1],
    ],
  },
  // ل - Lam
  "ل": {
    width: 4, height: 7,
    blocks: [
      [0, 0, 0, 1],
      [0, 0, 0, 1],
      [0, 0, 0, 1],
      [0, 0, 0, 1],
      [1, 1, 1, 1],
      [1, 0, 0, 0],
      [1, 1, 1, 1],
    ],
  },
  // ع - Ain
  "ع": {
    width: 5, height: 7,
    blocks: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0],
    ],
  },
  // ر - Ra
  "ر": {
    width: 4, height: 7,
    blocks: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 1],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
    ],
  },
  // ة - Ta Marbuta
  "ة": {
    width: 5, height: 7,
    blocks: [
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
  },
  // ك - Kaf
  "ك": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
  },
  // و - Waw
  "و": {
    width: 4, height: 7,
    blocks: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 1, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
    ],
  },
  // ح - Ha
  "ح": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 0, 0, 1],
      [0, 0, 1, 1, 0],
    ],
  },
  // خ - Kha
  "خ": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 0, 0, 1],
      [0, 0, 1, 1, 0],
    ],
  },
  // ف - Fa
  "ف": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 1, 0],
    ],
  },
  // ق - Qaf
  "ق": {
    width: 5, height: 7,
    blocks: [
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 1, 0],
    ],
  },
  // ه - Ha (end)
  "ه": {
    width: 4, height: 7,
    blocks: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
  },
  // ء - Hamza
  "ء": {
    width: 3, height: 3,
    blocks: [
      [0, 1, 0],
      [1, 0, 0],
      [0, 1, 0],
    ],
  },
  // ى - Alef Maksura
  "ى": {
    width: 5, height: 7,
    blocks: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
  },
  // Default fallback
  default: {
    width: 4, height: 7,
    blocks: [
      [1, 1, 1, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1],
    ],
  },
};

const CHAR_SPACING = 2;

function getCharPattern(char: string): CharacterPattern {
  return KUFIC_PATTERNS[char] || KUFIC_PATTERNS.default;
}

function calculateTextWidth(text: string, blockSize: number): number {
  let totalWidth = 0;
  for (const char of text) {
    if (char === " ") {
      totalWidth += blockSize * 3;
    } else {
      const pattern = getCharPattern(char);
      totalWidth += pattern.width * blockSize + CHAR_SPACING * blockSize;
    }
  }
  return totalWidth - CHAR_SPACING * blockSize;
}

// ============================================
// Kufic Block V2 Renderer
// ============================================

const kuficBlockV2Renderer: MarkRenderer = {
  id: "kufic-block-v2",
  name: "Kufic Block V2",
  supportedScripts: ["arabic"],
  
  render(ctx: MarkRendererContext): MarkRendererResult {
    const { canvas, layer, seed } = ctx;
    const text = layer.text || "";
    
    if (!text) {
      return { svg: "", bounds: { x: 0, y: 0, width: 0, height: 0 }, elementCount: 0 };
    }
    
    const blockSize = layer.strokeWidth * layer.scale;
    const color = layer.color;
    const rng = createSeededRandom(seed);
    
    // Reverse for RTL
    const chars = text.split("").reverse();
    
    const totalWidth = calculateTextWidth(text, blockSize);
    const totalHeight = 7 * blockSize;
    
    let startX = layer.centered ? (canvas.width - totalWidth) / 2 : canvas.width * 0.1;
    const startY = layer.centered ? (canvas.height - totalHeight) / 2 : canvas.height * 0.4;
    
    let svgPaths = "";
    let currentX = startX;
    let elementCount = 0;
    
    const spacing = layer.blockSpacing ?? 0.05;
    const cornerRadius = layer.cornerRadius ?? 0.1;
    
    for (const char of chars) {
      if (char === " ") {
        currentX += blockSize * 3;
        continue;
      }
      
      const pattern = getCharPattern(char);
      
      for (let row = 0; row < pattern.height; row++) {
        for (let col = 0; col < pattern.width; col++) {
          if (pattern.blocks[row][col] === 1) {
            const x = currentX + col * blockSize;
            const y = startY + row * blockSize;
            
            const offsetX = (rng() - 0.5) * blockSize * spacing;
            const offsetY = (rng() - 0.5) * blockSize * spacing;
            
            svgPaths += `<rect x="${x + offsetX}" y="${y + offsetY}" width="${blockSize * (1 - spacing)}" height="${blockSize * (1 - spacing)}" fill="${color}" rx="${blockSize * cornerRadius}"/>`;
            elementCount++;
          }
        }
      }
      
      currentX += pattern.width * blockSize + CHAR_SPACING * blockSize;
    }
    
    // Apply glow if specified
    if (layer.glow > 0) {
      const glowId = `mark-glow-${seed}`;
      const glowColor = layer.glowColor || color;
      const glowDef = `<defs><filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="${layer.glow * 10}" result="blur"/><feFlood flood-color="${glowColor}" flood-opacity="0.5" result="color"/><feComposite in="color" in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
      svgPaths = glowDef + `<g filter="url(#${glowId})">${svgPaths}</g>`;
    }
    
    return {
      svg: svgPaths,
      bounds: { x: startX, y: startY, width: totalWidth, height: totalHeight },
      elementCount,
    };
  },
};

// ============================================
// Geometric Wordmark Renderer
// ============================================

const geometricWordmarkRenderer: MarkRenderer = {
  id: "geometric-wordmark",
  name: "Geometric Wordmark",
  supportedScripts: ["abstract"],
  
  render(ctx: MarkRendererContext): MarkRendererResult {
    const { canvas, layer, theme, seed } = ctx;
    const rng = createSeededRandom(seed);
    
    const shapeCount = layer.shapeCount ?? 5;
    const shapeType = layer.shapeType ?? "squares";
    const color = layer.color;
    const scale = layer.scale;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseSize = Math.min(canvas.width, canvas.height) * 0.15 * scale;
    
    let svg = "";
    let elementCount = 0;
    
    const totalWidth = baseSize * shapeCount * 1.5;
    const startX = centerX - totalWidth / 2;
    
    for (let i = 0; i < shapeCount; i++) {
      const x = startX + i * baseSize * 1.5;
      const y = centerY - baseSize / 2 + (rng() - 0.5) * baseSize * 0.3;
      const size = baseSize * (0.8 + rng() * 0.4);
      const rotation = (rng() - 0.5) * 15;
      
      const shape = shapeType === "mixed"
        ? (["squares", "circles", "triangles"] as const)[Math.floor(rng() * 3)]
        : shapeType;
      
      switch (shape) {
        case "squares":
          svg += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" transform="rotate(${rotation} ${x + size/2} ${y + size/2})"/>`;
          break;
        case "circles":
          svg += `<circle cx="${x + size/2}" cy="${y + size/2}" r="${size/2}" fill="${color}"/>`;
          break;
        case "triangles":
          const points = `${x + size/2},${y} ${x + size},${y + size} ${x},${y + size}`;
          svg += `<polygon points="${points}" fill="${color}" transform="rotate(${rotation} ${x + size/2} ${y + size/2})"/>`;
          break;
      }
      elementCount++;
    }
    
    // Add connecting lines
    for (let i = 0; i < shapeCount - 1; i++) {
      if (rng() > 0.5) {
        const x1 = startX + i * baseSize * 1.5 + baseSize;
        const x2 = startX + (i + 1) * baseSize * 1.5;
        svg += `<line x1="${x1}" y1="${centerY}" x2="${x2}" y2="${centerY}" stroke="${color}" stroke-width="${2 * scale}" opacity="0.5"/>`;
        elementCount++;
      }
    }
    
    // Apply glow
    if (layer.glow > 0) {
      const glowId = `geo-glow-${seed}`;
      const glowDef = `<defs><filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="${layer.glow * 8}"/></filter></defs>`;
      svg = glowDef + `<g filter="url(#${glowId})">${svg}</g>`;
    }
    
    return {
      svg,
      bounds: { x: startX, y: centerY - baseSize, width: totalWidth, height: baseSize * 2 },
      elementCount,
    };
  },
};

// ============================================
// Abstract Grid Renderer
// ============================================

const abstractGridRenderer: MarkRenderer = {
  id: "abstract-grid",
  name: "Abstract Grid",
  supportedScripts: ["abstract"],
  
  render(ctx: MarkRendererContext): MarkRendererResult {
    const { canvas, layer, seed } = ctx;
    const rng = createSeededRandom(seed);
    
    const color = layer.color;
    const scale = layer.scale;
    
    const gridSize = 5;
    const cellSize = Math.min(canvas.width, canvas.height) * 0.1 * scale;
    const totalSize = gridSize * cellSize;
    
    const startX = (canvas.width - totalSize) / 2;
    const startY = (canvas.height - totalSize) / 2;
    
    let svg = "";
    let elementCount = 0;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (rng() > 0.4) {
          const x = startX + col * cellSize;
          const y = startY + row * cellSize;
          const size = cellSize * 0.85;
          const opacity = 0.5 + rng() * 0.5;
          
          if (rng() > 0.5) {
            svg += `<rect x="${x + (cellSize - size)/2}" y="${y + (cellSize - size)/2}" width="${size}" height="${size}" fill="${color}" opacity="${opacity}"/>`;
          } else {
            svg += `<circle cx="${x + cellSize/2}" cy="${y + cellSize/2}" r="${size/2}" fill="${color}" opacity="${opacity}"/>`;
          }
          elementCount++;
        }
      }
    }
    
    return {
      svg,
      bounds: { x: startX, y: startY, width: totalSize, height: totalSize },
      elementCount,
    };
  },
};

// ============================================
// Text Fallback Renderer
// ============================================

const textFallbackRenderer: MarkRenderer = {
  id: "text-fallback",
  name: "Text Fallback",
  supportedScripts: ["arabic", "latin"],
  
  render(ctx: MarkRendererContext): MarkRendererResult {
    const { canvas, layer } = ctx;
    const text = layer.text || "";
    const color = layer.color;
    const fontSize = layer.strokeWidth * layer.scale * 5;
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Use system font with proper Arabic support
    const svg = `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="${fontSize}" font-family="'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif" font-weight="bold" direction="rtl">${escapeXml(text)}</text>`;
    
    return {
      svg,
      bounds: { x: x - fontSize * text.length / 2, y: y - fontSize / 2, width: fontSize * text.length, height: fontSize },
      elementCount: 1,
    };
  },
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================
// Mark Renderer Registry
// ============================================

const markRenderers: Record<string, MarkRenderer> = {
  // PRIMARY: Symbolic mark renderer (default for logo preset)
  "symbolic-mark": symbolicMarkRenderer,
  // DEPRECATED for logo preset: Text-based renderers
  // These should only be used if explicitly requested
  "kufic-block-v2": kuficBlockV2Renderer,
  "geometric-wordmark": geometricWordmarkRenderer,
  "abstract-grid": abstractGridRenderer,
  "text-fallback": textFallbackRenderer,
};

export function getMarkRenderer(id: string): MarkRenderer | undefined {
  return markRenderers[id];
}

export function registerMarkRenderer(renderer: MarkRenderer): void {
  markRenderers[renderer.id] = renderer;
}

// ============================================
// Main Mark Layer Renderer
// ============================================

export function renderMainMark(
  layer: MarkLayer,
  ctx: LayerRendererContext
): LayerRendererResult {
  const { canvas, theme, seed } = ctx;
  
  // CRITICAL: Use symbolic-mark as default for abstract logo marks
  // Text-based renderers (kufic-block-v2, text-fallback) are deprecated
  // for logo preset and should only be used if explicitly requested.
  const rendererId = layer.renderer || "symbolic-mark";
  const renderer = markRenderers[rendererId];
  
  if (!renderer) {
    // Fallback to symbolic-mark (NOT text-based)
    const fallback = markRenderers["symbolic-mark"];
    const result = fallback.render({ canvas, layer, theme, seed });
    return { svg: result.svg, elementCount: result.elementCount };
  }
  
  const result = renderer.render({ canvas, layer, theme, seed });
  return { svg: result.svg, elementCount: result.elementCount };
}

export default renderMainMark;
