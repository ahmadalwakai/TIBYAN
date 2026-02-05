"use client";

import { Box, Heading, SimpleGrid, Stack, Text, Badge, Flex } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface InstructorProfile {
  nameAr: string;
  nameEn: string;
  specializationAr: string;
  specializationEn: string;
  credentialsAr: string;
  credentialsEn: string;
  icon: string;
}

const instructors: InstructorProfile[] = [
  {
    nameAr: "د. محمد أيوب يحيى العلي",
    nameEn: "Dr. Mohammed Ayoub Yahya Al-Ali",
    specializationAr: "التفسير وعلوم القرآن",
    specializationEn: "Tafsir and Quranic Sciences",
    credentialsAr: "دكتوراه في التفسير - جامعة الأزهر",
    credentialsEn: "PhD in Tafsir - Al-Azhar University",
    icon: "🎓",
  },
  {
    nameAr: "أ. نسرين صالح الموسى",
    nameEn: "Prof. Nesreen Saleh Al-Mousa",
    specializationAr: "اللغة العربية والنحو",
    specializationEn: "Arabic Language and Grammar",
    credentialsAr: "ماجستير في اللغة العربية - جامعة دمشق",
    credentialsEn: "Master's in Arabic Language - Damascus University",
    icon: "📚",
  },
  {
    nameAr: "د. جهادية الخليف",
    nameEn: "Dr. Jihadiya Al-Khalif",
    specializationAr: "الفقه وأصوله",
    specializationEn: "Fiqh and Usul",
    credentialsAr: "دكتوراه في الفقه - جامعة الإمام محمد بن سعود",
    credentialsEn: "PhD in Fiqh - Imam Muhammad ibn Saud University",
    icon: "⚖️",
  },
  {
    nameAr: "أ. هناء فوزي النوري",
    nameEn: "Prof. Hanaa Fawzi Al-Nouri",
    specializationAr: "العقيدة والسيرة النبوية",
    specializationEn: "Aqidah and Prophetic Biography",
    credentialsAr: "ماجستير في العقيدة - جامعة الشام",
    credentialsEn: "Master's in Aqidah - Damascus University",
    icon: "🕌",
  },
];

export default function InstructorVerification() {
  const t = useTranslations("ui.instructorVerification");
  const locale = useLocale();
  const isArabic = locale === "ar";

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
              {t("title")}
            </Heading>
            <Text fontSize="sm" color="gray.400" mt={1}>
              {t("subtitle")}
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
                      {isArabic ? instructor.nameAr : instructor.nameEn}
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
                      {isArabic ? instructor.specializationAr : instructor.specializationEn}
                    </Badge>
                  </Box>
                </Flex>
                <Text fontSize="sm" color="gray.400">
                  {isArabic ? instructor.credentialsAr : instructor.credentialsEn}
                </Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Link to full faculty page */}
        <Box pt={2}>
          <Text fontSize="sm" color="gray.400" textAlign="center">
            <Link href="/instructors" style={{ color: "#00FF2A", fontWeight: 600 }}>
              {t("viewAll")}
            </Link>
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
