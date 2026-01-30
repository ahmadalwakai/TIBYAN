"use client";

import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { pricingPlans } from "@/content/courses.ar";

const plans = [
  {
    name: pricingPlans.free.name,
    price: "0",
    description: "محتوى تعريفي لاستكشاف المنصة والبدء في رحلة التعلم.",
    features: pricingPlans.free.features,
    icon: "🎁",
    gradient: "linear-gradient(135deg, #6b7280 0%, #374151 100%)",
    accentColor: "#9ca3af",
  },
  {
    name: pricingPlans.preparatory.name,
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
  },
  {
    name: pricingPlans.arabicReading.name,
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
  },
  {
    name: pricingPlans.shariah1.name,
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
  },
  {
    name: pricingPlans.shariah2.name,
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
  },
  {
    name: pricingPlans.shariah3.name,
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
      css={{
        "@keyframes floatOrb": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-20px) scale(1.05)" },
        },
        "@keyframes shimmerBorder": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "@keyframes pulseGlow": {
          "0%, 100%": { opacity: 0.4, boxShadow: "0 0 20px currentColor" },
          "50%": { opacity: 0.8, boxShadow: "0 0 40px currentColor" },
        },
        "@keyframes cardFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "@keyframes iconBounce": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "25%": { transform: "scale(1.1) rotate(-5deg)" },
          "75%": { transform: "scale(1.1) rotate(5deg)" },
        },
      }}
    >
      {/* Floating background orbs */}
      <Box
        position="absolute"
        top="10%"
        right="5%"
        width="300px"
        height="300px"
        borderRadius="full"
        background="radial-gradient(circle, rgba(200, 162, 74, 0.15) 0%, transparent 70%)"
        filter="blur(40px)"
        css={{ animation: "floatOrb 8s ease-in-out infinite" }}
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
        css={{ animation: "floatOrb 10s ease-in-out infinite 2s" }}
      />
      <Box
        position="absolute"
        top="50%"
        left="50%"
        width="500px"
        height="500px"
        borderRadius="full"
        background="radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)"
        filter="blur(60px)"
        transform="translate(-50%, -50%)"
        css={{ animation: "floatOrb 12s ease-in-out infinite 4s" }}
      />

      <Container maxW="7xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={12} textAlign="center">
          {/* Header Section */}
          <Stack gap={4} align="center">
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
            
            <Heading 
              size={{ base: "xl", md: "2xl" }}
              color="white"
              fontWeight="900"
            >
              <Text 
                as="span" 
                background="linear-gradient(135deg, #ffffff 0%, #c8a24a 50%, #ffffff 100%)"
                backgroundClip="text"
                css={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                البرامج التعليمية
              </Text>
            </Heading>
            
            <Text color="whiteAlpha.800" fontSize="lg" maxW="600px">
              اختر البرنامج التعليمي المناسب لمستواك وأهدافك العلمية
            </Text>
          </Stack>

          {/* Pricing Cards Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {plans.map((plan, index) => (
              <Box
                key={plan.name}
                position="relative"
                transition="all 0.4s ease"
                _hover={{
                  transform: "translateY(-12px)",
                }}
                css={{
                  animation: plan.highlighted ? "cardFloat 4s ease-in-out infinite" : "none",
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Card glow effect */}
                <Box
                  position="absolute"
                  inset="-2px"
                  borderRadius="2xl"
                  background={plan.highlighted 
                    ? "linear-gradient(135deg, #c8a24a, #00d4ff, #c8a24a)"
                    : `linear-gradient(135deg, ${plan.accentColor}40, transparent, ${plan.accentColor}40)`
                  }
                  backgroundSize="200% 200%"
                  opacity={plan.highlighted ? 1 : 0}
                  transition="opacity 0.4s ease"
                  css={plan.highlighted ? { animation: "shimmerBorder 4s linear infinite" } : {}}
                  _groupHover={{ opacity: 1 }}
                />

                <Box
                  role="group"
                  position="relative"
                  bg="rgba(255, 255, 255, 0.03)"
                  backdropFilter="blur(20px)"
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor={plan.highlighted ? "transparent" : "whiteAlpha.100"}
                  overflow="hidden"
                  p={6}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.06)",
                    borderColor: `${plan.accentColor}50`,
                    boxShadow: `0 20px 60px -20px ${plan.accentColor}40`,
                  }}
                  transition="all 0.4s ease"
                >
                  {/* Highlighted badge */}
                  {plan.highlighted && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      height="3px"
                      background="linear-gradient(90deg, transparent, #c8a24a, #00d4ff, #c8a24a, transparent)"
                      backgroundSize="200% 100%"
                      css={{ animation: "shimmerBorder 4s linear infinite" }}
                    />
                  )}

                  <Stack gap={5}>
                    {/* Plan header with icon */}
                    <Flex justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        {plan.highlighted && (
                          <Box
                            display="inline-flex"
                            alignSelf="flex-start"
                            px={3}
                            py={1}
                            borderRadius="full"
                            background="linear-gradient(135deg, #c8a24a, #ffd700)"
                            boxShadow="0 4px 15px rgba(200, 162, 74, 0.4)"
                          >
                            <Text fontSize="xs" fontWeight="800" color="brand.900">
                              ⭐ الأكثر طلباً
                            </Text>
                          </Box>
                        )}
                        <Heading 
                          size="md"
                          color="white"
                          fontWeight="800"
                        >
                          {plan.name}
                        </Heading>
                      </Stack>
                      
                      <Box
                        w="50px"
                        h="50px"
                        borderRadius="xl"
                        background={plan.gradient}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="xl"
                        boxShadow={`0 8px 25px -5px ${plan.accentColor}50`}
                        transition="all 0.3s ease"
                        _groupHover={{
                          transform: "scale(1.1) rotate(5deg)",
                        }}
                      >
                        {plan.icon}
                      </Box>
                    </Flex>

                    {/* Price section */}
                    <Box>
                      <Flex align="baseline" gap={2}>
                        <Text 
                          fontSize="4xl" 
                          fontWeight="900"
                          background={plan.gradient}
                          backgroundClip="text"
                          css={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                        >
                          €{plan.price}
                        </Text>
                        {plan.priceUnit && (
                          <Text color="whiteAlpha.600" fontSize="sm">{plan.priceUnit}</Text>
                        )}
                      </Flex>
                      
                      {(plan.totalPrice || plan.duration || plan.sessions) && (
                        <Stack gap={1} mt={2}>
                          {plan.totalPrice && (
                            <Text fontSize="sm" color="whiteAlpha.700" fontWeight="600">
                              {plan.totalPrice}
                            </Text>
                          )}
                          <Flex gap={4} flexWrap="wrap">
                            {plan.duration && (
                              <Flex align="center" gap={1}>
                                <Text color={plan.accentColor}>🕐</Text>
                                <Text fontSize="xs" color="whiteAlpha.600">
                                  المدة: {plan.duration}
                                </Text>
                              </Flex>
                            )}
                            {plan.sessions && (
                              <Flex align="center" gap={1}>
                                <Text color={plan.accentColor}>📅</Text>
                                <Text fontSize="xs" color="whiteAlpha.600">
                                  {plan.sessions}
                                </Text>
                              </Flex>
                            )}
                          </Flex>
                        </Stack>
                      )}
                    </Box>

                    {/* Description */}
                    <Text color="whiteAlpha.700" fontSize="sm" lineHeight="1.8">
                      {plan.description}
                    </Text>

                    {/* Divider */}
                    <Box 
                      h="1px" 
                      background={`linear-gradient(90deg, transparent, ${plan.accentColor}40, transparent)`}
                    />

                    {/* Features */}
                    <Stack gap={3}>
                      {plan.features.map((feature) => (
                        <Flex key={feature} align="center" gap={3}>
                          <Box
                            w="20px"
                            h="20px"
                            borderRadius="full"
                            background={`${plan.accentColor}20`}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Text 
                              fontSize="xs" 
                              fontWeight="800"
                              color={plan.accentColor}
                            >
                              ✓
                            </Text>
                          </Box>
                          <Text fontSize="sm" color="whiteAlpha.900">{feature}</Text>
                        </Flex>
                      ))}
                    </Stack>

                    {/* CTA Button */}
                    <Box position="relative" mt={2}>
                      {plan.highlighted && (
                        <Box
                          position="absolute"
                          inset="-3px"
                          borderRadius="xl"
                          background="linear-gradient(135deg, #c8a24a, #00d4ff)"
                          filter="blur(10px)"
                          opacity={0.4}
                          css={{ animation: "pulseGlow 2s ease-in-out infinite" }}
                        />
                      )}
                      <Button
                        position="relative"
                        w="full"
                        size="lg"
                        background={plan.highlighted ? plan.gradient : "transparent"}
                        color={plan.highlighted ? "brand.900" : "white"}
                        borderWidth={plan.highlighted ? 0 : "1px"}
                        borderColor="whiteAlpha.300"
                        borderRadius="xl"
                        fontWeight="800"
                        _hover={{
                          background: plan.highlighted 
                            ? plan.gradient
                            : `${plan.accentColor}20`,
                          borderColor: plan.accentColor,
                          transform: "translateY(-2px)",
                          boxShadow: `0 10px 30px -10px ${plan.accentColor}60`,
                        }}
                        transition="all 0.3s ease"
                      >
                        {plan.price === "0" ? "🚀 استكشف المنصة" : "✨ سجل الآن"}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>

          {/* Bottom CTA Section */}
          <Box
            mt={8}
            p={8}
            borderRadius="2xl"
            bg="whiteAlpha.50"
            backdropFilter="blur(20px)"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            textAlign="center"
          >
            <Stack gap={4} align="center">
              <Text fontSize="2xl">🤔</Text>
              <Heading size="md" color="white">
                هل تحتاج مساعدة في اختيار البرنامج المناسب؟
              </Heading>
              <Text color="whiteAlpha.700" maxW="500px">
                تواصل معنا وسنساعدك في اختيار المسار التعليمي الأنسب لأهدافك
              </Text>
              <Button
                mt={2}
                px={8}
                bg="white"
                color="brand.900"
                fontWeight="800"
                borderRadius="full"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 30px rgba(255, 255, 255, 0.2)",
                }}
                transition="all 0.3s ease"
              >
                💬 تواصل معنا
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
