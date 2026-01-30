"use client";

import {
  Badge,
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
import PremiumCard from "@/components/ui/PremiumCard";

interface CourseData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  totalSessions: number;
  monthlyPayment: number;
  level: string;
  subjects: string[];
  objectives: string[];
}

export default function CoursePageClient({ course }: { course: CourseData }) {
  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <Stack gap={8}>
          {/* Back Button */}
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">→ العودة للدورات</Link>
          </Button>

          {/* Header */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
            {/* Course Info */}
            <Stack gap={6}>
              <Stack gap={3}>
                <Badge colorPalette="brand" fontSize="sm" w="fit-content">
                  {course.level}
                </Badge>
                <Heading size="2xl" color="text" lineHeight="1.3">
                  {course.name}
                </Heading>
                <Text fontSize="lg" color="muted" lineHeight="1.8">
                  {course.description}
                </Text>
              </Stack>

              {/* Stats */}
              <Flex gap={6} wrap="wrap">
                <Stack gap={0}>
                  <Text fontSize="2xl" fontWeight="700" color="brand.500">
                    {course.totalSessions}
                  </Text>
                  <Text fontSize="sm" color="muted">حصة</Text>
                </Stack>
                <Stack gap={0}>
                  <Text fontSize="2xl" fontWeight="700" color="brand.500">
                    {course.duration}
                  </Text>
                  <Text fontSize="sm" color="muted">مدة البرنامج</Text>
                </Stack>
                <Stack gap={0}>
                  <Text fontSize="2xl" fontWeight="700" color="brand.500">
                    {course.subjects.length}
                  </Text>
                  <Text fontSize="sm" color="muted">مادة علمية</Text>
                </Stack>
              </Flex>
            </Stack>

            {/* Pricing Card */}
            <PremiumCard p={6} bg="white">
              <Stack gap={5}>
                <Stack gap={2}>
                  <Text fontSize="sm" color="muted">سعر البرنامج الكامل</Text>
                  <Flex align="baseline" gap={2}>
                    <Text fontSize="4xl" fontWeight="800" color="brand.900">
                      {course.price}
                    </Text>
                    <Text fontSize="lg" color="muted">{course.currency}</Text>
                  </Flex>
                  <Text fontSize="sm" color="green.600">
                    أو {course.monthlyPayment} {course.currency} شهرياً
                  </Text>
                </Stack>

                <Stack gap={3}>
                  <Button
                    asChild
                    bg="brand.900"
                    color="white"
                    size="lg"
                    fontSize="md"
                    fontWeight="700"
                    w="100%"
                    py={6}
                    _hover={{ bg: "brand.700" }}
                  >
                    <Link href={`/checkout/${course.slug}`}>سجّل الآن 🚀</Link>
                  </Button>
                  <Text fontSize="xs" color="muted" textAlign="center">
                    ضمان استرداد الأموال خلال 14 يوم
                  </Text>
                </Stack>

                <Stack gap={2} pt={3} borderTop="1px solid" borderColor="gray.100">
                  <Flex gap={2} align="center">
                    <Text>✓</Text>
                    <Text fontSize="sm" color="text">وصول كامل لجميع المواد</Text>
                  </Flex>
                  <Flex gap={2} align="center">
                    <Text>✓</Text>
                    <Text fontSize="sm" color="text">شهادة إتمام معتمدة</Text>
                  </Flex>
                  <Flex gap={2} align="center">
                    <Text>✓</Text>
                    <Text fontSize="sm" color="text">دعم مباشر من المدرسين</Text>
                  </Flex>
                  <Flex gap={2} align="center">
                    <Text>✓</Text>
                    <Text fontSize="sm" color="text">مجتمع طلاب تفاعلي</Text>
                  </Flex>
                </Stack>
              </Stack>
            </PremiumCard>
          </SimpleGrid>

          {/* Subjects */}
          <PremiumCard p={{ base: 6, md: 8 }}>
            <Stack gap={6}>
              <Heading size="lg" color="text">المواد العلمية 📚</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {course.subjects.map((subject, index) => {
                  const [title, ...descParts] = subject.split(' - ');
                  const desc = descParts.join(' - ');
                  return (
                    <PremiumCard key={index} p={4} variant="bordered">
                      <Stack gap={2}>
                        <Text fontWeight="700" color="text">{title}</Text>
                        {desc && (
                          <Text fontSize="sm" color="muted" lineHeight="1.7">
                            {desc}
                          </Text>
                        )}
                      </Stack>
                    </PremiumCard>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </PremiumCard>

          {/* Objectives */}
          <PremiumCard p={{ base: 6, md: 8 }}>
            <Stack gap={6}>
              <Heading size="lg" color="text">أهداف البرنامج 🎯</Heading>
              <Stack gap={4}>
                {course.objectives.map((objective, index) => {
                  const [title, ...descParts] = objective.split(': ');
                  const desc = descParts.join(': ');
                  return (
                    <Flex key={index} gap={3} align="start">
                      <Box
                        bg="brand.100"
                        color="brand.700"
                        borderRadius="full"
                        w={8}
                        h={8}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="700"
                        flexShrink={0}
                      >
                        {index + 1}
                      </Box>
                      <Stack gap={1}>
                        <Text fontWeight="600" color="text">{title}</Text>
                        {desc && (
                          <Text fontSize="sm" color="muted" lineHeight="1.7">
                            {desc}
                          </Text>
                        )}
                      </Stack>
                    </Flex>
                  );
                })}
              </Stack>
            </Stack>
          </PremiumCard>

          {/* CTA */}
          <PremiumCard p={{ base: 6, md: 8 }} bg="brand.900">
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align="center"
              gap={6}
            >
              <Stack gap={2}>
                <Heading size="lg" color="white">
                  جاهز لبدء رحلتك العلمية؟ 🌟
                </Heading>
                <Text color="whiteAlpha.800">
                  انضم إلى آلاف الطلاب واستثمر في نفسك
                </Text>
              </Stack>
              <Button
                asChild
                bg="white"
                color="brand.900"
                size="lg"
                px={8}
                fontWeight="700"
                _hover={{ bg: "gray.100" }}
              >
                <Link href={`/checkout/${course.slug}`}>سجّل الآن</Link>
              </Button>
            </Flex>
          </PremiumCard>
        </Stack>
      </Container>
    </Box>
  );
}
