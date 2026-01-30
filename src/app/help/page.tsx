import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const helpCards = [
  {
    title: "البدء السريع",
    text: "تعرّف على كيفية التسجيل، اختيار الدورات، وتتبع التقدم داخل المنصة.",
  },
  {
    title: "الاختبارات والتقييم",
    text: "تعلم طريقة التعامل مع الاختبارات، المحاولات، والتغذية الراجعة.",
  },
  {
    title: "الدعم الفني",
    text: "حلول للمشكلات الشائعة وإرشادات رفع الملفات ومشاهدة الفيديو.",
  },
];

const faqs = [
  {
    question: "كيف أبدأ في تبيان؟",
    answer: "سجّل حسابًا جديدًا، ثم استعرض الدورات من صفحة الدورات وابدأ التعلم فورًا.",
  },
  {
    question: "هل الشهادات موثّقة؟",
    answer: "نعم، تُمنح شهادات عند إكمال المسار مع إمكانية التحقق عبر صفحة الشهادة.",
  },
  {
    question: "كيف أتواصل مع المدرّس؟",
    answer: "يمكنك استخدام قسم النقاشات أو Q&A داخل الدرس للتفاعل مع المدرّس.",
  },
];

export default function HelpPage() {
  return (
    <Box as="main" bg="background" minH="100vh" position="relative">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        bottom="0"
        right="0"
        width="450px"
        height="450px"
        bgGradient="radial(circle, brand.50 0%, transparent 70%)"
        opacity={0.3}
        pointerEvents="none"
        zIndex={0}
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={10}>
          <Stack gap={3} textAlign={{ base: "center", md: "start" }}>
            <Heading 
              size="2xl"
              bgGradient="linear(135deg, text 0%, brand.900 100%)"
              bgClip="text"
            >
              👨‍💻 مركز المساعدة
            </Heading>
            <Text color="muted" fontSize="lg">
              إجابات واضحة لكل ما تحتاجه لتجربة تعلم سلسة داخل تبيان.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {helpCards.map((card, index) => (
              <PremiumCard
                key={card.title}
                variant="default"
                p={6}
              >
                <Stack gap={3}>
                  <Flex align="center" gap={2}>
                    <Text fontSize="2xl">
                      {index === 0 ? "🚀" : index === 1 ? "🎯" : "🔧"}
                    </Text>
                    <Heading 
                      size="md"
                      bgGradient="linear(135deg, text 0%, brand.900 100%)"
                      bgClip="text"
                    >
                      {card.title}
                    </Heading>
                  </Flex>
                  <Text color="muted" lineHeight="1.7">{card.text}</Text>
                  <Button 
                    variant="outline" 
                    borderColor="brand.500"
                    borderWidth="2px"
                    color="brand.900" 
                    alignSelf="start"
                    _hover={{
                      bg: "brand.50",
                      transform: "translateY(-2px)"
                    }}
                    transition="all 0.3s ease"
                  >
                    اقرأ المزيد
                  </Button>
                </Stack>
              </PremiumCard>
            ))}
          </SimpleGrid>

          <PremiumCard variant="bordered" p={6}>
            <Stack gap={4}>
              <Heading 
                size="md"
                bgGradient="linear(135deg, text 0%, brand.900 100%)"
                bgClip="text"
              >
                ❓ الأسئلة الشائعة
              </Heading>
              {faqs.map((item) => (
                <Box key={item.question}>
                  <Text fontWeight="700" fontSize="md">{item.question}</Text>
                  <Text color="muted" mt={2} lineHeight="1.7">
                    {item.answer}
                  </Text>
                </Box>
              ))}
            </Stack>
          </PremiumCard>

          <Flex
            direction={{ base: "column", md: "row" }}
            gap={6}
            bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
            color="white"
            borderRadius="card"
            p={{ base: 6, md: 8 }}
            align="center"
            justify="space-between"
            boxShadow="cardLarge"
          >
            <Stack gap={2} textAlign={{ base: "center", md: "start" }}>
              <Heading size="md">📞 تحتاج مساعدة مباشرة؟</Heading>
              <Text color="whiteAlpha.900" fontSize="lg">
                تواصل مع فريق الدعم عبر البريد أو الدردشة المباشرة.
              </Text>
            </Stack>
            <Button 
              bg="white" 
              color="brand.900" 
              w={{ base: "100%", md: "auto" }}
              size="lg"
              px={8}
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.2)"
              }}
              transition="all 0.3s ease"
            >
              تواصل الآن
            </Button>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
}
