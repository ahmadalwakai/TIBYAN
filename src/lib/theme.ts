import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { BRAND } from "@/theme/brand";

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          900: { value: BRAND.navy[900] },
          800: { value: "#0E2847" },
          700: { value: BRAND.navy[700] },
          600: { value: "#16406A" },
          500: { value: BRAND.navy[500] },
          400: { value: BRAND.navy[400] },
          300: { value: BRAND.navy[300] },
          200: { value: BRAND.navy[200] },
          100: { value: BRAND.navy[100] },
          50: { value: BRAND.navy[50] },
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
        cardDark: { value: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)" },
        cardDarkHover: { value: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)" },
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
      fontSizes: {
        // Arabic-optimized typography scale
        xs: { value: "0.75rem" },    // 12px - captions, metadata
        sm: { value: "0.875rem" },   // 14px - secondary text
        md: { value: "1rem" },       // 16px - body text (baseline)
        lg: { value: "1.125rem" },   // 18px - emphasized body
        xl: { value: "1.25rem" },    // 20px - small headings
        "2xl": { value: "1.5rem" },  // 24px - h3
        "3xl": { value: "1.875rem" }, // 30px - h2
        "4xl": { value: "2.25rem" }, // 36px - h1
        "5xl": { value: "3rem" },    // 48px - display headings
        "6xl": { value: "3.75rem" }, // 60px - hero headings
        "7xl": { value: "4.5rem" },  // 72px - large hero
        "8xl": { value: "6rem" },    // 96px - extra large hero
      },
      lineHeights: {
        // Optimized for Arabic script with diacritics
        tight: { value: "1.25" },    // For headings
        snug: { value: "1.375" },    // For sub-headings
        normal: { value: "1.6" },    // For body text
        relaxed: { value: "1.75" },  // For long-form content
        loose: { value: "2" },       // For captions/metadata
      },
      spacing: {
        // RTL-aware spacing scale
        textGap: { value: "0.5rem" }, // Gap between text elements
        cardGap: { value: "1.5rem" }, // Gap between cards
        sectionGap: { value: "4rem" }, // Gap between sections
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
        // Core semantic tokens using CSS variables for proper dark mode
        background: { value: "var(--color-bg)" },
        backgroundAlt: { value: "var(--color-bg-alt)" },
        surface: { value: "var(--color-surface)" },
        surfaceHover: { value: "var(--color-surface-hover)" },
        text: { value: "var(--color-text)" },
        textBody: { value: "var(--color-text-body)" },
        muted: { value: "var(--color-text-muted)" },
        border: { value: "var(--color-border)" },
        borderAccent: { value: "var(--color-border-accent)" },
        
        // Interactive element tokens
        primary: { value: "var(--color-primary)" },
        primaryHover: { value: "var(--color-primary-hover)" },
        primaryText: { value: "var(--color-primary-text)" },
        secondary: { value: "var(--color-secondary)" },
        secondaryHover: { value: "var(--color-secondary-hover)" },
        secondaryText: { value: "var(--color-secondary-text)" },
        
        // Accent colors
        accent: { value: "var(--color-accent)" },
        accentSubtle: { value: "var(--color-accent-subtle)" },
        
        // Button-specific tokens
        outlineBorder: { value: "var(--color-outline-border)" },
        outlineText: { value: "var(--color-outline-text)" },
        outlineHoverBg: { value: "var(--color-outline-hover-bg)" },
        ghostText: { value: "var(--color-ghost-text)" },
        ghostHoverBg: { value: "var(--color-ghost-hover-bg)" },
        
        // Card tokens
        cardBg: { value: "var(--color-card-bg)" },
        cardBorder: { value: "var(--color-card-border)" },
        cardHoverBorder: { value: "var(--color-card-hover-border)" },
        
        // Status colors
        success: { value: "var(--color-success)" },
        warning: { value: "var(--color-warning)" },
        error: { value: "var(--color-danger)" },
        
        // Link colors
        link: { value: "var(--color-link)" },
        linkHover: { value: "var(--color-link-hover)" },
        
        // Spinner/Loading
        spinner: { value: "var(--color-spinner)" },
        
        // Avatar
        avatarBg: { value: "var(--color-avatar-bg)" },
        avatarText: { value: "var(--color-avatar-text)" },
        
        highlight: { value: { base: "#FEF3C7", _dark: "#78350F" } },
      },
    },
  },
  globalCss: {
    body: {
      bg: "background",
      color: "textBody",
      lineHeight: "normal",
      fontSize: "md",
    },
    "h1, h2, h3, h4, h5, h6": {
      color: "text",
      fontWeight: "700",
      lineHeight: "tight",
      letterSpacing: "-0.01em",
    },
    h1: {
      fontSize: { base: "4xl", md: "5xl", lg: "6xl" },
      lineHeight: "tight",
    },
    h2: {
      fontSize: { base: "3xl", md: "4xl" },
      lineHeight: "tight",
    },
    h3: {
      fontSize: { base: "2xl", md: "3xl" },
      lineHeight: "snug",
    },
    p: {
      lineHeight: "normal",
      marginBottom: "textGap",
    },
    a: {
      color: "link",
      textDecoration: "none",
      transition: "color 0.2s",
      _hover: {
        color: "linkHover",
      },
    },
  },
});

const system = createSystem(defaultConfig, customConfig);

export default system;
