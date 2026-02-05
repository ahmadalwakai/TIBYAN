"use client";

import {
  Accordion,
  Badge,
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";

// ============================================================================
// CONSTANTS
// ============================================================================
const NEON_GREEN = "#00FF2A";

const programMeta = {
  academyNameAr: "أكاديمية تِبيان التعليمية",
  academyNameEn: "TIBYAN EDUCATIONAL ACADEMY",
  titleAr: "برنامج تعليم القراءة العربية – المنهج الرشيدي",
  titleEn: "Arabic Reading Program – Al-Rashidi Method",
  delivery: "أونلاين عبر برنامج زوم",
  totalSessions: 36,
  sessionDuration: "40 دقيقة",
  weeklySessionsMin: 3,
  weeklySessionsMax: 5,
  durationMin: "شهرين",
  durationMax: "3 أشهر",
};

const objectives = [
  "تعليم قراءة اللغة العربية بطريقة علمية منهجية",
  "تأسيس القدرة على التعلم الذاتي في القراءة",
  "ضبط النطق وإتقان التجويد الأساسي",
  "بناء ثروة لغوية متينة من البداية",
];

const phases = [
  {
    title: "المرحلة الأولى – الحروف المفردة",
    sessions: 7,
    pages: "ص1 – ص9",
    details: [
      "حصة 1: حروف (أ – ب – ت – ث – ج)",
      "حصة 2: حروف (ح – خ – د – ذ – ر)",
      "حصة 3: حروف (ز – س – ش – ص – ض)",
      "حصة 4: حروف (ط – ظ – ع – غ – ف)",
      "حصة 5: حروف (ق – ك – ل – م – ن)",
      "حصة 6: حروف (هـ – و – ي) + مراجعة شاملة",
      "حصة 7: تقييم المرحلة الأولى",
    ],
  },
  {
    title: "المرحلة الثانية – الحركات والمدود والتنوين",
    sessions: 12,
    pages: "ص10 – ص38",
    details: [
      "حصة 8: الفتحة (ص10–11)",
      "حصة 9: الكسرة (ص12–13)",
      "حصة 10: الضمة (ص14–15)",
      "حصة 11: مراجعة الحركات الثلاث (ص16–17)",
      "حصة 12: السكون (ص18–20)",
      "حصة 13: الشدة (ص21–23)",
      "حصة 14: مراجعة السكون والشدة",
      "حصة 15: المد بالألف (ص24–27)",
      "حصة 16: المد بالياء (ص28–30)",
      "حصة 17: المد بالواو (ص31–33)",
      "حصة 18: التنوين بأنواعه (ص34–38)",
      "حصة 19: تقييم المرحلة الثانية",
    ],
  },
  {
    title: "المرحلة الثالثة – اللام الشمسية والقمرية",
    sessions: 5,
    pages: "ص39 – ص51",
    details: [
      "حصة 20: اللام الشمسية (ص39–42)",
      "حصة 21: اللام القمرية (ص43–46)",
      "حصة 22: التمييز بين اللامين (ص47–49)",
      "حصة 23: تدريبات شاملة (ص50–51)",
      "حصة 24: تقييم المرحلة الثالثة",
    ],
  },
  {
    title: "المرحلة الرابعة – قراءة الكلمات والجمل",
    sessions: 8,
    pages: "ص52 – ص70",
    details: [
      "حصة 25: كلمات ثلاثية (ص52–54)",
      "حصة 26: كلمات رباعية (ص55–57)",
      "حصة 27: كلمات خماسية فأكثر (ص58–60)",
      "حصة 28: جمل قصيرة (ص61–63)",
      "حصة 29: جمل متوسطة (ص64–66)",
      "حصة 30: فقرات قصيرة (ص67–68)",
      "حصة 31: تدريبات قرائية متنوعة (ص69–70)",
      "حصة 32: تقييم المرحلة الرابعة",
    ],
  },
  {
    title: "المرحلة الخامسة – المراجعة والتقييم النهائي",
    sessions: 4,
    pages: "مراجعة شاملة",
    details: [
      "حصة 33: مراجعة المرحلة الأولى والثانية",
      "حصة 34: مراجعة المرحلة الثالثة والرابعة",
      "حصة 35: تدريب على القراءة الجهرية المتصلة",
      "حصة 36: التقييم النهائي الشامل",
    ],
  },
];

const assessmentCriteria = [
  { label: "صحة نطق الحروف والكلمات", weight: "30%" },
  { label: "إتقان الحركات والمدود", weight: "25%" },
  { label: "التمييز بين اللام الشمسية والقمرية", weight: "15%" },
  { label: "طلاقة القراءة وسرعتها", weight: "20%" },
  { label: "المشاركة والالتزام", weight: "10%" },
];

const organizationalNotes = [
  "يُمنح الطالب شهادة إتمام بعد اجتياز التقييم النهائي بنسبة 70% فأعلى.",
  "يُتابَع كل طالب بملف تقييم فردي طوال البرنامج.",
  "يُنصَح الطالب بالمراجعة اليومية لمدة 15 دقيقة على الأقل.",
  "تُتاح للطالب إعادة الاختبار مرة واحدة عند الحاجة.",
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function ArabicReadingClient() {
  return (
    <Box
      as="main"
      bg="#000000"
      minH="100vh"
      position="relative"
      overflow="hidden"
    >
      {/* Background Orbs */}
      <Box
        position="absolute"
        top="-15%"
        right="-10%"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        filter="blur(80px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-10%"
        left="-5%"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(80px)"
        pointerEvents="none"
      />

      <Container maxW="5xl" py={{ base: 12, md: 20 }} px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
        {/* ====================== HERO SECTION ====================== */}
        <motion.div {...fadeInUp}>
          <Stack
            gap={6}
            textAlign="center"
            p={{ base: 6, md: 10 }}
            borderRadius="2xl"
            bg="#050505"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 40px rgba(0, 255, 42, 0.2)"
            mb={12}
          >
            {/* Academy Names */}
            <Stack gap={1}>
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                fontWeight="700"
                color={NEON_GREEN}
                dir="rtl"
              >
                {programMeta.academyNameAr}
              </Text>
              <Text
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="600"
                color="gray.400"
                letterSpacing="wider"
                dir="ltr"
              >
                {programMeta.academyNameEn}
              </Text>
            </Stack>

            {/* Program Titles */}
            <Stack gap={2}>
              <Heading
                as="h1"
                fontSize={{ base: "2xl", md: "4xl" }}
                fontWeight="800"
                color="white"
                dir="rtl"
              >
                {programMeta.titleAr}
              </Heading>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                color="gray.300"
                dir="ltr"
              >
                {programMeta.titleEn}
              </Text>
            </Stack>

            {/* Program Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} pt={4}>
              <StatBox label="طريقة التقديم" value={programMeta.delivery} />
              <StatBox label="عدد الحصص" value={`${programMeta.totalSessions} حصة`} />
              <StatBox label="مدة الحصة" value={programMeta.sessionDuration} />
              <StatBox
                label="حصص أسبوعياً"
                value={`${programMeta.weeklySessionsMin}–${programMeta.weeklySessionsMax}`}
              />
            </SimpleGrid>

            <Badge
              alignSelf="center"
              bg="rgba(0, 255, 42, 0.15)"
              color={NEON_GREEN}
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
            >
              المدة الكلية: {programMeta.durationMin} إلى {programMeta.durationMax}
            </Badge>
          </Stack>
        </motion.div>

        {/* ====================== OBJECTIVES ====================== */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <SectionCard title="أهداف البرنامج" icon="🎯">
            <Stack gap={3} dir="rtl">
              {objectives.map((obj, i) => (
                <Box
                  key={i}
                  display="flex"
                  alignItems="flex-start"
                  gap={3}
                  p={3}
                  borderRadius="lg"
                  bg="rgba(0, 255, 42, 0.05)"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.1)"
                >
                  <Text color={NEON_GREEN} fontWeight="700" fontSize="lg">
                    {i + 1}.
                  </Text>
                  <Text color="gray.200" fontSize="md">
                    {obj}
                  </Text>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </motion.div>

        {/* ====================== CURRICULUM BREAKDOWN ====================== */}
        <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
          <SectionCard title="تفصيل المنهج الدراسي" icon="📚">
            <Accordion.Root collapsible defaultValue={["phase-0"]}>
              {phases.map((phase, idx) => (
                <Accordion.Item key={idx} value={`phase-${idx}`}>
                  <Accordion.ItemTrigger
                    cursor="pointer"
                    p={4}
                    borderRadius="lg"
                    bg="#0A0A0A"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.2)"
                    mb={2}
                    _hover={{ borderColor: NEON_GREEN }}
                    transition="all 0.2s"
                  >
                    <Box flex="1" textAlign="right" dir="rtl">
                      <Text fontWeight="700" color="white" fontSize="md">
                        {phase.title}
                      </Text>
                      <Text fontSize="sm" color="gray.400" mt={1}>
                        {phase.sessions} حصص • {phase.pages}
                      </Text>
                    </Box>
                    <Accordion.ItemIndicator>
                      <Box
                        as="span"
                        color={NEON_GREEN}
                        fontSize="lg"
                        transition="transform 0.2s"
                      >
                        ▼
                      </Box>
                    </Accordion.ItemIndicator>
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box
                      p={4}
                      bg="#050505"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.1)"
                      mb={4}
                    >
                      <Stack gap={2} dir="rtl">
                        {phase.details.map((detail, di) => (
                          <Text
                            key={di}
                            fontSize="sm"
                            color="gray.300"
                            py={2}
                            borderBottom={di < phase.details.length - 1 ? "1px solid" : "none"}
                            borderColor="rgba(255, 255, 255, 0.05)"
                          >
                            {detail}
                          </Text>
                        ))}
                      </Stack>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </SectionCard>
        </motion.div>

        {/* ====================== ASSESSMENT METHOD ====================== */}
        <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
          <SectionCard title="آلية التقييم" icon="📝">
            <Text color="gray.300" dir="rtl" mb={4}>
              تقييم تكويني مستمر في نهاية كل مرحلة + تقييم نهائي شامل يشمل:
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
              {assessmentCriteria.map((item, i) => (
                <Box
                  key={i}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                  borderRadius="lg"
                  bg="#0A0A0A"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.15)"
                  dir="rtl"
                >
                  <Text color="gray.200" fontSize="sm">
                    {item.label}
                  </Text>
                  <Badge
                    bg={NEON_GREEN}
                    color="black"
                    fontWeight="700"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {item.weight}
                  </Badge>
                </Box>
              ))}
            </SimpleGrid>
          </SectionCard>
        </motion.div>

        {/* ====================== ORGANIZATIONAL NOTES ====================== */}
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
          <SectionCard title="ملاحظات تنظيمية" icon="📋">
            <Stack gap={3} dir="rtl">
              {organizationalNotes.map((note, i) => (
                <Box
                  key={i}
                  display="flex"
                  alignItems="flex-start"
                  gap={3}
                  p={3}
                  borderRadius="lg"
                  bg="rgba(0, 255, 42, 0.03)"
                >
                  <Text color={NEON_GREEN}>•</Text>
                  <Text color="gray.300" fontSize="sm">
                    {note}
                  </Text>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </motion.div>

        {/* ====================== CTA SECTION ====================== */}
        <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
          <Stack
            gap={6}
            textAlign="center"
            p={{ base: 6, md: 10 }}
            borderRadius="2xl"
            bg="#050505"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 40px rgba(0, 255, 42, 0.15)"
            mt={12}
          >
            <Heading as="h2" fontSize={{ base: "xl", md: "2xl" }} color="white" dir="rtl">
              ابدأ رحلتك في تعلم القراءة العربية
            </Heading>
            <Text color="gray.400" dir="rtl" maxW="md" mx="auto">
              سجّل الآن في برنامج المنهج الرشيدي واحصل على تأسيس قوي في القراءة العربية
            </Text>
            <Stack direction={{ base: "column", sm: "row" }} gap={4} justify="center">
              <Button
                asChild
                bg={NEON_GREEN}
                color="black"
                fontWeight="700"
                size="lg"
                px={8}
                _hover={{
                  bg: "#4DFF6A",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 30px rgba(0, 255, 42, 0.4)",
                }}
                transition="all 0.2s"
              >
                <Link href="/auth/register">سجّل الآن</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                borderColor="rgba(0, 255, 42, 0.5)"
                color="white"
                size="lg"
                px={8}
                _hover={{
                  bg: "rgba(0, 255, 42, 0.1)",
                  borderColor: NEON_GREEN,
                }}
                transition="all 0.2s"
              >
                <Link href="/help">تواصل مع المستشار الأكاديمي</Link>
              </Button>
            </Stack>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box
      p={4}
      borderRadius="xl"
      bg="#0A0A0A"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.2)"
      textAlign="center"
      dir="rtl"
    >
      <Text fontSize="xs" color="gray.500" mb={1}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="700" color="white">
        {value}
      </Text>
    </Box>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      p={{ base: 5, md: 8 }}
      borderRadius="2xl"
      bg="#050505"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.2)"
      mb={8}
    >
      <Heading
        as="h2"
        fontSize={{ base: "lg", md: "xl" }}
        fontWeight="700"
        color="white"
        mb={6}
        display="flex"
        alignItems="center"
        gap={3}
        dir="rtl"
      >
        <Text as="span" fontSize="2xl">
          {icon}
        </Text>
        {title}
      </Heading>
      {children}
    </Box>
  );
}


