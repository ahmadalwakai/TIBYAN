"use client";

import { Box, Heading, Stack, Text, Flex, Badge } from "@chakra-ui/react";
import { useLocale } from "next-intl";
import { lessonBreakdown } from "@/config/academyActivity";

/**
 * RealLessonSection
 * 
 * Shows how a real 45-minute lesson is structured.
 * No images needed - just clarity about what actually happens.
 */
export default function RealLessonSection() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const totalMinutes = lessonBreakdown.durationMinutes;

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
            {isArabic ? "كيف تبدو الحصة الحقيقية؟" : "How a Real Lesson Works"}
          </Heading>
          
          <Text color="gray.400" fontSize="md">
            {isArabic 
              ? `حصة واحدة = ${totalMinutes} دقيقة، مقسمة كالتالي:` 
              : `One session = ${totalMinutes} minutes, broken down like this:`}
          </Text>
        </Stack>

        {/* Timeline */}
        <Stack gap={0}>
          {lessonBreakdown.steps.map((step, index) => {
            // Calculate percentage width for visual bar
            const percentage = (step.minutes / totalMinutes) * 100;
            
            return (
              <Box key={index}>
                <Flex
                  align="stretch"
                  gap={{ base: 3, md: 5 }}
                  py={4}
                  borderBottom={index < lessonBreakdown.steps.length - 1 ? "1px solid" : "none"}
                  borderColor="whiteAlpha.100"
                >
                  {/* Time indicator */}
                  <Box
                    minW={{ base: "50px", md: "70px" }}
                    textAlign="center"
                  >
                    <Badge
                      bg="whiteAlpha.100"
                      color="white"
                      px={3}
                      py={1}
                      borderRadius="md"
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="700"
                    >
                      {step.minutes} {isArabic ? "د" : "min"}
                    </Badge>
                  </Box>

                  {/* Content */}
                  <Stack gap={2} flex={1}>
                    <Text 
                      color="white" 
                      fontWeight="700" 
                      fontSize={{ base: "md", md: "lg" }}
                    >
                      {isArabic ? step.labelAr : step.labelEn}
                    </Text>
                    <Text color="gray.400" fontSize="sm" lineHeight="1.7">
                      {isArabic ? step.descriptionAr : step.descriptionEn}
                    </Text>
                    
                    {/* Visual progress bar */}
                    <Box
                      w="100%"
                      h="4px"
                      bg="whiteAlpha.100"
                      borderRadius="full"
                      overflow="hidden"
                      mt={1}
                    >
                      <Box
                        w={`${percentage}%`}
                        h="100%"
                        bg="green.500"
                        borderRadius="full"
                      />
                    </Box>
                  </Stack>
                </Flex>
              </Box>
            );
          })}
        </Stack>

        {/* Summary */}
        <Box
          bg="whiteAlpha.50"
          borderRadius="xl"
          p={4}
          border="1px solid"
          borderColor="whiteAlpha.100"
        >
          <Text color="gray.300" fontSize="sm" textAlign="center">
            {isArabic 
              ? "كل حصة لها هدف واضح. لا وقت ضائع." 
              : "Every session has a clear goal. No wasted time."}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
