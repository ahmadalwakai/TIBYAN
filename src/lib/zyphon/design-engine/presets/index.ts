/**
 * Presets Index
 * 
 * Exports all available presets.
 */

export { logoPreset } from "./logo";
export { bannerPreset } from "./banner";
export { patternPreset } from "./pattern";
export { socialCardPreset } from "./social-card";

import { logoPreset } from "./logo";
import { bannerPreset } from "./banner";
import { patternPreset } from "./pattern";
import { socialCardPreset } from "./social-card";
import type { Preset, PresetId } from "../types";

/**
 * All available presets indexed by ID
 */
export const presets: Record<PresetId, Preset> = {
  logo: logoPreset,
  banner: bannerPreset,
  pattern: patternPreset,
  "social-card": socialCardPreset,
};

/**
 * Get preset by ID with fallback
 */
export function getPreset(id: PresetId): Preset {
  return presets[id] ?? logoPreset;
}

/**
 * List all preset IDs
 */
export function listPresetIds(): PresetId[] {
  return Object.keys(presets) as PresetId[];
}

/**
 * Add a custom preset
 * 
 * @example
 * ```typescript
 * registerPreset({
 *   id: "icon",
 *   name: "Icon",
 *   canvas: { width: 256, height: 256 },
 *   // ...
 * });
 * ```
 */
export function registerPreset(preset: Preset): void {
  (presets as Record<string, Preset>)[preset.id] = preset;
}
