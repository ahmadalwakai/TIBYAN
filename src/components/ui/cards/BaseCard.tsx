"use client";

import { Box, BoxProps } from "@chakra-ui/react";
import { ReactNode, forwardRef } from "react";

export type CardVariant = "default" | "elevated" | "outlined" | "glass";

export interface BaseCardProps extends BoxProps {
  children: ReactNode;
  /** Visual style variant */
  variant?: CardVariant;
  /** Enable hover lift animation */
  hoverLift?: boolean;
  /** Enable subtle glow on hover */
  hoverGlow?: boolean;
  /** Glow color (uses CSS variable or color value) */
  glowColor?: string;
}

// Neon green accent color
const NEON_GREEN = "#00FF2A";

/**
 * BaseCard - Foundation component for all card variants
 * Cyber Neon Theme: Black background, neon green accents
 */
const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      children,
      variant = "default",
      hoverLift = true,
      hoverGlow = true,
      glowColor = NEON_GREEN,
      ...props
    },
    ref
  ) => {
    // Variant-specific styles - all dark with neon accents
    const variantStyles: Record<CardVariant, BoxProps> = {
      default: {
        bg: "#050505",
        border: "1px solid",
        borderColor: "rgba(0, 255, 42, 0.2)",
        borderRadius: "xl",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 42, 0.05)",
      },
      elevated: {
        bg: "#050505",
        borderRadius: "xl",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 42, 0.1)",
      },
      outlined: {
        bg: "transparent",
        border: "2px solid",
        borderColor: "rgba(0, 255, 42, 0.3)",
        borderRadius: "xl",
      },
      glass: {
        bg: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(12px)",
        border: "1px solid",
        borderColor: "rgba(0, 255, 42, 0.2)",
        borderRadius: "xl",
      },
    };

    const baseStyles = variantStyles[variant];

    return (
      <Box
        ref={ref}
        position="relative"
        overflow="hidden"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        {...baseStyles}
        _hover={{
          borderColor: "rgba(0, 255, 42, 0.5)",
          transform: hoverLift ? "translateY(-6px)" : undefined,
          boxShadow: hoverGlow
            ? `0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 30px ${glowColor}40`
            : "0 10px 20px rgba(0, 0, 0, 0.3)",
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

BaseCard.displayName = "BaseCard";

export default BaseCard;
