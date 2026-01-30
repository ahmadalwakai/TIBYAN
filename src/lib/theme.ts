import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { BRAND, BRAND_DARK } from "@/theme/brand";

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          900: { value: BRAND.navy[900] },
          800: { value: "#0E2847" },
          700: { value: BRAND.navy[700] },
          500: { value: BRAND.navy[500] },
          600: { value: "#16406A" },
          400: { value: "#2A5C8F" },
          50: { value: "#F0F4F8" },
        },
      },
      radii: {
        card: { value: "16px" },
        button: { value: "14px" },
        badge: { value: "9999px" },
      },
      shadows: {
        card: { value: "0 1px 3px 0 rgba(11, 31, 58, 0.08), 0 1px 2px 0 rgba(11, 31, 58, 0.04)" },
        cardHover: { value: "0 10px 15px -3px rgba(11, 31, 58, 0.08), 0 4px 6px -2px rgba(11, 31, 58, 0.04)" },
        cardLarge: { value: "0 20px 25px -5px rgba(11, 31, 58, 0.1), 0 10px 10px -5px rgba(11, 31, 58, 0.04)" },
        subtle: { value: "0 1px 2px 0 rgba(11, 31, 58, 0.05)" },
        glow: { value: "0 0 0 3px rgba(31, 75, 122, 0.1)" },
        inner: { value: "inset 0 2px 4px 0 rgba(11, 31, 58, 0.06)" },
      },
      fonts: {
        heading: {
          value:
            "var(--font-ibm-plex), var(--font-inter), system-ui, -apple-system, sans-serif",
        },
        body: {
          value:
            "var(--font-ibm-plex), var(--font-inter), system-ui, -apple-system, sans-serif",
        },
      },
      gradients: {
        brand: { value: `linear-gradient(135deg, ${BRAND.navy[900]} 0%, ${BRAND.navy[700]} 100%)` },
        brandSubtle: { value: `linear-gradient(135deg, ${BRAND.background.subtle} 0%, ${BRAND.background.surface} 100%)` },
        primary: { value: `linear-gradient(135deg, ${BRAND.navy[900]} 0%, ${BRAND.navy[500]} 100%)` },
        surface: { value: `linear-gradient(145deg, ${BRAND.background.surface} 0%, ${BRAND.background.subtle} 100%)` },
        shimmer: { value: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" },
      },
    },
    semanticTokens: {
      colors: {
        background: { value: { base: BRAND.background.base, _dark: BRAND_DARK.background.base } },
        backgroundAlt: { value: { base: BRAND.background.subtle, _dark: BRAND_DARK.background.subtle } },
        surface: { value: { base: BRAND.background.surface, _dark: BRAND_DARK.background.surface } },
        surfaceHover: { value: { base: BRAND.background.subtle, _dark: BRAND_DARK.background.subtle } },
        text: { value: { base: BRAND.text.title, _dark: BRAND_DARK.text.title } },
        textBody: { value: { base: BRAND.text.body, _dark: BRAND_DARK.text.body } },
        muted: { value: { base: BRAND.text.muted, _dark: BRAND_DARK.text.muted } },
        border: { value: { base: BRAND.border.base, _dark: BRAND_DARK.border.base } },
        borderAccent: { value: { base: BRAND.navy[500], _dark: BRAND.navy[500] } },
        success: { value: BRAND.state.success },
        warning: { value: BRAND.state.warning },
        error: { value: BRAND.state.danger },
        link: { value: { base: BRAND.link, _dark: BRAND.navy[500] } },
        highlight: { value: { base: "#FEF3C7", _dark: "#78350F" } },
      },
    },
  },
  globalCss: {
    body: {
      bg: "background",
      color: "textBody",
      lineHeight: "1.6",
    },
    "h1, h2, h3, h4, h5, h6": {
      color: "text",
      fontWeight: "700",
      lineHeight: "1.3",
    },
    a: {
      color: "link",
      textDecoration: "none",
      transition: "color 0.2s",
      _hover: {
        color: "brand.700",
      },
    },
  },
});

const system = createSystem(defaultConfig, customConfig);

export default system;
