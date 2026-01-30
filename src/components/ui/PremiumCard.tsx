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
      bg: "surface",
      border: "1px solid",
      borderColor: "border",
      borderRadius: "card",
      boxShadow: "card",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            boxShadow: "cardHover",
            transform: "translateY(-4px)",
            borderColor: "borderAccent",
          }
        : {},
    },
    elevated: {
      bg: "surface",
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
      bg: "surface",
      border: "2px solid",
      borderColor: "brand.900",
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
        bg: "brand.900",
      },
      _hover: hoverEffect
        ? {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 40px -10px rgba(200, 162, 74, 0.3)",
          }
        : {},
    },
    bordered: {
      bg: "surface",
      border: "2px solid",
      borderColor: "border",
      borderRadius: "card",
      boxShadow: "subtle",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            borderColor: "brand.500",
            boxShadow: "cardHover",
            bg: "surfaceHover",
          }
        : {},
    },
    glass: {
      bg: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(12px)",
      border: "1px solid",
      borderColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: "card",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            bg: "rgba(255, 255, 255, 0.85)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
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
