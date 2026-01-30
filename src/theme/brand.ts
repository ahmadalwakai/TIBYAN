/**
 * Brand Color Palette - Premium Academy Design
 * Single source of truth for all brand colors
 * Elevated visual identity with gold accents for authority
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
  // Premium accent colors for authority and prestige
  gold: {
    50: "#FEF9E7",
    100: "#FCF3CF",
    200: "#F9E79F",
    300: "#F7DC6F",
    400: "#F4D03F",
    500: "#D4AF37", // Primary gold - prestige
    600: "#C8A24A", // Existing accent
    700: "#B8860B", // Dark gold
    800: "#9A7209",
    900: "#7C5B07",
  },
  burgundy: {
    50: "#FDF2F2",
    100: "#FAE5E5",
    200: "#F5CCCC",
    300: "#EFA3A3",
    400: "#E67373",
    500: "#800020", // Primary burgundy - authority
    600: "#6B001A",
    700: "#560014",
    800: "#40000F",
    900: "#2B000A",
  },
  text: {
    title: "#0B1F3A",
    body: "#344054",
    muted: "#667085",
    onNavy: "#FFFFFF",
    gold: "#D4AF37",
  },
  border: {
    base: "#D0D5DD",
    gold: "#D4AF37",
  },
  state: {
    success: "#12B76A",
    warning: "#F79009",
    danger: "#F04438",
  },
  link: "#0B1F3A",
  // Gradient definitions for premium effects
  gradients: {
    goldShimmer: "linear-gradient(135deg, #D4AF37 0%, #F7DC6F 50%, #D4AF37 100%)",
    navyGold: "linear-gradient(135deg, #0B1F3A 0%, #D4AF37 100%)",
    premiumCard: "linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(11, 31, 58, 0.05) 100%)",
    authorityBadge: "linear-gradient(135deg, #0B1F3A 0%, #1F4B7A 50%, #D4AF37 100%)",
  },
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
