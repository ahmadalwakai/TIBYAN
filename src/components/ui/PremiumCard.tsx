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
      bg: "#050505",
      border: "1px solid",
      borderColor: "rgba(0, 255, 42, 0.2)",
      borderRadius: "xl",
      boxShadow: "0 0 20px rgba(0, 255, 42, 0.05)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            boxShadow: "0 0 30px rgba(0, 255, 42, 0.15)",
            transform: "translateY(-4px)",
            borderColor: "rgba(0, 255, 42, 0.4)",
          }
        : {},
    },
    elevated: {
      bg: "#050505",
      borderRadius: "xl",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 42, 0.1)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            transform: "translateY(-6px)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 42, 0.2)",
          }
        : {},
    },
    gradient: {
      bg: "#050505",
      border: "1px solid",
      borderColor: "#00FF2A",
      borderRadius: "xl",
      boxShadow: "0 0 30px rgba(0, 255, 42, 0.2)",
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
        bg: "#00FF2A",
        boxShadow: "0 0 20px rgba(0, 255, 42, 0.5)",
      },
      _hover: hoverEffect
        ? {
            transform: "translateY(-4px)",
            boxShadow: "0 0 40px rgba(0, 255, 42, 0.3)",
          }
        : {},
    },
    bordered: {
      bg: "#050505",
      border: "1px solid",
      borderColor: "rgba(0, 255, 42, 0.3)",
      borderRadius: "xl",
      boxShadow: "0 0 15px rgba(0, 255, 42, 0.05)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      _hover: hoverEffect
        ? {
            borderColor: "#00FF2A",
            boxShadow: "0 0 30px rgba(0, 255, 42, 0.2)",
            bg: "#0A0A0A",
          }
        : {},
    },
    glass: {
      bg: "rgba(5, 5, 5, 0.9)",
      backdropFilter: "blur(12px)",
      border: "1px solid",
      borderColor: "rgba(0, 255, 42, 0.2)",
      borderRadius: "xl",
      boxShadow: "0 0 20px rgba(0, 255, 42, 0.05)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      opacity: 0.95,
      _hover: hoverEffect
        ? {
            opacity: 1,
            boxShadow: "0 0 30px rgba(0, 255, 42, 0.15)",
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
