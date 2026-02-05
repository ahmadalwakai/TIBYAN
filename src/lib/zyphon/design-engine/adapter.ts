/**
 * Legacy Adapter
 * 
 * Provides backward compatibility with the old svg-gen system.
 * Converts between LegacyDesignSpec and EngineSpec.
 */

import type { LegacyDesignSpec, EngineSpec, Layer, PresetId } from "./types";
import { createSpec } from "./index";
import { render, renderQuick } from "./render";

/**
 * Convert legacy DesignSpec to EngineSpec
 */
export function fromLegacySpec(legacy: LegacyDesignSpec): EngineSpec {
  const layers: Layer[] = [];
  
  // Background layer
  layers.push({
    id: "bg",
    type: "background",
    enabled: true,
    opacity: 1,
    blendMode: "normal",
    zIndex: 0,
    color: legacy.canvas.bg,
  });
  
  // Islamic pattern layer
  if (legacy.patterns?.islamic?.enabled) {
    const islamic = legacy.patterns.islamic;
    layers.push({
      id: "pattern",
      type: "pattern",
      enabled: true,
      opacity: islamic.opacity,
      blendMode: "normal",
      zIndex: 1,
      patternType: mapTileType(islamic.tile),
      tileSize: 60 * islamic.scale,
      strokeWidth: 1,
      strokeColor: islamic.color,
      rotation: 0,
      density: 1,
    });
  }
  
  // Circuit pattern layer
  if (legacy.patterns?.circuit?.enabled) {
    const circuit = legacy.patterns.circuit;
    layers.push({
      id: "circuit",
      type: "circuit",
      enabled: true,
      opacity: circuit.opacity,
      blendMode: "normal",
      zIndex: 2,
      density: circuit.density,
      color: circuit.color || "#FFFFFF",
      nodeRadius: circuit.nodeRadius,
      lineWidth: 1,
      maxSegments: 5,
    });
  }
  
  // Mark layer (text)
  layers.push({
    id: "mark",
    type: "mark",
    enabled: true,
    opacity: 1,
    blendMode: "normal",
    zIndex: 3,
    renderer: mapGeometryStyle(legacy.text.geometryStyle),
    text: legacy.text.value,
    color: legacy.text.color || legacy.accent?.color || "#FFFFFF",
    scale: legacy.text.scale,
    strokeWidth: legacy.text.strokeWidth,
    centered: legacy.text.centered,
    glow: legacy.accent?.glow || 0,
    blockSpacing: 0.05,
    cornerRadius: 0.1,
    shapeCount: 5,
    shapeType: "squares",
  });
  
  // Accent layer
  if (legacy.accent) {
    layers.push({
      id: "accent",
      type: "accent",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 4,
      color: legacy.accent.color,
      style: "corners",
      lineWeight: legacy.accent.lineWeight,
      glow: legacy.accent.glow,
      margin: 40,
      cornerSize: 60,
    });
  }
  
  return {
    presetId: "logo",
    themeId: "emerald",
    canvas: {
      width: legacy.canvas.w,
      height: legacy.canvas.h,
      background: legacy.canvas.bg,
    },
    layers,
    seed: legacy.seed,
    version: "2.0",
    metadata: {
      text: legacy.text.value,
    },
  };
}

/**
 * Convert EngineSpec to legacy DesignSpec
 */
export function toLegacySpec(spec: EngineSpec): LegacyDesignSpec {
  const bgLayer = spec.layers.find((l) => l.type === "background");
  const markLayer = spec.layers.find((l) => l.type === "mark");
  const patternLayer = spec.layers.find((l) => l.type === "pattern");
  const circuitLayer = spec.layers.find((l) => l.type === "circuit");
  const accentLayer = spec.layers.find((l) => l.type === "accent");
  
  return {
    canvas: {
      w: spec.canvas.width,
      h: spec.canvas.height,
      bg: bgLayer?.type === "background" ? bgLayer.color : spec.canvas.background,
    },
    text: {
      value: markLayer?.type === "mark" ? (markLayer.text || "") : "",
      strokeWidth: markLayer?.type === "mark" ? markLayer.strokeWidth : 10,
      geometryStyle: markLayer?.type === "mark" ? reverseMapGeometryStyle(markLayer.renderer) : "kufic-block",
      centered: markLayer?.type === "mark" ? markLayer.centered : true,
      color: markLayer?.type === "mark" ? markLayer.color : undefined,
      scale: markLayer?.type === "mark" ? markLayer.scale : 1,
    },
    patterns: {
      islamic: patternLayer?.type === "pattern" && patternLayer.enabled ? {
        enabled: true,
        opacity: patternLayer.opacity,
        tile: reverseMapTileType(patternLayer.patternType),
        scale: patternLayer.tileSize / 60,
        color: patternLayer.strokeColor,
      } : { enabled: false, opacity: 0.08, tile: "8-point-star", scale: 1 },
      circuit: circuitLayer?.type === "circuit" && circuitLayer.enabled ? {
        enabled: true,
        opacity: circuitLayer.opacity,
        density: circuitLayer.density,
        color: circuitLayer.color,
        nodeRadius: circuitLayer.nodeRadius,
      } : { enabled: false, opacity: 0.18, density: 0.35, nodeRadius: 3 },
    },
    accent: accentLayer?.type === "accent" ? {
      color: accentLayer.color,
      lineWeight: accentLayer.lineWeight,
      glow: accentLayer.glow,
    } : { color: "#00A86B", lineWeight: 3, glow: 0 },
    seed: spec.seed,
  };
}

/**
 * Map legacy tile type to new pattern type
 */
function mapTileType(tile: string): "8-point-star" | "6-point-star" | "hexagonal" | "octagonal" | "arabesque" | "muqarnas" {
  const map: Record<string, "8-point-star" | "6-point-star" | "hexagonal" | "octagonal"> = {
    "8-point-star": "8-point-star",
    "6-point-star": "6-point-star",
    "hexagonal": "hexagonal",
    "octagonal": "octagonal",
  };
  return map[tile] || "8-point-star";
}

/**
 * Reverse map pattern type to legacy tile type
 */
function reverseMapTileType(patternType: string): string {
  return patternType;
}

/**
 * Map legacy geometry style to renderer
 */
function mapGeometryStyle(style: string): "kufic-block-v2" | "geometric-wordmark" | "abstract-grid" | "text-fallback" {
  const map: Record<string, "kufic-block-v2" | "geometric-wordmark" | "text-fallback"> = {
    "kufic-block": "kufic-block-v2",
    "kufic-rounded": "kufic-block-v2",
    "angular": "kufic-block-v2",
    "geometric": "geometric-wordmark",
  };
  return map[style] || "kufic-block-v2";
}

/**
 * Reverse map renderer to legacy geometry style
 */
function reverseMapGeometryStyle(renderer: string): string {
  const map: Record<string, string> = {
    "kufic-block-v2": "kufic-block",
    "geometric-wordmark": "geometric",
    "abstract-grid": "geometric",
    "text-fallback": "kufic-block",
  };
  return map[renderer] || "kufic-block";
}

/**
 * Render legacy spec using new engine
 */
export function renderLegacy(legacy: LegacyDesignSpec): string {
  const spec = fromLegacySpec(legacy);
  return renderQuick(spec);
}

/**
 * Safe render with error handling (legacy compatibility)
 */
export function safeRenderLegacy(legacy: LegacyDesignSpec): { svg: string; error?: string } {
  try {
    const svg = renderLegacy(legacy);
    return { svg };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown render error";
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1a1a1a"/><text x="256" y="256" text-anchor="middle" fill="#ff4444" font-size="16">Render Error</text></svg>`;
    return { svg: fallbackSvg, error: errorMessage };
  }
}

export default {
  fromLegacySpec,
  toLegacySpec,
  renderLegacy,
  safeRenderLegacy,
};
