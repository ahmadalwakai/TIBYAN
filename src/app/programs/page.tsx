import { Badge, Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";

const programs = [
  {
    title: "شهادة التحليل الاستراتيجي",
    slug: "strategic-analysis",
    description: "برنامج مكثف لتطوير مهارات التحليل وصناعة القرار.",
    duration: "12 أسبوعًا",
    level: "متقدم",
    price: "290",
    icon: "📊",
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    students: 234,
  },
  {
    title: "برنامج إعداد الباحث الشرعي",
    slug: "islamic-researcher",
    description: "منهج متكامل لبناء المهارات البحثية والتأصيل.",
    duration: "10 أسابيع",
    level: "متوسط",
    price: "210",
    icon: "📚",
    color: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    students: 189,
  },
  {
    title: "دبلوم قيادة الفرق التعليمية",
    slug: "educational-leadership",
    description: "قيادة تعليمية عملية مع أدوات قياس الأثر.",
    duration: "14 أسبوعًا",
    level: "متقدم",
    price: "320",
    icon: "🎯",
    color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    students: 156,
  },
];

export default function ProgramsPage() {
  return (
    <Box as="main" bg="background" minH="100vh" position="relative" overflow="hidden">
      {/* Animated background elements */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        width="600px"
        height="600px"
        borderRadius="full"
        bg="linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)"
        filter="blur(80px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-10%"
        left="-10%"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.05) 100%)"
        filter="blur(80px)"
        pointerEvents="none"
      />

      <Container maxW="6xl" py={{ base: 16, md: 24 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={14}>
          {/* Header Section */}
          <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
            <Badge
              bg="brand.900"
              color="white"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="700"
              w="fit-content"
              mx="auto"
            >
              🎓 برامج معتمدة
            </Badge>
            <Heading 
              size="2xl"
              lineHeight="1.3"
              css={{
                background: "linear-gradient(135deg, #0B1F3A 0%, #1F4B7A 50%, #D4AF37 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              البرامج والشهادات المتخصصة
            </Heading>
            <Text color="muted" fontSize="lg" lineHeight="1.8">
              برامج متخصصة مبنية على المسارات التعليمية والاختبارات المتقدمة، 
              صُممت بإشراف نخبة من العلماء والمتخصصين.
            </Text>
          </Stack>

          {/* Programs Grid */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
            {programs.map((program, index) => (
              <Box
                key={program.title}
                position="relative"
                role="group"
                css={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
                  "@keyframes fadeInUp": {
                    "0%": { opacity: 0, transform: "translateY(30px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                {/* Glow effect on hover */}
                <Box
                  position="absolute"
                  inset="-2px"
                  borderRadius="2xl"
                  background={program.color}
                  opacity={0}
                  filter="blur(20px)"
                  transition="opacity 0.4s ease"
                  _groupHover={{ opacity: 0.4 }}
                />

                {/* Card */}
                <Box
                  position="relative"
                  bg="surface"
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                  transition="all 0.4s ease"
                  _hover={{
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  {/* Top gradient bar */}
                  <Box h="4px" background={program.color} />

                  {/* Card content */}
                  <Stack p={7} gap={5}>
                    {/* Icon & Level */}
                    <Flex justify="space-between" align="flex-start">
                      <Box
                        w="70px"
                        h="70px"
                        borderRadius="xl"
                        background={program.color}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="2xl"
                        boxShadow="0 8px 20px rgba(0, 0, 0, 0.15)"
                        transition="transform 0.3s ease"
                        _groupHover={{ transform: "scale(1.1) rotate(-5deg)" }}
                      >
                        {program.icon}
                      </Box>
                      <Badge 
                        background={program.color}
                        color="white" 
                        px={3} 
                        py={1.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {program.level}
                      </Badge>
                    </Flex>

                    {/* Title & Description */}
                    <Box>
                      <Heading 
                        size="md"
                        mb={2}
                        color="text"
                        transition="color 0.3s ease"
                      >
                        {program.title}
                      </Heading>
                      <Text color="muted" fontSize="sm" lineHeight="1.8">
                        {program.description}
                      </Text>
                    </Box>

                    {/* Stats */}
                    <Flex 
                      gap={4} 
                      py={4}
                      borderTop="1px solid"
                      borderBottom="1px solid"
                      borderColor="border"
                    >
                      <Box flex={1} textAlign="center">
                        <Text fontSize="xs" color="muted" mb={1}>المدة</Text>
                        <Text fontWeight="700" color="text" fontSize="sm">
                          ⏱️ {program.duration}
                        </Text>
                      </Box>
                      <Box w="1px" bg="border" />
                      <Box flex={1} textAlign="center">
                        <Text fontSize="xs" color="muted" mb={1}>المسجلين</Text>
                        <Text fontWeight="700" color="text" fontSize="sm">
                          👥 {program.students}+
                        </Text>
                      </Box>
                    </Flex>

                    {/* Price & CTA */}
                    <Flex align="center" justify="space-between" pt={2}>
                      <Box>
                        <Text fontSize="xs" color="muted">الرسوم</Text>
                        <Flex align="baseline" gap={1}>
                          <Text 
                            fontSize="2xl" 
                            fontWeight="800"
                            css={{
                              background: program.color,
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              color: "transparent",
                            }}
                          >
                            €{program.price}
                          </Text>
                        </Flex>
                      </Box>
                      <Button 
                        asChild
                        size="md"
                        background={program.color}
                        color="white" 
                        px={6}
                        borderRadius="full"
                        fontWeight="700"
                        _hover={{ 
                          transform: "scale(1.05)",
                          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)"
                        }}
                        transition="all 0.3s ease"
                      >
                        <Link href={`/checkout/${program.slug}`}>سجّل الآن ←</Link>
                      </Button>
                    </Flex>
                  </Stack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>

          {/* Bottom CTA */}
          <Box 
            textAlign="center" 
            p={10}
            borderRadius="2xl"
            bg="linear-gradient(135deg, rgba(11, 31, 58, 0.03) 0%, rgba(212, 175, 55, 0.05) 100%)"
            border="1px solid"
            borderColor="border"
          >
            <Text color="muted" mb={4}>
              لم تجد البرنامج المناسب؟ تواصل معنا لمساعدتك في اختيار المسار الأمثل
            </Text>
            <Button
              size="lg"
              bg="brand.900"
              color="white"
              px={8}
              borderRadius="full"
              fontWeight="700"
              _hover={{
                bg: "brand.700",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(11, 31, 58, 0.3)",
              }}
              transition="all 0.3s ease"
            >
              📞 احجز استشارة مجانية
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
