/**
 * Validators Index
 * 
 * Exports all validators and unified validation function.
 */

export { validateContrast, calculateContrastRatio, suggestContrastFix } from "./contrast";
export { validateBounds, suggestBoundsFix } from "./bounds";
export { validateDominance, suggestDominanceFix } from "./dominance";
export { validateComplexity, suggestComplexityFix } from "./complexity";

import { validateContrast, suggestContrastFix } from "./contrast";
import { validateBounds, suggestBoundsFix } from "./bounds";
import { validateDominance, suggestDominanceFix } from "./dominance";
import { validateComplexity, suggestComplexityFix } from "./complexity";
import type {
  Layer,
  Canvas,
  Theme,
  Preset,
  ValidationResult,
  ValidationIssue,
  MarkLayer,
  PatternLayer,
  CircuitLayer,
} from "../types";

/**
 * Run all validators
 */
export function validateSpec(
  layers: Layer[],
  canvas: Canvas,
  theme: Theme,
  preset: Preset
): ValidationResult {
  const allIssues: ValidationIssue[] = [];
  
  // Run all validators
  allIssues.push(...validateContrast(layers, theme));
  allIssues.push(...validateBounds(layers, canvas));
  allIssues.push(...validateDominance(layers, canvas, preset));
  allIssues.push(...validateComplexity(layers, canvas, preset));
  
  const hasErrors = allIssues.some((i) => i.severity === "error");
  
  return {
    valid: !hasErrors,
    issues: allIssues,
  };
}

/**
 * Auto-fix validation issues if possible
 */
export function autoFixIssues(
  layers: Layer[],
  canvas: Canvas,
  theme: Theme,
  preset: Preset,
  issues: ValidationIssue[]
): { layers: Layer[]; adjustments: Array<{ layer: string; property: string; oldValue: unknown; newValue: unknown }> } {
  const adjustments: Array<{ layer: string; property: string; oldValue: unknown; newValue: unknown }> = [];
  const fixedLayers = JSON.parse(JSON.stringify(layers)) as Layer[];
  
  for (const issue of issues) {
    if (!issue.autoFixable) continue;
    
    switch (issue.code) {
      case "LOW_CONTRAST": {
        const markLayer = fixedLayers.find((l) => l.type === "mark") as MarkLayer | undefined;
        const bgLayer = fixedLayers.find((l) => l.type === "background");
        
        if (markLayer && bgLayer && bgLayer.type === "background") {
          const oldColor = markLayer.color;
          const newColor = suggestContrastFix(bgLayer.color, markLayer.color, theme.contrastTargets.markVsBackground);
          markLayer.color = newColor;
          adjustments.push({ layer: markLayer.id, property: "color", oldValue: oldColor, newValue: newColor });
        }
        break;
      }
      
      case "LOW_DOMINANCE": {
        const dominanceFixes = suggestDominanceFix(fixedLayers, preset.constraints.minMarkDominance);
        for (const fix of dominanceFixes) {
          const layer = fixedLayers.find((l) => l.id === fix.layerId);
          if (layer) {
            const oldValue = (layer as Record<string, unknown>)[fix.property];
            (layer as Record<string, unknown>)[fix.property] = fix.value;
            adjustments.push({ layer: fix.layerId, property: fix.property, oldValue, newValue: fix.value });
          }
        }
        break;
      }
      
      case "HIGH_COMPLEXITY": {
        const complexityFixes = suggestComplexityFix(fixedLayers, canvas, preset.constraints.maxElementCount);
        for (const fix of complexityFixes) {
          const layer = fixedLayers.find((l) => l.id === fix.layerId);
          if (layer) {
            const oldValue = (layer as Record<string, unknown>)[fix.property];
            (layer as Record<string, unknown>)[fix.property] = fix.value;
            adjustments.push({ layer: fix.layerId, property: fix.property, oldValue, newValue: fix.value });
          }
        }
        break;
      }
      
      case "OUT_OF_BOUNDS": {
        if (issue.layer) {
          const layer = fixedLayers.find((l) => l.id === issue.layer);
          if (layer) {
            const boundsFix = suggestBoundsFix(layer, canvas);
            if (boundsFix) {
              for (const [prop, value] of Object.entries(boundsFix)) {
                const oldValue = (layer as Record<string, unknown>)[prop];
                (layer as Record<string, unknown>)[prop] = value;
                adjustments.push({ layer: issue.layer, property: prop, oldValue, newValue: value });
              }
            }
          }
        }
        break;
      }
    }
  }
  
  return { layers: fixedLayers, adjustments };
}

/**
 * Validate and auto-fix in one pass
 */
export function validateAndFix(
  layers: Layer[],
  canvas: Canvas,
  theme: Theme,
  preset: Preset
): { result: ValidationResult; layers: Layer[] } {
  // First validation pass
  let result = validateSpec(layers, canvas, theme, preset);
  let currentLayers = layers;
  
  // If there are auto-fixable issues and preset allows auto-adjust
  if (!result.valid && preset.constraints.autoAdjust) {
    const { layers: fixedLayers, adjustments } = autoFixIssues(
      currentLayers,
      canvas,
      theme,
      preset,
      result.issues
    );
    
    currentLayers = fixedLayers;
    
    // Re-validate after fixes
    result = validateSpec(currentLayers, canvas, theme, preset);
    result.adjustments = adjustments;
  }
  
  return { result, layers: currentLayers };
}
