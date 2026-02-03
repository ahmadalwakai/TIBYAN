"use client";

import { Badge, Box, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const PROGRAMS = [
  {
    key: "preparatory",
    icon: "🎓",
    gradient: "linear-gradient(135deg, #0b1f3b, #1a365d)",
    accentGradient: "linear-gradient(135deg, #00FF2A, #4DFF6A)",
    slug: "preparatory-year",
  },
  {
    key: "shariah",
    icon: "📖",
    gradient: "linear-gradient(135deg, #065f46, #047857)",
    accentGradient: "linear-gradient(135deg, #00ff88, #10b981)",
    slug: "shariah-track",
  },
  {
    key: "arabicReading",
    icon: "✍️",
    gradient: "linear-gradient(135deg, #92400e, #b45309)",
    accentGradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    slug: "arabic-reading",
  },
];

/**
 * ProgramsSection - Educational programs showcase
 */
export default function ProgramsSection() {
  const t = useTranslations("home");

  return (
    <Box position="relative" py={4}>
      <Stack gap={10} textAlign={{ base: "center", md: "start" }}>
        {/* Section Header */}
        <Stack gap={5} align={{ base: "center", md: "flex-start" }} maxW="750px">
          <Badge
            position="relative"
            overflow="hidden"
            bg="transparent"
            color="white"
            px={5}
            py={2.5}
            borderRadius="full"
            fontSize="sm"
            fontWeight="700"
            css={{
              background: "linear-gradient(135deg, #0b1f3b, #1a365d)",
              boxShadow: "0 4px 15px rgba(11, 31, 59, 0.3)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "full",
                padding: "2px",
                background: "linear-gradient(135deg, #00FF2A, #00FF2A, #00FF2A)",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
              },
            }}
          >
            {t("programsBadge")}
          </Badge>
          <Heading
            size={{ base: "lg", md: "xl" }}
            lineHeight="1.3"
            css={{
              background: "linear-gradient(90deg, #0b1f3b, #00FF2A, #0b1f3b, #00FF2A)",
              backgroundSize: "200% auto",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {t("programsTitle")}
          </Heading>
          <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
            {t("programsDescription")}
          </Text>
        </Stack>

        {/* Programs Grid */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
          {PROGRAMS.map((program) => (
            <Link key={program.key} href={`/programs#${program.slug}`} style={{ textDecoration: "none" }}>
              <Box
                position="relative"
                borderRadius="2xl"
                overflow="hidden"
                cursor="pointer"
                transition="all 0.4s ease"
                _hover={{
                  transform: "translateY(-12px) scale(1.02)",
                }}
              >
                {/* Animated border */}
                <Box
                  position="absolute"
                  inset="-2px"
                  borderRadius="2xl"
                  background={program.accentGradient}
                  opacity={0.6}
                  transition="opacity 0.4s ease"
                />

                <Box
                  position="relative"
                  bg="surface"
                  borderRadius="xl"
                  m="2px"
                  p={8}
                  transition="all 0.4s ease"
                  _hover={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <Stack gap={5}>
                    {/* Header */}
                    <Flex align="center" justify="space-between">
                      <Box position="relative">
                        <Box
                          position="absolute"
                          inset="-6px"
                          borderRadius="xl"
                          background={program.accentGradient}
                          filter="blur(12px)"
                          opacity={0.4}
                        />
                        <Box
                          position="relative"
                          background={program.gradient}
                          color="white"
                          w="64px"
                          h="64px"
                          borderRadius="xl"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="2xl"
                          boxShadow="0 8px 20px rgba(0, 0, 0, 0.2)"
                          transition="transform 0.3s ease"
                          _hover={{ transform: "scale(1.1) rotate(5deg)" }}
                        >
                          {program.icon}
                        </Box>
                      </Box>
                      <Badge
                        background={program.accentGradient}
                        color="white"
                        px={4}
                        py={2}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="800"
                        boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
                      >
                        {t(`programsList.${program.key}.sessions`)}
                      </Badge>
                    </Flex>

                    {/* Content */}
                    <Box>
                      <Heading
                        size="md"
                        mb={3}
                        css={{
                          background: program.gradient,
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        {t(`programsList.${program.key}.title`)}
                      </Heading>
                      <Text color="muted" fontSize="sm" lineHeight="1.8">
                        {t(`programsList.${program.key}.description`)}
                      </Text>
                    </Box>

                    {/* Bottom accent */}
                    <Box
                      h="4px"
                      background={program.accentGradient}
                      borderRadius="full"
                      w="50px"
                      transition="width 0.4s ease"
                    />

                    {/* Learn more */}
                    <Flex
                      align="center"
                      gap={2}
                      color="muted"
                      fontSize="sm"
                      fontWeight="600"
                      transition="all 0.3s ease"
                    >
                      <Text>{t("learnMore")}</Text>
                      <Text>←</Text>
                    </Flex>
                  </Stack>
                </Box>
              </Box>
            </Link>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
