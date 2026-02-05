/**
 * Banner Preset
 * 
 * Wide format for banners and headers.
 * 1920x480, includes frame elements.
 */

import type { Preset, Layer } from "../types";

export const bannerPreset: Preset = {
  id: "banner",
  name: "Banner",
  description: "Wide banner format (1920x480)",
  canvas: {
    width: 1920,
    height: 480,
  },
  layerOrder: ["background", "pattern", "circuit", "mark", "frame", "accent"],
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
      opacity: 0.06,
      blendMode: "normal",
      zIndex: 1,
      patternType: "8-point-star",
      tileSize: 80,
      strokeWidth: 1,
      rotation: 0,
      density: 0.8,
    },
    {
      id: "circuit",
      type: "circuit",
      enabled: true,
      opacity: 0.12,
      blendMode: "normal",
      zIndex: 2,
      density: 0.25,
      color: "#FFFFFF",
      nodeRadius: 2,
      lineWidth: 1,
      maxSegments: 4,
    },
    {
      id: "mark",
      type: "mark",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 3,
      renderer: "kufic-block-v2",
      color: "#FFFFFF",
      scale: 0.8,
      strokeWidth: 8,
      centered: true,
      glow: 0,
      blockSpacing: 0.05,
      cornerRadius: 0.1,
      shapeCount: 5,
      shapeType: "squares",
    },
    {
      id: "frame",
      type: "frame",
      enabled: true,
      opacity: 0.3,
      blendMode: "normal",
      zIndex: 4,
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
      cornerRadius: 0,
      padding: 30,
    },
    {
      id: "accent",
      type: "accent",
      enabled: true,
      opacity: 1,
      blendMode: "normal",
      zIndex: 5,
      color: "#00A86B",
      style: "lines",
      lineWeight: 2,
      glow: 0,
      margin: 30,
      cornerSize: 40,
    },
  ] as Layer[],
  constraints: {
    minMarkDominance: 0.15,
    maxElementCount: 3000,
    requireMark: true,
    allowTextFallback: true,
    tileable: false,
    autoAdjust: true,
  },
  allowedStyles: ["kufic-block-v2", "geometric-wordmark", "text-fallback"],
};

export default bannerPreset;
