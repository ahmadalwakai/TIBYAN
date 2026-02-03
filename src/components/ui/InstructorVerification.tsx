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
      bg="#050505"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.3)"
      p={{ base: 6, md: 8 }}
      boxShadow="0 0 30px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
      transition="all 0.3s ease"
      _hover={{
        boxShadow: "0 0 40px rgba(0, 255, 42, 0.4), inset 0 0 30px rgba(0, 255, 42, 0.08)",
        borderColor: "rgba(0, 255, 42, 0.5)",
      }}
    >
      <Stack gap={6}>
        {/* Header */}
        <Flex align="center" gap={3}>
          <Box
            w="60px"
            h="60px"
            borderRadius="full"
            bg="#0A0A0A"
            border="2px solid"
            borderColor="rgba(0, 255, 42, 0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="2xl"
            boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
          >
            👨‍🏫
          </Box>
          <Box>
            <Heading size="lg" color="white">
              هيئة تدريس مؤهلة ومعتمدة
            </Heading>
            <Text fontSize="sm" color="gray.400" mt={1}>
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
              bg="#0A0A0A"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.2)"
              p={4}
              transition="all 0.2s ease"
              _hover={{
                borderColor: "rgba(0, 255, 42, 0.5)",
                transform: "translateY(-2px)",
                boxShadow: "0 0 20px rgba(0, 255, 42, 0.2)",
              }}
            >
              <Stack gap={2}>
                <Flex align="center" gap={2}>
                  <Box
                    w="45px"
                    h="45px"
                    borderRadius="full"
                    bg="#050505"
                    border="2px solid"
                    borderColor="rgba(0, 255, 42, 0.4)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xl"
                    boxShadow="0 0 10px rgba(0, 255, 42, 0.2)"
                  >
                    {instructor.icon}
                  </Box>
                  <Box>
                    <Text fontSize="md" fontWeight="700" color="white">
                      {instructor.name}
                    </Text>
                    <Badge
                      bg="#0A0A0A"
                      color="#00FF2A"
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.3)"
                    >
                      {instructor.specialization}
                    </Badge>
                  </Box>
                </Flex>
                <Text fontSize="sm" color="gray.400">
                  {instructor.credentials}
                </Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Link to full faculty page */}
        <Box pt={2}>
          <Text fontSize="sm" color="gray.400" textAlign="center">
            <Link href="/instructors" style={{ color: "#00FF2A", fontWeight: 600 }}>
              عرض جميع أعضاء هيئة التدريس ←
            </Link>
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
