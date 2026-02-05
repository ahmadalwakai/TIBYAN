/**
 * Gold Theme
 * 
 * Luxurious gold accent on dark background.
 * Traditional Arabic style.
 */

import type { Theme } from "../types";

export const goldTheme: Theme = {
  id: "gold",
  name: "Gold",
  description: "Luxurious gold accent on dark background",
  colors: {
    background: "#0D0D0D",
    backgroundAlt: "#1A1A1A",
    primary: "#FFD700",
    secondary: "#DAA520",
    accent: "#FFC125",
    text: "#FFFFFF",
    muted: "#8B7355",
  },
  contrastTargets: {
    markVsBackground: 4.5,
    textVsBackground: 7,
  },
};

export default goldTheme;
