/**
 * Complexity Validator
 * 
 * Validates SVG complexity to prevent heavy output.
 */

import type { ValidationIssue, Canvas, Layer, Preset } from "../types";

/**
 * Estimate element count for a layer
 */
function estimateLayerElements(layer: Layer, canvas: Canvas): number {
  if (!layer.enabled) return 0;
  
  switch (layer.type) {
    case "background":
      return 1;
    
    case "pattern": {
      const tileSize = layer.tileSize || 60;
      const density = layer.density || 1;
      const cols = Math.ceil(canvas.width / (tileSize * density)) + 2;
      const rows = Math.ceil(canvas.height / (tileSize * density)) + 2;
      // Pattern + connectors
      return cols * rows * 1.5;
    }
    
    case "circuit": {
      const density = layer.density || 0.35;
      const numTraces = Math.floor(15 * density * (canvas.width / 1024));
      const maxSegments = layer.maxSegments || 5;
      // Traces + nodes
      return numTraces * (maxSegments + 3);
    }
    
    case "mark": {
      // Estimate based on text length (if present) or shape count
      const text = layer.text || "";
      if (text) {
        // Each character ~35 blocks on average
        return text.length * 35;
      }
      const shapeCount = layer.shapeCount || 5;
      return shapeCount * 2;
    }
    
    case "accent":
      return 10; // Corner elements, lines
    
    case "frame":
      return 1;
    
    case "grid": {
      const cellSize = layer.cellSize || 50;
      const cols = Math.ceil(canvas.width / cellSize);
      const rows = Math.ceil(canvas.height / cellSize);
      return cols + rows + 2;
    }
    
    default:
      return 0;
  }
}

/**
 * Validate total complexity
 */
export function validateComplexity(
  layers: Layer[],
  canvas: Canvas,
  preset: Preset
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  const totalElements = layers.reduce(
    (sum, layer) => sum + estimateLayerElements(layer, canvas),
    0
  );
  
  const maxElements = preset.constraints.maxElementCount;
  
  if (totalElements > maxElements) {
    issues.push({
      code: "HIGH_COMPLEXITY",
      message: `Estimated element count (${totalElements}) exceeds maximum (${maxElements})`,
      severity: totalElements > maxElements * 1.5 ? "error" : "warning",
      autoFixable: true,
    });
    
    // Identify the most complex layer
    let maxLayer: Layer | null = null;
    let maxCount = 0;
    
    for (const layer of layers) {
      const count = estimateLayerElements(layer, canvas);
      if (count > maxCount) {
        maxCount = count;
        maxLayer = layer;
      }
    }
    
    if (maxLayer) {
      issues.push({
        code: "HIGH_COMPLEXITY",
        message: `Layer "${maxLayer.id}" contributes most elements (${maxCount})`,
        severity: "warning",
        layer: maxLayer.id,
        autoFixable: true,
      });
    }
  }
  
  return issues;
}

/**
 * Suggest adjustments to reduce complexity
 */
export function suggestComplexityFix(
  layers: Layer[],
  canvas: Canvas,
  maxElements: number
): Array<{ layerId: string; property: string; value: number }> {
  const fixes: Array<{ layerId: string; property: string; value: number }> = [];
  
  // Sort layers by element count
  const layerCounts = layers
    .map((layer) => ({
      layer,
      count: estimateLayerElements(layer, canvas),
    }))
    .sort((a, b) => b.count - a.count);
  
  for (const { layer, count } of layerCounts) {
    if (count < 100) continue;
    
    if (layer.type === "pattern") {
      // Increase tile size to reduce element count
      const currentTileSize = layer.tileSize || 60;
      fixes.push({
        layerId: layer.id,
        property: "tileSize",
        value: currentTileSize * 1.5,
      });
      // Reduce density
      const currentDensity = layer.density || 1;
      fixes.push({
        layerId: layer.id,
        property: "density",
        value: currentDensity * 0.7,
      });
    }
    
    if (layer.type === "circuit") {
      // Reduce density
      const currentDensity = layer.density || 0.35;
      fixes.push({
        layerId: layer.id,
        property: "density",
        value: currentDensity * 0.6,
      });
    }
    
    if (layer.type === "grid") {
      // Increase cell size
      const currentCellSize = layer.cellSize || 50;
      fixes.push({
        layerId: layer.id,
        property: "cellSize",
        value: currentCellSize * 1.5,
      });
    }
  }
  
  return fixes;
}

export default validateComplexity;
