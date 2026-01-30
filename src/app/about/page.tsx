import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const values = [
  {
    title: "معرفة موثوقة",
    description: "محتوى تعليمي مبني على معايير أكاديمية وتحقق علمي.",
  },
  {
    title: "تجربة عربية أولاً",
    description: "واجهة RTL متكاملة تدعم اللغة العربية بكل تفاصيلها.",
  },
  {
    title: "تعلّم بقياس الأثر",
    description: "مؤشرات أداء واضحة وتحليلات متقدمة لضمان نتائج حقيقية.",
  },
];

export default function AboutPage() {
  return (
    <Box as="main" bg="background" minH="100vh" position="relative">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="500px"
        height="500px"
        bgGradient="radial(circle, brand.50 0%, transparent 70%)"
        opacity={0.4}
        pointerEvents="none"
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="0"
        left="0"
        width="400px"
        height="400px"
        bgGradient="radial(circle, brand.50 0%, transparent 70%)"
        opacity={0.3}
        pointerEvents="none"
        zIndex={0}
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={12}>
          <Flex direction={{ base: "column", md: "row" }} gap={8} align="center">
            <Stack gap={4} flex="1">
              <Heading 
                size="2xl"
                bgGradient="linear(135deg, text 0%, brand.900 100%)"
                bgClip="text"
              >
                ✨ منصة تبيان
              </Heading>
              <Text color="muted" fontSize="lg" lineHeight="1.8">
                تبيان منصة تعليمية عربية متقدمة تربط بين المعرفة، التطبيق العملي،
                والقياس المستمر للأثر التعليمي عبر مسارات احترافية.
              </Text>
              <Button 
                bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
                color="white" 
                _hover={{ 
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 20px -5px rgba(11, 31, 59, 0.3)"
                }}
                transition="all 0.3s ease"
                alignSelf="start"
                size="lg"
                px={8}
              >
                تواصل مع فريقنا
              </Button>
            </Stack>
            <PremiumCard
              variant="elevated"
              flex="1"
              p={8}
            >
              <Stack gap={3}>
                <Flex align="center" gap={2}>
                  <Text fontSize="2xl">🎯</Text>
                  <Heading size="md">رسالتنا</Heading>
                </Flex>
                <Text color="muted" lineHeight="1.8">
                  تمكين المتعلمين العرب من الوصول إلى تعليم عالي الجودة من خلال
                  تقنيات حديثة وتجربة تفاعلية.
                </Text>
              </Stack>
            </PremiumCard>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {values.map((value, index) => (
              <PremiumCard
                key={value.title}
                variant="default"
                p={6}
              >
                <Stack gap={3}>
                  <Flex align="center" gap={3}>
                    <Text fontSize="2xl">
                      {index === 0 ? "📚" : index === 1 ? "🌍" : "📈"}
                    </Text>
                    <Heading 
                      size="md"
                      bgGradient="linear(135deg, text 0%, brand.900 100%)"
                      bgClip="text"
                    >
                      {value.title}
                    </Heading>
                  </Flex>
                  <Text color="muted" lineHeight="1.7">{value.description}</Text>
                </Stack>
              </PremiumCard>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
