/**
 * Design Engine Registry
 * 
 * Central registry for presets, themes, and mark renderers.
 */

import type { Preset, Theme, PresetId, MarkRenderer } from "./types";
import { presets, registerPreset, getPreset, listPresetIds } from "./presets";
import { themes, registerTheme, getTheme, listThemeIds } from "./themes";
import { registerMarkRenderer, getMarkRenderer } from "./layers/mainMark";

// Re-export preset registry functions
export { registerPreset, getPreset, listPresetIds };

// Re-export theme registry functions
export { registerTheme, getTheme, listThemeIds };

// Re-export mark renderer registry functions
export { registerMarkRenderer, getMarkRenderer };

/**
 * Get all available presets
 */
export function getAllPresets(): Record<PresetId, Preset> {
  return { ...presets };
}

/**
 * Get all available themes
 */
export function getAllThemes(): Record<string, Theme> {
  return { ...themes };
}

/**
 * Registry summary
 */
export interface RegistrySummary {
  presets: Array<{ id: string; name: string; description?: string }>;
  themes: Array<{ id: string; name: string; description?: string }>;
}

/**
 * Get registry summary for UI
 */
export function getRegistrySummary(): RegistrySummary {
  return {
    presets: Object.values(presets).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    })),
    themes: Object.values(themes).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    })),
  };
}

/**
 * Validate that preset and theme exist
 */
export function validateRegistryIds(
  presetId: PresetId,
  themeId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!presets[presetId]) {
    errors.push(`Unknown preset: ${presetId}`);
  }
  
  if (!themes[themeId]) {
    errors.push(`Unknown theme: ${themeId}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  registerPreset,
  getPreset,
  listPresetIds,
  getAllPresets,
  registerTheme,
  getTheme,
  listThemeIds,
  getAllThemes,
  registerMarkRenderer,
  getMarkRenderer,
  getRegistrySummary,
  validateRegistryIds,
};
