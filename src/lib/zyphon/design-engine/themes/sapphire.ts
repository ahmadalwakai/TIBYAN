/**
 * Sapphire Theme
 * 
 * Deep blue accent on dark background.
 * Modern tech style.
 */

import type { Theme } from "../types";

export const sapphireTheme: Theme = {
  id: "sapphire",
  name: "Sapphire",
  description: "Deep blue accent on dark background",
  colors: {
    background: "#050510",
    backgroundAlt: "#0A0A1F",
    primary: "#0F52BA",
    secondary: "#1E40AF",
    accent: "#3B82F6",
    text: "#FFFFFF",
    muted: "#4B5563",
  },
  contrastTargets: {
    markVsBackground: 4.5,
    textVsBackground: 7,
  },
};

export default sapphireTheme;
