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
    students: 156,
  },
];

export default function ProgramsPage() {
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
        "@keyframes shimmerBorder": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      }}
    >
      {/* Animated background elements - Neon Green */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        width="600px"
        height="600px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        filter="blur(80px)"
        pointerEvents="none"
        css={{ animation: "floatOrb 10s ease-in-out infinite" }}
      />
      <Box
        position="absolute"
        bottom="-10%"
        left="-10%"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(80px)"
        pointerEvents="none"
        css={{ animation: "floatOrb 12s ease-in-out infinite reverse" }}
      />

      <Container maxW="6xl" py={{ base: 16, md: 24 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={14}>
          {/* Header Section */}
          <Stack 
            gap={4} 
            textAlign="center" 
            maxW="2xl" 
            mx="auto"
            p={{ base: 6, md: 10 }}
            borderRadius="2xl"
            bg="#050505"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
          >
            <Badge
              bg="#0A0A0A"
              color="#00FF2A"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="700"
              w="fit-content"
              mx="auto"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              boxShadow="0 0 15px rgba(0, 255, 42, 0.2)"
            >
              🎓 برامج معتمدة
            </Badge>
            <Heading 
              size="2xl"
              lineHeight="1.3"
              css={{
                background: "linear-gradient(135deg, #ffffff 0%, #00FF2A 50%, #ffffff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              البرامج والشهادات المتخصصة
            </Heading>
            <Text color="rgba(255, 255, 255, 0.85)" fontSize="lg" lineHeight="1.8">
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
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both, cardFloat 4s ease-in-out infinite`,
                  animationDelay: `${index * 0.15}s, ${index * 0.3}s`,
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
                  background="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                  opacity={0}
                  filter="blur(20px)"
                  transition="opacity 0.4s ease"
                  _groupHover={{ opacity: 0.4 }}
                />

                {/* Card */}
                <Box
                  position="relative"
                  bg="#050505"
                  borderRadius="2xl"
                  overflow="hidden"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.3)"
                  boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                  transition="all 0.4s ease"
                  _hover={{
                    transform: "translateY(-8px)",
                    boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
                    borderColor: "rgba(0, 255, 42, 0.6)",
                  }}
                >
                  {/* Top gradient bar - Neon Green */}
                  <Box 
                    h="4px" 
                    background="linear-gradient(90deg, #00FF2A, #4DFF6A, #00FF2A)"
                    backgroundSize="200% 100%"
                    css={{ animation: "shimmerBorder 3s linear infinite" }}
                  />

                  {/* Card content */}
                  <Stack p={7} gap={5}>
                    {/* Icon & Level */}
                    <Flex justify="space-between" align="flex-start">
                      <Box
                        w="70px"
                        h="70px"
                        borderRadius="xl"
                        bg="#0A0A0A"
                        border="1px solid"
                        borderColor="rgba(0, 255, 42, 0.4)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="2xl"
                        boxShadow="0 0 15px rgba(0, 255, 42, 0.2)"
                        transition="all 0.3s ease"
                        _groupHover={{ transform: "scale(1.1) rotate(-5deg)", borderColor: "#00FF2A" }}
                      >
                        {program.icon}
                      </Box>
                      <Badge 
                        bg="#0A0A0A"
                        color="#00FF2A" 
                        px={3} 
                        py={1.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="700"
                        border="1px solid"
                        borderColor="rgba(0, 255, 42, 0.3)"
                      >
                        {program.level}
                      </Badge>
                    </Flex>

                    {/* Title & Description */}
                    <Box>
                      <Heading 
                        size="md"
                        mb={2}
                        color="white"
                        transition="color 0.3s ease"
                      >
                        {program.title}
                      </Heading>
                      <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm" lineHeight="1.8">
                        {program.description}
                      </Text>
                    </Box>

                    {/* Stats */}
                    <Flex 
                      gap={4} 
                      py={4}
                      borderTop="1px solid"
                      borderBottom="1px solid"
                      borderColor="rgba(0, 255, 42, 0.2)"
                    >
                      <Box flex={1} textAlign="center">
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" mb={1}>المدة</Text>
                        <Text fontWeight="700" color="white" fontSize="sm">
                          ⏱️ {program.duration}
                        </Text>
                      </Box>
                      <Box w="1px" bg="rgba(0, 255, 42, 0.3)" />
                      <Box flex={1} textAlign="center">
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" mb={1}>المسجلين</Text>
                        <Text fontWeight="700" color="white" fontSize="sm">
                          👥 {program.students}+
                        </Text>
                      </Box>
                    </Flex>

                    {/* Price & CTA */}
                    <Flex align="center" justify="space-between" pt={2}>
                      <Box>
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)">الرسوم</Text>
                        <Flex align="baseline" gap={1}>
                          <Text 
                            fontSize="2xl" 
                            fontWeight="800"
                            color="#00FF2A"
                          >
                            €{program.price}
                          </Text>
                        </Flex>
                      </Box>
                      <Button 
                        asChild
                        size="md"
                        bg="#0A0A0A"
                        color="#00FF2A" 
                        px={6}
                        borderRadius="full"
                        fontWeight="700"
                        border="1px solid"
                        borderColor="rgba(0, 255, 42, 0.4)"
                        _hover={{ 
                          transform: "scale(1.05)",
                          boxShadow: "0 0 20px rgba(0, 255, 42, 0.4)",
                          borderColor: "#00FF2A"
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
            bg="#050505"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)"
          >
            <Text color="rgba(255, 255, 255, 0.8)" mb={4}>
              لم تجد البرنامج المناسب؟ تواصل معنا لمساعدتك في اختيار المسار الأمثل
            </Text>
            <Button
              size="lg"
              bg="#0A0A0A"
              color="#00FF2A"
              px={8}
              borderRadius="full"
              fontWeight="700"
              border="2px solid"
              borderColor="rgba(0, 255, 42, 0.5)"
              boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
              _hover={{
                borderColor: "#00FF2A",
                transform: "translateY(-2px)",
                boxShadow: "0 0 30px rgba(0, 255, 42, 0.5), 0 8px 25px rgba(0, 255, 42, 0.3)",
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
