/**
 * Brand Color Palette - Dark Cyber Neon Design
 * Single source of truth for all brand colors
 * Pure black background with neon green (#00FF2A) accents
 */

// Primary neon color
export const NEON_GREEN = "#00FF2A";
export const NEON_GREEN_RGB = "0, 255, 42";

export const BRAND = {
  background: {
    base: "#000000",       // Pure black
    surface: "#050505",    // Near-black for cards
    subtle: "#0A0A0A",     // Slightly lighter black
  },
  car: {
    name: "Cyber Black",
    hex: "#000000",
    trim: NEON_GREEN,
  },
  // Neon scale - replacing navy
  navy: {
    900: "#000000",        // Pure black
    700: "#050505",        // Near-black
    500: "#0A0A0A",        // Dark surface
    400: "#0F0F0F",        // Lighter surface
    300: "#1A1A1A",        // Muted surface
    200: "#252525",        // Light surface
    100: "#333333",        // Border-like
    50: "#404040",         // Lightest
  },
  // Neon green accent palette
  gold: {
    50: "rgba(0, 255, 42, 0.05)",
    100: "rgba(0, 255, 42, 0.1)",
    200: "rgba(0, 255, 42, 0.2)",
    300: "rgba(0, 255, 42, 0.35)",
    400: "#00DD24",        // Slightly darker neon
    500: NEON_GREEN,       // Primary neon green
    600: "#00FF2A",        // Same as primary
    700: "#00CC22",        // Darker neon
    800: "#009919",        // Even darker
    900: "#006611",        // Darkest
  },
  // Keep burgundy for errors only
  burgundy: {
    50: "rgba(240, 68, 56, 0.05)",
    100: "rgba(240, 68, 56, 0.1)",
    200: "rgba(240, 68, 56, 0.2)",
    300: "rgba(240, 68, 56, 0.3)",
    400: "#F04438",
    500: "#F04438",
    600: "#D93A30",
    700: "#C03028",
    800: "#A02620",
    900: "#801C18",
  },
  text: {
    title: "#FFFFFF",
    body: "#FFFFFF",
    muted: "rgba(255, 255, 255, 0.7)",
    onNavy: "#FFFFFF",
    gold: NEON_GREEN,
  },
  border: {
    base: "rgba(0, 255, 42, 0.2)",
    gold: "rgba(0, 255, 42, 0.35)",
  },
  state: {
    success: "#00FF2A",    // Neon green for success
    warning: "#FFB800",    // Amber warning
    danger: "#F04438",     // Red stays red
  },
  link: NEON_GREEN,
  // Gradient definitions for neon effects
  gradients: {
    goldShimmer: `linear-gradient(135deg, ${NEON_GREEN} 0%, #4DFF6A 50%, ${NEON_GREEN} 100%)`,
    navyGold: `linear-gradient(135deg, #000000 0%, ${NEON_GREEN} 100%)`,
    premiumCard: `linear-gradient(135deg, rgba(0, 255, 42, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)`,
    authorityBadge: `linear-gradient(135deg, #000000 0%, #0A0A0A 50%, ${NEON_GREEN} 100%)`,
    neonGlow: `linear-gradient(135deg, ${NEON_GREEN}, #4DFF6A, ${NEON_GREEN})`,
  },
} as const;

// Dark mode variants - same as light mode (always dark)
export const BRAND_DARK = {
  background: {
    base: "#000000",
    surface: "#050505",
    subtle: "#0A0A0A",
  },
  navy: {
    900: "#000000",
    700: "#050505",
    500: "#0A0A0A",
    400: "#0F0F0F",
    300: "#1A1A1A",
    200: "#252525",
    100: "#333333",
    50: "#404040",
  },
  text: {
    title: "#FFFFFF",
    body: "#FFFFFF",
    muted: "rgba(255, 255, 255, 0.7)",
    onNavy: "#FFFFFF",
  },
  border: {
    base: "rgba(0, 255, 42, 0.2)",
    accent: "rgba(0, 255, 42, 0.5)",
  },
} as const;
