"use client";

import {
  Badge,
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import BaseCard from "./BaseCard";

const MotionBox = motion.create(Box);

export interface CourseCardProps extends BoxProps {
  /** Course title */
  title: string;
  /** Course description */
  description?: string;
  /** Course level (e.g., "مبتدئ", "متوسط", "متقدم") */
  level?: string;
  /** Course duration */
  duration?: string;
  /** Number of sessions */
  sessions?: number;
  /** Monthly price display */
  price?: string;
  /** Total price display */
  totalPrice?: string;
  /** Course category */
  category?: string;
  /** Course slug for link */
  slug: string;
  /** Icon/emoji for the course */
  icon?: string;
  /** Accent color for the card */
  accentColor?: "gold" | "blue" | "green" | "purple";
}

// Cyber Neon color map - all with neon green as primary
const NEON_GREEN = "#00FF2A";
const colorMap = {
  gold: {
    gradient: `linear-gradient(135deg, ${NEON_GREEN}, #4DFF6A)`,
    glow: "rgba(0, 255, 42, 0.4)",
    badge: NEON_GREEN,
  },
  blue: {
    gradient: "linear-gradient(135deg, #00FF2A, #00ffff)",
    glow: "rgba(0, 212, 255, 0.4)",
    badge: "#00FF2A",
  },
  green: {
    gradient: `linear-gradient(135deg, ${NEON_GREEN}, #4DFF6A)`,
    glow: "rgba(0, 255, 42, 0.4)",
    badge: NEON_GREEN,
  },
  purple: {
    gradient: "linear-gradient(135deg, #a855f7, #c084fc)",
    glow: "rgba(168, 85, 247, 0.4)",
    badge: "#a855f7",
  },
};

/**
 * CourseCard - For displaying course listings
 * Used in courses page, homepage program section
 */
export default function CourseCard({
  title,
  description,
  level,
  duration,
  sessions,
  price,
  totalPrice,
  category,
  slug,
  icon = "📖",
  accentColor = "gold",
  ...props
}: CourseCardProps) {
  const colors = colorMap[accentColor];

  return (
    <BaseCard
      variant="default"
      hoverLift
      hoverGlow
      glowColor={colors.glow}
      {...props}
    >
      {/* Top accent bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="4px"
        background={colors.gradient}
        borderTopRadius="xl"
      />

      {/* Corner glow decoration */}
      <MotionBox
        position="absolute"
        top={-20}
        right={-20}
        w="100px"
        h="100px"
        borderRadius="full"
        background={colors.gradient}
        filter="blur(40px)"
        opacity={0.15}
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.3, opacity: 0.25 }}
        transition={{ duration: 0.4 }}
        pointerEvents="none"
      />

      <Stack p={6} gap={4} position="relative">
        {/* Header with icon and category */}
        <Flex justify="space-between" align="flex-start">
          <Box
            w="48px"
            h="48px"
            borderRadius="lg"
            background={colors.gradient}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="xl"
            boxShadow={`0 4px 12px ${colors.glow}`}
          >
            {icon}
          </Box>
          {category && (
            <Badge
              bg={`${colors.badge}20`}
              color={colors.badge}
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
            >
              {category}
            </Badge>
          )}
        </Flex>

        {/* Title and description */}
        <Stack gap={2}>
          <Heading
            as="h3"
            size="md"
            fontWeight="800"
            color="white"
            css={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </Heading>
          {description && (
            <Text
              fontSize="sm"
              color="rgba(255, 255, 255, 0.7)"
              lineHeight="1.7"
              css={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </Text>
          )}
        </Stack>

        {/* Meta info */}
        <Flex gap={4} flexWrap="wrap" fontSize="xs" color="rgba(255, 255, 255, 0.7)">
          {level && (
            <Flex align="center" gap={1}>
              <Text>📊</Text>
              <Text fontWeight="600">{level}</Text>
            </Flex>
          )}
          {duration && (
            <Flex align="center" gap={1}>
              <Text>⏱️</Text>
              <Text fontWeight="600">{duration}</Text>
            </Flex>
          )}
          {sessions && (
            <Flex align="center" gap={1}>
              <Text>📅</Text>
              <Text fontWeight="600">{sessions} جلسة</Text>
            </Flex>
          )}
        </Flex>

        {/* Price and CTA */}
        <Flex justify="space-between" align="center" pt={2}>
          <Stack gap={0}>
            {price && (
              <Text fontSize="lg" fontWeight="800" color={colors.badge}>
                {price}
                <Text as="span" fontSize="xs" color="rgba(255, 255, 255, 0.7)" fontWeight="normal">
                  {" "}
                  /شهرياً
                </Text>
              </Text>
            )}
            {totalPrice && (
              <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)">
                الإجمالي: {totalPrice}
              </Text>
            )}
          </Stack>
          <Button
            asChild
            size="sm"
            bg={colors.gradient}
            color="white"
            fontWeight="700"
            borderRadius="lg"
            px={4}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: `0 8px 20px ${colors.glow}`,
            }}
            transition="all 0.3s ease"
          >
            <Link href={`/courses/${slug}`}>عرض التفاصيل</Link>
          </Button>
        </Flex>
      </Stack>
    </BaseCard>
  );
}
