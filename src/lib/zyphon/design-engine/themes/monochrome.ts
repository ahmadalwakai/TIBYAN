/**
 * Monochrome Theme
 * 
 * Classic black and white.
 * Minimalist style.
 */

import type { Theme } from "../types";

export const monochromeTheme: Theme = {
  id: "monochrome",
  name: "Monochrome",
  description: "Classic black and white minimalist style",
  colors: {
    background: "#000000",
    backgroundAlt: "#111111",
    primary: "#FFFFFF",
    secondary: "#CCCCCC",
    accent: "#888888",
    text: "#FFFFFF",
    muted: "#444444",
  },
  contrastTargets: {
    markVsBackground: 7,
    textVsBackground: 7,
  },
};

export default monochromeTheme;
