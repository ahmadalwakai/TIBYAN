"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";

interface CurriculumModule {
  title: string;
  description: string;
  duration: string;
  icon: string;
}

const curriculumModules: CurriculumModule[] = [
  {
    title: "التفسير الموضوعي",
    description: "دراسة أشهر سور القرآن الكريم بمنهجية مبتكرة لتبيان أحكام وعلوم القرآن مع إبراز أساليب المعاني والبلاغة.",
    duration: "٨ أسابيع",
    icon: "📖",
  },
  {
    title: "علم التجويد",
    description: "أحكام علم التجويد من الأحكام الأساسية في القرآن الكريم، يُدرس بشكل تطبيقي وعملي.",
    duration: "٦ أسابيع",
    icon: "🎵",
  },
  {
    title: "العقيدة والفقه",
    description: "أصول العلم والمعرفة، أحكام وأدلة التوحيد، ودراسة فقه العبادات بشكل نظري تطبيقي.",
    duration: "١٠ أسابيع",
    icon: "⚖️",
  },
  {
    title: "النحو والصرف",
    description: "علامات الإعراب، مباحث المرفوعات والمنصوبات والمجرورات، مع مباحث مختارة في علم الصرف.",
    duration: "٨ أسابيع",
    icon: "✍️",
  },
];

interface CurriculumOutcomesProps {
  programName?: string;
}

export default function CurriculumOutcomes({ programName = "السنة التمهيدية" }: CurriculumOutcomesProps) {
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
            📚 المنهج الدراسي - {programName}
          </Heading>
          <Text fontSize="sm" color="muted" mt={2}>
            منهج متكامل مصمم لتحقيق نتائج تعليمية واضحة وقابلة للقياس
          </Text>
        </Box>

        {/* Learning Outcomes */}
        <Box borderRadius="xl" bg="backgroundAlt" p={5} border="1px solid" borderColor="border">
          <Heading size="md" color="text" mb={3}>
            🎯 النتائج التعليمية المتوقعة
          </Heading>
          <Stack gap={2}>
            {[
              "إتقان قراءة القرآن الكريم بأحكام التجويد الصحيحة",
              "فهم أساسيات العقيدة الإسلامية والفقه العملي",
              "القدرة على تحليل النصوص الشرعية بشكل دقيق",
              "تطوير المهارات اللغوية في النحو والصرف والبلاغة",
            ].map((outcome, idx) => (
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
            📋 المواد الدراسية
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
                    {module.title}
                  </Text>
                  <Text fontSize="xs" color="muted" mr="auto">
                    {module.duration}
                  </Text>
                </Box>
                <Text fontSize="sm" color="textBody" lineHeight="1.7">
                  {module.description}
                </Text>
              </Stack>
            </Box>
          ))}
        </Stack>

        {/* Download Syllabus CTA */}
        <Box textAlign="center" pt={2}>
          <Text fontSize="sm" color="muted">
            <a href="/syllabus.pdf" style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }} download>
              📥 تحميل المنهج الكامل (PDF)
            </a>
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
