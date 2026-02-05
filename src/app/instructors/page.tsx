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
import { useTranslations } from "next-intl";

// Count up animation hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      // Initial state based on prop - legitimate setState in effect
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      bg="#050505"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.3)"
      boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
      textAlign="center"
      transition="all 0.4s ease"
      _hover={{
        bg: "#0A0A0A",
        transform: "translateY(-5px)",
        borderColor: "rgba(0, 255, 42, 0.6)",
        boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
      }}
      role="group"
    >
      <Stack gap={3} align="center">
        <Box
          w="60px"
          h="60px"
          borderRadius="xl"
          bg="#0A0A0A"
          border="1px solid"
          borderColor="rgba(0, 255, 42, 0.3)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2xl"
          transition="all 0.3s ease"
          _groupHover={{ transform: "scale(1.1) rotate(5deg)", borderColor: "rgba(0, 255, 42, 0.6)" }}
        >
          {icon}
        </Box>
        <Text 
          fontSize="3xl" 
          fontWeight="900" 
          color="#00FF2A"
        >
          {displayValue}
        </Text>
        <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="600">
          {label}
        </Text>
      </Stack>
    </Box>
  );
}

export default function InstructorsPage() {
  const t = useTranslations("instructorsPage");
  
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
        background="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
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
        background="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
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
        background="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(40px)"
        css={{ animation: "floatOrb 8s ease-in-out infinite 1s" }}
      />

      <Container maxW="7xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={{ base: 12, md: 16 }}>
          {/* Header Section */}
          <Stack 
            gap={6} 
            textAlign="center" 
            maxW="800px" 
            mx="auto" 
            align="center"
            p={{ base: 6, md: 10 }}
            borderRadius="2xl"
            bg="#050505"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
          >
            <Box
              display="inline-flex"
              alignItems="center"
              gap={2}
              px={5}
              py={2}
              borderRadius="full"
              bg="#0A0A0A"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              boxShadow="0 0 15px rgba(0, 255, 42, 0.2)"
            >
              <Text fontSize="xl">👨‍🏫</Text>
              <Text color="#00FF2A" fontWeight="600" fontSize="sm">
                {t("badge")}
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
                background="linear-gradient(135deg, #ffffff 0%, #00FF2A 50%, #ffffff 100%)"
                backgroundClip="text"
                css={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {t("title")}
              </Text>
            </Heading>
            
            <Text color="rgba(255, 255, 255, 0.85)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9" maxW="650px">
              {t("description")}
            </Text>
          </Stack>

          {/* Stats Section */}
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={5}>
            <AnimatedStat icon="👥" value={12} suffix="+" label={t("stats.specializedTeachers")} color="#00FF2A" />
            <AnimatedStat icon="📚" value={5} suffix="" label={t("stats.programs")} color="#00FF2A" />
            <AnimatedStat icon="🎓" value={0} suffix="" label={t("stats.enrolledStudents")} color="#00FF2A" />
          </SimpleGrid>

          {/* Teachers Grid */}
          <Stack gap={8}>
            <Flex align="center" justify="center" gap={3}>
              <Box h="2px" flex={1} maxW="100px" background="linear-gradient(90deg, transparent, #00FF2A)" />
              <Heading size="lg" color="white" textAlign="center">
                {t("teachersLabel")}
              </Heading>
              <Box h="2px" flex={1} maxW="100px" background="linear-gradient(90deg, #00FF2A, transparent)" />
            </Flex>
            
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={5}>
              {teachers.map((teacher, index) => {
                // Unique colors for each teacher
                const colors = [
                  { gradient: "linear-gradient(135deg, #00FF2A, #4DFF6A)", shadow: "#00FF2A" },
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
                      background="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                      opacity={0.3}
                      transition="opacity 0.4s ease"
                      _groupHover={{ opacity: 0.6 }}
                      filter="blur(15px)"
                    />
                    
                    <Box
                      position="relative"
                      bg="#050505"
                      backdropFilter="blur(20px)"
                      borderRadius="2xl"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.3)"
                      p={6}
                      textAlign="center"
                      transition="all 0.4s ease"
                      boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                      _hover={{
                        bg: "#0A0A0A",
                        borderColor: "#00FF2A",
                        transform: "translateY(-10px)",
                        boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
                      }}
                    >
                      <Stack gap={4} align="center">
                        {/* Avatar */}
                        <Box position="relative">
                          <Box
                            position="absolute"
                            inset="-4px"
                            borderRadius="full"
                            background="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                            opacity={0.3}
                            filter="blur(8px)"
                            css={{ animation: "pulseGlow 3s ease-in-out infinite" }}
                          />
                          <Box
                            position="relative"
                            background="#0A0A0A"
                            color="#00FF2A"
                            border="2px solid"
                            borderColor="#00FF2A"
                            w="80px"
                            h="80px"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            fontWeight="800"
                            boxShadow="0 0 20px rgba(0, 255, 42, 0.4)"
                            transition="all 0.3s ease"
                            _groupHover={{ transform: "scale(1.1)", boxShadow: "0 0 30px rgba(0, 255, 42, 0.6)" }}
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
                          bg="#0A0A0A"
                          border="1px solid"
                          borderColor="rgba(0, 255, 42, 0.3)"
                        >
                          <Text fontSize="xs" color="#00FF2A" fontWeight="600">
                            {t("teacherRole")}
                          </Text>
                        </Box>

                        {/* Divider */}
                        <Box 
                          w="full" 
                          h="1px" 
                          background="linear-gradient(90deg, transparent, rgba(0, 255, 42, 0.5), transparent)"
                        />

                        {/* Stats */}
                        <SimpleGrid columns={2} gap={4} w="100%">
                          <Box
                            p={3}
                            borderRadius="xl"
                            bg="rgba(0, 255, 42, 0.05)"
                            border="1px solid"
                            borderColor="rgba(0, 255, 42, 0.1)"
                            transition="all 0.3s ease"
                            _groupHover={{ bg: "rgba(0, 255, 42, 0.1)", borderColor: "rgba(0, 255, 42, 0.3)" }}
                          >
                            <Text 
                              fontSize="lg" 
                              fontWeight="800" 
                              color="#00FF2A"
                            >
                              ✓ {t("stats.certified")}
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.600">
                              {t("stats.qualifiedTeacher")}
                            </Text>
                          </Box>
                          <Box
                            p={3}
                            borderRadius="xl"
                            bg="rgba(0, 255, 42, 0.05)"
                            border="1px solid"
                            borderColor="rgba(0, 255, 42, 0.1)"
                            transition="all 0.3s ease"
                            _groupHover={{ bg: "rgba(0, 255, 42, 0.1)", borderColor: "rgba(0, 255, 42, 0.3)" }}
                          >
                            <Text 
                              fontSize="lg" 
                              fontWeight="800" 
                              color="#00FF2A"
                            >
                              👥 500+
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.600">
                              {t("stats.student")}
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
            boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), 0 0 90px rgba(0, 255, 42, 0.1)"
          >
            {/* Animated border */}
            <Box
              position="absolute"
              inset={0}
              borderRadius="3xl"
              p="2px"
              background="linear-gradient(135deg, #00FF2A, #4DFF6A, #00FF2A, #4DFF6A)"
              backgroundSize="300% 300%"
              css={{ animation: "shimmerBorder 6s linear infinite" }}
            >
              <Box
                w="full"
                h="full"
                borderRadius="3xl"
                bg="#000000"
              />
            </Box>

            <Box
              position="relative"
              bg="rgba(0, 0, 0, 0.95)"
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
                bg="#00FF2A"
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
                bg="#00FF2A"
                opacity={0.5}
                css={{ animation: "floatOrb 5s ease-in-out infinite 1s" }}
              />

              <Stack gap={6} align="center" maxW="600px" mx="auto">
                <Box
                  position="relative"
                  w="80px"
                  h="80px"
                  borderRadius="2xl"
                  background="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="3xl"
                  boxShadow="0 10px 40px -10px rgba(0, 255, 42, 0.5)"
                >
                  <Box
                    position="absolute"
                    inset="-5px"
                    borderRadius="2xl"
                    background="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                    opacity={0.3}
                    filter="blur(15px)"
                    css={{ animation: "pulseGlow 2s ease-in-out infinite" }}
                  />
                  <Text position="relative">🎓</Text>
                </Box>
                
                <Heading size="lg" color="white" fontWeight="800">
                  {t("cta.title")}
                </Heading>
                
                <Text color="whiteAlpha.800" fontSize="lg" lineHeight="1.9">
                  {t("cta.description")}
                </Text>
                
                <Link href="/instructors/apply" style={{ textDecoration: "none" }}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-4px"
                      borderRadius="full"
                      background="linear-gradient(135deg, #00FF2A, #00FF2A)"
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
                      background="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                      color="#000000"
                      px={10}
                      py={4}
                      borderRadius="full"
                      fontWeight="800"
                      fontSize="lg"
                      cursor="pointer"
                      transition="all 0.3s ease"
                      _hover={{
                        transform: "translateY(-3px) scale(1.02)",
                        boxShadow: "0 15px 40px -10px rgba(0, 255, 42, 0.5)",
                      }}
                    >
                      ✨ {t("cta.joinButton")}
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
