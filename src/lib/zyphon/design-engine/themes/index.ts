/**
 * Themes Index
 * 
 * Exports all available themes.
 */

export { emeraldTheme } from "./emerald";
export { goldTheme } from "./gold";
export { sapphireTheme } from "./sapphire";
export { monochromeTheme } from "./monochrome";

import { emeraldTheme } from "./emerald";
import { goldTheme } from "./gold";
import { sapphireTheme } from "./sapphire";
import { monochromeTheme } from "./monochrome";
import type { Theme } from "../types";

/**
 * All available themes indexed by ID
 */
export const themes: Record<string, Theme> = {
  emerald: emeraldTheme,
  gold: goldTheme,
  sapphire: sapphireTheme,
  monochrome: monochromeTheme,
};

/**
 * Get theme by ID with fallback
 */
export function getTheme(id: string): Theme {
  return themes[id] ?? emeraldTheme;
}

/**
 * List all theme IDs
 */
export function listThemeIds(): string[] {
  return Object.keys(themes);
}

/**
 * Add a custom theme
 * 
 * @example
 * ```typescript
 * registerTheme({
 *   id: "ruby",
 *   name: "Ruby",
 *   colors: { ... }
 * });
 * ```
 */
export function registerTheme(theme: Theme): void {
  themes[theme.id] = theme;
}
