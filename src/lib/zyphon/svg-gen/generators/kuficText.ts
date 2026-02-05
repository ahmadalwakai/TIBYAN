/**
 * Kufic Text Generator
 * 
 * Generates blocky Kufic-style Arabic text using rectangles and strokes.
 * Does not require external fonts - creates geometric representation.
 */

import type { TextSpec, Accent, Canvas } from "../types";

// ============================================
// Character Map: Arabic letters to geometric blocks
// ============================================

// Each character is represented as a grid pattern
// 1 = filled, 0 = empty, in a 5x7 grid (width x height)
// This creates blocky Kufic-like letterforms

interface CharacterPattern {
  width: number;
  height: number;
  blocks: number[][];
}

// Simplified Kufic patterns for Arabic letters
const KUFIC_PATTERNS: Record<string, CharacterPattern> = {
  // ت - Ta
  "ت": {
    width: 5,
    height: 7,
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
  // ِ - Kasra (diacritic)
  "ِ": {
    width: 2,
    height: 2,
    blocks: [
      [0, 0],
      [1, 1],
    ],
  },
  // ب - Ba
  "ب": {
    width: 5,
    height: 7,
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
    width: 5,
    height: 7,
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
    width: 3,
    height: 7,
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
    width: 5,
    height: 7,
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
  // Default fallback for unknown characters
  default: {
    width: 4,
    height: 7,
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

// Space between characters
const CHAR_SPACING = 2;

/**
 * Get pattern for a character
 */
function getCharPattern(char: string): CharacterPattern {
  return KUFIC_PATTERNS[char] || KUFIC_PATTERNS.default;
}

/**
 * Calculate total width of text
 */
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
  return totalWidth - CHAR_SPACING * blockSize; // Remove trailing spacing
}

/**
 * Generate SVG elements for Kufic-style text
 */
export function generateKuficText(
  text: TextSpec,
  accent: Accent | undefined,
  canvas: Canvas,
  seed: number
): string {
  const blockSize = text.strokeWidth * text.scale;
  const color = text.color || accent?.color || "#FFFFFF";
  
  // Reverse text for RTL rendering (Arabic reads right-to-left)
  const chars = text.value.split("").reverse();
  
  const totalWidth = calculateTextWidth(text.value, blockSize);
  const totalHeight = 7 * blockSize; // Standard height
  
  // Calculate starting position
  let startX = text.centered 
    ? (canvas.w - totalWidth) / 2 
    : canvas.w * 0.1;
  const startY = text.centered 
    ? (canvas.h - totalHeight) / 2 
    : canvas.h * 0.4;
  
  let svgPaths = "";
  let currentX = startX;
  
  // Add subtle randomization based on seed for organic feel
  const rng = createSeededRandom(seed);
  
  for (const char of chars) {
    if (char === " ") {
      currentX += blockSize * 3;
      continue;
    }
    
    const pattern = getCharPattern(char);
    
    // Draw blocks for this character
    for (let row = 0; row < pattern.height; row++) {
      for (let col = 0; col < pattern.width; col++) {
        if (pattern.blocks[row][col] === 1) {
          const x = currentX + col * blockSize;
          const y = startY + row * blockSize;
          
          // Small random offset for organic feel
          const offsetX = (rng() - 0.5) * blockSize * 0.05;
          const offsetY = (rng() - 0.5) * blockSize * 0.05;
          
          svgPaths += `<rect 
            x="${x + offsetX}" 
            y="${y + offsetY}" 
            width="${blockSize * 0.95}" 
            height="${blockSize * 0.95}" 
            fill="${color}"
            rx="${blockSize * 0.1}"
          />`;
        }
      }
    }
    
    currentX += pattern.width * blockSize + CHAR_SPACING * blockSize;
  }
  
  // Add glow effect if specified
  let glowFilter = "";
  if (accent?.glow && accent.glow > 0) {
    const glowId = `text-glow-${seed}`;
    glowFilter = `
      <defs>
        <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${accent.glow * 10}" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;
    svgPaths = `<g filter="url(#${glowId})">${svgPaths}</g>`;
  }
  
  return glowFilter + svgPaths;
}

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
