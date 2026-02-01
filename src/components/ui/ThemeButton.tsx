"use client";

import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import { forwardRef } from "react";

export interface ThemeButtonProps extends Omit<ChakraButtonProps, "colorScheme"> {
  themeVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
}

/**
 * Theme-aware Button component that maintains proper contrast in both light and dark modes.
 * Use this instead of raw Chakra Button with hardcoded brand colors.
 */
const ThemeButton = forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ themeVariant = "primary", children, ...props }, ref) => {
    const variantStyles = {
      primary: {
        bg: "primary",
        color: "primaryText",
        _hover: {
          bg: "primaryHover",
          transform: "translateY(-2px)",
        },
        _active: {
          transform: "translateY(0)",
        },
      },
      secondary: {
        bg: "secondary",
        color: "secondaryText",
        _hover: {
          bg: "secondaryHover",
          transform: "translateY(-2px)",
        },
        _active: {
          transform: "translateY(0)",
        },
      },
      outline: {
        bg: "transparent",
        border: "2px solid",
        borderColor: "outlineBorder",
        color: "outlineText",
        _hover: {
          bg: "outlineHoverBg",
          transform: "translateY(-2px)",
        },
        _active: {
          transform: "translateY(0)",
        },
      },
      ghost: {
        bg: "transparent",
        color: "ghostText",
        _hover: {
          bg: "ghostHoverBg",
        },
      },
      danger: {
        bg: "error",
        color: "white",
        _hover: {
          opacity: 0.9,
          transform: "translateY(-2px)",
        },
        _active: {
          transform: "translateY(0)",
        },
      },
      success: {
        bg: "success",
        color: "white",
        _hover: {
          opacity: 0.9,
          transform: "translateY(-2px)",
        },
        _active: {
          transform: "translateY(0)",
        },
      },
    };

    return (
      <ChakraButton
        ref={ref}
        borderRadius="button"
        fontWeight="600"
        transition="all 0.2s ease"
        {...variantStyles[themeVariant]}
        {...props}
      >
        {children}
      </ChakraButton>
    );
  }
);

ThemeButton.displayName = "ThemeButton";

export default ThemeButton;
