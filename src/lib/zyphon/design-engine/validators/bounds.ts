/**
 * Bounds Validator
 * 
 * Validates that elements stay within canvas bounds.
 */

import type { ValidationIssue, Canvas, Layer } from "../types";

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Estimate bounds for a mark layer
 */
function estimateMarkBounds(layer: Layer, canvas: Canvas): Bounds | null {
  if (layer.type !== "mark" || !layer.enabled) return null;
  
  const scale = layer.scale || 1;
  const strokeWidth = layer.strokeWidth || 10;
  const estimatedWidth = strokeWidth * scale * 30; // Rough estimate
  const estimatedHeight = strokeWidth * scale * 7;
  
  if (layer.centered) {
    return {
      minX: (canvas.width - estimatedWidth) / 2,
      minY: (canvas.height - estimatedHeight) / 2,
      maxX: (canvas.width + estimatedWidth) / 2,
      maxY: (canvas.height + estimatedHeight) / 2,
    };
  }
  
  return {
    minX: canvas.width * 0.1,
    minY: canvas.height * 0.4,
    maxX: canvas.width * 0.1 + estimatedWidth,
    maxY: canvas.height * 0.4 + estimatedHeight,
  };
}

/**
 * Estimate bounds for an accent layer
 */
function estimateAccentBounds(layer: Layer, canvas: Canvas): Bounds | null {
  if (layer.type !== "accent" || !layer.enabled) return null;
  
  const margin = layer.margin || 40;
  const cornerSize = layer.cornerSize || 60;
  
  // Accent elements are within margin, check if they fit
  if (margin + cornerSize > canvas.width / 2 || margin + cornerSize > canvas.height / 2) {
    return null; // Will trigger bounds issue
  }
  
  return {
    minX: margin,
    minY: margin,
    maxX: canvas.width - margin,
    maxY: canvas.height - margin,
  };
}

/**
 * Validate all layers are within canvas bounds
 */
export function validateBounds(
  layers: Layer[],
  canvas: Canvas
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const layer of layers) {
    if (!layer.enabled) continue;
    
    let bounds: Bounds | null = null;
    
    switch (layer.type) {
      case "mark":
        bounds = estimateMarkBounds(layer, canvas);
        break;
      case "accent":
        bounds = estimateAccentBounds(layer, canvas);
        break;
    }
    
    if (bounds) {
      if (bounds.minX < 0 || bounds.minY < 0 || bounds.maxX > canvas.width || bounds.maxY > canvas.height) {
        issues.push({
          code: "OUT_OF_BOUNDS",
          message: `Layer "${layer.id}" elements may extend outside canvas bounds`,
          severity: "warning",
          layer: layer.id,
          autoFixable: true,
        });
      }
    }
    
    // Check accent margin/corner size ratio
    if (layer.type === "accent") {
      const margin = layer.margin || 40;
      const cornerSize = layer.cornerSize || 60;
      
      if (margin + cornerSize > Math.min(canvas.width, canvas.height) / 3) {
        issues.push({
          code: "OUT_OF_BOUNDS",
          message: `Accent layer "${layer.id}" margin/corner size too large for canvas`,
          severity: "warning",
          layer: layer.id,
          autoFixable: true,
        });
      }
    }
  }
  
  return issues;
}

/**
 * Suggest scale adjustment to fit within bounds
 */
export function suggestBoundsFix(
  layer: Layer,
  canvas: Canvas
): Partial<Layer> | null {
  if (layer.type === "mark") {
    // Reduce scale to fit
    const currentScale = layer.scale || 1;
    const suggestedScale = currentScale * 0.8;
    return { scale: suggestedScale } as Partial<Layer>;
  }
  
  if (layer.type === "accent") {
    // Reduce margin and corner size
    const currentMargin = layer.margin || 40;
    const currentCornerSize = layer.cornerSize || 60;
    return {
      margin: currentMargin * 0.7,
      cornerSize: currentCornerSize * 0.7,
    } as Partial<Layer>;
  }
  
  return null;
}

export default validateBounds;
