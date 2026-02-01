"use client";

import { Box, BoxProps, Flex, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

interface StatCardProps extends BoxProps {
  title?: string;
  value?: string | number;
  icon?: string;
  color?: string;
  children?: ReactNode;
  accentColor?: string;
}

// Map semantic color names to CSS variable values
const getColorValue = (color: string | undefined): string => {
  if (!color) return "var(--color-accent)";
  
  // Map semantic tokens to CSS variables
  const colorMap: Record<string, string> = {
    "accent": "var(--color-accent)",
    "primary": "var(--color-primary)",
    "secondary": "var(--color-secondary)",
    "success": "var(--color-success)",
    "warning": "var(--color-warning)",
    "error": "var(--color-danger)",
    "spinner": "var(--color-spinner)",
    "link": "var(--color-link)",
    // Legacy brand.xxx support - map to semantic colors
    "brand.500": "var(--color-accent)",
    "brand.700": "var(--color-primary)",
    "brand.900": "var(--color-primary)",
    // Keep other colors as-is for Chakra
    "green.500": "#12B76A",
    "green.600": "#059669",
    "blue.500": "#3B82F6",
    "yellow.500": "#EAB308",
    "yellow.600": "#CA8A04",
    "orange.500": "#F97316",
    "purple.500": "#8B5CF6",
    "teal.500": "#14B8A6",
  };
  
  return colorMap[color] || color;
};

export default function StatCard({
  title,
  value,
  icon,
  color,
  children,
  accentColor,
  ...props
}: StatCardProps) {
  const accent = getColorValue(accentColor || color);
  
  return (
    <Box
      bg="cardBg"
      border="1px solid"
      borderColor="cardBorder"
      borderRadius="xl"
      boxShadow="sm"
      position="relative"
      overflow="hidden"
      p={5}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: "md",
        transform: "translateY(-2px)",
        borderColor: "cardHoverBorder",
      }}
      _before={{
        content: '""',
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "4px",
        bg: accent,
        transition: "width 0.3s ease",
      }}
      _after={{
        content: '""',
        position: "absolute",
        top: 0,
        right: 0,
        width: "60px",
        height: "60px",
        bg: accent,
        opacity: 0.05,
        borderRadius: "0 0 0 100%",
      }}
      {...props}
    >
      {title && value !== undefined ? (
        <Flex direction="column" gap={2}>
          <Flex align="center" justify="space-between">
            <Text fontSize="sm" color="muted" fontWeight="medium">
              {title}
            </Text>
            {icon && (
              <Text fontSize="xl">{icon}</Text>
            )}
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color={accent}>
            {value}
          </Text>
        </Flex>
      ) : (
        children
      )}
    </Box>
  );
}
