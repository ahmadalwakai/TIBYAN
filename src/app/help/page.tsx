import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

const helpCards = [
  {
    title: "البدء السريع",
    text: "تعرّف على كيفية التسجيل، اختيار الدورات، وتتبع التقدم داخل المنصة.",
    icon: "🚀",
  },
  {
    title: "الاختبارات والتقييم",
    text: "تعلم طريقة التعامل مع الاختبارات، المحاولات، والتغذية الراجعة.",
    icon: "🎯",
  },
  {
    title: "الدعم الفني",
    text: "حلول للمشكلات الشائعة وإرشادات رفع الملفات ومشاهدة الفيديو.",
    icon: "🔧",
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
    <Box 
      as="main" 
      bg="#000000" 
      minH="100vh" 
      position="relative"
      overflow="hidden"
    >
      {/* Background glow effects */}
      <Box
        position="absolute"
        top="10%"
        left="5%"
        w="350px"
        h="350px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="20%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={10}>
          <Stack gap={3} textAlign={{ base: "center", md: "start" }}>
            <Heading 
              size="2xl"
              color="white"
            >
              👨‍💻 مركز المساعدة
            </Heading>
            <Text color="gray.400" fontSize="lg">
              إجابات واضحة لكل ما تحتاجه لتجربة تعلم سلسة داخل تبيان.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {helpCards.map((card) => (
              <Box
                key={card.title}
                bg="#050505"
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(0, 255, 42, 0.3)"
                boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                p={6}
                transition="all 0.3s ease"
                _hover={{
                  borderColor: "rgba(0, 255, 42, 0.5)",
                  boxShadow: "0 0 30px rgba(0, 255, 42, 0.25)",
                  transform: "translateY(-4px)",
                }}
              >
                <Stack gap={3}>
                  <Flex align="center" gap={3}>
                    <Box
                      w="50px"
                      h="50px"
                      borderRadius="xl"
                      bg="#0A0A0A"
                      border="2px solid"
                      borderColor="rgba(0, 255, 42, 0.4)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="xl"
                      boxShadow="0 0 15px rgba(0, 255, 42, 0.2)"
                    >
                      {card.icon}
                    </Box>
                    <Heading 
                      size="md"
                      color="white"
                    >
                      {card.title}
                    </Heading>
                  </Flex>
                  <Text color="gray.400" lineHeight="1.7">{card.text}</Text>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>

          <Box
            bg="#050505"
            borderRadius="2xl"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 25px rgba(0, 255, 42, 0.15)"
            p={6}
          >
            <Stack gap={5}>
              <Heading 
                size="md"
                color="#00FF2A"
              >
                ❓ الأسئلة الشائعة
              </Heading>
              {faqs.map((item) => (
                <Box 
                  key={item.question}
                  bg="#0A0A0A"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.2)"
                  p={4}
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: "rgba(0, 255, 42, 0.4)",
                    boxShadow: "0 0 15px rgba(0, 255, 42, 0.1)",
                  }}
                >
                  <Text fontWeight="700" fontSize="md" color="white">{item.question}</Text>
                  <Text color="gray.400" mt={2} lineHeight="1.7">
                    {item.answer}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>

          <Flex
            direction={{ base: "column", md: "row" }}
            gap={6}
            bg="#050505"
            borderRadius="2xl"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.4)"
            boxShadow="0 0 30px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
            p={{ base: 6, md: 8 }}
            align="center"
            justify="space-between"
          >
            <Stack gap={2} textAlign={{ base: "center", md: "start" }}>
              <Heading size="md" color="white">📞 تحتاج مساعدة مباشرة؟</Heading>
              <Text color="gray.400" fontSize="lg">
                تواصل مع فريق الدعم عبر البريد أو الدردشة المباشرة.
              </Text>
            </Stack>
            <Button 
              bg="#00FF2A" 
              color="black" 
              w={{ base: "100%", md: "auto" }}
              size="lg"
              px={8}
              fontWeight="700"
              boxShadow="0 0 20px rgba(0, 255, 42, 0.4)"
              _hover={{
                bg: "#4DFF6A",
                transform: "translateY(-2px)",
                boxShadow: "0 0 30px rgba(0, 255, 42, 0.6)"
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
