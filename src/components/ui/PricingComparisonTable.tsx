"use client";

import { Box, Button, Flex, Heading, SimpleGrid, Stack, Text, Badge } from "@chakra-ui/react";
import Link from "next/link";

export interface PricingPlan {
  name: string;
  slug: string;
  price: string;
  priceUnit?: string;
  totalPrice?: string;
  duration?: string;
  sessions?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  icon: string;
  gradient: string;
  accentColor: string;
  track: "academic" | "professional";
}

interface PricingComparisonTableProps {
  plans: PricingPlan[];
  track: "academic" | "professional";
  trackTitle: string;
  trackDescription: string;
}

export default function PricingComparisonTable({
  plans,
  track,
  trackTitle,
  trackDescription,
}: PricingComparisonTableProps) {
  const trackPlans = plans.filter((p) => p.track === track);

  return (
    <Box
      borderRadius="2xl"
      bg="linear-gradient(135deg, rgba(11, 31, 59, 0.4), rgba(26, 54, 93, 0.3))"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="rgba(200, 162, 74, 0.2)"
      p={{ base: 6, md: 10 }}
      position="relative"
      overflow="hidden"
    >
      {/* Background decoration */}
      <Box
        position="absolute"
        top="-50%"
        right="-20%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(200, 162, 74, 0.08) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />

      <Stack gap={8} position="relative" zIndex={1}>
        {/* Track Header */}
        <Stack gap={3} textAlign="center">
          <Badge
            alignSelf="center"
            bg="rgba(200, 162, 74, 0.15)"
            color="#c8a24a"
            px={4}
            py={2}
            borderRadius="full"
            fontSize="sm"
            fontWeight="700"
            border="1px solid"
            borderColor="rgba(200, 162, 74, 0.3)"
          >
            {track === "academic" ? "🎓 المسار الأكاديمي" : "💼 الدبلومات المهنية"}
          </Badge>
          <Heading size={{ base: "lg", md: "xl" }} color="white">
            {trackTitle}
          </Heading>
          <Text color="gray.300" fontSize={{ base: "md", md: "lg" }} maxW="2xl" mx="auto">
            {trackDescription}
          </Text>
        </Stack>

        {/* Plans Grid */}
        <SimpleGrid columns={{ base: 1, md: trackPlans.length >= 3 ? 3 : trackPlans.length }} gap={6}>
          {trackPlans.map((plan) => (
            <Box
              key={plan.slug}
              position="relative"
              borderRadius="xl"
              bg="rgba(255, 255, 255, 0.03)"
              backdropFilter="blur(10px)"
              border="2px solid"
              borderColor={plan.highlighted ? "#c8a24a" : "rgba(255, 255, 255, 0.1)"}
              p={6}
              transition="all 0.3s ease"
              _hover={{
                transform: "translateY(-8px)",
                borderColor: plan.highlighted ? "#ffd700" : "rgba(200, 162, 74, 0.5)",
                boxShadow: plan.highlighted
                  ? "0 20px 40px rgba(200, 162, 74, 0.3)"
                  : "0 10px 30px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* Best Value Badge */}
              {plan.highlighted && (
                <Box
                  position="absolute"
                  top="-12px"
                  right="20px"
                  bg="linear-gradient(135deg, #c8a24a, #ffd700)"
                  color="primary"
                  px={4}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="800"
                  boxShadow="0 4px 12px rgba(200, 162, 74, 0.4)"
                >
                  ⭐ الأفضل قيمة
                </Box>
              )}

              <Stack gap={4}>
                {/* Icon & Name */}
                <Flex align="center" gap={3}>
                  <Text fontSize="3xl">{plan.icon}</Text>
                  <Box>
                    <Heading size="md" color="white">
                      {plan.name}
                    </Heading>
                    {plan.duration && (
                      <Text fontSize="sm" color="gray.400" fontWeight="600">
                        {plan.duration}
                      </Text>
                    )}
                  </Box>
                </Flex>

                {/* Price */}
                <Box>
                  <Flex align="baseline" gap={1}>
                    <Text fontSize="4xl" fontWeight="900" color="#c8a24a">
                      €{plan.price}
                    </Text>
                    {plan.priceUnit && (
                      <Text fontSize="md" color="gray.400" fontWeight="600">
                        {plan.priceUnit}
                      </Text>
                    )}
                  </Flex>
                  {plan.totalPrice && (
                    <Text fontSize="sm" color="gray.500" fontWeight="600">
                      {plan.totalPrice}
                    </Text>
                  )}
                  {plan.sessions && (
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mt={1}>
                      {plan.sessions}
                    </Text>
                  )}
                </Box>

                {/* Description */}
                <Text fontSize="sm" color="gray.300" lineHeight="1.7">
                  {plan.description}
                </Text>

                {/* Features */}
                <Stack gap={2} pt={2}>
                  {plan.features.map((feature, idx) => (
                    <Flex key={idx} align="start" gap={2}>
                      <Text color="#c8a24a">✓</Text>
                      <Text fontSize="sm" color="gray.200" flex={1}>
                        {feature}
                      </Text>
                    </Flex>
                  ))}
                </Stack>

                {/* CTA */}
                <Button
                  asChild
                  mt={2}
                  bg={plan.highlighted ? "linear-gradient(135deg, #c8a24a, #d4b05a)" : "rgba(200, 162, 74, 0.15)"}
                  color={plan.highlighted ? "brand.900" : "white"}
                  size="lg"
                  fontWeight="800"
                  borderRadius="xl"
                  border={plan.highlighted ? "none" : "1px solid"}
                  borderColor="rgba(200, 162, 74, 0.4)"
                  _hover={{
                    bg: plan.highlighted
                      ? "linear-gradient(135deg, #d4b05a, #c8a24a)"
                      : "rgba(200, 162, 74, 0.25)",
                    transform: "translateY(-2px)",
                  }}
                  transition="all 0.2s ease"
                >
                  <Link href={`/checkout/${plan.slug}`}>
                    {plan.price === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
                  </Link>
                </Button>
                
                {/* View Syllabus Link */}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  color="gray.300"
                  _hover={{
                    color: "#c8a24a",
                    bg: "rgba(200, 162, 74, 0.1)",
                  }}
                >
                  <Link href={`/courses/${plan.slug}`}>
                    عرض المنهج الكامل →
                  </Link>
                </Button>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
