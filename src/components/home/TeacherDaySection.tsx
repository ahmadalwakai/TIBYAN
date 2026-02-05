"use client";

import { Box, Heading, Stack, Text, Flex } from "@chakra-ui/react";
import { useLocale } from "next-intl";
import { teacherDayTimeline } from "@/config/academyActivity";

/**
 * TeacherDaySection
 * 
 * Shows what a real teacher's day looks like.
 * This section must feel human, not promotional.
 */
export default function TeacherDaySection() {
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
            {isArabic ? "يوم المعلم الحقيقي" : "A Real Teacher's Day"}
          </Heading>
          
          <Text color="gray.400" fontSize="md">
            {isArabic 
              ? "ماذا يفعل معلمونا فعلياً خلال يوم العمل" 
              : "What our teachers actually do during a work day"}
          </Text>
        </Stack>

        {/* Timeline */}
        <Box position="relative">
          {/* Vertical line */}
          <Box
            position="absolute"
            top={0}
            bottom={0}
            left={{ base: "28px", md: "40px" }}
            w="2px"
            bg="whiteAlpha.200"
          />

          <Stack gap={0}>
            {teacherDayTimeline.map((item, index) => (
              <Flex
                key={index}
                align="flex-start"
                gap={{ base: 4, md: 6 }}
                py={4}
                position="relative"
              >
                {/* Time dot */}
                <Box
                  position="relative"
                  zIndex={1}
                  minW={{ base: "56px", md: "80px" }}
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Text
                    color="gray.500"
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="600"
                    fontFamily="monospace"
                    minW={{ base: "40px", md: "50px" }}
                  >
                    {item.time}
                  </Text>
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg="#050505"
                    border="3px solid"
                    borderColor={index === 0 ? "green.400" : "gray.600"}
                    flexShrink={0}
                  />
                </Box>

                {/* Activity */}
                <Box
                  flex={1}
                  bg="whiteAlpha.50"
                  borderRadius="lg"
                  p={4}
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  transition="all 0.2s"
                  _hover={{
                    bg: "whiteAlpha.100",
                    borderColor: "whiteAlpha.200",
                  }}
                >
                  <Text color="gray.200" fontSize={{ base: "sm", md: "md" }} lineHeight="1.7">
                    {isArabic ? item.activityAr : item.activityEn}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Stack>
        </Box>

        {/* Human note */}
        <Text color="gray.500" fontSize="sm" fontStyle="italic" textAlign="center">
          {isArabic 
            ? "التدريس ليس مجرد إلقاء محاضرات — إنه متابعة وتحضير وتواصل" 
            : "Teaching isn't just delivering lectures — it's follow-up, preparation, and communication"}
        </Text>
      </Stack>
    </Box>
  );
}
