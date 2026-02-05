/**
 * Dominance Validator
 * 
 * Validates that the main mark has sufficient visual weight.
 */

import type { ValidationIssue, Canvas, Layer, Preset } from "../types";

/**
 * Estimate visual weight of a layer (0-1)
 */
function estimateLayerWeight(layer: Layer, canvas: Canvas): number {
  if (!layer.enabled) return 0;
  
  const canvasArea = canvas.width * canvas.height;
  
  switch (layer.type) {
    case "mark": {
      const scale = layer.scale || 1;
      const strokeWidth = layer.strokeWidth || 10;
      // Estimate mark area as percentage of canvas
      const estimatedArea = strokeWidth * scale * 30 * strokeWidth * scale * 7;
      const areaRatio = estimatedArea / canvasArea;
      // Factor in opacity
      const opacity = layer.opacity || 1;
      return Math.min(1, areaRatio * opacity * 2); // Boost for visual importance
    }
    
    case "pattern": {
      const opacity = layer.opacity || 1;
      const density = layer.density || 1;
      return opacity * density * 0.2; // Patterns have lower visual weight
    }
    
    case "circuit": {
      const opacity = layer.opacity || 1;
      const density = layer.density || 0.35;
      return opacity * density * 0.15;
    }
    
    case "accent": {
      const opacity = layer.opacity || 1;
      return opacity * 0.1; // Accents are decorative
    }
    
    default:
      return 0;
  }
}

/**
 * Calculate total visual weight of non-mark elements
 */
function calculateBackgroundNoise(layers: Layer[], canvas: Canvas): number {
  return layers
    .filter((l) => l.type !== "mark" && l.type !== "background")
    .reduce((sum, layer) => sum + estimateLayerWeight(layer, canvas), 0);
}

/**
 * Validate mark dominance
 */
export function validateDominance(
  layers: Layer[],
  canvas: Canvas,
  preset: Preset
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!preset.constraints.requireMark) {
    return issues; // Skip if mark not required
  }
  
  const markLayer = layers.find((l) => l.type === "mark" && l.enabled);
  
  if (!markLayer) {
    issues.push({
      code: "MISSING_MARK",
      message: "No enabled mark layer found",
      severity: "error",
      autoFixable: false,
    });
    return issues;
  }
  
  const markWeight = estimateLayerWeight(markLayer, canvas);
  const noiseWeight = calculateBackgroundNoise(layers, canvas);
  const totalWeight = markWeight + noiseWeight;
  
  const dominance = totalWeight > 0 ? markWeight / totalWeight : 0;
  const minDominance = preset.constraints.minMarkDominance;
  
  if (dominance < minDominance) {
    issues.push({
      code: "LOW_DOMINANCE",
      message: `Mark dominance (${(dominance * 100).toFixed(1)}%) below minimum (${(minDominance * 100).toFixed(1)}%). Mark must be the dominant visual element.`,
      severity: "warning",
      layer: markLayer.id,
      autoFixable: true,
    });
  }
  
  return issues;
}

/**
 * Check if the mark renderer is text-based (deprecated for logo preset)
 */
export function isTextBasedRenderer(renderer: string): boolean {
  return renderer === "kufic-block-v2" || renderer === "text-fallback";
}

/**
 * Validate that logo preset uses symbolic-mark renderer
 */
export function validateLogoRenderer(
  layers: Layer[],
  presetId: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (presetId !== "logo") {
    return issues;
  }
  
  const markLayer = layers.find((l) => l.type === "mark" && l.enabled);
  if (!markLayer || markLayer.type !== "mark") {
    return issues;
  }
  
  const renderer = markLayer.renderer || "symbolic-mark";
  
  if (isTextBasedRenderer(renderer)) {
    issues.push({
      code: "LOW_DOMINANCE", // Reusing code for compatibility
      message: `Logo preset should use symbolic-mark renderer, not "${renderer}". Text rendering is deprecated for logos.`,
      severity: "warning",
      layer: markLayer.id,
      autoFixable: true,
    });
  }
  
  return issues;
}

/**
 * Suggest adjustments to improve mark dominance
 * CRITICAL: For logo preset, also suggests disabling noise layers
 */
export function suggestDominanceFix(
  layers: Layer[],
  targetDominance: number,
  presetId?: string
): Array<{ layerId: string; property: string; value: number | boolean | string }> {
  const fixes: Array<{ layerId: string; property: string; value: number | boolean | string }> = [];
  
  const isLogo = presetId === "logo";
  
  // Option 1: For logo preset, DISABLE pattern/circuit layers entirely
  // For other presets, reduce their opacity
  for (const layer of layers) {
    if (layer.type === "pattern" && layer.enabled) {
      if (isLogo) {
        // Disable entirely for logo preset
        fixes.push({
          layerId: layer.id,
          property: "enabled",
          value: false,
        });
      } else {
        const currentOpacity = layer.opacity || 1;
        fixes.push({
          layerId: layer.id,
          property: "opacity",
          value: currentOpacity * 0.5,
        });
      }
    }
    
    if (layer.type === "circuit" && layer.enabled) {
      if (isLogo) {
        // Disable entirely for logo preset
        fixes.push({
          layerId: layer.id,
          property: "enabled",
          value: false,
        });
      } else {
        const currentOpacity = layer.opacity || 1;
        fixes.push({
          layerId: layer.id,
          property: "opacity",
          value: currentOpacity * 0.6,
        });
      }
    }
  }
  
  // Option 2: Increase mark scale
  const markLayer = layers.find((l) => l.type === "mark");
  if (markLayer && markLayer.type === "mark") {
    const currentScale = markLayer.scale || 1;
    fixes.push({
      layerId: markLayer.id,
      property: "scale",
      value: currentScale * 1.2,
    });
    
    // For logo preset, also suggest switching to symbolic-mark
    if (isLogo && isTextBasedRenderer(markLayer.renderer || "")) {
      fixes.push({
        layerId: markLayer.id,
        property: "renderer",
        value: "symbolic-mark",
      });
    }
  }
  
  return fixes;
}

export default validateDominance;
