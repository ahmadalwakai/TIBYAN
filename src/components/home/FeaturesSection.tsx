"use client";

import { Badge, Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FeatureCard } from "@/components/ui/cards";

// Cyber Neon gradients
const FEATURE_GRADIENTS = [
  "linear-gradient(135deg, #00FF2A, #4DFF6A)",
  "linear-gradient(135deg, #00FF2A, #00ffff)",
  "linear-gradient(135deg, #00FF2A, #66FF80)",
];

/**
 * FeaturesSection - Why Tibyan features highlight
 * Cyber Neon Theme: Black background, neon green accents
 */
export default function FeaturesSection() {
  const t = useTranslations("home");

  const features = [
    {
      title: t("features.academicCommitment.title"),
      description: t("features.academicCommitment.description"),
      icon: "📚",
      gradient: FEATURE_GRADIENTS[0],
    },
    {
      title: t("features.questionBank.title"),
      description: t("features.questionBank.description"),
      icon: "🎯",
      gradient: FEATURE_GRADIENTS[1],
    },
    {
      title: t("features.interactiveCommunity.title"),
      description: t("features.interactiveCommunity.description"),
      icon: "💬",
      gradient: FEATURE_GRADIENTS[2],
    },
  ];

  return (
    <Box
      position="relative"
      borderRadius="2xl"
      overflow="hidden"
    >
      {/* Animated Border - Neon Green */}
      <Box
        position="absolute"
        inset="-2px"
        borderRadius="2xl"
        background="linear-gradient(135deg, #00FF2A, #000000, #4DFF6A, #000000, #00FF2A)"
        backgroundSize="400% 400%"
        css={{
          animation: "gradient 8s ease infinite",
          "@keyframes gradient": {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
        }}
      />

      <Box
        position="relative"
        bg="linear-gradient(135deg, rgba(0, 0, 0, 0.97), rgba(5, 5, 5, 0.95))"
        borderRadius="xl"
        m="2px"
        p={{ base: 8, md: 12 }}
      >
        {/* Background Decorations - Neon Glow */}
        <Box
          position="absolute"
          top="10%"
          right="5%"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
          pointerEvents="none"
        />

        <Stack gap={10} position="relative" zIndex={1}>
          {/* Section Header */}
          <Stack gap={3} textAlign="center">
            <Text color="#00FF2A" fontWeight="700" fontSize="sm" letterSpacing="wider">
              {t("whyTibyan")}
            </Text>
            <Heading
              size={{ base: "lg", md: "xl" }}
              color="white"
              css={{
                background: "linear-gradient(135deg, #ffffff 0%, #00FF2A 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {t("featuresTitle")}
            </Heading>
          </Stack>

          {/* Feature Cards Grid */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                iconGradient={feature.gradient}
                bg="rgba(0, 0, 0, 0.8)"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="rgba(0, 255, 42, 0.2)"
                _hover={{
                  bg: "rgba(0, 0, 0, 0.9)",
                  borderColor: "rgba(0, 255, 42, 0.5)",
                  boxShadow: "0 0 30px rgba(0, 255, 42, 0.2)",
                }}
                css={{
                  "& h3": { color: "white" },
                  "& p": { color: "rgba(255, 255, 255, 0.7)" },
                }}
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Box>
    </Box>
  );
}
