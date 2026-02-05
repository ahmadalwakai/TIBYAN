"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useTranslations, useLocale } from "next-intl";

interface CurriculumModule {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationAr: string;
  durationEn: string;
  icon: string;
}

const curriculumModules: CurriculumModule[] = [
  {
    titleAr: "التفسير الموضوعي",
    titleEn: "Thematic Tafsir",
    descriptionAr: "دراسة أشهر سور القرآن الكريم بمنهجية مبتكرة لتبيان أحكام وعلوم القرآن مع إبراز أساليب المعاني والبلاغة.",
    descriptionEn: "Study of famous Quranic chapters with an innovative methodology to explain rulings and sciences of the Quran while highlighting meaning and rhetoric.",
    durationAr: "٨ أسابيع",
    durationEn: "8 weeks",
    icon: "📖",
  },
  {
    titleAr: "علم التجويد",
    titleEn: "Tajweed Science",
    descriptionAr: "أحكام علم التجويد من الأحكام الأساسية في القرآن الكريم، يُدرس بشكل تطبيقي وعملي.",
    descriptionEn: "Tajweed rules are fundamental in Quran recitation, taught in a practical and applied manner.",
    durationAr: "٦ أسابيع",
    durationEn: "6 weeks",
    icon: "🎵",
  },
  {
    titleAr: "العقيدة والفقه",
    titleEn: "Creed and Jurisprudence",
    descriptionAr: "أصول العلم والمعرفة، أحكام وأدلة التوحيد، ودراسة فقه العبادات بشكل نظري تطبيقي.",
    descriptionEn: "Foundations of knowledge, principles and evidences of monotheism, and practical study of worship jurisprudence.",
    durationAr: "١٠ أسابيع",
    durationEn: "10 weeks",
    icon: "⚖️",
  },
  {
    titleAr: "النحو والصرف",
    titleEn: "Grammar and Morphology",
    descriptionAr: "علامات الإعراب، مباحث المرفوعات والمنصوبات والمجرورات، مع مباحث مختارة في علم الصرف.",
    descriptionEn: "Grammatical signs, studies of nominative, accusative and genitive cases, with selected morphology topics.",
    durationAr: "٨ أسابيع",
    durationEn: "8 weeks",
    icon: "✍️",
  },
];

interface CurriculumOutcomesProps {
  programName?: string;
}

export default function CurriculumOutcomes({ programName }: CurriculumOutcomesProps) {
  const t = useTranslations("ui.curriculum");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const defaultProgramName = isArabic ? "السنة التمهيدية" : "Preparatory Year";
  
  return (
    <Box
      borderRadius="2xl"
      bg="surface"
      border="1px solid"
      borderColor="border"
      p={{ base: 6, md: 8 }}
      boxShadow="card"
    >
      <Stack gap={6}>
        {/* Header */}
        <Box>
          <Heading size="lg" color="text">
            📚 {t("title")} - {programName || defaultProgramName}
          </Heading>
          <Text fontSize="sm" color="muted" mt={2}>
            {t("subtitle")}
          </Text>
        </Box>

        {/* Learning Outcomes */}
        <Box borderRadius="xl" bg="backgroundAlt" p={5} border="1px solid" borderColor="border">
          <Heading size="md" color="text" mb={3}>
            🎯 {t("expectedOutcomes")}
          </Heading>
          <Stack gap={2}>
            {[t("outcome1"), t("outcome2"), t("outcome3"), t("outcome4")].map((outcome, idx) => (
              <Box key={idx} display="flex" alignItems="start" gap={2}>
                <Text color="success" fontSize="lg">✓</Text>
                <Text fontSize="sm" color="textBody" flex={1}>
                  {outcome}
                </Text>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Curriculum Modules */}
        <Stack gap={3}>
          <Heading size="md" color="text">
            📋 {t("subjects")}
          </Heading>
          {curriculumModules.map((module, idx) => (
            <Box
              key={idx}
              borderRadius="lg"
              bg="backgroundAlt"
              border="1px solid"
              borderColor="border"
              p={4}
              transition="all 0.2s ease"
              _hover={{
                borderColor: "borderAccent",
                transform: "translateX(-4px)",
              }}
            >
              <Stack gap={1}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Text fontSize="xl">{module.icon}</Text>
                  <Text fontSize="md" fontWeight="700" color="text">
                    {isArabic ? module.titleAr : module.titleEn}
                  </Text>
                  <Text fontSize="xs" color="muted" mr="auto">
                    {isArabic ? module.durationAr : module.durationEn}
                  </Text>
                </Box>
                <Text fontSize="sm" color="textBody" lineHeight="1.7">
                  {isArabic ? module.descriptionAr : module.descriptionEn}
                </Text>
              </Stack>
            </Box>
          ))}
        </Stack>

        {/* Download Syllabus CTA */}
        <Box textAlign="center" pt={2}>
          <Text fontSize="sm" color="muted">
            <a href="/syllabus.pdf" style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }} download>
              {t("downloadSyllabus")}
            </a>
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
