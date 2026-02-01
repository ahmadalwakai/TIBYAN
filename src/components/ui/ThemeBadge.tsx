"use client";

import { Badge as ChakraBadge, BadgeProps as ChakraBadgeProps } from "@chakra-ui/react";
import { forwardRef } from "react";

export interface ThemeBadgeProps extends ChakraBadgeProps {
  themeVariant?: "primary" | "secondary" | "success" | "warning" | "danger" | "muted";
}

/**
 * Theme-aware Badge component that maintains proper contrast in both light and dark modes.
 * Use this instead of raw Chakra Badge with hardcoded brand colors.
 */
const ThemeBadge = forwardRef<HTMLSpanElement, ThemeBadgeProps>(
  ({ themeVariant = "primary", children, ...props }, ref) => {
    const variantStyles = {
      primary: {
        bg: "primary",
        color: "primaryText",
      },
      secondary: {
        bg: "secondary",
        color: "secondaryText",
      },
      success: {
        bg: "success",
        color: "white",
      },
      warning: {
        bg: "warning",
        color: "white",
      },
      danger: {
        bg: "error",
        color: "white",
      },
      muted: {
        bg: "ghostHoverBg",
        color: "muted",
      },
    };

    return (
      <ChakraBadge
        ref={ref}
        px={3}
        py={1}
        borderRadius="badge"
        fontSize="xs"
        fontWeight="600"
        {...variantStyles[themeVariant]}
        {...props}
      >
        {children}
      </ChakraBadge>
    );
  }
);

ThemeBadge.displayName = "ThemeBadge";

export default ThemeBadge;
