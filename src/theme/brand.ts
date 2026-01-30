/**
 * Brand Color Palette - Clean White + Navy
 * Single source of truth for all brand colors
 */

export const BRAND = {
  background: {
    base: "#F2F4F7",
    surface: "#FFFFFF",
    subtle: "#EEF2F6",
  },
  car: {
    name: "Pearl White",
    hex: "#F8F8F6",
    trim: "#0B1F3A",
  },
  navy: {
    900: "#0B1F3A",
    700: "#12335A",
    500: "#1F4B7A",
  },
  text: {
    title: "#0B1F3A",
    body: "#344054",
    muted: "#667085",
    onNavy: "#FFFFFF",
  },
  border: {
    base: "#D0D5DD",
  },
  state: {
    success: "#12B76A",
    warning: "#F79009",
    danger: "#F04438",
  },
  link: "#0B1F3A",
} as const;

// Dark mode variants (optional, for future use)
export const BRAND_DARK = {
  background: {
    base: "#0A1628",
    surface: "#0F1D32",
    subtle: "#1A2B45",
  },
  text: {
    title: "#F8F8F6",
    body: "#D0D5DD",
    muted: "#98A2B3",
    onNavy: "#FFFFFF",
  },
  border: {
    base: "#2E3D54",
  },
} as const;
