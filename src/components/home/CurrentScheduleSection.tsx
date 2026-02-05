"use client";

import { Box, Heading, Stack, Text, Badge, SimpleGrid, Flex } from "@chakra-ui/react";
import { useLocale } from "next-intl";
import { currentSchedule } from "@/config/academyActivity";

/**
 * CurrentScheduleSection
 * 
 * Shows REAL class times with actual availability.
 * No "flexible scheduling" - real days, real times, real spots.
 */
export default function CurrentScheduleSection() {
  const locale = useLocale();
  const isArabic = locale === "ar";

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
          <Heading
            as="h2"
            size={{ base: "lg", md: "xl" }}
            color="white"
            fontFamily="var(--font-ibm-plex)"
          >
            {isArabic ? "جدول الحصص الحالي" : "Current Class Schedule"}
          </Heading>
          
          <Text color="gray.400" fontSize="md">
            {isArabic 
              ? "مواعيد الحصص الأسبوعية المتاحة حالياً" 
              : "Weekly class times currently available"}
          </Text>
        </Stack>

        {/* Schedule Grid */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {currentSchedule.map((slot, index) => {
            const isFull = slot.spotsLeft === null;
            const isLowSpots = slot.spotsLeft !== null && slot.spotsLeft <= 2;
            
            return (
              <Box
                key={index}
                bg={isFull ? "whiteAlpha.50" : "whiteAlpha.100"}
                borderRadius="xl"
                p={5}
                border="1px solid"
                borderColor={isFull ? "whiteAlpha.100" : isLowSpots ? "orange.800" : "whiteAlpha.200"}
                opacity={isFull ? 0.6 : 1}
                transition="all 0.2s"
                _hover={{
                  borderColor: isFull ? "whiteAlpha.100" : "green.700",
                  transform: isFull ? "none" : "translateY(-2px)",
                }}
              >
                <Stack gap={3}>
                  {/* Day and Time */}
                  <Flex justify="space-between" align="center">
                    <Text color="white" fontWeight="700" fontSize="lg">
                      {isArabic ? slot.dayAr : slot.day}
                    </Text>
                    <Text 
                      color="gray.300" 
                      fontWeight="600" 
                      fontSize="md"
                      fontFamily="monospace"
                    >
                      {slot.time}
                    </Text>
                  </Flex>

                  {/* Level */}
                  <Text color="gray.400" fontSize="md">
                    {isArabic ? slot.levelAr : slot.level}
                  </Text>

                  {/* Availability */}
                  <Flex justify="flex-end">
                    {isFull ? (
                      <Badge
                        bg="gray.800"
                        color="gray.400"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {isArabic ? "مكتمل" : "Full"}
                      </Badge>
                    ) : isLowSpots ? (
                      <Badge
                        bg="orange.900"
                        color="orange.300"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {isArabic 
                          ? `${slot.spotsLeft} مقاعد متبقية` 
                          : `${slot.spotsLeft} spots left`}
                      </Badge>
                    ) : (
                      <Badge
                        bg="green.900"
                        color="green.300"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {isArabic 
                          ? `${slot.spotsLeft} مقاعد متاحة` 
                          : `${slot.spotsLeft} spots available`}
                      </Badge>
                    )}
                  </Flex>
                </Stack>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Note */}
        <Box
          bg="whiteAlpha.50"
          borderRadius="xl"
          p={4}
          border="1px solid"
          borderColor="whiteAlpha.100"
        >
          <Text color="gray.400" fontSize="sm" textAlign="center">
            {isArabic 
              ? "التوقيتات بتوقيت ألمانيا (CET). تواصل معنا لحجز مقعد." 
              : "Times shown in Germany timezone (CET). Contact us to reserve a spot."}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
