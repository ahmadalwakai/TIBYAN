import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

const values = [
  {
    title: "معرفة موثوقة",
    description: "محتوى تعليمي مبني على معايير أكاديمية وتحقق علمي.",
    icon: "📚",
  },
  {
    title: "تجربة عربية أولاً",
    description: "واجهة RTL متكاملة تدعم اللغة العربية بكل تفاصيلها.",
    icon: "🌍",
  },
  {
    title: "تعلّم بقياس الأثر",
    description: "مؤشرات أداء واضحة وتحليلات متقدمة لضمان نتائج حقيقية.",
    icon: "📈",
  },
];

export default function AboutPage() {
  return (
    <Box 
      as="main" 
      bg="#000000" 
      minH="100vh" 
      position="relative"
      overflow="hidden"
      css={{
        "@keyframes floatOrb": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-30px) scale(1.05)" },
        },
        "@keyframes cardFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      }}
    >
      {/* Decorative background elements - Neon Green */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        css={{ animation: "floatOrb 10s ease-in-out infinite" }}
      />
      <Box
        position="absolute"
        bottom="0"
        left="0"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(50px)"
        pointerEvents="none"
        zIndex={0}
        css={{ animation: "floatOrb 12s ease-in-out infinite reverse" }}
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={12}>
          <Flex direction={{ base: "column", md: "row" }} gap={8} align="center">
            <Stack 
              gap={4} 
              flex="1"
              p={{ base: 6, md: 8 }}
              borderRadius="2xl"
              bg="#050505"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
            >
              <Heading 
                size="2xl"
                css={{
                  background: "linear-gradient(135deg, #ffffff 0%, #00FF2A 50%, #ffffff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                ✨ منصة تبيان
              </Heading>
              <Text color="rgba(255, 255, 255, 0.85)" fontSize="lg" lineHeight="1.8">
                تبيان منصة تعليمية عربية متقدمة تربط بين المعرفة، التطبيق العملي،
                والقياس المستمر للأثر التعليمي عبر مسارات احترافية.
              </Text>
              <Button 
                bg="#0A0A0A"
                color="#00FF2A" 
                border="2px solid"
                borderColor="rgba(0, 255, 42, 0.5)"
                boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                _hover={{ 
                  transform: "translateY(-2px)",
                  boxShadow: "0 0 30px rgba(0, 255, 42, 0.5), 0 10px 20px rgba(0, 255, 42, 0.3)",
                  borderColor: "#00FF2A"
                }}
                transition="all 0.3s ease"
                alignSelf="start"
                size="lg"
                px={8}
                fontWeight="700"
                borderRadius="full"
              >
                تواصل مع فريقنا
              </Button>
            </Stack>
            <Box
              flex="1"
              p={8}
              bg="#050505"
              borderRadius="2xl"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
              transition="all 0.3s ease"
              _hover={{
                boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
                borderColor: "rgba(0, 255, 42, 0.5)",
              }}
            >
              <Stack gap={3}>
                <Flex align="center" gap={2}>
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="xl"
                    bg="#0A0A0A"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.4)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xl"
                    boxShadow="0 0 10px rgba(0, 255, 42, 0.2)"
                  >
                    🎯
                  </Box>
                  <Heading size="md" color="white">رسالتنا</Heading>
                </Flex>
                <Text color="rgba(255, 255, 255, 0.8)" lineHeight="1.8">
                  تمكين المتعلمين العرب من الوصول إلى تعليم عالي الجودة من خلال
                  تقنيات حديثة وتجربة تفاعلية.
                </Text>
              </Stack>
            </Box>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {values.map((value, index) => (
              <Box
                key={value.title}
                p={6}
                bg="#050505"
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(0, 255, 42, 0.3)"
                boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                transition="all 0.4s ease"
                css={{
                  animation: `cardFloat 4s ease-in-out infinite`,
                  animationDelay: `${index * 0.3}s`,
                }}
                _hover={{
                  transform: "translateY(-8px)",
                  boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
                  borderColor: "rgba(0, 255, 42, 0.6)",
                }}
              >
                <Stack gap={3}>
                  <Flex align="center" gap={3}>
                    <Box
                      w="50px"
                      h="50px"
                      borderRadius="xl"
                      bg="#0A0A0A"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.4)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="xl"
                      boxShadow="0 0 10px rgba(0, 255, 42, 0.2)"
                    >
                      {value.icon}
                    </Box>
                    <Heading 
                      size="md"
                      color="#00FF2A"
                    >
                      {value.title}
                    </Heading>
                  </Flex>
                  <Text color="rgba(255, 255, 255, 0.7)" lineHeight="1.7">{value.description}</Text>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
