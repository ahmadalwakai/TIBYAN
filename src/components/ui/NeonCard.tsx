"use client";

import { Box, BoxProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface NeonCardProps extends BoxProps {
  children: ReactNode;
  neonColor?: "blue" | "gold" | "green" | "purple";
  glowIntensity?: "low" | "medium" | "high";
  animationSpeed?: "slow" | "medium" | "fast";
}

export default function NeonCard({
  children,
  neonColor = "blue",
  glowIntensity = "medium",
  animationSpeed = "medium",
  ...props
}: NeonCardProps) {
  const colorMap = {
    blue: {
      primary: "#00d4ff",
      secondary: "#0099ff",
      glow: "rgba(0, 212, 255, 0.6)",
    },
    gold: {
      primary: "#ffd700",
      secondary: "#c8a24a",
      glow: "rgba(255, 215, 0, 0.6)",
    },
    green: {
      primary: "#00ff88",
      secondary: "#00cc6a",
      glow: "rgba(0, 255, 136, 0.6)",
    },
    purple: {
      primary: "#bf00ff",
      secondary: "#9900cc",
      glow: "rgba(191, 0, 255, 0.6)",
    },
  };

  const intensityMap = {
    low: { blur: "15px", spread: "5px" },
    medium: { blur: "25px", spread: "10px" },
    high: { blur: "40px", spread: "15px" },
  };

  const speedMap = {
    slow: "8s",
    medium: "4s",
    fast: "2s",
  };

  const colors = colorMap[neonColor];
  const intensity = intensityMap[glowIntensity];
  const speed = speedMap[animationSpeed];

  return (
    <Box
      position="relative"
      borderRadius="xl"
      overflow="hidden"
      css={{
        "@keyframes neonRotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "@keyframes neonPulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
      }}
      {...props}
    >
      {/* Animated neon border */}
      <Box
        position="absolute"
        inset="-2px"
        borderRadius="xl"
        background={`conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, transparent, transparent, ${colors.primary})`}
        css={{
          animation: `neonRotate ${speed} linear infinite`,
        }}
        zIndex={0}
      />
      
      {/* Glow effect */}
      <Box
        position="absolute"
        inset="-4px"
        borderRadius="xl"
        background={`conic-gradient(from 0deg, ${colors.glow}, transparent, transparent, ${colors.glow})`}
        filter={`blur(${intensity.blur})`}
        css={{
          animation: `neonRotate ${speed} linear infinite, neonPulse 2s ease-in-out infinite`,
        }}
        zIndex={0}
      />

      {/* Inner content container */}
      <Box
        position="relative"
        zIndex={1}
        bg="surface"
        borderRadius="lg"
        m="2px"
        overflow="hidden"
      >
        {children}
      </Box>
    </Box>
  );
}
