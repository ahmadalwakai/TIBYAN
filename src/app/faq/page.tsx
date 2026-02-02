import { Box, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const faqs = [
  {
    question: "كيف أسجل في تبيان؟",
    answer: "يمكنك إنشاء حساب جديد من صفحة التسجيل ثم اختيار الدورة المناسبة.",
  },
  {
    question: "هل الدورات متاحة على الجوال؟",
    answer: "نعم، الواجهة تدعم الأجهزة المحمولة بشكل كامل.",
  },
  {
    question: "كيف أحصل على الشهادة؟",
    answer: "بعد إكمال الدورة وتحقيق نسبة النجاح، تُصدر الشهادة تلقائيًا.",
  },
  {
    question: "هل يمكنني التواصل مع المدرّس؟",
    answer: "نعم عبر نظام النقاشات والأسئلة داخل الدروس.",
  },
  {
    question: "ما طرق الدفع المتاحة؟",
    answer: "يمكن الدفع ببطاقات الائتمان أو التحويل البنكي حسب الخطة.",
  },
  {
    question: "كيف أستعيد كلمة المرور؟",
    answer: "من صفحة استعادة كلمة المرور يمكن إرسال رابط إعادة التعيين.",
  },
];

export default function FaqPage() {
  return (
    <Box as="main" bg="background" minH="100vh" position="relative">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        top="0"
        right="10%"
        width="400px"
        height="400px"
        bg="accentSubtle"
        opacity={0.3}
        pointerEvents="none"
        zIndex={0}
        borderRadius="full"
      />
      <Container maxW="5xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={10}>
          <Stack gap={3} textAlign={{ base: "center", md: "start" }}>
            <Heading 
              size="2xl"
              color="text"
            >
              ❓ الأسئلة الشائعة
            </Heading>
            <Text color="muted" fontSize="lg">
              إجابات مختصرة لأكثر الأسئلة تكرارًا من الطلاب والعملاء.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {faqs.map((item, index) => (
              <PremiumCard
                key={item.question}
                variant="default"
                p={6}
              >
                <Stack gap={3}>
                  <Heading 
                    size="md"
                    color="text"
                  >
                    {["🔑", "📱", "🎓", "💬", "💳", "🔐"][index]} {item.question}
                  </Heading>
                  <Text color="muted" lineHeight="1.7">{item.answer}</Text>
                </Stack>
              </PremiumCard>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
