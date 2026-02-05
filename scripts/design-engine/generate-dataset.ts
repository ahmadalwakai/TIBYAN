#!/usr/bin/env tsx
/**
 * Design Engine Dataset Generator
 *
 * Generates synthetic EngineRequest variations and renders SVGs
 * for use in automated scoring and parameter tuning.
 *
 * INTERNAL TOOLING ONLY - Not user-facing.
 *
 * Usage:
 *   npm run design:gen
 *   npm run design:gen -- --count=100
 */

import * as fs from "fs";
import * as path from "path";
import {
  createSpec,
  render,
  listPresetIds,
  listThemeIds,
  type EngineRequest,
  type PresetId,
  type RenderResult,
} from "../../src/lib/zyphon/design-engine";

// ============================================
// Configuration
// ============================================

interface GeneratorConfig {
  count: number;
  outputDir: string;
  requestsDir: string;
  rendersDir: string;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  count: 500,
  outputDir: path.resolve(__dirname, "../../fixtures/generated"),
  requestsDir: "requests",
  rendersDir: "renders",
};

// ============================================
// Parameter Ranges for Variation
// ============================================

interface ParameterRanges {
  patternIntensity: { min: number; max: number };
  circuitIntensity: { min: number; max: number };
  accentIntensity: { min: number; max: number };
  // Mark layer variations
  markScale: { min: number; max: number };
  markStrokeWidth: { min: number; max: number };
  markGlow: { min: number; max: number };
  // Pattern layer variations
  patternDensity: { min: number; max: number };
  patternTileSize: { min: number; max: number };
  patternStrokeWidth: { min: number; max: number };
  // Circuit layer variations
  circuitDensity: { min: number; max: number };
  circuitNodeRadius: { min: number; max: number };
  circuitLineWidth: { min: number; max: number };
}

const PARAM_RANGES: ParameterRanges = {
  patternIntensity: { min: 0, max: 1 },
  circuitIntensity: { min: 0, max: 1 },
  accentIntensity: { min: 0, max: 1 },
  markScale: { min: 0.5, max: 2.0 },
  markStrokeWidth: { min: 5, max: 50 },
  markGlow: { min: 0, max: 0.8 },
  patternDensity: { min: 0.3, max: 1.5 },
  patternTileSize: { min: 30, max: 120 },
  patternStrokeWidth: { min: 0.5, max: 3 },
  circuitDensity: { min: 0.1, max: 0.8 },
  circuitNodeRadius: { min: 2, max: 8 },
  circuitLineWidth: { min: 0.5, max: 2.5 },
};

// ============================================
// Seeded Random Generator
// ============================================

function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// ============================================
// Random Helpers
// ============================================

function randomInRange(
  rng: () => number,
  min: number,
  max: number
): number {
  return min + rng() * (max - min);
}

function randomChoice<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ============================================
// Request Generator
// ============================================

interface GeneratedRequest {
  id: string;
  request: EngineRequest;
  metadata: {
    generatedAt: string;
    seed: number;
    variationSeed: number;
  };
}

function generateRequest(
  index: number,
  baseSeed: number
): GeneratedRequest {
  const variationSeed = baseSeed + index * 7919; // Prime multiplier for spread
  const rng = createSeededRandom(variationSeed);
  
  // Select preset and theme
  const presetIds = listPresetIds();
  const themeIds = listThemeIds();
  
  const presetId = randomChoice(rng, presetIds);
  const themeId = randomChoice(rng, themeIds);
  
  // Generate unique request seed
  const requestSeed = Math.floor(rng() * 999999999);
  
  // Generate intensity values
  const patternIntensity = randomInRange(
    rng,
    PARAM_RANGES.patternIntensity.min,
    PARAM_RANGES.patternIntensity.max
  );
  const circuitIntensity = randomInRange(
    rng,
    PARAM_RANGES.circuitIntensity.min,
    PARAM_RANGES.circuitIntensity.max
  );
  const accentIntensity = randomInRange(
    rng,
    PARAM_RANGES.accentIntensity.min,
    PARAM_RANGES.accentIntensity.max
  );
  
  // Build request
  const request: EngineRequest = {
    presetId,
    themeId,
    seed: requestSeed,
    patternIntensity,
    circuitIntensity,
    accentIntensity,
  };
  
  // Generate ID
  const id = `${presetId}-${themeId}-${index.toString().padStart(4, "0")}`;
  
  return {
    id,
    request,
    metadata: {
      generatedAt: new Date().toISOString(),
      seed: requestSeed,
      variationSeed,
    },
  };
}

// ============================================
// Extended Request with Layer Overrides
// ============================================

interface ExtendedGeneratedRequest extends GeneratedRequest {
  layerOverrides: {
    mark?: {
      scale?: number;
      strokeWidth?: number;
      glow?: number;
    };
    pattern?: {
      density?: number;
      tileSize?: number;
      strokeWidth?: number;
    };
    circuit?: {
      density?: number;
      nodeRadius?: number;
      lineWidth?: number;
    };
  };
}

function generateExtendedRequest(
  index: number,
  baseSeed: number
): ExtendedGeneratedRequest {
  const variationSeed = baseSeed + index * 7919;
  const rng = createSeededRandom(variationSeed);
  
  const presetIds = listPresetIds();
  const themeIds = listThemeIds();
  
  const presetId = randomChoice(rng, presetIds);
  const themeId = randomChoice(rng, themeIds);
  
  const requestSeed = Math.floor(rng() * 999999999);
  
  const patternIntensity = randomInRange(
    rng,
    PARAM_RANGES.patternIntensity.min,
    PARAM_RANGES.patternIntensity.max
  );
  const circuitIntensity = randomInRange(
    rng,
    PARAM_RANGES.circuitIntensity.min,
    PARAM_RANGES.circuitIntensity.max
  );
  const accentIntensity = randomInRange(
    rng,
    PARAM_RANGES.accentIntensity.min,
    PARAM_RANGES.accentIntensity.max
  );
  
  // Layer-specific overrides
  const layerOverrides = {
    mark: {
      scale: randomInRange(rng, PARAM_RANGES.markScale.min, PARAM_RANGES.markScale.max),
      strokeWidth: randomInRange(rng, PARAM_RANGES.markStrokeWidth.min, PARAM_RANGES.markStrokeWidth.max),
      glow: randomInRange(rng, PARAM_RANGES.markGlow.min, PARAM_RANGES.markGlow.max),
    },
    pattern: {
      density: randomInRange(rng, PARAM_RANGES.patternDensity.min, PARAM_RANGES.patternDensity.max),
      tileSize: randomInRange(rng, PARAM_RANGES.patternTileSize.min, PARAM_RANGES.patternTileSize.max),
      strokeWidth: randomInRange(rng, PARAM_RANGES.patternStrokeWidth.min, PARAM_RANGES.patternStrokeWidth.max),
    },
    circuit: {
      density: randomInRange(rng, PARAM_RANGES.circuitDensity.min, PARAM_RANGES.circuitDensity.max),
      nodeRadius: randomInRange(rng, PARAM_RANGES.circuitNodeRadius.min, PARAM_RANGES.circuitNodeRadius.max),
      lineWidth: randomInRange(rng, PARAM_RANGES.circuitLineWidth.min, PARAM_RANGES.circuitLineWidth.max),
    },
  };
  
  const request: EngineRequest = {
    presetId,
    themeId,
    seed: requestSeed,
    patternIntensity,
    circuitIntensity,
    accentIntensity,
  };
  
  const id = `${presetId}-${themeId}-${index.toString().padStart(4, "0")}`;
  
  return {
    id,
    request,
    metadata: {
      generatedAt: new Date().toISOString(),
      seed: requestSeed,
      variationSeed,
    },
    layerOverrides,
  };
}

// ============================================
// Render and Save
// ============================================

interface RenderOutput {
  id: string;
  svg: string;
  stats: {
    elementCount: number;
    renderTimeMs: number;
    layerCount: number;
  };
  validation: {
    valid: boolean;
    issueCount: number;
  };
}

function renderRequest(
  generated: ExtendedGeneratedRequest
): RenderOutput {
  // Create spec from request
  const spec = createSpec(generated.request);
  
  // Apply layer overrides
  for (const layer of spec.layers) {
    if (layer.type === "mark" && generated.layerOverrides.mark) {
      if (generated.layerOverrides.mark.scale !== undefined) {
        layer.scale = generated.layerOverrides.mark.scale;
      }
      if (generated.layerOverrides.mark.strokeWidth !== undefined) {
        layer.strokeWidth = generated.layerOverrides.mark.strokeWidth;
      }
      if (generated.layerOverrides.mark.glow !== undefined) {
        layer.glow = generated.layerOverrides.mark.glow;
      }
    }
    if (layer.type === "pattern" && generated.layerOverrides.pattern) {
      if (generated.layerOverrides.pattern.density !== undefined) {
        layer.density = generated.layerOverrides.pattern.density;
      }
      if (generated.layerOverrides.pattern.tileSize !== undefined) {
        layer.tileSize = generated.layerOverrides.pattern.tileSize;
      }
      if (generated.layerOverrides.pattern.strokeWidth !== undefined) {
        layer.strokeWidth = generated.layerOverrides.pattern.strokeWidth;
      }
    }
    if (layer.type === "circuit" && generated.layerOverrides.circuit) {
      if (generated.layerOverrides.circuit.density !== undefined) {
        layer.density = generated.layerOverrides.circuit.density;
      }
      if (generated.layerOverrides.circuit.nodeRadius !== undefined) {
        layer.nodeRadius = generated.layerOverrides.circuit.nodeRadius;
      }
      if (generated.layerOverrides.circuit.lineWidth !== undefined) {
        layer.lineWidth = generated.layerOverrides.circuit.lineWidth;
      }
    }
  }
  
  // Render
  const result: RenderResult = render(spec);
  
  return {
    id: generated.id,
    svg: result.svg,
    stats: result.stats,
    validation: {
      valid: result.validation.valid,
      issueCount: result.validation.issues.length,
    },
  };
}

// ============================================
// File I/O
// ============================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveRequest(
  generated: ExtendedGeneratedRequest,
  dir: string
): void {
  const filePath = path.join(dir, `${generated.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(generated, null, 2));
}

function saveSvg(output: RenderOutput, dir: string): void {
  const filePath = path.join(dir, `${output.id}.svg`);
  fs.writeFileSync(filePath, output.svg);
}

// ============================================
// Main Generator
// ============================================

interface GeneratorStats {
  total: number;
  successful: number;
  failed: number;
  avgRenderTimeMs: number;
  avgElementCount: number;
  byPreset: Record<string, number>;
  byTheme: Record<string, number>;
}

async function generateDataset(config: GeneratorConfig): Promise<GeneratorStats> {
  console.log("Design Engine Dataset Generator");
  console.log("================================");
  console.log(`Generating ${config.count} samples...`);
  console.log(`Output: ${config.outputDir}`);
  console.log("");
  
  // Ensure directories exist
  const requestsPath = path.join(config.outputDir, config.requestsDir);
  const rendersPath = path.join(config.outputDir, config.rendersDir);
  
  ensureDir(requestsPath);
  ensureDir(rendersPath);
  
  // Generate base seed from current time
  const baseSeed = Date.now() % 1000000;
  
  const stats: GeneratorStats = {
    total: config.count,
    successful: 0,
    failed: 0,
    avgRenderTimeMs: 0,
    avgElementCount: 0,
    byPreset: {},
    byTheme: {},
  };
  
  let totalRenderTime = 0;
  let totalElements = 0;
  
  for (let i = 0; i < config.count; i++) {
    try {
      // Generate request with variations
      const generated = generateExtendedRequest(i, baseSeed);
      
      // Save request JSON
      saveRequest(generated, requestsPath);
      
      // Render SVG
      const output = renderRequest(generated);
      
      // Save SVG
      saveSvg(output, rendersPath);
      
      // Update stats
      stats.successful++;
      totalRenderTime += output.stats.renderTimeMs;
      totalElements += output.stats.elementCount;
      
      const presetId = generated.request.presetId as string;
      const themeId = generated.request.themeId ?? "emerald";
      stats.byPreset[presetId] = (stats.byPreset[presetId] || 0) + 1;
      stats.byTheme[themeId] = (stats.byTheme[themeId] || 0) + 1;
      
      // Progress indicator
      if ((i + 1) % 50 === 0 || i === config.count - 1) {
        const pct = Math.round(((i + 1) / config.count) * 100);
        console.log(`Progress: ${i + 1}/${config.count} (${pct}%)`);
      }
    } catch (error) {
      stats.failed++;
      console.error(`Failed to generate sample ${i}:`, error);
    }
  }
  
  // Calculate averages
  if (stats.successful > 0) {
    stats.avgRenderTimeMs = totalRenderTime / stats.successful;
    stats.avgElementCount = totalElements / stats.successful;
  }
  
  return stats;
}

// ============================================
// CLI Entry Point
// ============================================

function parseArgs(): GeneratorConfig {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of args) {
    if (arg.startsWith("--count=")) {
      const count = parseInt(arg.split("=")[1], 10);
      if (!isNaN(count) && count > 0) {
        config.count = count;
      }
    }
    if (arg.startsWith("--output=")) {
      config.outputDir = path.resolve(arg.split("=")[1]);
    }
  }
  
  return config;
}

async function main() {
  const config = parseArgs();
  
  const startTime = Date.now();
  const stats = await generateDataset(config);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log("");
  console.log("Generation Complete");
  console.log("===================");
  console.log(`Total: ${stats.total}`);
  console.log(`Successful: ${stats.successful}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Avg Render Time: ${stats.avgRenderTimeMs.toFixed(2)}ms`);
  console.log(`Avg Element Count: ${stats.avgElementCount.toFixed(0)}`);
  console.log(`Total Time: ${elapsedSec}s`);
  console.log("");
  console.log("By Preset:");
  for (const [preset, count] of Object.entries(stats.byPreset)) {
    console.log(`  ${preset}: ${count}`);
  }
  console.log("");
  console.log("By Theme:");
  for (const [theme, count] of Object.entries(stats.byTheme)) {
    console.log(`  ${theme}: ${count}`);
  }
  console.log("");
  console.log(`Requests saved to: ${path.join(config.outputDir, config.requestsDir)}`);
  console.log(`Renders saved to: ${path.join(config.outputDir, config.rendersDir)}`);
}

main().catch((err) => {
  console.error("Dataset generation failed:", err);
  process.exit(1);
});
