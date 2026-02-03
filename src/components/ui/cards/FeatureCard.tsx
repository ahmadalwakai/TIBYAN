"use client";

import { Box, BoxProps, Heading, Stack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import BaseCard from "./BaseCard";

const MotionBox = motion.create(Box);

export interface FeatureCardProps extends Omit<BoxProps, "title" | "animationDelay"> {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Icon (emoji or ReactNode) */
  icon: ReactNode;
  /** Gradient color for icon background */
  iconGradient?: string;
  /** Accent color for highlights */
  accentColor?: string;
}

// Neon green default
const NEON_GREEN = "#00FF2A";
const DEFAULT_GRADIENT = `linear-gradient(135deg, ${NEON_GREEN}, #4DFF6A)`;

/**
 * FeatureCard - For showcasing features/benefits with icon
 * Cyber Neon Theme: Black background, neon green accents
 */
export default function FeatureCard({
  title,
  description,
  icon,
  iconGradient = DEFAULT_GRADIENT,
  accentColor = NEON_GREEN,
  ...props
}: FeatureCardProps) {
  return (
    <BaseCard
      variant="default"
      hoverLift
      hoverGlow
      glowColor={accentColor}
      p={{ base: 6, md: 8 }}
      {...props}
    >
      <Stack gap={5} align="center" textAlign="center">
        {/* Icon with glow effect */}
        <Box position="relative">
          {/* Glow background */}
          <MotionBox
            position="absolute"
            inset="-8px"
            borderRadius="full"
            background={iconGradient}
            filter="blur(16px)"
            opacity={0.3}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.2, opacity: 0.5 }}
            transition={{ duration: 0.3 }}
          />
          {/* Icon container */}
          <MotionBox
            position="relative"
            w={{ base: "64px", md: "72px" }}
            h={{ base: "64px", md: "72px" }}
            borderRadius="full"
            background={iconGradient}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize={{ base: "xl", md: "2xl" }}
            color="white"
            boxShadow="0 8px 24px rgba(0, 0, 0, 0.15)"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </MotionBox>
        </Box>

        {/* Content */}
        <Stack gap={2}>
          <Heading
            as="h3"
            size={{ base: "sm", md: "md" }}
            fontWeight="800"
            color="white"
          >
            {title}
          </Heading>
          <Text
            fontSize={{ base: "sm", md: "md" }}
            color="rgba(255, 255, 255, 0.7)"
            lineHeight="1.8"
          >
            {description}
          </Text>
        </Stack>

        {/* Bottom accent line */}
        <Box
          w="40px"
          h="3px"
          borderRadius="full"
          background={iconGradient}
          opacity={0.6}
          transition="width 0.3s ease"
          _groupHover={{ w: "60px" }}
        />
      </Stack>
    </BaseCard>
  );
}
