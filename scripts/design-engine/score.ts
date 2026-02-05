#!/usr/bin/env tsx
/**
 * Design Engine Scoring
 *
 * Scores rendered SVGs using heuristic metrics.
 * Does NOT require a vision model - uses deterministic SVG analysis.
 *
 * Metrics:
 * - Dominance Score: Main mark area vs background (higher = better)
 * - Contrast Score: Foreground vs background color contrast
 * - Complexity Score: Element count (moderate is ideal)
 * - Whitespace Score: Negative space ratio (balanced is ideal)
 * - Symmetry Score: Visual balance (for presets requiring symmetry)
 *
 * INTERNAL TOOLING ONLY - Not user-facing.
 *
 * Usage:
 *   npm run design:score
 */

import * as fs from "fs";
import * as path from "path";

// ============================================
// Configuration
// ============================================

interface ScoringConfig {
  inputDir: string;
  requestsDir: string;
  rendersDir: string;
  outputFile: string;
}

const DEFAULT_CONFIG: ScoringConfig = {
  inputDir: path.resolve(__dirname, "../../fixtures/generated"),
  requestsDir: "requests",
  rendersDir: "renders",
  outputFile: "scores.csv",
};

// ============================================
// Scoring Metrics
// ============================================

interface ScoreMetrics {
  dominance: number;      // 0-1: Mark visual weight vs total
  contrast: number;       // 0-1: Color contrast quality
  complexity: number;     // 0-1: Element count score (bell curve)
  whitespace: number;     // 0-1: Negative space balance
  symmetry: number;       // 0-1: Visual balance (preset-dependent)
  overall: number;        // 0-1: Weighted composite score
}

interface ScoredSample {
  id: string;
  presetId: string;
  themeId: string;
  seed: number;
  patternIntensity: number;
  circuitIntensity: number;
  accentIntensity: number;
  markScale: number;
  markStrokeWidth: number;
  markGlow: number;
  patternDensity: number;
  patternTileSize: number;
  circuitDensity: number;
  renderTimeMs: number;
  elementCount: number;
  validationValid: boolean;
  metrics: ScoreMetrics;
}

// ============================================
// SVG Analysis Utilities
// ============================================

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16),
  ];
}

/**
 * Calculate relative luminance
 */
function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract colors from SVG
 */
function extractColors(svg: string): { background: string; foreground: string[] } {
  // Find background (usually first rect or svg fill)
  const bgMatch = svg.match(/<rect[^>]*fill="(#[0-9A-Fa-f]{6})"/);
  const background = bgMatch ? bgMatch[1] : "#000000";
  
  // Find foreground colors (stroke and fill colors)
  const colorMatches = Array.from(svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g));
  const foreground: string[] = [];
  
  for (const match of colorMatches) {
    if (match[1] !== background && !foreground.includes(match[1])) {
      foreground.push(match[1]);
    }
  }
  
  return { background, foreground };
}

/**
 * Count SVG elements
 */
function countElements(svg: string): number {
  // Count all graphics elements
  const elementTags = ["rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "g"];
  let count = 0;
  
  for (const tag of elementTags) {
    const regex = new RegExp(`<${tag}[\\s>]`, "g");
    const matches = svg.match(regex);
    count += matches ? matches.length : 0;
  }
  
  return count;
}

/**
 * Estimate mark region bounds from SVG
 */
function estimateMarkBounds(svg: string): { x: number; y: number; w: number; h: number } | null {
  // Look for the mark group
  const markGroupMatch = svg.match(/<g[^>]*id="mark"[^>]*>([\s\S]*?)<\/g>/);
  if (!markGroupMatch) {
    // Try to find transform hints
    const transformMatch = svg.match(/translate\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\)/);
    if (transformMatch) {
      return {
        x: parseFloat(transformMatch[1]) - 200,
        y: parseFloat(transformMatch[2]) - 200,
        w: 400,
        h: 400,
      };
    }
    return null;
  }
  
  // Extract paths from mark group
  const pathMatches = Array.from(markGroupMatch[1].matchAll(/d="([^"]+)"/g));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const pathMatch of pathMatches) {
    // Simple extraction of coordinates from path data
    const coords = pathMatch[1].match(/[-\d.]+/g);
    if (coords) {
      for (let i = 0; i < coords.length - 1; i += 2) {
        const x = parseFloat(coords[i]);
        const y = parseFloat(coords[i + 1]);
        if (!isNaN(x) && !isNaN(y)) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
  }
  
  if (minX === Infinity) return null;
  
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Extract canvas dimensions from SVG
 */
function extractCanvasDimensions(svg: string): { width: number; height: number } {
  const widthMatch = svg.match(/width="(\d+)"/);
  const heightMatch = svg.match(/height="(\d+)"/);
  
  return {
    width: widthMatch ? parseInt(widthMatch[1], 10) : 1024,
    height: heightMatch ? parseInt(heightMatch[1], 10) : 1024,
  };
}

// ============================================
// Scoring Functions
// ============================================

/**
 * Score dominance: how much the mark dominates the visual
 */
function scoreDominance(
  svg: string,
  elementCount: number,
  patternIntensity: number,
  circuitIntensity: number
): number {
  const { width, height } = extractCanvasDimensions(svg);
  const canvasArea = width * height;
  
  // Estimate mark area
  const markBounds = estimateMarkBounds(svg);
  if (!markBounds) {
    // Fallback based on intensities
    const noiseLevel = (patternIntensity + circuitIntensity) / 2;
    return Math.max(0, 1 - noiseLevel * 1.5);
  }
  
  const markArea = markBounds.w * markBounds.h;
  const markRatio = markArea / canvasArea;
  
  // Ideal mark dominance: 15-40% of canvas
  if (markRatio < 0.05) return markRatio * 10; // Too small
  if (markRatio > 0.6) return Math.max(0, 1 - (markRatio - 0.6) * 2); // Too large
  
  // In ideal range, score based on noise level
  const noiseLevel = (patternIntensity + circuitIntensity) / 2;
  const noiseScore = 1 - noiseLevel * 0.5;
  
  // Peak at 20-30% mark coverage
  const coverageScore = markRatio < 0.2 
    ? markRatio / 0.2 
    : markRatio > 0.4 
      ? Math.max(0, 1 - (markRatio - 0.4) / 0.2)
      : 1;
  
  return Math.min(1, (coverageScore + noiseScore) / 2);
}

/**
 * Score contrast: color contrast quality
 */
function scoreContrast(svg: string): number {
  const { background, foreground } = extractColors(svg);
  
  if (foreground.length === 0) {
    return 0.5; // Neutral score if no foreground detected
  }
  
  // Calculate contrast with each foreground color
  const ratios = foreground.map((fg) => calculateContrastRatio(background, fg));
  const maxRatio = Math.max(...ratios);
  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  
  // WCAG AA requires 4.5:1, AAA requires 7:1
  // Score: 0 at 1:1, 1 at 7:1+
  const scoreFromMax = Math.min(1, (maxRatio - 1) / 6);
  const scoreFromAvg = Math.min(1, (avgRatio - 1) / 5);
  
  return (scoreFromMax * 0.7 + scoreFromAvg * 0.3);
}

/**
 * Score complexity: element count should be moderate
 */
function scoreComplexity(elementCount: number, presetId: string): number {
  // Ideal ranges by preset
  const idealRanges: Record<string, { min: number; max: number; optimal: number }> = {
    logo: { min: 10, max: 500, optimal: 100 },
    banner: { min: 20, max: 800, optimal: 200 },
    pattern: { min: 100, max: 2000, optimal: 500 },
    "social-card": { min: 15, max: 600, optimal: 150 },
  };
  
  const range = idealRanges[presetId] || idealRanges.logo;
  
  if (elementCount < range.min) {
    return elementCount / range.min; // Penalize too few elements
  }
  if (elementCount > range.max) {
    return Math.max(0, 1 - (elementCount - range.max) / range.max); // Penalize too many
  }
  
  // Bell curve around optimal
  const distance = Math.abs(elementCount - range.optimal);
  const width = (range.max - range.min) / 2;
  return Math.exp(-(distance * distance) / (2 * width * width));
}

/**
 * Score whitespace: negative space balance
 */
function scoreWhitespace(
  svg: string,
  elementCount: number,
  patternIntensity: number,
  circuitIntensity: number
): number {
  const { width, height } = extractCanvasDimensions(svg);
  const canvasArea = width * height;
  
  // Estimate filled area based on element count and intensities
  const baseFilledRatio = elementCount / 2000; // Rough heuristic
  const patternFill = patternIntensity * 0.3;
  const circuitFill = circuitIntensity * 0.15;
  
  const estimatedFillRatio = Math.min(1, baseFilledRatio + patternFill + circuitFill);
  const whitespaceRatio = 1 - estimatedFillRatio;
  
  // Ideal whitespace: 40-70%
  if (whitespaceRatio < 0.2) return whitespaceRatio / 0.2 * 0.5; // Too crowded
  if (whitespaceRatio > 0.85) return Math.max(0, 1 - (whitespaceRatio - 0.85) / 0.15); // Too empty
  
  // Peak at 50-60% whitespace
  if (whitespaceRatio >= 0.4 && whitespaceRatio <= 0.7) return 1;
  if (whitespaceRatio < 0.4) return 0.5 + (whitespaceRatio - 0.2) / 0.4;
  return 0.5 + (0.85 - whitespaceRatio) / 0.3;
}

/**
 * Score symmetry: visual balance
 */
function scoreSymmetry(svg: string, presetId: string): number {
  // Only logo preset requires strict symmetry
  const requiresSymmetry = presetId === "logo";
  
  if (!requiresSymmetry) {
    return 0.8; // Default good score for non-symmetric presets
  }
  
  // Extract mark bounds
  const markBounds = estimateMarkBounds(svg);
  const { width, height } = extractCanvasDimensions(svg);
  
  if (!markBounds) {
    return 0.7; // Neutral if can't detect
  }
  
  // Check if mark is centered
  const centerX = width / 2;
  const centerY = height / 2;
  
  const markCenterX = markBounds.x + markBounds.w / 2;
  const markCenterY = markBounds.y + markBounds.h / 2;
  
  const xOffset = Math.abs(markCenterX - centerX) / width;
  const yOffset = Math.abs(markCenterY - centerY) / height;
  
  // Score based on centering (max offset ~15% is good)
  const xScore = Math.max(0, 1 - xOffset * 5);
  const yScore = Math.max(0, 1 - yOffset * 5);
  
  return (xScore + yScore) / 2;
}

/**
 * Calculate overall composite score
 */
function calculateOverallScore(metrics: Omit<ScoreMetrics, "overall">, presetId: string): number {
  // Weights by preset
  const weights: Record<string, { d: number; c: number; x: number; w: number; s: number }> = {
    logo: { d: 0.35, c: 0.25, x: 0.15, w: 0.10, s: 0.15 },
    banner: { d: 0.25, c: 0.25, x: 0.20, w: 0.20, s: 0.10 },
    pattern: { d: 0.10, c: 0.20, x: 0.35, w: 0.25, s: 0.10 },
    "social-card": { d: 0.25, c: 0.30, x: 0.15, w: 0.20, s: 0.10 },
  };
  
  const w = weights[presetId] || weights.logo;
  
  return (
    metrics.dominance * w.d +
    metrics.contrast * w.c +
    metrics.complexity * w.x +
    metrics.whitespace * w.w +
    metrics.symmetry * w.s
  );
}

// ============================================
// Main Scoring Logic
// ============================================

function scoreSample(
  requestData: {
    id: string;
    request: {
      presetId: string;
      themeId: string;
      seed: number;
      patternIntensity: number;
      circuitIntensity: number;
      accentIntensity: number;
    };
    layerOverrides?: {
      mark?: { scale?: number; strokeWidth?: number; glow?: number };
      pattern?: { density?: number; tileSize?: number };
      circuit?: { density?: number };
    };
    metadata?: { seed?: number };
  },
  svgContent: string,
  renderStats?: { renderTimeMs?: number; elementCount?: number },
  validationValid?: boolean
): ScoredSample {
  const { request, layerOverrides } = requestData;
  
  const elementCount = renderStats?.elementCount ?? countElements(svgContent);
  
  // Calculate individual metrics
  const dominance = scoreDominance(
    svgContent,
    elementCount,
    request.patternIntensity,
    request.circuitIntensity
  );
  const contrast = scoreContrast(svgContent);
  const complexity = scoreComplexity(elementCount, request.presetId);
  const whitespace = scoreWhitespace(
    svgContent,
    elementCount,
    request.patternIntensity,
    request.circuitIntensity
  );
  const symmetry = scoreSymmetry(svgContent, request.presetId);
  
  const partialMetrics = { dominance, contrast, complexity, whitespace, symmetry };
  const overall = calculateOverallScore(partialMetrics, request.presetId);
  
  return {
    id: requestData.id,
    presetId: request.presetId,
    themeId: request.themeId,
    seed: request.seed ?? requestData.metadata?.seed ?? 0,
    patternIntensity: request.patternIntensity,
    circuitIntensity: request.circuitIntensity,
    accentIntensity: request.accentIntensity,
    markScale: layerOverrides?.mark?.scale ?? 1,
    markStrokeWidth: layerOverrides?.mark?.strokeWidth ?? 10,
    markGlow: layerOverrides?.mark?.glow ?? 0,
    patternDensity: layerOverrides?.pattern?.density ?? 1,
    patternTileSize: layerOverrides?.pattern?.tileSize ?? 60,
    circuitDensity: layerOverrides?.circuit?.density ?? 0.35,
    renderTimeMs: renderStats?.renderTimeMs ?? 0,
    elementCount,
    validationValid: validationValid ?? true,
    metrics: { ...partialMetrics, overall },
  };
}

// ============================================
// CSV Export
// ============================================

function toCSV(samples: ScoredSample[]): string {
  const headers = [
    "id",
    "presetId",
    "themeId",
    "seed",
    "patternIntensity",
    "circuitIntensity",
    "accentIntensity",
    "markScale",
    "markStrokeWidth",
    "markGlow",
    "patternDensity",
    "patternTileSize",
    "circuitDensity",
    "renderTimeMs",
    "elementCount",
    "validationValid",
    "dominance",
    "contrast",
    "complexity",
    "whitespace",
    "symmetry",
    "overall",
  ];
  
  const rows = samples.map((s) => [
    s.id,
    s.presetId,
    s.themeId,
    s.seed,
    s.patternIntensity.toFixed(4),
    s.circuitIntensity.toFixed(4),
    s.accentIntensity.toFixed(4),
    s.markScale.toFixed(4),
    s.markStrokeWidth.toFixed(4),
    s.markGlow.toFixed(4),
    s.patternDensity.toFixed(4),
    s.patternTileSize.toFixed(4),
    s.circuitDensity.toFixed(4),
    s.renderTimeMs.toFixed(2),
    s.elementCount,
    s.validationValid ? 1 : 0,
    s.metrics.dominance.toFixed(4),
    s.metrics.contrast.toFixed(4),
    s.metrics.complexity.toFixed(4),
    s.metrics.whitespace.toFixed(4),
    s.metrics.symmetry.toFixed(4),
    s.metrics.overall.toFixed(4),
  ].join(","));
  
  return [headers.join(","), ...rows].join("\n");
}

// ============================================
// Main Scoring Pipeline
// ============================================

interface ScoringStats {
  total: number;
  scored: number;
  failed: number;
  avgOverall: number;
  topScores: Array<{ id: string; overall: number }>;
  bottomScores: Array<{ id: string; overall: number }>;
  byPreset: Record<string, { count: number; avgOverall: number }>;
  byTheme: Record<string, { count: number; avgOverall: number }>;
}

async function scoreDataset(config: ScoringConfig): Promise<ScoringStats> {
  console.log("Design Engine Scoring");
  console.log("=====================");
  console.log(`Input: ${config.inputDir}`);
  console.log("");
  
  const requestsPath = path.join(config.inputDir, config.requestsDir);
  const rendersPath = path.join(config.inputDir, config.rendersDir);
  
  if (!fs.existsSync(requestsPath) || !fs.existsSync(rendersPath)) {
    throw new Error("Input directories not found. Run dataset generator first.");
  }
  
  // List all request files
  const requestFiles = fs.readdirSync(requestsPath).filter((f) => f.endsWith(".json"));
  console.log(`Found ${requestFiles.length} samples to score.`);
  console.log("");
  
  const samples: ScoredSample[] = [];
  const stats: ScoringStats = {
    total: requestFiles.length,
    scored: 0,
    failed: 0,
    avgOverall: 0,
    topScores: [],
    bottomScores: [],
    byPreset: {},
    byTheme: {},
  };
  
  for (let i = 0; i < requestFiles.length; i++) {
    const requestFile = requestFiles[i];
    const id = requestFile.replace(".json", "");
    const svgFile = `${id}.svg`;
    
    try {
      // Load request
      const requestPath = path.join(requestsPath, requestFile);
      const requestData = JSON.parse(fs.readFileSync(requestPath, "utf-8"));
      
      // Load SVG
      const svgPath = path.join(rendersPath, svgFile);
      if (!fs.existsSync(svgPath)) {
        throw new Error(`SVG file not found: ${svgFile}`);
      }
      const svgContent = fs.readFileSync(svgPath, "utf-8");
      
      // Score the sample
      const scored = scoreSample(requestData, svgContent);
      samples.push(scored);
      stats.scored++;
      
      // Progress
      if ((i + 1) % 100 === 0 || i === requestFiles.length - 1) {
        const pct = Math.round(((i + 1) / requestFiles.length) * 100);
        console.log(`Scoring: ${i + 1}/${requestFiles.length} (${pct}%)`);
      }
    } catch (error) {
      stats.failed++;
      console.error(`Failed to score ${id}:`, error);
    }
  }
  
  // Calculate aggregate stats
  if (samples.length > 0) {
    // Overall average
    stats.avgOverall = samples.reduce((sum, s) => sum + s.metrics.overall, 0) / samples.length;
    
    // Sort by score
    const sorted = [...samples].sort((a, b) => b.metrics.overall - a.metrics.overall);
    stats.topScores = sorted.slice(0, 10).map((s) => ({ id: s.id, overall: s.metrics.overall }));
    stats.bottomScores = sorted.slice(-10).map((s) => ({ id: s.id, overall: s.metrics.overall }));
    
    // By preset
    for (const sample of samples) {
      if (!stats.byPreset[sample.presetId]) {
        stats.byPreset[sample.presetId] = { count: 0, avgOverall: 0 };
      }
      stats.byPreset[sample.presetId].count++;
      stats.byPreset[sample.presetId].avgOverall += sample.metrics.overall;
    }
    for (const preset of Object.keys(stats.byPreset)) {
      stats.byPreset[preset].avgOverall /= stats.byPreset[preset].count;
    }
    
    // By theme
    for (const sample of samples) {
      if (!stats.byTheme[sample.themeId]) {
        stats.byTheme[sample.themeId] = { count: 0, avgOverall: 0 };
      }
      stats.byTheme[sample.themeId].count++;
      stats.byTheme[sample.themeId].avgOverall += sample.metrics.overall;
    }
    for (const theme of Object.keys(stats.byTheme)) {
      stats.byTheme[theme].avgOverall /= stats.byTheme[theme].count;
    }
  }
  
  // Export CSV
  const csvContent = toCSV(samples);
  const csvPath = path.join(config.inputDir, config.outputFile);
  fs.writeFileSync(csvPath, csvContent);
  console.log("");
  console.log(`Scores written to: ${csvPath}`);
  
  return stats;
}

// ============================================
// CLI Entry Point
// ============================================

function parseArgs(): ScoringConfig {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of args) {
    if (arg.startsWith("--input=")) {
      config.inputDir = path.resolve(arg.split("=")[1]);
    }
    if (arg.startsWith("--output=")) {
      config.outputFile = arg.split("=")[1];
    }
  }
  
  return config;
}

async function main() {
  const config = parseArgs();
  
  const startTime = Date.now();
  const stats = await scoreDataset(config);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log("");
  console.log("Scoring Complete");
  console.log("================");
  console.log(`Total: ${stats.total}`);
  console.log(`Scored: ${stats.scored}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Avg Overall Score: ${stats.avgOverall.toFixed(4)}`);
  console.log(`Time: ${elapsedSec}s`);
  console.log("");
  console.log("Top 10 Scores:");
  for (const { id, overall } of stats.topScores) {
    console.log(`  ${id}: ${overall.toFixed(4)}`);
  }
  console.log("");
  console.log("Bottom 10 Scores:");
  for (const { id, overall } of stats.bottomScores) {
    console.log(`  ${id}: ${overall.toFixed(4)}`);
  }
  console.log("");
  console.log("By Preset:");
  for (const [preset, data] of Object.entries(stats.byPreset)) {
    console.log(`  ${preset}: ${data.count} samples, avg ${data.avgOverall.toFixed(4)}`);
  }
  console.log("");
  console.log("By Theme:");
  for (const [theme, data] of Object.entries(stats.byTheme)) {
    console.log(`  ${theme}: ${data.count} samples, avg ${data.avgOverall.toFixed(4)}`);
  }
}

main().catch((err) => {
  console.error("Scoring failed:", err);
  process.exit(1);
});
