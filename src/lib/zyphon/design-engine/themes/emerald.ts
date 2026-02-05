/**
 * Emerald Theme
 * 
 * Premium green accent on dark background.
 * Classic Tibyan style.
 */

import type { Theme } from "../types";

export const emeraldTheme: Theme = {
  id: "emerald",
  name: "Emerald",
  description: "Premium green accent on dark background",
  colors: {
    background: "#000000",
    backgroundAlt: "#0a0a0a",
    primary: "#00A86B",
    secondary: "#008855",
    accent: "#00D486",
    text: "#FFFFFF",
    muted: "#666666",
  },
  contrastTargets: {
    markVsBackground: 4.5,
    textVsBackground: 7,
  },
};

export default emeraldTheme;
