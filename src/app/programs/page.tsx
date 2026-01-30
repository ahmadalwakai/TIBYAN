import { Badge, Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const programs = [
  {
    title: "شهادة التحليل الاستراتيجي",
    description: "برنامج مكثف لتطوير مهارات التحليل وصناعة القرار.",
    duration: "12 أسبوعًا",
    level: "متقدم",
    price: "€ 290",
  },
  {
    title: "برنامج إعداد الباحث الشرعي",
    description: "منهج متكامل لبناء المهارات البحثية والتأصيل.",
    duration: "10 أسابيع",
    level: "متوسط",
    price: "€ 210",
  },
  {
    title: "دبلوم قيادة الفرق التعليمية",
    description: "قيادة تعليمية عملية مع أدوات قياس الأثر.",
    duration: "14 أسبوعًا",
    level: "متقدم",
    price: "€ 320",
  },
];

export default function ProgramsPage() {
  return (
    <Box as="main" bg="background" minH="100vh" position="relative">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        width="500px"
        height="500px"
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
              🎓 البرامج والشهادات
            </Heading>
            <Text color="muted" fontSize="lg">
              برامج متخصصة مبنية على المسارات التعليمية والاختبارات المتقدمة.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {programs.map((program) => (
              <PremiumCard
                key={program.title}
                variant="elevated"
                p={6}
              >
                <Stack gap={4}>
                  <Badge 
                    bgGradient="linear(135deg, brand.500 0%, brand.600 100%)"
                    color="white" 
                    w="fit-content" 
                    px={3} 
                    py={1}
                    borderRadius="badge"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {program.level}
                  </Badge>
                  <Heading 
                    size="md"
                    bgGradient="linear(135deg, text 0%, brand.900 100%)"
                    bgClip="text"
                  >
                    {program.title}
                  </Heading>
                  <Text color="muted" lineHeight="1.7">{program.description}</Text>
                  <Stack gap={2} color="muted" fontSize="sm">
                    <Flex align="center" gap={2}>
                      <Text>⏱️</Text>
                      <Text>المدة: {program.duration}</Text>
                    </Flex>
                    <Flex align="center" gap={2}>
                      <Text>💰</Text>
                      <Text>الرسوم: {program.price}</Text>
                    </Flex>
                  </Stack>
                  <Flex align="center" justify="space-between" gap={3} pt={2}>
                    <Button 
                      size="sm" 
                      bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
                      color="white" 
                      _hover={{ 
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 12px -2px rgba(11, 31, 59, 0.3)"
                      }}
                      transition="all 0.3s ease"
                      flex="1"
                    >
                      عرض التفاصيل
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      borderColor="brand.500"
                      borderWidth="2px"
                      color="brand.900"
                      _hover={{
                        bg: "brand.50",
                        transform: "translateY(-2px)"
                      }}
                      transition="all 0.3s ease"
                      flex="1"
                    >
                      سجل اهتمامك
                    </Button>
                  </Flex>
                </Stack>
              </PremiumCard>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
