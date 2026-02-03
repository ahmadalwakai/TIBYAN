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
      bg="#050505"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.3)"
      p={{ base: 6, md: 10 }}
      position="relative"
      overflow="hidden"
      boxShadow="0 0 30px rgba(0, 255, 42, 0.1)"
    >
      {/* Background decoration */}
      <Box
        position="absolute"
        top="-50%"
        right="-20%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />

      <Stack gap={8} position="relative" zIndex={1}>
        {/* Track Header */}
        <Stack gap={3} textAlign="center">
          <Badge
            alignSelf="center"
            bg="rgba(0, 255, 42, 0.1)"
            color="#00FF2A"
            px={4}
            py={2}
            borderRadius="full"
            fontSize="sm"
            fontWeight="700"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
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
              borderColor={plan.highlighted ? "#00FF2A" : "rgba(255, 255, 255, 0.1)"}
              p={6}
              transition="all 0.3s ease"
              _hover={{
                transform: "translateY(-8px)",
                borderColor: plan.highlighted ? "#4DFF6A" : "rgba(0, 255, 42, 0.5)",
                boxShadow: plan.highlighted
                  ? "0 20px 40px rgba(0, 255, 42, 0.3)"
                  : "0 10px 30px rgba(0, 255, 42, 0.2)",
              }}
            >
              {/* Best Value Badge */}
              {plan.highlighted && (
                <Box
                  position="absolute"
                  top="-12px"
                  right="20px"
                  bg="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                  color="primary"
                  px={4}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="800"
                  boxShadow="0 4px 12px rgba(0, 255, 42, 0.4)"
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
                    <Text fontSize="4xl" fontWeight="900" color="#00FF2A">
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
                      <Text color="#00FF2A">✓</Text>
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
                  bg={plan.highlighted ? "#00FF2A" : "rgba(0, 255, 42, 0.15)"}
                  color={plan.highlighted ? "#000000" : "white"}
                  size="lg"
                  fontWeight="800"
                  borderRadius="xl"
                  border={plan.highlighted ? "none" : "1px solid"}
                  borderColor="rgba(0, 255, 42, 0.4)"
                  _hover={{
                    bg: plan.highlighted
                      ? "#4DFF6A"
                      : "rgba(0, 255, 42, 0.25)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 0 20px rgba(0, 255, 42, 0.4)",
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
                    color: "#00FF2A",
                    bg: "rgba(0, 255, 42, 0.1)",
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
