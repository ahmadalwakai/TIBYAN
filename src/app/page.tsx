"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ThisWeekSection,
  RealLessonSection,
  TeacherDaySection,
  CurrentScheduleSection,
  TrustStatementSection,
} from "@/components/home";

/**
 * Homepage - Living Academy Version
 * 
 * This homepage answers ONE question:
 * "What is happening in the academy right now?"
 * 
 * Section order:
 * 1. Hero (minimal, honest)
 * 2. This Week at the Academy (MOST IMPORTANT)
 * 3. How a Real Lesson Works
 * 4. A Real Teacher's Day
 * 5. Current Schedule
 * 6. Trust Statement (one real fact)
 * 7. Simple CTA
 */
export default function Home() {
  const t = useTranslations("home");
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <Box as="main" bg="black" minH="100vh">
      {/* ========================================
          SECTION 1: HERO (Minimal, Honest)
          ======================================== */}
      <Box
        position="relative"
        minH={{ base: "60vh", md: "70vh" }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        {/* Simple gradient background */}
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, #000000 0%, #050505 50%, #0a0a0a 100%)"
        />
        
        {/* Subtle decorative element */}
        <Box
          position="absolute"
          top="20%"
          left="50%"
          transform="translateX(-50%)"
          w={{ base: "300px", md: "500px" }}
          h={{ base: "300px", md: "500px" }}
          borderRadius="full"
          bg="radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)"
          filter="blur(60px)"
          pointerEvents="none"
        />

        {/* Hero Content */}
        <Container maxW="4xl" position="relative" zIndex={1} px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 6, md: 8 }} textAlign="center" align="center">
            {/* Academy Name */}
            <Heading
              as="h1"
              fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
              fontWeight="900"
              fontFamily="var(--font-ibm-plex)"
              color="white"
              letterSpacing="-0.02em"
            >
              {isArabic ? "أكاديمية تِبيان" : "Tibyan Academy"}
            </Heading>

            {/* One realistic sentence - NO marketing */}
            <Text
              color="gray.300"
              fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
              maxW="700px"
              lineHeight="1.8"
            >
              {isArabic
                ? "حصص قراءة عربية أونلاين مع معلمين حقيقيين وتقدّم ملموس"
                : "Online Arabic reading classes with real teachers and real progress"}
            </Text>

            {/* Single Primary Action */}
            <Button
              asChild
              size="lg"
              bg="green.500"
              color="white"
              px={{ base: 8, md: 12 }}
              h={{ base: "56px", md: "64px" }}
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="700"
              borderRadius="xl"
              _hover={{
                bg: "green.400",
                transform: "translateY(-2px)",
              }}
              transition="all 0.2s"
            >
              <Link href="/courses">
                {isArabic ? "عرض الحصص الحالية" : "View Current Classes"}
              </Link>
            </Button>
          </Stack>
        </Container>

        {/* Scroll hint */}
        <Box
          position="absolute"
          bottom={8}
          left="50%"
          transform="translateX(-50%)"
        >
          <Box
            as="button"
            onClick={() => {
              document.getElementById("this-week")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            color="gray.500"
            fontSize="sm"
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: "gray.300" }}
          >
            <Text>{isArabic ? "اكتشف المزيد" : "Learn more"}</Text>
            <Text fontSize="lg">↓</Text>
          </Box>
        </Box>
      </Box>

      {/* ========================================
          MAIN CONTENT SECTIONS
          ======================================== */}
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 4, md: 8 }}>
        <Stack gap={{ base: 12, md: 16 }}>
          
          {/* ========================================
              SECTION 2: THIS WEEK (MOST IMPORTANT)
              ======================================== */}
          <Box id="this-week">
            <ThisWeekSection />
          </Box>

          {/* ========================================
              SECTION 3 & 4: Two-column layout
              How a Lesson Works + Teacher's Day
              ======================================== */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 8, md: 10 }}>
            <RealLessonSection />
            <TeacherDaySection />
          </SimpleGrid>

          {/* ========================================
              SECTION 5: CURRENT SCHEDULE
              ======================================== */}
          <CurrentScheduleSection />

          {/* ========================================
              SECTION 6: TRUST STATEMENT
              ======================================== */}
          <TrustStatementSection />

          {/* ========================================
              SECTION 7: SIMPLE CTA
              ======================================== */}
          <Box
            bg="#050505"
            borderRadius="2xl"
            border="1px solid"
            borderColor="whiteAlpha.200"
            p={{ base: 8, md: 12 }}
            textAlign="center"
          >
            <Stack gap={6} align="center">
              <Heading
                as="h2"
                size={{ base: "lg", md: "xl" }}
                color="white"
                fontFamily="var(--font-ibm-plex)"
              >
                {isArabic ? "هل تريد تجربة حصة؟" : "Want to try a class?"}
              </Heading>
              
              <Text color="gray.400" fontSize="md" maxW="500px">
                {isArabic
                  ? "تواصل معنا لحجز حصة تجريبية مجانية ومعرفة المستوى المناسب"
                  : "Contact us to book a free trial class and find the right level"}
              </Text>

              <Flex
                gap={4}
                direction={{ base: "column", sm: "row" }}
                w={{ base: "100%", sm: "auto" }}
              >
                <Button
                  asChild
                  size="lg"
                  bg="green.500"
                  color="white"
                  px={8}
                  fontWeight="700"
                  borderRadius="xl"
                  _hover={{
                    bg: "green.400",
                    transform: "translateY(-2px)",
                  }}
                  transition="all 0.2s"
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Link href="/assessment">
                    {isArabic ? "ابدأ التقييم المجاني" : "Start Free Assessment"}
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  borderColor="whiteAlpha.300"
                  color="white"
                  px={8}
                  fontWeight="600"
                  borderRadius="xl"
                  _hover={{
                    bg: "whiteAlpha.100",
                    borderColor: "whiteAlpha.500",
                  }}
                  transition="all 0.2s"
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Link href="/help">
                    {isArabic ? "تواصل معنا" : "Contact Us"}
                  </Link>
                </Button>
              </Flex>
            </Stack>
          </Box>

        </Stack>
      </Container>
    </Box>
  );
}
