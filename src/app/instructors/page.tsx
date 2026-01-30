"use client";

import {
  Box,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { teachers } from "@/content/courses.ar";
import { useEffect, useRef, useState } from "react";

// Count up animation hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// Animated stat component
function AnimatedStat({ icon, value, label, suffix = "", color }: { 
  icon: string; 
  value: number; 
  label: string; 
  suffix?: string;
  color: string;
}) {
  const { count, ref } = useCountUp(value, 2000);
  const displayValue = suffix ? `${count}${suffix}` : count.toString();

  return (
    <Box
      ref={ref}
      position="relative"
      p={6}
      bg="rgba(255, 255, 255, 0.03)"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      textAlign="center"
      transition="all 0.4s ease"
      _hover={{
        bg: "rgba(255, 255, 255, 0.06)",
        transform: "translateY(-5px)",
        borderColor: `${color}50`,
        boxShadow: `0 20px 40px -20px ${color}40`,
      }}
      role="group"
    >
      <Stack gap={3} align="center">
        <Box
          w="60px"
          h="60px"
          borderRadius="xl"
          background={`linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2xl"
          transition="all 0.3s ease"
          _groupHover={{ transform: "scale(1.1) rotate(5deg)" }}
        >
          {icon}
        </Box>
        <Text 
          fontSize="3xl" 
          fontWeight="900" 
          background={`linear-gradient(135deg, ${color} 0%, #ffffff 100%)`}
          backgroundClip="text"
          css={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          {displayValue}
        </Text>
        <Text fontSize="sm" color="whiteAlpha.700" fontWeight="600">
          {label}
        </Text>
      </Stack>
    </Box>
  );
}

export default function InstructorsPage() {
  return (
    <Box 
      as="main" 
      bg="brand.900" 
      minH="100vh"
      position="relative"
      overflow="hidden"
      css={{
        "@keyframes floatOrb": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-30px) scale(1.05)" },
        },
        "@keyframes shimmerBorder": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "@keyframes pulseGlow": {
          "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
          "50%": { opacity: 0.8, transform: "scale(1.05)" },
        },
        "@keyframes cardFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "@keyframes avatarPulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 currentColor" },
          "50%": { boxShadow: "0 0 20px 5px currentColor" },
        },
      }}
    >
      {/* Floating background orbs */}
      <Box
        position="absolute"
        top="5%"
        right="10%"
        width="400px"
        height="400px"
        borderRadius="full"
        background="radial-gradient(circle, rgba(200, 162, 74, 0.15) 0%, transparent 70%)"
        filter="blur(50px)"
        css={{ animation: "floatOrb 10s ease-in-out infinite" }}
      />
      <Box
        position="absolute"
        bottom="10%"
        left="5%"
        width="500px"
        height="500px"
        borderRadius="full"
        background="radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)"
        filter="blur(60px)"
        css={{ animation: "floatOrb 12s ease-in-out infinite 3s" }}
      />
      <Box
        position="absolute"
        top="40%"
        left="40%"
        width="300px"
        height="300px"
        borderRadius="full"
        background="radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)"
        filter="blur(40px)"
        css={{ animation: "floatOrb 8s ease-in-out infinite 1s" }}
      />

      <Container maxW="7xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={{ base: 12, md: 16 }}>
          {/* Header Section */}
          <Stack gap={6} textAlign="center" maxW="800px" mx="auto" align="center">
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
              <Text fontSize="xl">👨‍🏫</Text>
              <Text color="white" fontWeight="600" fontSize="sm">
                هيئة التدريس
              </Text>
            </Box>
            
            <Heading 
              size={{ base: "xl", md: "2xl" }}
              color="white"
              lineHeight="1.3"
              fontWeight="900"
            >
              <Text 
                as="span" 
                background="linear-gradient(135deg, #ffffff 0%, #c8a24a 50%, #ffffff 100%)"
                backgroundClip="text"
                css={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                تعلّم على أيدي نخبة من المعلمين
              </Text>
            </Heading>
            
            <Text color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9" maxW="650px">
              يقدم الدروس في منصة تبيان مجموعة من المعلمين المتخصصين والخبراء في مجالاتهم،
              المكرسين لتقديم تجربة تعليمية متميزة ومتابعة مستمرة لتحصيل الطلاب.
            </Text>
          </Stack>

          {/* Stats Section */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={5}>
            <AnimatedStat icon="👥" value={12} suffix="+" label="معلم متخصص" color="#c8a24a" />
            <AnimatedStat icon="📚" value={5} suffix="" label="برنامج تعليمي" color="#3b82f6" />
            <AnimatedStat icon="🎓" value={18} suffix="k+" label="طالب مستفيد" color="#10b981" />
            <AnimatedStat icon="⭐" value={4.9} suffix="" label="تقييم المعلمين" color="#f59e0b" />
          </SimpleGrid>

          {/* Teachers Grid */}
          <Stack gap={8}>
            <Flex align="center" justify="center" gap={3}>
              <Box h="2px" flex={1} maxW="100px" background="linear-gradient(90deg, transparent, #c8a24a)" />
              <Heading size="lg" color="white" textAlign="center">
                المعلمون والمعلمات
              </Heading>
              <Box h="2px" flex={1} maxW="100px" background="linear-gradient(90deg, #c8a24a, transparent)" />
            </Flex>
            
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={5}>
              {teachers.map((teacher, index) => {
                // Unique colors for each teacher
                const colors = [
                  { gradient: "linear-gradient(135deg, #c8a24a, #ffd700)", shadow: "#c8a24a" },
                  { gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)", shadow: "#3b82f6" },
                  { gradient: "linear-gradient(135deg, #10b981, #34d399)", shadow: "#10b981" },
                  { gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)", shadow: "#8b5cf6" },
                  { gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)", shadow: "#f59e0b" },
                  { gradient: "linear-gradient(135deg, #ec4899, #f472b6)", shadow: "#ec4899" },
                ];
                const color = colors[index % colors.length];
                
                return (
                  <Box
                    key={teacher.id}
                    position="relative"
                    role="group"
                    css={{ 
                      animation: `cardFloat 4s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                  >
                    {/* Card glow on hover */}
                    <Box
                      position="absolute"
                      inset="-2px"
                      borderRadius="2xl"
                      background={color.gradient}
                      opacity={0}
                      transition="opacity 0.4s ease"
                      _groupHover={{ opacity: 0.5 }}
                      filter="blur(15px)"
                    />
                    
                    <Box
                      position="relative"
                      bg="rgba(255, 255, 255, 0.03)"
                      backdropFilter="blur(20px)"
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="whiteAlpha.100"
                      p={6}
                      textAlign="center"
                      transition="all 0.4s ease"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.06)",
                        borderColor: `${color.shadow}50`,
                        transform: "translateY(-10px)",
                      }}
                    >
                      <Stack gap={4} align="center">
                        {/* Avatar */}
                        <Box position="relative">
                          <Box
                            position="absolute"
                            inset="-4px"
                            borderRadius="full"
                            background={color.gradient}
                            opacity={0.3}
                            filter="blur(8px)"
                            css={{ animation: "pulseGlow 3s ease-in-out infinite" }}
                          />
                          <Box
                            position="relative"
                            background={color.gradient}
                            color="white"
                            w="80px"
                            h="80px"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            fontWeight="800"
                            boxShadow={`0 8px 25px -5px ${color.shadow}60`}
                            transition="all 0.3s ease"
                            _groupHover={{ transform: "scale(1.1)" }}
                          >
                            {teacher.name.charAt(0)}
                          </Box>
                        </Box>
                        
                        {/* Name */}
                        <Heading size="md" color="white" fontWeight="700">
                          {teacher.name}
                        </Heading>
                        
                        {/* Role Badge */}
                        <Box
                          px={4}
                          py={1.5}
                          borderRadius="full"
                          bg="whiteAlpha.100"
                          borderWidth="1px"
                          borderColor="whiteAlpha.200"
                        >
                          <Text fontSize="xs" color="whiteAlpha.800" fontWeight="600">
                            معلم في تبيان
                          </Text>
                        </Box>

                        {/* Divider */}
                        <Box 
                          w="full" 
                          h="1px" 
                          background={`linear-gradient(90deg, transparent, ${color.shadow}50, transparent)`}
                        />

                        {/* Stats */}
                        <SimpleGrid columns={2} gap={4} w="100%">
                          <Box
                            p={3}
                            borderRadius="xl"
                            bg="whiteAlpha.50"
                            transition="all 0.3s ease"
                            _groupHover={{ bg: "whiteAlpha.100" }}
                          >
                            <Text 
                              fontSize="lg" 
                              fontWeight="800" 
                              background={color.gradient}
                              backgroundClip="text"
                              css={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            >
                              ⭐ 4.9
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.600">
                              التقييم
                            </Text>
                          </Box>
                          <Box
                            p={3}
                            borderRadius="xl"
                            bg="whiteAlpha.50"
                            transition="all 0.3s ease"
                            _groupHover={{ bg: "whiteAlpha.100" }}
                          >
                            <Text 
                              fontSize="lg" 
                              fontWeight="800" 
                              color="#10b981"
                            >
                              👥 500+
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.600">
                              طالب
                            </Text>
                          </Box>
                        </SimpleGrid>
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Stack>

          {/* CTA Section */}
          <Box
            position="relative"
            borderRadius="3xl"
            overflow="hidden"
            mt={8}
          >
            {/* Animated border */}
            <Box
              position="absolute"
              inset={0}
              borderRadius="3xl"
              p="2px"
              background="linear-gradient(135deg, #c8a24a, #00d4ff, #8b5cf6, #c8a24a)"
              backgroundSize="300% 300%"
              css={{ animation: "shimmerBorder 6s linear infinite" }}
            >
              <Box
                w="full"
                h="full"
                borderRadius="3xl"
                bg="brand.900"
              />
            </Box>

            <Box
              position="relative"
              bg="rgba(255, 255, 255, 0.02)"
              backdropFilter="blur(20px)"
              p={{ base: 10, md: 14 }}
              textAlign="center"
            >
              {/* Floating particles */}
              <Box
                position="absolute"
                top="20%"
                left="15%"
                w="8px"
                h="8px"
                borderRadius="full"
                bg="#c8a24a"
                opacity={0.5}
                css={{ animation: "floatOrb 4s ease-in-out infinite" }}
              />
              <Box
                position="absolute"
                bottom="30%"
                right="20%"
                w="6px"
                h="6px"
                borderRadius="full"
                bg="#00d4ff"
                opacity={0.5}
                css={{ animation: "floatOrb 5s ease-in-out infinite 1s" }}
              />

              <Stack gap={6} align="center" maxW="600px" mx="auto">
                <Box
                  position="relative"
                  w="80px"
                  h="80px"
                  borderRadius="2xl"
                  background="linear-gradient(135deg, #c8a24a, #ffd700)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="3xl"
                  boxShadow="0 10px 40px -10px rgba(200, 162, 74, 0.5)"
                >
                  <Box
                    position="absolute"
                    inset="-5px"
                    borderRadius="2xl"
                    background="linear-gradient(135deg, #c8a24a, #ffd700)"
                    opacity={0.3}
                    filter="blur(15px)"
                    css={{ animation: "pulseGlow 2s ease-in-out infinite" }}
                  />
                  <Text position="relative">🎓</Text>
                </Box>
                
                <Heading size="lg" color="white" fontWeight="800">
                  هل أنت معلم متخصص؟
                </Heading>
                
                <Text color="whiteAlpha.800" fontSize="lg" lineHeight="1.9">
                  انضم إلى فريق تبيان وشارك خبرتك مع آلاف الطلاب الراغبين في التعلم
                </Text>
                
                <Link href="/instructors/apply" style={{ textDecoration: "none" }}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-4px"
                      borderRadius="full"
                      background="linear-gradient(135deg, #c8a24a, #00d4ff)"
                      filter="blur(12px)"
                      opacity={0.5}
                      css={{ animation: "pulseGlow 2s ease-in-out infinite" }}
                    />
                    <Box
                      as="span"
                      position="relative"
                      display="inline-flex"
                      alignItems="center"
                      gap={2}
                      background="linear-gradient(135deg, #c8a24a, #ffd700)"
                      color="brand.900"
                      px={10}
                      py={4}
                      borderRadius="full"
                      fontWeight="800"
                      fontSize="lg"
                      cursor="pointer"
                      transition="all 0.3s ease"
                      _hover={{
                        transform: "translateY(-3px) scale(1.02)",
                        boxShadow: "0 15px 40px -10px rgba(200, 162, 74, 0.5)",
                      }}
                    >
                      ✨ انضم كمعلم
                    </Box>
                  </Box>
                </Link>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
