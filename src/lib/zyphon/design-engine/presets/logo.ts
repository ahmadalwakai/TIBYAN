/**
 * Logo Preset
 * 
 * Square format for logos and icons.
 * 1024x1024, minimal layers, mark is required.
 * 
 * CRITICAL: Uses symbolic-mark renderer by default.
 * Pattern and circuit layers are DISABLED by default
 * to ensure the mark dominates the composition.
 * 
 * Text-based renderers are deprecated for this preset.
 */

import type { Preset, Layer } from "../types";

export const logoPreset: Preset = {
  id: "logo",
  name: "Logo",
  description: "Abstract logo mark (1024x1024) — not literal text",
  canvas: {
    width: 1024,
    height: 1024,
  },
  layerOrder: ["background", "pattern", "circuit", "mark", "accent"],
  defaultLayers: [
    {
      id: "bg",
      type: "background",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 0,
      color: "#000000",
    },
    {
      // Pattern layer DISABLED by default for logo preset
      // Mark must dominate - patterns are secondary noise
      id: "pattern",
      type: "pattern",
      enabled: false, // DISABLED: Mark must dominate
      opacity: 0.05, // Very low opacity if enabled manually
      blendMode: "normal",
      zIndex: 1,
      patternType: "8-point-star",
      tileSize: 60,
      strokeWidth: 1,
      rotation: 0,
      density: 1,
    },
    {
      // Circuit layer DISABLED by default for logo preset
      // Mark must dominate - circuits are secondary noise
      id: "circuit",
      type: "circuit",
      enabled: false, // DISABLED: Mark must dominate
      opacity: 0.05, // Very low opacity if enabled manually
      blendMode: "normal",
      zIndex: 2,
      density: 0.35,
      color: "#FFFFFF",
      nodeRadius: 3,
      lineWidth: 1,
      maxSegments: 5,
    },
    {
      id: "mark",
      type: "mark",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 3,
      // CRITICAL: Use symbolic-mark (abstract shapes, NOT text)
      renderer: "symbolic-mark",
      color: "#FFFFFF",
      scale: 1,
      strokeWidth: 10,
      centered: true,
      glow: 0,
      blockSpacing: 0.05,
      cornerRadius: 0.1,
      shapeCount: 5,
      shapeType: "squares",
    },
    {
      id: "accent",
      type: "accent",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 4,
      color: "#00A86B",
      style: "corners",
      lineWeight: 3,
      glow: 0,
      margin: 40,
      cornerSize: 60,
    },
  ] as Layer[],
  constraints: {
    // Higher dominance requirement for logo preset
    minMarkDominance: 0.40,
    maxElementCount: 2000,
    requireMark: true,
    // Text fallback allowed ONLY if explicitly requested
    allowTextFallback: false,
    tileable: false,
    autoAdjust: true,
  },
  // symbolic-mark is PRIMARY; text-based styles only if explicitly requested
  allowedStyles: ["symbolic-mark", "geometric-wordmark", "abstract-grid"],
};

export default logoPreset;
