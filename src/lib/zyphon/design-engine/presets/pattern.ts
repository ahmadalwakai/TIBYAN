/**
 * Pattern Preset
 * 
 * Tileable pattern format.
 * 512x512, no mark required, optimized for tiling.
 */

import type { Preset, Layer } from "../types";

export const patternPreset: Preset = {
  id: "pattern",
  name: "Pattern",
  description: "Tileable pattern format (512x512)",
  canvas: {
    width: 512,
    height: 512,
  },
  layerOrder: ["background", "pattern", "circuit"],
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
      id: "pattern",
      type: "pattern",
      enabled: true,
      opacity: 0.15,
      blendMode: "normal",
      zIndex: 1,
      patternType: "8-point-star",
      tileSize: 64,
      strokeWidth: 1,
      rotation: 0,
      density: 1,
    },
    {
      id: "circuit",
      type: "circuit",
      enabled: false,
      opacity: 0.1,
      blendMode: "normal",
      zIndex: 2,
      density: 0.2,
      color: "#FFFFFF",
      nodeRadius: 2,
      lineWidth: 0.5,
      maxSegments: 3,
    },
  ] as Layer[],
  constraints: {
    minMarkDominance: 0,
    maxElementCount: 1000,
    requireMark: false,
    allowTextFallback: false,
    tileable: true,
    autoAdjust: true,
  },
  allowedStyles: [],
};

export default patternPreset;
