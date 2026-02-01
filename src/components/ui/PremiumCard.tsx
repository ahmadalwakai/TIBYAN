"use client";

import { Box, BoxProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface PremiumCardProps extends BoxProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "gradient" | "bordered" | "glass";
  hoverEffect?: boolean;
}

export default function PremiumCard({
  children,
  variant = "default",
  hoverEffect = true,
  ...props
}: PremiumCardProps) {
  const variantStyles = {
    default: {
      bg: "cardBg",
      border: "1px solid",
      borderColor: "cardBorder",
      borderRadius: "card",
      boxShadow: "card",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            boxShadow: "cardHover",
            transform: "translateY(-4px)",
            borderColor: "cardHoverBorder",
          }
        : {},
    },
    elevated: {
      bg: "cardBg",
      borderRadius: "card",
      boxShadow: "cardLarge",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            transform: "translateY(-6px)",
            boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.2)",
          }
        : {},
    },
    gradient: {
      bg: "cardBg",
      border: "2px solid",
      borderColor: "primary",
      borderRadius: "card",
      boxShadow: "card",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _before: {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        bg: "primary",
      },
      _hover: hoverEffect
        ? {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 40px -10px rgba(200, 162, 74, 0.3)",
          }
        : {},
    },
    bordered: {
      bg: "cardBg",
      border: "2px solid",
      borderColor: "cardBorder",
      borderRadius: "card",
      boxShadow: "subtle",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            borderColor: "cardHoverBorder",
            boxShadow: "cardHover",
            bg: "surfaceHover",
          }
        : {},
    },
    glass: {
      bg: "surface",
      backdropFilter: "blur(12px)",
      border: "1px solid",
      borderColor: "border",
      borderRadius: "card",
      boxShadow: "card",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      opacity: 0.95,
      _hover: hoverEffect
        ? {
            opacity: 1,
            boxShadow: "cardHover",
          }
        : {},
    },
  };

  return (
    <Box {...variantStyles[variant]} {...props}>
      {children}
    </Box>
  );
}
