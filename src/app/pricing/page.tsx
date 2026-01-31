"use client";

import { Box, Container, Heading, Stack, Text, Tabs } from "@chakra-ui/react";
import PricingComparisonTable, { PricingPlan } from "@/components/ui/PricingComparisonTable";
import RefundSecurityBlock from "@/components/ui/RefundSecurityBlock";
import InstructorVerification from "@/components/ui/InstructorVerification";
import { pricingPlans } from "@/content/courses.ar";

// Define all pricing plans with track categorization
const plans: PricingPlan[] = [
  {
    name: pricingPlans.free.name,
    slug: "free",
    price: "0",
    description: "محتوى تعريفي لاستكشاف المنصة والبدء في رحلة التعلم.",
    features: pricingPlans.free.features,
    icon: "🎁",
    gradient: "linear-gradient(135deg, #6b7280 0%, #374151 100%)",
    accentColor: "#9ca3af",
    track: "professional",
  },
  {
    name: pricingPlans.preparatory.name,
    slug: "preparatory-year",
    price: `${pricingPlans.preparatory.price}`,
    priceUnit: "/ شهر",
    totalPrice: `المجموع: €${pricingPlans.preparatory.totalPrice}`,
    duration: pricingPlans.preparatory.duration,
    sessions: `${pricingPlans.preparatory.sessions} جلسة`,
    description: "برنامج تمهيدي متكامل لإعداد الطالب نفسياً ومعرفياً ومهارياً.",
    features: [
      "٨ شهور دراسية",
      "١٦٠ جلسة تفاعلية",
      "٨ مواد علمية شاملة",
      "شهادة معتمدة",
    ],
    highlighted: true,
    icon: "⭐",
    gradient: "linear-gradient(135deg, #c8a24a 0%, #ffd700 100%)",
    accentColor: "#c8a24a",
    track: "academic",
  },
  {
    name: pricingPlans.shariah1.name,
    slug: "shariah-first-year",
    price: `${pricingPlans.shariah1.price}`,
    priceUnit: "/ شهر",
    totalPrice: `المجموع: €${pricingPlans.shariah1.totalPrice}`,
    duration: pricingPlans.shariah1.duration,
    sessions: `${pricingPlans.shariah1.sessions} جلسة`,
    description: "السنة الأولى من المسار الشرعي المتخصص.",
    features: [
      "٧ شهور دراسية",
      "١١٢ جلسة تفاعلية",
      "علوم شرعية متقدمة",
      "شهادة معتمدة",
    ],
    icon: "🕌",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    accentColor: "#3b82f6",
    track: "academic",
  },
  {
    name: pricingPlans.shariah2.name,
    slug: "shariah-second-year",
    price: `${pricingPlans.shariah2.price}`,
    priceUnit: "/ شهر",
    totalPrice: `المجموع: €${pricingPlans.shariah2.totalPrice}`,
    duration: pricingPlans.shariah2.duration,
    sessions: `${pricingPlans.shariah2.sessions} جلسة`,
    description: "السنة الثانية - التعمق في العلوم الشرعية والفقهية.",
    features: [
      "٧ شهور دراسية",
      "١١٢ جلسة تفاعلية",
      "تخصص في مجالات محددة",
      "شهادة معتمدة",
    ],
    icon: "📚",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    accentColor: "#8b5cf6",
    track: "academic",
  },
  {
    name: pricingPlans.shariah3.name,
    slug: "shariah-third-year",
    price: `${pricingPlans.shariah3.price}`,
    priceUnit: "/ شهر",
    totalPrice: `المجموع: €${pricingPlans.shariah3.totalPrice}`,
    duration: pricingPlans.shariah3.duration,
    sessions: `${pricingPlans.shariah3.sessions} جلسة`,
    description: "السنة الثالثة - قمة التخصص والاجتهاد العلمي.",
    features: [
      "٦ شهور دراسية",
      "٩٦ جلسة تفاعلية",
      "مستوى الاجتهاد",
      "شهادة نهائية معتمدة",
    ],
    icon: "🏆",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    accentColor: "#f59e0b",
    track: "academic",
  },
  {
    name: pricingPlans.arabicReading.name,
    slug: "arabic-reading",
    price: `${pricingPlans.arabicReading.price}`,
    priceUnit: "/ شهر",
    totalPrice: `المجموع: €${pricingPlans.arabicReading.totalPrice}`,
    duration: pricingPlans.arabicReading.duration,
    sessions: `${pricingPlans.arabicReading.sessions} جلسة`,
    description: "تعلم قراءة اللغة العربية الفصحى من الصفر حتى الإتقان.",
    features: [
      "٧ شهور دراسية",
      "١١٢ جلسة تفاعلية",
      "منهج متدرج ومتكامل",
      "شهادة إتمام",
    ],
    icon: "📖",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    accentColor: "#10b981",
    track: "professional",
  },
];

export default function PricingPage() {
  return (
    <Box
      as="main"
      bg="brand.900"
      minH="100vh"
      position="relative"
      dir="rtl"
      lang="ar"
      overflow="hidden"
    >
      {/* Background decorations */}
      <Box
        position="absolute"
        top="10%"
        right="5%"
        width="300px"
        height="300px"
        borderRadius="full"
        background="radial-gradient(circle, rgba(200, 162, 74, 0.15) 0%, transparent 70%)"
        filter="blur(40px)"
        pointerEvents="none"
        css={{
          animation: "floatOrb 8s ease-in-out infinite",
          "@keyframes floatOrb": {
            "0%, 100%": { transform: "translateY(0) scale(1)" },
            "50%": { transform: "translateY(-20px) scale(1.05)" },
          },
        }}
      />
      <Box
        position="absolute"
        bottom="20%"
        left="10%"
        width="400px"
        height="400px"
        borderRadius="full"
        background="radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)"
        filter="blur(50px)"
        pointerEvents="none"
        css={{ animation: "floatOrb 10s ease-in-out infinite 2s" }}
      />

      <Container maxW="7xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={16}>
          {/* Header Section */}
          <Stack gap={4} textAlign="center" align="center">
            <Box
              display="inline-flex"
              alignItems="center"
              gap={2}
              px={5}
              py={2}
              borderRadius="full"
              bg="whiteAlpha.100"
              backdropFilter="blur(10px)"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="xl">💳</Text>
              <Text color="white" fontWeight="600" fontSize="sm">
                خطط الاشتراك
              </Text>
            </Box>

            <Heading size={{ base: "xl", md: "2xl" }} color="white" fontWeight="900">
              <Text
                as="span"
                background="linear-gradient(135deg, #ffffff 0%, #c8a24a 50%, #ffffff 100%)"
                backgroundClip="text"
                css={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                البرامج التعليمية
              </Text>
            </Heading>

            <Text color="whiteAlpha.800" fontSize="lg" maxW="700px" lineHeight="1.8">
              اختر المسار التعليمي المناسب لمستواك وأهدافك العلمية. نقدم مسارين متكاملين: أكاديمي طويل المدى أو دبلومات مهنية قصيرة.
            </Text>
          </Stack>

          {/* Academic Track */}
          <PricingComparisonTable
            plans={plans}
            track="academic"
            trackTitle="المسار الأكاديمي الشامل"
            trackDescription="برامج طويلة المدى للطلاب الراغبين في التعمق في العلوم الشرعية واللغة العربية بشكل أكاديمي ممنهج على مدى سنوات. تشمل السنة التمهيدية وثلاث سنوات في المسار الشرعي."
          />

          {/* Professional Track */}
          <PricingComparisonTable
            plans={plans}
            track="professional"
            trackTitle="الدبلومات المهنية القصيرة"
            trackDescription="برامج مكثفة متخصصة للمتعلمين الذين يبحثون عن مهارات محددة في وقت قصير. مناسبة للمبتدئين أو من يرغب في تطوير مهارة بعينها مثل القراءة العربية."
          />

          {/* Instructor Trust Block */}
          <InstructorVerification />

          {/* Trust & Guarantee Block */}
          <RefundSecurityBlock />
        </Stack>
      </Container>
    </Box>
  );
}
