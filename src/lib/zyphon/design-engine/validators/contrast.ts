/**
 * Contrast Validator
 * 
 * Validates contrast ratios between layers.
 */

import type { ValidationIssue, Canvas, Layer, Theme } from "../types";

/**
 * Calculate relative luminance
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16),
  ];
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get background color from layers
 */
function getBackgroundColor(layers: Layer[]): string {
  const bgLayer = layers.find((l) => l.type === "background" && l.enabled);
  if (bgLayer && bgLayer.type === "background") {
    return bgLayer.color;
  }
  return "#000000";
}

/**
 * Get mark color from layers
 */
function getMarkColor(layers: Layer[]): string | null {
  const markLayer = layers.find((l) => l.type === "mark" && l.enabled);
  if (markLayer && markLayer.type === "mark") {
    return markLayer.color;
  }
  return null;
}

/**
 * Validate contrast between mark and background
 */
export function validateContrast(
  layers: Layer[],
  theme: Theme
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  const bgColor = getBackgroundColor(layers);
  const markColor = getMarkColor(layers);
  
  if (markColor) {
    const ratio = calculateContrastRatio(bgColor, markColor);
    const target = theme.contrastTargets.markVsBackground;
    
    if (ratio < target) {
      issues.push({
        code: "LOW_CONTRAST",
        message: `Mark contrast ratio (${ratio.toFixed(2)}) is below target (${target})`,
        severity: ratio < 2 ? "error" : "warning",
        layer: "mark",
        autoFixable: true,
      });
    }
  }
  
  return issues;
}

/**
 * Suggest adjusted colors for better contrast
 */
export function suggestContrastFix(
  bgColor: string,
  markColor: string,
  targetRatio: number
): string {
  const bgLum = getLuminance(bgColor);
  
  // If background is dark, lighten the mark color
  if (bgLum < 0.5) {
    // Return white for maximum contrast on dark backgrounds
    return "#FFFFFF";
  } else {
    // Return dark for maximum contrast on light backgrounds
    return "#000000";
  }
}

export default validateContrast;
