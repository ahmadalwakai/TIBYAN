"use client";

import { Badge, Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * CTASection - Final call-to-action with assessment lead magnet
 */
export default function CTASection() {
  const t = useTranslations("home");

  return (
    <Box
      position="relative"
      borderRadius="2xl"
      overflow="hidden"
    >
      {/* Gold gradient border */}
      <Box
        position="absolute"
        inset="-2px"
        borderRadius="2xl"
        background="linear-gradient(135deg, #00FF2A, #F7DC6F, #00FF2A)"
        backgroundSize="200% 200%"
        css={{
          animation: "gradientShift 4s ease infinite",
          "@keyframes gradientShift": {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
        }}
      />

      <Box
        position="relative"
        bg="linear-gradient(135deg, #0b1f3b 0%, #1a365d 100%)"
        borderRadius="xl"
        m="2px"
        p={{ base: 8, md: 12 }}
        color="white"
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="space-between"
          gap={8}
        >
          {/* Content */}
          <Stack gap={4} flex="1" textAlign={{ base: "center", md: "start" }}>
            <Badge
              bg="linear-gradient(135deg, #00FF2A, #F7DC6F)"
              color="#0b1f3b"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="800"
              w="fit-content"
              mx={{ base: "auto", md: 0 }}
            >
              {t("assessmentBadge")}
            </Badge>
            <Heading size={{ base: "md", md: "lg" }} color="white">
              {t("assessmentTitle")}
            </Heading>
            <Text color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} lineHeight="1.8">
              {t("assessmentSubtitle")}
            </Text>

            {/* Features */}
            <Flex gap={4} wrap="wrap" justify={{ base: "center", md: "flex-start" }}>
              {[
                { key: "personalized", icon: "🎯" },
                { key: "freeMinutes", icon: "⏱️" },
                { key: "noCommitment", icon: "✓" },
              ].map((feature) => (
                <Flex
                  key={feature.key}
                  align="center"
                  gap={2}
                  bg="whiteAlpha.100"
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="600"
                >
                  <Text>{feature.icon}</Text>
                  <Text>{t(`assessmentFeatures.${feature.key}`)}</Text>
                </Flex>
              ))}
            </Flex>
          </Stack>

          {/* CTA Button */}
          <Box position="relative">
            <Box
              position="absolute"
              inset="-4px"
              borderRadius="xl"
              bg="linear-gradient(135deg, #00FF2A, #F7DC6F)"
              filter="blur(15px)"
              opacity={0.5}
              css={{
                animation: "pulse 3s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { boxShadow: "0 0 30px rgba(212, 175, 55, 0.3)" },
                  "50%": { boxShadow: "0 0 60px rgba(212, 175, 55, 0.5)" },
                },
              }}
            />
            <Button
              asChild
              position="relative"
              bg="linear-gradient(135deg, #00FF2A, #F7DC6F)"
              color="#0b1f3b"
              size="lg"
              px={10}
              h="60px"
              fontSize="lg"
              fontWeight="800"
              boxShadow="0 8px 30px rgba(212, 175, 55, 0.4)"
              _hover={{
                transform: "translateY(-4px) scale(1.02)",
                boxShadow: "0 12px 40px rgba(212, 175, 55, 0.5)",
              }}
              transition="all 0.3s ease"
            >
              <Link href="/assessment">{t("assessmentCta")}</Link>
            </Button>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
