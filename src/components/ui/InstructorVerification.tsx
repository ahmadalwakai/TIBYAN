"use client";

import { Box, Heading, SimpleGrid, Stack, Text, Badge, Flex } from "@chakra-ui/react";
import Link from "next/link";

interface InstructorProfile {
  name: string;
  specialization: string;
  credentials: string;
  icon: string;
}

const instructors: InstructorProfile[] = [
  {
    name: "د. محمد أيوب يحيى العلي",
    specialization: "التفسير وعلوم القرآن",
    credentials: "دكتوراه في التفسير - جامعة الأزهر",
    icon: "🎓",
  },
  {
    name: "أ. نسرين صالح الموسى",
    specialization: "اللغة العربية والنحو",
    credentials: "ماجستير في اللغة العربية - جامعة دمشق",
    icon: "📚",
  },
  {
    name: "د. جهادية الخليف",
    specialization: "الفقه وأصوله",
    credentials: "دكتوراه في الفقه - جامعة الإمام محمد بن سعود",
    icon: "⚖️",
  },
  {
    name: "أ. هناء فوزي النوري",
    specialization: "العقيدة والسيرة النبوية",
    credentials: "ماجستير في العقيدة - جامعة الشام",
    icon: "🕌",
  },
];

export default function InstructorVerification() {
  return (
    <Box
      borderRadius="2xl"
      bg="surface"
      border="1px solid"
      borderColor="border"
      p={{ base: 6, md: 8 }}
      boxShadow="card"
      transition="all 0.3s ease"
      _hover={{
        boxShadow: "cardHover",
        borderColor: "borderAccent",
      }}
    >
      <Stack gap={6}>
        {/* Header */}
        <Flex align="center" gap={3}>
          <Text fontSize="3xl">👨‍🏫</Text>
          <Box>
            <Heading size="lg" color="text">
              هيئة تدريس مؤهلة ومعتمدة
            </Heading>
            <Text fontSize="sm" color="muted" mt={1}>
              جميع مدرسينا حاصلون على شهادات علمية متخصصة وخبرة تدريسية مثبتة
            </Text>
          </Box>
        </Flex>

        {/* Instructors Grid */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {instructors.map((instructor, idx) => (
            <Box
              key={idx}
              borderRadius="xl"
              bg="backgroundAlt"
              border="1px solid"
              borderColor="border"
              p={4}
              transition="all 0.2s ease"
              _hover={{
                borderColor: "borderAccent",
                transform: "translateY(-2px)",
              }}
            >
              <Stack gap={2}>
                <Flex align="center" gap={2}>
                  <Text fontSize="2xl">{instructor.icon}</Text>
                  <Box>
                    <Text fontSize="md" fontWeight="700" color="text">
                      {instructor.name}
                    </Text>
                    <Badge colorScheme="blue" size="sm">
                      {instructor.specialization}
                    </Badge>
                  </Box>
                </Flex>
                <Text fontSize="sm" color="muted">
                  {instructor.credentials}
                </Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Link to full faculty page */}
        <Box pt={2}>
          <Text fontSize="sm" color="muted" textAlign="center">
            <Link href="/instructors" style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }}>
              عرض جميع أعضاء هيئة التدريس ←
            </Link>
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
