"use client";

import { Box, Heading, Stack, Text, Badge } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { thisWeekUpdates, lastUpdated } from "@/config/academyActivity";

/**
 * ThisWeekSection
 * 
 * Displays real weekly activity updates from the academy.
 * This is the MOST IMPORTANT section - it shows the academy is alive.
 * 
 * Content is pulled from src/config/academyActivity.ts
 * Update that file weekly to refresh this section.
 */
export default function ThisWeekSection() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const t = useTranslations("home.thisWeek");

  // Format the last updated date
  const formattedDate = new Date(lastUpdated).toLocaleDateString(
    isArabic ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <Box
      as="section"
      bg="#050505"
      borderRadius="2xl"
      border="1px solid"
      borderColor="whiteAlpha.200"
      p={{ base: 6, md: 10 }}
    >
      <Stack gap={6}>
        {/* Header */}
        <Stack gap={3}>
          <Badge
            bg="green.900"
            color="green.300"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="700"
            w="fit-content"
          >
            {t("badge")}
          </Badge>
          
          <Heading
            as="h2"
            size={{ base: "lg", md: "xl" }}
            color="white"
            fontFamily="var(--font-ibm-plex)"
          >
            {t("title")}
          </Heading>
          
          <Text color="gray.500" fontSize="sm">
            {t("lastUpdated", { date: formattedDate })}
          </Text>
        </Stack>

        {/* Updates List */}
        <Stack as="ul" gap={3} listStyleType="none" p={0} m={0}>
          {thisWeekUpdates.map((update) => (
            <Box
              as="li"
              key={update.id}
              display="flex"
              alignItems="flex-start"
              gap={3}
              p={4}
              bg="whiteAlpha.50"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.100"
              transition="all 0.2s"
              _hover={{
                bg: "whiteAlpha.100",
                borderColor: "whiteAlpha.200",
              }}
            >
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg="green.400"
                mt={2}
                flexShrink={0}
              />
              <Text color="gray.200" fontSize={{ base: "md", md: "lg" }} lineHeight="1.8">
                {isArabic ? update.textAr : update.textEn}
              </Text>
            </Box>
          ))}
        </Stack>

        {/* Subtle footer */}
        <Text color="gray.600" fontSize="xs" textAlign="center">
          {t("footer")}
        </Text>
      </Stack>
    </Box>
  );
}
