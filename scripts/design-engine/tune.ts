#!/usr/bin/env tsx
/**
 * Design Engine Auto-Tuning
 *
 * Analyzes top-scoring samples and computes recommended
 * default parameters for presets and themes.
 *
 * Outputs:
 * - fixtures/generated/recommendations.json
 * - Console summary
 *
 * INTERNAL TOOLING ONLY - Not user-facing.
 * 
 * Usage:
 *   npm run design:tune
 *   npm run design:tune -- --top-pct=10
 */

import * as fs from "fs";
import * as path from "path";

// ============================================
// Configuration
// ============================================

interface TuningConfig {
  inputDir: string;
  scoresFile: string;
  topPercentile: number; // Top X% to analyze
  outputFile: string;
}

const DEFAULT_CONFIG: TuningConfig = {
  inputDir: path.resolve(__dirname, "../../fixtures/generated"),
  scoresFile: "scores.csv",
  topPercentile: 10, // Top 10%
  outputFile: "recommendations.json",
};

// ============================================
// Types
// ============================================

interface ScoreRow {
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
  dominance: number;
  contrast: number;
  complexity: number;
  whitespace: number;
  symmetry: number;
  overall: number;
}

interface ParameterStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p25: number;
  p75: number;
}

interface PresetRecommendation {
  presetId: string;
  sampleCount: number;
  topSampleCount: number;
  avgScoreAll: number;
  avgScoreTop: number;
  parameters: {
    patternIntensity: ParameterStats & { recommended: number };
    circuitIntensity: ParameterStats & { recommended: number };
    accentIntensity: ParameterStats & { recommended: number };
    markScale: ParameterStats & { recommended: number };
    markStrokeWidth: ParameterStats & { recommended: number };
    markGlow: ParameterStats & { recommended: number };
    patternDensity: ParameterStats & { recommended: number };
    patternTileSize: ParameterStats & { recommended: number };
    circuitDensity: ParameterStats & { recommended: number };
  };
  constraints: {
    recommendedMaxElementCount: number;
    recommendedMinDominance: number;
  };
}

interface ThemeRecommendation {
  themeId: string;
  sampleCount: number;
  topSampleCount: number;
  avgScoreAll: number;
  avgScoreTop: number;
  avgContrast: number;
}

interface Recommendations {
  generatedAt: string;
  config: {
    topPercentile: number;
    totalSamples: number;
  };
  presets: Record<string, PresetRecommendation>;
  themes: Record<string, ThemeRecommendation>;
  globalInsights: {
    bestPreset: { id: string; avgScore: number };
    bestTheme: { id: string; avgScore: number };
    bestCombination: { presetId: string; themeId: string; avgScore: number };
    parameterCorrelations: Array<{
      parameter: string;
      correlationWithScore: number;
    }>;
  };
}

// ============================================
// CSV Parsing
// ============================================

function parseCSV(content: string): ScoreRow[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string | number | boolean> = {};
    
    headers.forEach((header, i) => {
      const value = values[i];
      if (header === "validationValid") {
        row[header] = value === "1";
      } else if (header === "id" || header === "presetId" || header === "themeId") {
        row[header] = value;
      } else {
        row[header] = parseFloat(value);
      }
    });
    
    return row as unknown as ScoreRow;
  });
}

// ============================================
// Statistical Utilities
// ============================================

function calculateStats(values: number[]): ParameterStats {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, p25: 0, p75: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const min = sorted[0];
  const max = sorted[n - 1];
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];
  
  const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const p25Idx = Math.floor(n * 0.25);
  const p75Idx = Math.floor(n * 0.75);
  const p25 = sorted[p25Idx];
  const p75 = sorted[p75Idx];
  
  return { min, max, mean, median, stdDev, p25, p75 };
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// ============================================
// Recommendation Logic
// ============================================

function recommendParameter(stats: ParameterStats): number {
  // Recommend value at intersection of median and interquartile mean
  const iqMean = (stats.p25 + stats.p75) / 2;
  return (stats.median * 0.6 + iqMean * 0.4);
}

function analyzePreset(
  presetId: string,
  allSamples: ScoreRow[],
  topSamples: ScoreRow[]
): PresetRecommendation {
  const all = allSamples.filter((s) => s.presetId === presetId);
  const top = topSamples.filter((s) => s.presetId === presetId);
  
  const avgScoreAll = all.length > 0 
    ? all.reduce((sum, s) => sum + s.overall, 0) / all.length 
    : 0;
  const avgScoreTop = top.length > 0 
    ? top.reduce((sum, s) => sum + s.overall, 0) / top.length 
    : 0;
  
  // Calculate stats for each parameter from top samples
  const patternIntensityStats = calculateStats(top.map((s) => s.patternIntensity));
  const circuitIntensityStats = calculateStats(top.map((s) => s.circuitIntensity));
  const accentIntensityStats = calculateStats(top.map((s) => s.accentIntensity));
  const markScaleStats = calculateStats(top.map((s) => s.markScale));
  const markStrokeWidthStats = calculateStats(top.map((s) => s.markStrokeWidth));
  const markGlowStats = calculateStats(top.map((s) => s.markGlow));
  const patternDensityStats = calculateStats(top.map((s) => s.patternDensity));
  const patternTileSizeStats = calculateStats(top.map((s) => s.patternTileSize));
  const circuitDensityStats = calculateStats(top.map((s) => s.circuitDensity));
  
  // Calculate constraints from top samples
  const elementCounts = top.map((s) => s.elementCount);
  const dominanceScores = top.map((s) => s.dominance);
  
  const elementCountStats = calculateStats(elementCounts);
  const dominanceStats = calculateStats(dominanceScores);
  
  return {
    presetId,
    sampleCount: all.length,
    topSampleCount: top.length,
    avgScoreAll,
    avgScoreTop,
    parameters: {
      patternIntensity: { ...patternIntensityStats, recommended: recommendParameter(patternIntensityStats) },
      circuitIntensity: { ...circuitIntensityStats, recommended: recommendParameter(circuitIntensityStats) },
      accentIntensity: { ...accentIntensityStats, recommended: recommendParameter(accentIntensityStats) },
      markScale: { ...markScaleStats, recommended: recommendParameter(markScaleStats) },
      markStrokeWidth: { ...markStrokeWidthStats, recommended: recommendParameter(markStrokeWidthStats) },
      markGlow: { ...markGlowStats, recommended: recommendParameter(markGlowStats) },
      patternDensity: { ...patternDensityStats, recommended: recommendParameter(patternDensityStats) },
      patternTileSize: { ...patternTileSizeStats, recommended: recommendParameter(patternTileSizeStats) },
      circuitDensity: { ...circuitDensityStats, recommended: recommendParameter(circuitDensityStats) },
    },
    constraints: {
      recommendedMaxElementCount: Math.round(elementCountStats.p75 * 1.2),
      recommendedMinDominance: Math.max(0.2, dominanceStats.p25 - 0.1),
    },
  };
}

function analyzeTheme(
  themeId: string,
  allSamples: ScoreRow[],
  topSamples: ScoreRow[]
): ThemeRecommendation {
  const all = allSamples.filter((s) => s.themeId === themeId);
  const top = topSamples.filter((s) => s.themeId === themeId);
  
  const avgScoreAll = all.length > 0 
    ? all.reduce((sum, s) => sum + s.overall, 0) / all.length 
    : 0;
  const avgScoreTop = top.length > 0 
    ? top.reduce((sum, s) => sum + s.overall, 0) / top.length 
    : 0;
  const avgContrast = top.length > 0 
    ? top.reduce((sum, s) => sum + s.contrast, 0) / top.length 
    : 0;
  
  return {
    themeId,
    sampleCount: all.length,
    topSampleCount: top.length,
    avgScoreAll,
    avgScoreTop,
    avgContrast,
  };
}

function findBestCombination(
  samples: ScoreRow[]
): { presetId: string; themeId: string; avgScore: number } {
  const combinations: Record<string, { scores: number[] }> = {};
  
  for (const sample of samples) {
    const key = `${sample.presetId}:${sample.themeId}`;
    if (!combinations[key]) {
      combinations[key] = { scores: [] };
    }
    combinations[key].scores.push(sample.overall);
  }
  
  let best = { presetId: "", themeId: "", avgScore: 0 };
  
  for (const [key, data] of Object.entries(combinations)) {
    if (data.scores.length < 5) continue; // Need minimum samples
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    if (avg > best.avgScore) {
      const [presetId, themeId] = key.split(":");
      best = { presetId, themeId, avgScore: avg };
    }
  }
  
  return best;
}

function calculateParameterCorrelations(
  samples: ScoreRow[]
): Array<{ parameter: string; correlationWithScore: number }> {
  const scores = samples.map((s) => s.overall);
  
  const parameters = [
    "patternIntensity",
    "circuitIntensity",
    "accentIntensity",
    "markScale",
    "markStrokeWidth",
    "markGlow",
    "patternDensity",
    "patternTileSize",
    "circuitDensity",
    "elementCount",
  ] as const;
  
  return parameters.map((param) => ({
    parameter: param,
    correlationWithScore: calculateCorrelation(
      samples.map((s) => s[param]),
      scores
    ),
  })).sort((a, b) => Math.abs(b.correlationWithScore) - Math.abs(a.correlationWithScore));
}

// ============================================
// Main Tuning Logic
// ============================================

async function tuneParameters(config: TuningConfig): Promise<Recommendations> {
  console.log("Design Engine Auto-Tuning");
  console.log("=========================");
  console.log(`Input: ${config.inputDir}`);
  console.log(`Top Percentile: ${config.topPercentile}%`);
  console.log("");
  
  // Load scores
  const scoresPath = path.join(config.inputDir, config.scoresFile);
  if (!fs.existsSync(scoresPath)) {
    throw new Error("Scores file not found. Run scoring first.");
  }
  
  const csvContent = fs.readFileSync(scoresPath, "utf-8");
  const allSamples = parseCSV(csvContent);
  
  console.log(`Loaded ${allSamples.length} scored samples.`);
  
  // Filter to valid samples only
  const validSamples = allSamples.filter((s) => s.validationValid);
  console.log(`Valid samples: ${validSamples.length}`);
  
  // Sort by overall score and take top percentile
  const sorted = [...validSamples].sort((a, b) => b.overall - a.overall);
  const topCount = Math.max(1, Math.ceil(sorted.length * (config.topPercentile / 100)));
  const topSamples = sorted.slice(0, topCount);
  
  console.log(`Analyzing top ${topCount} samples (${config.topPercentile}%).`);
  console.log("");
  
  // Get unique presets and themes
  const presetIds = Array.from(new Set(allSamples.map((s) => s.presetId)));
  const themeIds = Array.from(new Set(allSamples.map((s) => s.themeId)));
  
  // Analyze each preset
  const presets: Record<string, PresetRecommendation> = {};
  for (const presetId of presetIds) {
    presets[presetId] = analyzePreset(presetId, validSamples, topSamples);
  }
  
  // Analyze each theme
  const themes: Record<string, ThemeRecommendation> = {};
  for (const themeId of themeIds) {
    themes[themeId] = analyzeTheme(themeId, validSamples, topSamples);
  }
  
  // Find best performers
  const presetByScore = Object.values(presets).sort((a, b) => b.avgScoreTop - a.avgScoreTop);
  const themeByScore = Object.values(themes).sort((a, b) => b.avgScoreTop - a.avgScoreTop);
  
  const recommendations: Recommendations = {
    generatedAt: new Date().toISOString(),
    config: {
      topPercentile: config.topPercentile,
      totalSamples: allSamples.length,
    },
    presets,
    themes,
    globalInsights: {
      bestPreset: {
        id: presetByScore[0]?.presetId ?? "",
        avgScore: presetByScore[0]?.avgScoreTop ?? 0,
      },
      bestTheme: {
        id: themeByScore[0]?.themeId ?? "",
        avgScore: themeByScore[0]?.avgScoreTop ?? 0,
      },
      bestCombination: findBestCombination(topSamples),
      parameterCorrelations: calculateParameterCorrelations(validSamples),
    },
  };
  
  // Save recommendations
  const outputPath = path.join(config.inputDir, config.outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(recommendations, null, 2));
  console.log(`Recommendations saved to: ${outputPath}`);
  
  return recommendations;
}

// ============================================
// Console Summary
// ============================================

function printSummary(recommendations: Recommendations): void {
  console.log("");
  console.log("Tuning Results");
  console.log("==============");
  console.log("");
  
  console.log("Global Insights:");
  console.log(`  Best Preset: ${recommendations.globalInsights.bestPreset.id} (avg: ${recommendations.globalInsights.bestPreset.avgScore.toFixed(4)})`);
  console.log(`  Best Theme: ${recommendations.globalInsights.bestTheme.id} (avg: ${recommendations.globalInsights.bestTheme.avgScore.toFixed(4)})`);
  console.log(`  Best Combination: ${recommendations.globalInsights.bestCombination.presetId} + ${recommendations.globalInsights.bestCombination.themeId} (avg: ${recommendations.globalInsights.bestCombination.avgScore.toFixed(4)})`);
  console.log("");
  
  console.log("Top Parameter Correlations with Score:");
  for (const corr of recommendations.globalInsights.parameterCorrelations.slice(0, 5)) {
    const sign = corr.correlationWithScore >= 0 ? "+" : "";
    console.log(`  ${corr.parameter}: ${sign}${corr.correlationWithScore.toFixed(4)}`);
  }
  console.log("");
  
  console.log("Recommended Parameters by Preset:");
  for (const [presetId, preset] of Object.entries(recommendations.presets)) {
    console.log(`\n  ${presetId.toUpperCase()} (${preset.topSampleCount} top samples):`);
    console.log(`    patternIntensity: ${preset.parameters.patternIntensity.recommended.toFixed(3)} (range: ${preset.parameters.patternIntensity.p25.toFixed(3)}-${preset.parameters.patternIntensity.p75.toFixed(3)})`);
    console.log(`    circuitIntensity: ${preset.parameters.circuitIntensity.recommended.toFixed(3)} (range: ${preset.parameters.circuitIntensity.p25.toFixed(3)}-${preset.parameters.circuitIntensity.p75.toFixed(3)})`);
    console.log(`    accentIntensity: ${preset.parameters.accentIntensity.recommended.toFixed(3)} (range: ${preset.parameters.accentIntensity.p25.toFixed(3)}-${preset.parameters.accentIntensity.p75.toFixed(3)})`);
    console.log(`    markScale: ${preset.parameters.markScale.recommended.toFixed(3)} (range: ${preset.parameters.markScale.p25.toFixed(3)}-${preset.parameters.markScale.p75.toFixed(3)})`);
    console.log(`    markStrokeWidth: ${preset.parameters.markStrokeWidth.recommended.toFixed(1)}`);
    console.log(`    maxElementCount: ${preset.constraints.recommendedMaxElementCount}`);
    console.log(`    minDominance: ${preset.constraints.recommendedMinDominance.toFixed(3)}`);
  }
  console.log("");
  
  console.log("Theme Performance:");
  for (const [themeId, theme] of Object.entries(recommendations.themes)) {
    console.log(`  ${themeId}: avg score ${theme.avgScoreTop.toFixed(4)}, avg contrast ${theme.avgContrast.toFixed(4)}`);
  }
  console.log("");
  
  console.log("HOW TO APPLY:");
  console.log("1. Review recommendations.json for detailed parameter statistics");
  console.log("2. Update preset defaults in src/lib/zyphon/design-engine/presets/");
  console.log("3. Update theme defaults if contrast targets need adjustment");
  console.log("4. Re-run the full loop to validate changes");
  console.log("");
  console.log("SAFETY: Manual review is required before applying changes to production.");
}

// ============================================
// CLI Entry Point
// ============================================

function parseArgs(): TuningConfig {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of args) {
    if (arg.startsWith("--input=")) {
      config.inputDir = path.resolve(arg.split("=")[1]);
    }
    if (arg.startsWith("--top-pct=")) {
      const pct = parseInt(arg.split("=")[1], 10);
      if (!isNaN(pct) && pct > 0 && pct <= 100) {
        config.topPercentile = pct;
      }
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
  const recommendations = await tuneParameters(config);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  
  printSummary(recommendations);
  
  console.log(`Tuning completed in ${elapsedSec}s`);
}

main().catch((err) => {
  console.error("Tuning failed:", err);
  process.exit(1);
});
