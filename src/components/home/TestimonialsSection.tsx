"use client";

import { Badge, Box, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/components/ui/cards";

const TESTIMONIALS = [
  { key: "student1", gradient: "linear-gradient(135deg, #00FF2A, #F7DC6F)" },
  { key: "student2", gradient: "linear-gradient(135deg, #00FF2A, #00CC22)" },
  { key: "student3", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
];

/**
 * TestimonialsSection - Student testimonials/social proof
 */
export default function TestimonialsSection() {
  const t = useTranslations("home");

  return (
    <Box position="relative" py={8}>
      <Stack gap={10} textAlign="center">
        {/* Section Header */}
        <Stack gap={5} align="center" maxW="800px" mx="auto">
          <Badge
            bg="linear-gradient(135deg, #10b981, #34d399)"
            color="white"
            px={6}
            py={2.5}
            borderRadius="full"
            fontSize="sm"
            fontWeight="800"
            boxShadow="0 4px 15px rgba(16, 185, 129, 0.4)"
          >
            {t("testimonialsBadge")}
          </Badge>
          <Heading
            size={{ base: "lg", md: "xl" }}
            css={{
              background: "linear-gradient(135deg, #0b1f3b 0%, #10b981 50%, #0b1f3b 100%)",
              backgroundSize: "200% auto",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {t("testimonialsTitle")}
          </Heading>
          <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
            {t("testimonialsSubtitle")}
          </Text>
        </Stack>

        {/* Testimonial Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
          {TESTIMONIALS.map((student, index) => (
            <BaseCard
              key={student.key}
              variant="default"
              hoverLift
              css={{
                animation: `testimonialFloat 5s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`,
                "@keyframes testimonialFloat": {
                  "0%, 100%": { transform: "translateY(0)" },
                  "50%": { transform: "translateY(-6px)" },
                },
              }}
            >
              {/* Quote Icon */}
              <Box
                position="absolute"
                top={4}
                right={4}
                fontSize="4xl"
                color="backgroundAlt"
                opacity={0.5}
              >
                ❝
              </Box>

              <Stack p={8} gap={5}>
                {/* Quote Text */}
                <Text
                  fontSize="sm"
                  color="muted"
                  lineHeight="1.9"
                  fontStyle="italic"
                  position="relative"
                  zIndex={1}
                >
                  &ldquo;{t(`testimonials.${student.key}.quote`)}&rdquo;
                </Text>

                {/* Divider */}
                <Box
                  h="2px"
                  w="60px"
                  background={student.gradient}
                  borderRadius="full"
                />

                {/* Author */}
                <Flex align="center" gap={4}>
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="full"
                    background={student.gradient}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xl"
                    color="white"
                    fontWeight="800"
                    boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                  >
                    {t(`testimonials.${student.key}.name`).charAt(0)}
                  </Box>
                  <Stack gap={0}>
                    <Text fontWeight="800" fontSize="sm" color="text">
                      {t(`testimonials.${student.key}.name`)}
                    </Text>
                    <Text fontSize="xs" color="muted">
                      {t(`testimonials.${student.key}.location`)}
                    </Text>
                    <Badge
                      bg="backgroundAlt"
                      color="accent"
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      mt={1}
                    >
                      {t(`testimonials.${student.key}.program`)}
                    </Badge>
                  </Stack>
                </Flex>
              </Stack>
            </BaseCard>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
