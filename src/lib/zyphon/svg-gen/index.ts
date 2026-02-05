/**
 * SVG Generator Module Index
 * 
 * Exports all SVG generation utilities.
 * 
 * NOTE: This module is maintained for backward compatibility.
 * New code should use @/lib/zyphon/design-engine instead.
 */

export * from "./types";
export { renderSvg, safeRenderSvg } from "./render";
export { generateKuficText } from "./generators/kuficText";
export { generateIslamicPattern } from "./generators/islamicPattern";
export { generateCircuitLines } from "./generators/circuitLines";

// Re-export design-engine for new code
export * as DesignEngine from "../design-engine";
