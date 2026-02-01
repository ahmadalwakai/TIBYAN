"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";
import FeatureCard from "@/components/ui/FeatureCard";
import InstructorVerification from "@/components/ui/InstructorVerification";
import SocialFeed from "@/components/ui/SocialFeed";

// Animated counter hook
function useCountUp(end: number, duration: number = 3000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

// Animated stat card component
function AnimatedStatCard({ 
  value, 
  label, 
  color, 
  icon, 
  suffix = "", 
  decimals = 0 
}: { 
  value: number; 
  label: string; 
  color: string; 
  icon: string; 
  suffix?: string;
  decimals?: number;
}) {
  const { count, ref } = useCountUp(decimals > 0 ? value * 10 : value, 3000);
  const displayValue = decimals > 0 ? (count / 10).toFixed(decimals) : count;

  return (
    <StatCard 
      accentColor={color} 
      p={4}
      transition="all 0.3s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "cardHover",
      }}
    >
      <Stack gap={1} align="center">
        <Text fontSize="lg">{icon}</Text>
        <Text 
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="900"
          color={color}
          letterSpacing="tight"
        >
          <span ref={ref}>{displayValue}{suffix}</span>
        </Text>
        <Text fontSize="xs" color="muted" fontWeight="700">
          {label}
        </Text>
      </Stack>
    </StatCard>
  );
}

export default function Home() {
  const t = useTranslations("home");
  
  return (
    <Box 
      as="main" 
      bg="background" 
      minH="100vh" 
      position="relative"
      css={{
        "@keyframes heroFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "@keyframes textGlow": {
          "0%, 100%": { textShadow: "0 0 20px rgba(200, 162, 74, 0.3)" },
          "50%": { textShadow: "0 0 40px rgba(200, 162, 74, 0.6)" },
        },
        "@keyframes gradientShift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "@keyframes sparkle": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.5, transform: "scale(1.2)" },
        },
      }}
    >
      {/* Hero Background Decorations */}
      <Box
        position="absolute"
        top="5%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(200, 162, 74, 0.08) 0%, transparent 70%)"
        filter="blur(40px)"
        pointerEvents="none"
        css={{ animation: "heroFloat 8s ease-in-out infinite" }}
      />
      <Box
        position="absolute"
        top="20%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, transparent 70%)"
        filter="blur(30px)"
        pointerEvents="none"
        css={{ animation: "heroFloat 10s ease-in-out infinite reverse" }}
      />

      {/* Hero Section with Video Background */}
      <Box 
        position="relative" 
        minH={{ base: "100vh", md: "95vh" }}
        overflow="hidden"
      >
        {/* Video Background - decorative, no audio content */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={(e) => {
            // Fallback: hide video if it fails to load
            e.currentTarget.style.display = 'none';
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          {/* Captions track for accessibility compliance - video is decorative/muted */}
          <track kind="captions" src="/videos/hero-captions.vtt" srcLang="ar" label="Arabic" default />
        </video>

        {/* Fallback Background (shows if video fails) */}
        <Box
          position="absolute"
          inset={0}
          zIndex={-1}
          bg="linear-gradient(135deg, #0a1628 0%, #0b1f3b 25%, #1a365d 50%, #0b1f3b 75%, #0a1628 100%)"
          backgroundSize="400% 400%"
          css={{
            animation: "gradientShift 20s ease infinite",
          }}
        />

        {/* Animated Particles/Stars Background */}
        <Box
          position="absolute"
          inset={0}
          zIndex={1}
          overflow="hidden"
          pointerEvents="none"
        >
          {/* Floating orbs */}
          <Box
            position="absolute"
            top="10%"
            right="15%"
            w={{ base: "150px", md: "250px" }}
            h={{ base: "150px", md: "250px" }}
            borderRadius="full"
            bg="radial-gradient(circle, rgba(200, 162, 74, 0.15) 0%, transparent 70%)"
            filter="blur(40px)"
            css={{ animation: "heroFloat 8s ease-in-out infinite" }}
          />
          <Box
            position="absolute"
            top="60%"
            left="10%"
            w={{ base: "100px", md: "200px" }}
            h={{ base: "100px", md: "200px" }}
            borderRadius="full"
            bg="radial-gradient(circle, rgba(0, 212, 255, 0.12) 0%, transparent 70%)"
            filter="blur(35px)"
            css={{ animation: "heroFloat 12s ease-in-out infinite reverse" }}
          />
          <Box
            position="absolute"
            bottom="20%"
            right="25%"
            w={{ base: "80px", md: "150px" }}
            h={{ base: "80px", md: "150px" }}
            borderRadius="full"
            bg="radial-gradient(circle, rgba(200, 162, 74, 0.1) 0%, transparent 70%)"
            filter="blur(30px)"
            css={{ animation: "heroFloat 10s ease-in-out infinite 2s" }}
          />
        </Box>

        {/* Dark Overlay for Readability */}
        <Box
          position="absolute"
          inset={0}
          zIndex={2}
          bg="linear-gradient(180deg, rgba(10, 22, 40, 0.65) 0%, rgba(11, 31, 59, 0.7) 40%, rgba(10, 22, 40, 0.75) 70%, rgba(10, 22, 40, 0.85) 100%)"
          backdropFilter="blur(1px)"
          pointerEvents="none"
        />

        {/* Gradient Overlay for Smooth Transition */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="50%"
          zIndex={3}
          bg="linear-gradient(to top, var(--chakra-colors-background) 0%, var(--chakra-colors-background) 5%, rgba(245, 243, 240, 0.95) 15%, rgba(245, 243, 240, 0.7) 30%, rgba(10, 22, 40, 0.4) 60%, transparent 100%)"
          pointerEvents="none"
        />

        {/* Hero Content */}
        <Container 
          maxW="7xl" 
          py={{ base: 20, md: 32 }} 
          px={{ base: 6, md: 8 }} 
          position="relative"
          zIndex={4}
          h="100%"
          display="flex"
          alignItems="center"
        >
          <Stack gap={{ base: 8, md: 10 }} textAlign="center" w="100%" align="center">
            {/* Animated Badge */}
            <Badge
              position="relative"
              overflow="hidden"
              bg="transparent"
              color="white"
              px={{ base: 5, md: 8 }}
              py={{ base: 2, md: 3 }}
              borderRadius="full"
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="700"
              letterSpacing="wide"
              css={{
                background: "linear-gradient(135deg, rgba(11, 31, 59, 0.9), rgba(26, 54, 93, 0.9))",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "full",
                  padding: "2px",
                  background: "linear-gradient(135deg, #c8a24a, #ffd700, #c8a24a, #00d4ff, #c8a24a)",
                  backgroundSize: "300% 300%",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  animation: "gradientShift 4s ease infinite",
                },
              }}
            >
              {t("heroBadge")}
            </Badge>

            {/* Main Title Block */}
            <Stack gap={{ base: 4, md: 6 }} align="center">
              {/* Platform Name - Calligraphic Style */}
              <Box position="relative">
                <Heading
                  as="h1"
                  fontWeight="900"
                  fontSize={{ base: "5xl", md: "7xl", lg: "8xl" }}
                  letterSpacing="-0.02em"
                  lineHeight="1"
                  fontFamily="var(--font-ibm-plex)"
                  css={{
                    background: "linear-gradient(180deg, #ffffff 0%, #f0f0f0 40%, #c8a24a 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    textShadow: "0 0 80px rgba(200, 162, 74, 0.5)",
                    filter: "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))",
                  }}
                >
                  {t("platformName")}
                </Heading>
                {/* Decorative underline */}
                <Box
                  position="absolute"
                  bottom={{ base: "-8px", md: "-12px" }}
                  left="50%"
                  transform="translateX(-50%)"
                  w={{ base: "60%", md: "50%" }}
                  h={{ base: "3px", md: "4px" }}
                  borderRadius="full"
                  background="linear-gradient(90deg, transparent, #c8a24a, #ffd700, #c8a24a, transparent)"
                  css={{
                    animation: "sparkle 3s ease-in-out infinite",
                  }}
                />
              </Box>

              {/* Hero Title & Subtitle */}
              <Stack gap={2} align="center" pt={{ base: 4, md: 6 }}>
                <Heading 
                  as="h2"
                  size={{ base: "2xl", md: "3xl", lg: "4xl" }}
                  lineHeight="1.2"
                  fontWeight="800"
                  color="white"
                  textShadow="0 2px 20px rgba(0, 0, 0, 0.5)"
                >
                  {t("heroTitle")}
                </Heading>
                <Text
                  fontSize={{ base: "lg", md: "2xl", lg: "3xl" }}
                  fontWeight="600"
                  css={{
                    background: "linear-gradient(135deg, #c8a24a 0%, #ffd700 50%, #c8a24a 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("heroSubtitle")}
                </Text>
              </Stack>
            </Stack>

            {/* Description */}
            <Text 
              color="gray.300" 
              fontSize={{ base: "md", md: "lg", lg: "xl" }} 
              lineHeight="1.9" 
              maxW="800px"
              px={{ base: 2, md: 0 }}
              dangerouslySetInnerHTML={{ __html: t.raw("heroDescription") }}
              css={{
                "& strong": {
                  color: "#c8a24a",
                  fontWeight: 700,
                },
              }}
            />

            {/* CTA Buttons */}
            <Stack
              direction={{ base: "column", sm: "row" }}
              gap={{ base: 4, md: 5 }}
              pt={{ base: 4, md: 6 }}
              w={{ base: "100%", sm: "auto" }}
            >
              {/* Primary Button with Glow - High Intent CTA */}
              <Box position="relative">
                <Box
                  position="absolute"
                  inset="-6px"
                  borderRadius="2xl"
                  background="linear-gradient(135deg, #c8a24a, #ffd700, #c8a24a)"
                  filter="blur(20px)"
                  opacity={0.5}
                  pointerEvents="none"
                  css={{ animation: "sparkle 3s ease-in-out infinite" }}
                />
                <Button
                  asChild
                  position="relative"
                  bg="linear-gradient(135deg, #c8a24a 0%, #b8943a 100%)"
                  color="brand.900"
                  size="lg"
                  px={{ base: 8, md: 12 }}
                  h={{ base: "56px", md: "64px" }}
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="800"
                  borderRadius="xl"
                  boxShadow="0 8px 30px rgba(200, 162, 74, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                  _hover={{ 
                    bg: "linear-gradient(135deg, #d4b05a 0%, #c8a24a 100%)",
                    transform: "translateY(-4px) scale(1.02)",
                    boxShadow: "0 16px 50px rgba(200, 162, 74, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                  }}
                  _active={{
                    transform: "translateY(-2px) scale(1.01)",
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Link href="/assessment">{t("startAssessment")}</Link>
                </Button>
              </Box>

              {/* Secondary Button */}
              <Button
                asChild
                variant="outline"
                borderWidth="2px"
                borderColor="rgba(200, 162, 74, 0.5)"
                color="white"
                size="lg"
                px={{ base: 8, md: 12 }}
                h={{ base: "56px", md: "64px" }}
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="700"
                borderRadius="xl"
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                _hover={{ 
                  bg: "rgba(200, 162, 74, 0.15)",
                  borderColor: "#c8a24a",
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 30px rgba(200, 162, 74, 0.2)",
                }}
                _active={{
                  transform: "translateY(-2px)",
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                w={{ base: "100%", sm: "auto" }}
              >
                <Link href="/programs">{t("explorePrograms")}</Link>
              </Button>
            </Stack>
            
            {/* Stats Grid */}
            <SimpleGrid
              columns={3}
              gap={{ base: 3, md: 6 }}
              pt={{ base: 8, md: 12 }}
              w="100%"
              maxW="700px"
            >
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                border="1px solid"
                borderColor="rgba(200, 162, 74, 0.2)"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.08)",
                  borderColor: "rgba(200, 162, 74, 0.4)",
                  transform: "translateY(-4px)",
                }}
              >
                <Stack gap={1} align="center">
                  <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="900" color="white">+5</Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.400" fontWeight="600">{t("stats.programs")}</Text>
                </Stack>
              </Box>
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                border="1px solid"
                borderColor="rgba(200, 162, 74, 0.2)"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.08)",
                  borderColor: "rgba(200, 162, 74, 0.4)",
                  transform: "translateY(-4px)",
                }}
              >
                <Stack gap={1} align="center">
                  <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="900" color="white">معتمد</Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.400" fontWeight="600">{t("stats.certified")}</Text>
                </Stack>
              </Box>
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                border="1px solid"
                borderColor="rgba(200, 162, 74, 0.2)"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.08)",
                  borderColor: "rgba(200, 162, 74, 0.4)",
                  transform: "translateY(-4px)",
                }}
              >
                <Stack gap={1} align="center">
                  <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="900" color="#c8a24a">مختصون</Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.400" fontWeight="600">{t("stats.expertInstructors")}</Text>
                </Stack>
              </Box>
            </SimpleGrid>

            {/* Scroll indicator - Premium Design */}
            <Box
              pt={{ base: 6, md: 10 }}
            >
              <Box
                as="button"
                onClick={() => {
                  document.getElementById('content-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                position="relative"
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={3}
                cursor="pointer"
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                px={6}
                py={4}
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(200, 162, 74, 0.2)"
                transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: "rgba(200, 162, 74, 0.1)",
                  borderColor: "rgba(200, 162, 74, 0.5)",
                  transform: "translateY(-4px)",
                  boxShadow: "0 20px 40px rgba(200, 162, 74, 0.2)",
                }}
                css={{
                  animation: "floatButton 3s ease-in-out infinite",
                  "@keyframes floatButton": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-8px)" },
                  },
                  "&:hover": {
                    animation: "none",
                  },
                }}
              >
                {/* Glow effect */}
                <Box
                  position="absolute"
                  inset="-1px"
                  borderRadius="2xl"
                  bg="linear-gradient(135deg, rgba(200, 162, 74, 0.3), transparent, rgba(200, 162, 74, 0.3))"
                  filter="blur(8px)"
                  opacity={0.5}
                  pointerEvents="none"
                  css={{
                    animation: "glowPulse 2s ease-in-out infinite",
                    "@keyframes glowPulse": {
                      "0%, 100%": { opacity: 0.3 },
                      "50%": { opacity: 0.6 },
                    },
                  }}
                />
                
                <Text 
                  fontSize="sm" 
                  fontWeight="600" 
                  color="white"
                  letterSpacing="wide"
                  position="relative"
                >
                  استكشف المزيد
                </Text>
                
                {/* Animated chevrons */}
                <Box position="relative" h="32px" w="24px">
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      position="absolute"
                      left="50%"
                      transform="translateX(-50%)"
                      top={`${i * 10}px`}
                      css={{
                        animation: `chevronBounce 1.5s ease-in-out infinite ${i * 0.15}s`,
                        "@keyframes chevronBounce": {
                          "0%, 100%": { opacity: 0.3, transform: "translateX(-50%) translateY(0)" },
                          "50%": { opacity: 1, transform: "translateX(-50%) translateY(4px)" },
                        },
                      }}
                    >
                      <svg 
                        width="16" 
                        height="10" 
                        viewBox="0 0 16 10" 
                        fill="none"
                      >
                        <path 
                          d="M1 1L8 8L15 1" 
                          stroke="#c8a24a" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Seamless Transition Zone */}
      <Box
        id="content-section"
        position="relative"
        mt="-120px"
        pt="120px"
        bg="background"
        zIndex={5}
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: "linear-gradient(to bottom, transparent 0%, var(--chakra-colors-background) 100%)",
          pointerEvents: "none",
        }}
      >
        {/* Subtle decorative elements for depth */}
        <Box
          position="absolute"
          top="60px"
          left="10%"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(200, 162, 74, 0.06) 0%, transparent 70%)"
          filter="blur(40px)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          top="100px"
          right="15%"
          w="150px"
          h="150px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(0, 212, 255, 0.04) 0%, transparent 70%)"
          filter="blur(30px)"
          pointerEvents="none"
        />

      {/* Rest of Page Content */}
      <Container maxW="7xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative">
        <Stack gap={{ base: 16, md: 20 }}>
          
          {/* Community Posts Section - First thing after hero */}
          <Box
            position="relative"
            py={{ base: 8, md: 12 }}
            bg="background"
            borderRadius="3xl"
            boxShadow="0 -20px 60px rgba(0, 0, 0, 0.03)"
            mx={{ base: -4, md: -6 }}
            px={{ base: 4, md: 6 }}
          >
            <Stack gap={8}>
              {/* Section Header */}
              <Stack gap={4} textAlign="center" align="center">
                <Badge
                  bg="linear-gradient(135deg, rgba(200, 162, 74, 0.2), rgba(0, 212, 255, 0.2))"
                  color="brand.500"
                  px={6}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                  border="1px solid"
                  borderColor="rgba(200, 162, 74, 0.3)"
                >
                  {t("socialBadge")}
                </Badge>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  css={{
                    background: "linear-gradient(135deg, #0b1f3b 0%, #c8a24a 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("socialTitle")}
                </Heading>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} maxW="600px">
                  {t("socialDescription")}
                </Text>
              </Stack>

              {/* Social Feed Component */}
              <Box maxW="4xl" mx="auto" w="100%">
                <SocialFeed showTitle={false} maxPosts={3} />
              </Box>

              {/* View All Button */}
              <Flex justify="center" pt={4}>
                <Button
                  asChild
                  size="lg"
                  bg="linear-gradient(135deg, #c8a24a 0%, #b8943a 100%)"
                  color="brand.900"
                  px={8}
                  fontWeight="700"
                  borderRadius="xl"
                  boxShadow="0 4px 20px rgba(200, 162, 74, 0.3)"
                  _hover={{
                    bg: "linear-gradient(135deg, #d4b05a 0%, #c8a24a 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 30px rgba(200, 162, 74, 0.4)",
                  }}
                  transition="all 0.3s ease"
                >
                  <Link href="/social">{t("viewAllPosts")} →</Link>
                </Button>
              </Flex>
            </Stack>
          </Box>

          {/* Features Highlight Section */}
          <Box
            position="relative"
            borderRadius="2xl"
            overflow="hidden"
            css={{
              "@keyframes floatCard": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-8px)" },
              },
              "@keyframes glowPulse": {
                "0%, 100%": { boxShadow: "0 0 20px rgba(200, 162, 74, 0.3)" },
                "50%": { boxShadow: "0 0 40px rgba(200, 162, 74, 0.5)" },
              },
              "@keyframes iconBounce": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
              },
            }}
          >
            {/* Animated border */}
            <Box
              position="absolute"
              inset="-2px"
              borderRadius="2xl"
              background="linear-gradient(135deg, #c8a24a, #0b1f3b, #00d4ff, #0b1f3b, #c8a24a)"
              backgroundSize="400% 400%"
              css={{
                animation: "gradient 8s ease infinite",
                "@keyframes gradient": {
                  "0%": { backgroundPosition: "0% 50%" },
                  "50%": { backgroundPosition: "100% 50%" },
                  "100%": { backgroundPosition: "0% 50%" },
                },
              }}
            />
            
            <Box
              position="relative"
              bg="linear-gradient(135deg, rgba(11, 31, 59, 0.97), rgba(11, 31, 59, 0.92))"
              borderRadius="xl"
              m="2px"
              p={{ base: 8, md: 12 }}
            >
              {/* Background decorations */}
              <Box
                position="absolute"
                top="10%"
                right="5%"
                w="200px"
                h="200px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(200, 162, 74, 0.1) 0%, transparent 70%)"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="10%"
                left="5%"
                w="150px"
                h="150px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)"
                pointerEvents="none"
              />

              <Stack gap={10} position="relative" zIndex={1}>
                {/* Section Header */}
                <Stack gap={3} textAlign="center">
                  <Text color="brand.500" fontWeight="700" fontSize="sm" letterSpacing="wider">
                    {t("whyTibyan")}
                  </Text>
                  <Heading 
                    size={{ base: "lg", md: "xl" }} 
                    color="white"
                    css={{
                      background: "linear-gradient(135deg, #ffffff 0%, #c8a24a 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {t("featuresTitle")}
                  </Heading>
                </Stack>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                  {[
                    {
                      title: t("features.academicCommitment.title"),
                      text: t("features.academicCommitment.description"),
                      icon: "📚",
                      gradient: "linear-gradient(135deg, #c8a24a, #ffd700)",
                      delay: "0s",
                    },
                    {
                      title: t("features.questionBank.title"),
                      text: t("features.questionBank.description"),
                      icon: "🎯",
                      gradient: "linear-gradient(135deg, #00d4ff, #0099ff)",
                      delay: "0.2s",
                    },
                    {
                      title: t("features.interactiveCommunity.title"),
                      text: t("features.interactiveCommunity.description"),
                      icon: "💬",
                      gradient: "linear-gradient(135deg, #00ff88, #00cc6a)",
                      delay: "0.4s",
                    },
                  ].map((card) => (
                    <Box
                      key={card.title}
                      position="relative"
                      bg="rgba(255, 255, 255, 0.03)"
                      backdropFilter="blur(10px)"
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      p={6}
                      transition="all 0.4s ease"
                      css={{
                        animation: `floatCard 4s ease-in-out infinite`,
                        animationDelay: card.delay,
                      }}
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.08)",
                        borderColor: "rgba(200, 162, 74, 0.4)",
                        transform: "translateY(-12px) scale(1.02)",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {/* Glow effect on hover */}
                      <Box
                        position="absolute"
                        inset="-1px"
                        borderRadius="xl"
                        background={card.gradient}
                        opacity={0}
                        filter="blur(15px)"
                        transition="opacity 0.4s ease"
                        css={{
                          "[data-hover] &, :hover > &": { opacity: 0.3 },
                        }}
                        pointerEvents="none"
                      />

                      <Stack gap={4} align="center" textAlign="center" position="relative">
                        {/* Icon with animated background */}
                        <Box position="relative">
                          <Box
                            position="absolute"
                            inset="-8px"
                            borderRadius="full"
                            background={card.gradient}
                            filter="blur(12px)"
                            opacity={0.4}
                            css={{ animation: "glowPulse 3s ease-in-out infinite" }}
                          />
                          <Box
                            position="relative"
                            bg={card.gradient}
                            w="72px"
                            h="72px"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            boxShadow="0 8px 24px rgba(0, 0, 0, 0.3)"
                            transition="transform 0.3s ease"
                            _hover={{ transform: "scale(1.1)" }}
                          >
                            {card.icon}
                          </Box>
                        </Box>

                        <Heading 
                          size="md" 
                          color="white"
                          fontWeight="800"
                        >
                          {card.title}
                        </Heading>

                        <Text 
                          color="whiteAlpha.800" 
                          lineHeight="1.9"
                          fontSize="sm"
                        >
                          {card.text}
                        </Text>

                        {/* Bottom accent line */}
                        <Box
                          w="40px"
                          h="3px"
                          borderRadius="full"
                          background={card.gradient}
                          opacity={0.6}
                          transition="width 0.3s ease"
                          _groupHover={{ w: "60px" }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Stack>
            </Box>
          </Box>

          {/* Advisory Board Section - New Authority Section */}
          <Box
            position="relative"
            py={8}
            css={{
              "@keyframes advisorFloat": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-8px)" },
              },
              "@keyframes goldGlow": {
                "0%, 100%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)" },
                "50%": { boxShadow: "0 0 40px rgba(212, 175, 55, 0.5)" },
              },
            }}
          >
            <Stack gap={10} textAlign="center">
              <Stack gap={5} align="center" maxW="800px" mx="auto">
                <Badge
                  bg="linear-gradient(135deg, #D4AF37, #F7DC6F)"
                  color="#0B1F3A"
                  px={6}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="800"
                  boxShadow="0 4px 15px rgba(212, 175, 55, 0.4)"
                >
                  {t("advisoryBadge")}
                </Badge>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  css={{
                    background: "linear-gradient(135deg, #0b1f3b 0%, #D4AF37 50%, #0b1f3b 100%)",
                    backgroundSize: "200% auto",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("advisoryTitle")}
                </Heading>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  {t("advisorySubtitle")}
                </Text>
              </Stack>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {[
                  { key: "scholar1", icon: "👨‍🎓", gradient: "linear-gradient(135deg, #D4AF37, #F7DC6F)" },
                  { key: "scholar2", icon: "📖", gradient: "linear-gradient(135deg, #0b1f3b, #1a365d)" },
                  { key: "scholar3", icon: "✨", gradient: "linear-gradient(135deg, #800020, #B85450)" },
                ].map((advisor, index) => (
                  <Box
                    key={advisor.key}
                    position="relative"
                    bg="surface"
                    borderRadius="2xl"
                    overflow="hidden"
                    transition="all 0.4s ease"
                    css={{
                      animation: `advisorFloat 5s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                    _hover={{
                      transform: "translateY(-12px) scale(1.02)",
                      boxShadow: "0 25px 50px -12px rgba(212, 175, 55, 0.25)",
                    }}
                  >
                    {/* Gold border accent */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      h="4px"
                      background={advisor.gradient}
                    />
                    <Stack p={8} gap={4} align="center">
                      {/* Avatar placeholder with glow */}
                      <Box position="relative">
                        <Box
                          position="absolute"
                          inset="-8px"
                          borderRadius="full"
                          background={advisor.gradient}
                          filter="blur(15px)"
                          opacity={0.4}
                          css={{ animation: "goldGlow 3s ease-in-out infinite" }}
                        />
                        <Box
                          position="relative"
                          w="100px"
                          h="100px"
                          borderRadius="full"
                          background={advisor.gradient}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="3xl"
                          boxShadow="0 8px 24px rgba(0, 0, 0, 0.2)"
                        >
                          {advisor.icon}
                        </Box>
                      </Box>
                      <Stack gap={1} align="center">
                        <Heading size="md" color="text">
                          {t(`advisors.${advisor.key}.name`)}
                        </Heading>
                        <Text fontSize="sm" fontWeight="700" color="brand.500">
                          {t(`advisors.${advisor.key}.title`)}
                        </Text>
                        <Text fontSize="sm" color="muted" textAlign="center">
                          {t(`advisors.${advisor.key}.bio`)}
                        </Text>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          </Box>

          {/* Elegant Divider */}
          <Box 
            h="1px" 
            bg="linear-gradient(90deg, transparent, #D4AF37, transparent)"
            borderRadius="full"
          />

          {/* Tibyan 5-Step Mastery Method Section */}
          <Box
            position="relative"
            py={8}
            css={{
              "@keyframes stepPulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.05)" },
              },
              "@keyframes lineGrow": {
                "0%": { width: "0%" },
                "100%": { width: "100%" },
              },
            }}
          >
            <Stack gap={12} textAlign="center">
              <Stack gap={5} align="center" maxW="800px" mx="auto">
                <Badge
                  bg="linear-gradient(135deg, #0b1f3b, #1a365d)"
                  color="white"
                  px={6}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="800"
                  boxShadow="0 4px 15px rgba(11, 31, 59, 0.4)"
                  css={{
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "full",
                      padding: "2px",
                      background: "linear-gradient(135deg, #D4AF37, #F7DC6F)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                    },
                  }}
                  position="relative"
                  overflow="hidden"
                >
                  {t("methodologyBadge")}
                </Badge>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  css={{
                    background: "linear-gradient(135deg, #D4AF37 0%, #0b1f3b 50%, #D4AF37 100%)",
                    backgroundSize: "200% auto",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("methodologyTitle")}
                </Heading>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  {t("methodologySubtitle")}
                </Text>
              </Stack>

              {/* 5-Step Timeline */}
              <Box position="relative" px={{ base: 4, md: 8 }}>
                {/* Connection line - hidden on mobile */}
                <Box
                  display={{ base: "none", md: "block" }}
                  position="absolute"
                  top="60px"
                  left="10%"
                  right="10%"
                  h="4px"
                  bg="linear-gradient(90deg, #D4AF37, #0b1f3b, #00d4ff, #0b1f3b, #D4AF37)"
                  borderRadius="full"
                  zIndex={0}
                />

                <SimpleGrid columns={{ base: 1, md: 5 }} gap={{ base: 6, md: 4 }}>
                  {[
                    { step: "step1", icon: "🏗️", color: "#D4AF37" },
                    { step: "step2", icon: "💡", color: "#00d4ff" },
                    { step: "step3", icon: "⚡", color: "#10b981" },
                    { step: "step4", icon: "📊", color: "#f59e0b" },
                    { step: "step5", icon: "🏆", color: "#D4AF37" },
                  ].map((item, index) => (
                    <Stack
                      key={item.step}
                      align="center"
                      gap={4}
                      position="relative"
                      zIndex={1}
                    >
                      {/* Step number circle */}
                      <Box position="relative">
                        <Box
                          position="absolute"
                          inset="-6px"
                          borderRadius="full"
                          bg={item.color}
                          filter="blur(12px)"
                          opacity={0.4}
                        />
                        <Box
                          position="relative"
                          w="80px"
                          h="80px"
                          borderRadius="full"
                          bg="surface"
                          borderWidth="4px"
                          borderColor={item.color}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="2xl"
                          boxShadow={`0 8px 24px ${item.color}40`}
                          transition="all 0.3s ease"
                          _hover={{ transform: "scale(1.1)" }}
                        >
                          {item.icon}
                        </Box>
                        {/* Step number badge */}
                        <Box
                          position="absolute"
                          top="-4px"
                          right="-4px"
                          w="28px"
                          h="28px"
                          borderRadius="full"
                          bg={item.color}
                          color="white"
                          fontSize="sm"
                          fontWeight="900"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 12px rgba(0,0,0,0.2)"
                        >
                          {index + 1}
                        </Box>
                      </Box>
                      <Stack gap={1} align="center">
                        <Text fontWeight="800" color="text" fontSize="md">
                          {t(`methodologySteps.${item.step}.title`)}
                        </Text>
                        <Text fontSize="xs" color="muted" textAlign="center" maxW="160px">
                          {t(`methodologySteps.${item.step}.description`)}
                        </Text>
                      </Stack>
                    </Stack>
                  ))}
                </SimpleGrid>
              </Box>
            </Stack>
          </Box>

          {/* Elegant Divider */}
          <Box 
            h="1px" 
            bg="linear-gradient(90deg, transparent, #D4AF37, transparent)"
            borderRadius="full"
          />

          {/* Educational Programs Section - Enhanced */}
          <Box
            position="relative"
            py={4}
            css={{
              "@keyframes slideIn": {
                "0%": { opacity: 0, transform: "translateY(30px)" },
                "100%": { opacity: 1, transform: "translateY(0)" },
              },
              "@keyframes cardFloat": {
                "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
                "50%": { transform: "translateY(-10px) rotate(1deg)" },
              },
              "@keyframes shimmerText": {
                "0%": { backgroundPosition: "200% center" },
                "100%": { backgroundPosition: "-200% center" },
              },
              "@keyframes borderGlow": {
                "0%, 100%": { opacity: 0.5 },
                "50%": { opacity: 1 },
              },
            }}
          >
            <Stack gap={10} textAlign={{ base: "center", md: "start" }}>
              {/* Section Header */}
              <Stack gap={5} align={{ base: "center", md: "flex-start" }} maxW="750px">
                <Badge
                  position="relative"
                  overflow="hidden"
                  bg="transparent"
                  color="white"
                  px={5}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                  css={{
                    background: "linear-gradient(135deg, #0b1f3b, #1a365d)",
                    boxShadow: "0 4px 15px rgba(11, 31, 59, 0.3)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "full",
                      padding: "2px",
                      background: "linear-gradient(135deg, #c8a24a, #00d4ff, #c8a24a)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                      animation: "borderGlow 3s ease-in-out infinite",
                    },
                  }}
                >
                  {t("programsBadge")}
                </Badge>
                <Heading 
                  size={{ base: "lg", md: "xl" }} 
                  lineHeight="1.3"
                  css={{
                    background: "linear-gradient(90deg, #0b1f3b, #c8a24a, #0b1f3b, #c8a24a)",
                    backgroundSize: "200% auto",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    animation: "shimmerText 6s linear infinite",
                  }}
                >
                  {t("programsTitle")}
                </Heading>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  {t("programsDescription")}
                </Text>
              </Stack>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {[
                  { 
                    title: t("programsList.preparatory.title"), 
                    desc: t("programsList.preparatory.description"),
                    icon: "🎓", 
                    gradient: "linear-gradient(135deg, #0b1f3b, #1a365d)",
                    accentGradient: "linear-gradient(135deg, #c8a24a, #ffd700)",
                    sessions: t("programsList.preparatory.sessions"),
                    delay: "0s",
                    slug: "preparatory-year",
                  },
                  { 
                    title: t("programsList.shariah.title"), 
                    desc: t("programsList.shariah.description"),
                    icon: "📖", 
                    gradient: "linear-gradient(135deg, #065f46, #047857)",
                    accentGradient: "linear-gradient(135deg, #00ff88, #10b981)",
                    sessions: t("programsList.shariah.sessions"),
                    delay: "0.15s",
                    slug: "shariah-track",
                  },
                  { 
                    title: t("programsList.arabicReading.title"), 
                    desc: t("programsList.arabicReading.description"),
                    icon: "✍️", 
                    gradient: "linear-gradient(135deg, #92400e, #b45309)",
                    accentGradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    sessions: t("programsList.arabicReading.sessions"),
                    delay: "0.3s",
                    slug: "arabic-reading",
                  },
                ].map((item) => (
                  <Link key={item.title} href={`/programs#${item.slug}`} style={{ textDecoration: "none" }}>
                    <Box
                      position="relative"
                      borderRadius="2xl"
                      overflow="hidden"
                      cursor="pointer"
                      css={{
                        animation: `cardFloat 5s ease-in-out infinite`,
                        animationDelay: item.delay,
                      }}
                    >
                    {/* Animated border */}
                    <Box
                      position="absolute"
                      inset="-2px"
                      borderRadius="2xl"
                      background={item.accentGradient}
                      opacity={0.6}
                      transition="opacity 0.4s ease"
                      css={{
                        animation: "borderGlow 3s ease-in-out infinite",
                      }}
                    />
                    
                    <Box
                      position="relative"
                      bg="surface"
                      borderRadius="xl"
                      m="2px"
                      p={8}
                      transition="all 0.4s ease"
                      _hover={{
                        transform: "translateY(-12px) scale(1.02)",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      <Stack gap={5}>
                        {/* Header with icon and badge */}
                        <Flex align="center" justify="space-between">
                          <Box position="relative">
                            {/* Icon glow */}
                            <Box
                              position="absolute"
                              inset="-6px"
                              borderRadius="xl"
                              background={item.accentGradient}
                              filter="blur(12px)"
                              opacity={0.4}
                            />
                            <Box
                              position="relative"
                              background={item.gradient}
                              color="white"
                              w="64px"
                              h="64px"
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="2xl"
                              boxShadow="0 8px 20px rgba(0, 0, 0, 0.2)"
                              transition="transform 0.3s ease"
                              _hover={{ transform: "scale(1.1) rotate(5deg)" }}
                            >
                              {item.icon}
                            </Box>
                          </Box>
                          <Badge
                            background={item.accentGradient}
                            color="white"
                            px={4}
                            py={2}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="800"
                            boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
                          >
                            {item.sessions}
                          </Badge>
                        </Flex>

                        {/* Content */}
                        <Box>
                          <Heading 
                            size="md" 
                            mb={3}
                            css={{
                              background: item.gradient,
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              color: "transparent",
                            }}
                          >
                            {item.title}
                          </Heading>
                          <Text color="muted" fontSize="sm" lineHeight="1.8">
                            {item.desc}
                          </Text>
                        </Box>

                        {/* Bottom accent */}
                        <Box
                          h="4px"
                          background={item.accentGradient}
                          borderRadius="full"
                          w="50px"
                          transition="width 0.4s ease"
                          _groupHover={{ w: "80px" }}
                        />

                        {/* Learn more indicator */}
                        <Flex 
                          align="center" 
                          gap={2}
                          color="muted"
                          fontSize="sm"
                          fontWeight="600"
                          aria-hidden="true"
                          transition="all 0.3s ease"
                          _groupHover={{ 
                            color: "brand.500",
                            gap: 3,
                          }}
                        >
                          <Text>{t("learnMore")}</Text>
                          <Text>←</Text>
                        </Flex>
                      </Stack>
                    </Box>
                  </Box>
                  </Link>
                ))}
              </SimpleGrid>
            </Stack>
          </Box>

          {/* Elegant Divider */}
          <Box 
            h="1px" 
            bg="border"
            borderRadius="full"
          />

          {/* Teacher Experience Section - Enhanced */}
          <Box
            position="relative"
            css={{
              "@keyframes featureSlide": {
                "0%": { opacity: 0, transform: "translateX(20px)" },
                "100%": { opacity: 1, transform: "translateX(0)" },
              },
              "@keyframes iconSpin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
              "@keyframes gradientFlow": {
                "0%": { backgroundPosition: "0% 50%" },
                "50%": { backgroundPosition: "100% 50%" },
                "100%": { backgroundPosition: "0% 50%" },
              },
            }}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              gap={{ base: 10, md: 16 }}
              align="center"
            >
              {/* Left Content */}
              <Stack flex="1" gap={8}>
                <Stack gap={4}>
                  <Badge
                    position="relative"
                    overflow="hidden"
                    bg="transparent"
                    color="white"
                    px={5}
                    py={2.5}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="700"
                    w="fit-content"
                    css={{
                      background: "linear-gradient(135deg, #0b1f3b, #1a365d)",
                      boxShadow: "0 4px 15px rgba(11, 31, 59, 0.3)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        borderRadius: "full",
                        padding: "2px",
                        background: "linear-gradient(135deg, #c8a24a, #00d4ff)",
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "exclude",
                      },
                    }}
                  >
                    {t("teachersBadge")}
                  </Badge>
                  <Heading 
                    size={{ base: "lg", md: "xl" }} 
                    lineHeight="1.3"
                    css={{
                      background: "linear-gradient(135deg, #0b1f3b 0%, #c8a24a 50%, #0b1f3b 100%)",
                      backgroundSize: "200% auto",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      animation: "gradientFlow 4s ease infinite",
                    }}
                  >
                    {t("teachersTitle")}<br />{t("teachersSubtitle")}
                  </Heading>
                </Stack>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9" maxW="500px">
                  {t("teachersDescription")}
                </Text>
                <Flex gap={4} pt={2}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-3px"
                      borderRadius="xl"
                      background="linear-gradient(135deg, #c8a24a, #00d4ff)"
                      filter="blur(10px)"
                      opacity={0.4}
                    />
                    <Button
                      position="relative"
                      bg="brand.900"
                      color="white"
                      size="lg"
                      px={10}
                      fontWeight="700"
                      boxShadow="0 8px 25px rgba(11, 31, 59, 0.3)"
                      _hover={{ 
                        bg: "brand.700",
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 12px 35px rgba(11, 31, 59, 0.4)"
                      }}
                      transition="all 0.3s ease"
                    >
                      {t("startTeaching")}
                    </Button>
                  </Box>
                </Flex>
              </Stack>
              
              {/* Right Card - Features Grid */}
              <Box
                position="relative"
                flex="1"
                w="100%"
                maxW={{ base: "100%", md: "520px" }}
                borderRadius="2xl"
                overflow="hidden"
              >
                {/* Animated border */}
                <Box
                  position="absolute"
                  inset="-2px"
                  borderRadius="2xl"
                  background="linear-gradient(135deg, #c8a24a, #0b1f3b, #00d4ff, #0b1f3b, #c8a24a)"
                  backgroundSize="300% 300%"
                  css={{ animation: "gradientFlow 6s ease infinite" }}
                />
                
                <Box
                  position="relative"
                  bg="surface"
                  borderRadius="xl"
                  m="2px"
                  p={8}
                >
                  <SimpleGrid columns={2} gap={4}>
                    {[
                      { 
                        text: t("teacherFeatures.dragDrop"), 
                        icon: "🎨",
                        gradient: "linear-gradient(135deg, #c8a24a, #ffd700)",
                        delay: "0s",
                      },
                      { 
                        text: t("teacherFeatures.qualityReview"), 
                        icon: "✅",
                        gradient: "linear-gradient(135deg, #10b981, #34d399)",
                        delay: "0.1s",
                      },
                      { 
                        text: t("teacherFeatures.analytics"), 
                        icon: "📊",
                        gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                        delay: "0.2s",
                      },
                      { 
                        text: t("teacherFeatures.smartAssessment"), 
                        icon: "🎯",
                        gradient: "linear-gradient(135deg, #00d4ff, #0099ff)",
                        delay: "0.3s",
                      },
                    ].map((item, index) => (
                      <Box
                        key={item.text}
                        position="relative"
                        bg="backgroundAlt"
                        borderRadius="xl"
                        p={5}
                        transition="all 0.4s ease"
                        borderWidth="2px"
                        borderColor="transparent"
                        css={{
                          animation: `featureSlide 0.6s ease forwards`,
                          animationDelay: item.delay,
                        }}
                        _hover={{
                          bg: "surfaceHover",
                          borderColor: "brand.500",
                          transform: "translateY(-8px) scale(1.03)",
                          boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <Stack gap={4} align="center" textAlign="center">
                          {/* Icon with glow */}
                          <Box position="relative">
                            <Box
                              position="absolute"
                              inset="-6px"
                              borderRadius="xl"
                              background={item.gradient}
                              filter="blur(10px)"
                              opacity={0.3}
                            />
                            <Box
                              position="relative"
                              background={item.gradient}
                              w="56px"
                              h="56px"
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="xl"
                              boxShadow="0 6px 15px rgba(0, 0, 0, 0.15)"
                              transition="transform 0.3s ease"
                              _hover={{ transform: "rotate(10deg) scale(1.1)" }}
                            >
                              {item.icon}
                            </Box>
                          </Box>
                          <Text 
                            fontWeight="700" 
                            fontSize="sm"
                            lineHeight="1.5"
                            color="text"
                          >
                            {item.text}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              </Box>
            </Flex>
          </Box>

          {/* Instructor Verification Section */}
          <Container maxW="6xl" py={{ base: 8, md: 12 }}>
            <InstructorVerification />
          </Container>

          {/* Testimonials Section - Story-Driven Social Proof */}
          <Box
            position="relative"
            py={8}
            css={{
              "@keyframes testimonialFloat": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-6px)" },
              },
              "@keyframes quoteGlow": {
                "0%, 100%": { opacity: 0.6 },
                "50%": { opacity: 1 },
              },
            }}
          >
            <Stack gap={10} textAlign="center">
              <Stack gap={5} align="center" maxW="800px" mx="auto">
                <Badge
                  bg="linear-gradient(135deg, #10b981, #34d399)"
                  color="white"
                  px={6}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="800"
                  boxShadow="0 4px 15px rgba(16, 185, 129, 0.4)"
                >
                  {t("testimonialsBadge")}
                </Badge>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  css={{
                    background: "linear-gradient(135deg, #0b1f3b 0%, #10b981 50%, #0b1f3b 100%)",
                    backgroundSize: "200% auto",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("testimonialsTitle")}
                </Heading>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  {t("testimonialsSubtitle")}
                </Text>
              </Stack>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {[
                  { key: "student1", gradient: "linear-gradient(135deg, #D4AF37, #F7DC6F)" },
                  { key: "student2", gradient: "linear-gradient(135deg, #00d4ff, #0099ff)" },
                  { key: "student3", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
                ].map((student, index) => (
                  <Box
                    key={student.key}
                    position="relative"
                    bg="surface"
                    borderRadius="2xl"
                    overflow="hidden"
                    transition="all 0.4s ease"
                    css={{
                      animation: `testimonialFloat 5s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                    _hover={{
                      transform: "translateY(-12px) scale(1.02)",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    {/* Quote icon accent */}
                    <Box
                      position="absolute"
                      top={4}
                      right={4}
                      fontSize="4xl"
                      color="backgroundAlt"
                      opacity={0.5}
                      css={{ animation: "quoteGlow 3s ease-in-out infinite" }}
                    >
                      ❝
                    </Box>
                    
                    <Stack p={8} gap={5}>
                      {/* Quote */}
                      <Text
                        fontSize="sm"
                        color="muted"
                        lineHeight="1.9"
                        fontStyle="italic"
                        position="relative"
                        zIndex={1}
                      >
                        &ldquo;{t(`testimonials.${student.key}.quote`)}&rdquo;
                      </Text>

                      {/* Divider */}
                      <Box
                        h="2px"
                        w="60px"
                        background={student.gradient}
                        borderRadius="full"
                      />

                      {/* Author */}
                      <Flex align="center" gap={4}>
                        {/* Avatar */}
                        <Box
                          w="50px"
                          h="50px"
                          borderRadius="full"
                          background={student.gradient}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="xl"
                          color="white"
                          fontWeight="800"
                          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                        >
                          {t(`testimonials.${student.key}.name`).charAt(0)}
                        </Box>
                        <Stack gap={0}>
                          <Text fontWeight="800" fontSize="sm" color="text">
                            {t(`testimonials.${student.key}.name`)}
                          </Text>
                          <Text fontSize="xs" color="muted">
                            {t(`testimonials.${student.key}.location`)}
                          </Text>
                          <Badge
                            bg="backgroundAlt"
                            color="brand.500"
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            mt={1}
                          >
                            {t(`testimonials.${student.key}.program`)}
                          </Badge>
                        </Stack>
                      </Flex>
                    </Stack>
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          </Box>

          {/* Partners / As Seen In Section */}
          <Box py={8}>
            <Stack gap={8} align="center">
              <Stack gap={2} align="center">
                <Badge
                  bg="backgroundAlt"
                  color="muted"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                >
                  {t("partnersBadge")}
                </Badge>
                <Text fontSize="lg" fontWeight="700" color="text">
                  {t("partnersTitle")}
                </Text>
              </Stack>
              
              {/* Partner logos placeholder - replace with actual logos */}
              <Flex
                gap={{ base: 8, md: 16 }}
                wrap="wrap"
                justify="center"
                align="center"
                opacity={0.6}
                filter="grayscale(100%)"
                transition="all 0.3s ease"
                _hover={{ opacity: 1, filter: "grayscale(0%)" }}
              >
                {["🏛️ Al-Azhar", "📚 Islamic University", "🎓 Dar Al-Uloom", "🌍 ISNA", "📖 Quran Academy"].map((partner) => (
                  <Box
                    key={partner}
                    bg="backgroundAlt"
                    px={6}
                    py={3}
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight="600"
                    color="muted"
                    transition="all 0.3s ease"
                    _hover={{
                      bg: "surface",
                      color: "text",
                      transform: "scale(1.05)",
                    }}
                  >
                    {partner}
                  </Box>
                ))}
              </Flex>
            </Stack>
          </Box>

          {/* Free Assessment Lead Magnet Section */}
          <Box
            position="relative"
            borderRadius="2xl"
            overflow="hidden"
            css={{
              "@keyframes assessmentPulse": {
                "0%, 100%": { boxShadow: "0 0 30px rgba(212, 175, 55, 0.3)" },
                "50%": { boxShadow: "0 0 60px rgba(212, 175, 55, 0.5)" },
              },
            }}
          >
            {/* Gold gradient border */}
            <Box
              position="absolute"
              inset="-2px"
              borderRadius="2xl"
              background="linear-gradient(135deg, #D4AF37, #F7DC6F, #D4AF37)"
              backgroundSize="200% 200%"
              css={{
                animation: "gradientShift 4s ease infinite",
              }}
            />
            
            <Box
              position="relative"
              bg="linear-gradient(135deg, #0b1f3b 0%, #1a365d 100%)"
              borderRadius="xl"
              m="2px"
              p={{ base: 8, md: 12 }}
              color="white"
            >
              <Flex
                direction={{ base: "column", md: "row" }}
                align="center"
                justify="space-between"
                gap={8}
              >
                {/* Content */}
                <Stack gap={4} flex="1" textAlign={{ base: "center", md: "start" }}>
                  <Badge
                    bg="linear-gradient(135deg, #D4AF37, #F7DC6F)"
                    color="#0b1f3b"
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="800"
                    w="fit-content"
                    mx={{ base: "auto", md: 0 }}
                  >
                    {t("assessmentBadge")}
                  </Badge>
                  <Heading size={{ base: "md", md: "lg" }} color="white">
                    {t("assessmentTitle")}
                  </Heading>
                  <Text color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} lineHeight="1.8">
                    {t("assessmentSubtitle")}
                  </Text>
                  
                  {/* Features */}
                  <Flex gap={4} wrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                    {[
                      { key: "personalized", icon: "🎯" },
                      { key: "freeMinutes", icon: "⏱️" },
                      { key: "noCommitment", icon: "✓" },
                    ].map((feature) => (
                      <Flex
                        key={feature.key}
                        align="center"
                        gap={2}
                        bg="whiteAlpha.100"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="600"
                      >
                        <Text>{feature.icon}</Text>
                        <Text>{t(`assessmentFeatures.${feature.key}`)}</Text>
                      </Flex>
                    ))}
                  </Flex>
                </Stack>

                {/* CTA Button */}
                <Box position="relative">
                  <Box
                    position="absolute"
                    inset="-4px"
                    borderRadius="xl"
                    bg="linear-gradient(135deg, #D4AF37, #F7DC6F)"
                    filter="blur(15px)"
                    opacity={0.5}
                    css={{ animation: "assessmentPulse 3s ease-in-out infinite" }}
                  />
                  <Button
                    asChild
                    position="relative"
                    bg="linear-gradient(135deg, #D4AF37, #F7DC6F)"
                    color="#0b1f3b"
                    size="lg"
                    px={10}
                    h="60px"
                    fontSize="lg"
                    fontWeight="800"
                    boxShadow="0 8px 30px rgba(212, 175, 55, 0.4)"
                    _hover={{
                      transform: "translateY(-4px) scale(1.02)",
                      boxShadow: "0 12px 40px rgba(212, 175, 55, 0.5)",
                    }}
                    transition="all 0.3s ease"
                  >
                    <Link href="/assessment">{t("assessmentCta")}</Link>
                  </Button>
                </Box>
              </Flex>
            </Box>
          </Box>

          {/* Enhanced CTA Section with Neon Effect */}
          <Box
            position="relative"
            borderRadius="2xl"
            overflow="hidden"
            css={{
              "@keyframes borderRotate": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
              "@keyframes shimmer": {
                "0%": { backgroundPosition: "200% 0" },
                "100%": { backgroundPosition: "-200% 0" },
              },
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-10px)" },
              },
              "@keyframes pulse": {
                "0%, 100%": { opacity: 0.6 },
                "50%": { opacity: 1 },
              },
            }}
          >
            {/* Animated neon border */}
            <Box
              position="absolute"
              inset="-3px"
              borderRadius="2xl"
              background="conic-gradient(from 0deg, #00d4ff, #0099ff, #c8a24a, #ffd700, #00d4ff)"
              css={{
                animation: "borderRotate 6s linear infinite",
              }}
              zIndex={0}
            />
            
            {/* Glow effect */}
            <Box
              position="absolute"
              inset="-8px"
              borderRadius="2xl"
              background="conic-gradient(from 0deg, rgba(0, 212, 255, 0.5), rgba(0, 153, 255, 0.3), rgba(200, 162, 74, 0.3), rgba(255, 215, 0, 0.5), rgba(0, 212, 255, 0.5))"
              filter="blur(20px)"
              css={{
                animation: "borderRotate 6s linear infinite, pulse 3s ease-in-out infinite",
              }}
              zIndex={0}
            />

            {/* Main content */}
            <Box
              position="relative"
              zIndex={1}
              bg="brand.900"
              color="white"
              borderRadius="xl"
              m="3px"
              p={{ base: 10, md: 16 }}
              overflow="hidden"
            >
              {/* Animated background particles */}
              <Box
                position="absolute"
                top="10%"
                right="5%"
                width="120px"
                height="120px"
                borderRadius="full"
                bg="linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(255, 215, 0, 0.1))"
                filter="blur(40px)"
                css={{ animation: "float 6s ease-in-out infinite" }}
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="15%"
                left="10%"
                width="100px"
                height="100px"
                borderRadius="full"
                bg="linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(0, 212, 255, 0.1))"
                filter="blur(40px)"
                css={{ animation: "float 8s ease-in-out infinite reverse" }}
                pointerEvents="none"
              />
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                width="400px"
                height="400px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(200, 162, 74, 0.08) 0%, transparent 70%)"
                pointerEvents="none"
              />
              
              {/* Shimmer overlay */}
              <Box
                position="absolute"
                inset={0}
                background="linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)"
                backgroundSize="200% 100%"
                css={{ animation: "shimmer 8s ease-in-out infinite" }}
                pointerEvents="none"
              />
              
              <Stack 
                gap={8} 
                textAlign="center"
                align="center"
                position="relative" 
                zIndex={1}
                maxW="800px"
                mx="auto"
              >
                {/* Icon with glow */}
                <Box
                  position="relative"
                  css={{ animation: "float 4s ease-in-out infinite" }}
                >
                  <Box
                    position="absolute"
                    inset="-10px"
                    borderRadius="full"
                    bg="linear-gradient(135deg, rgba(0, 212, 255, 0.4), rgba(255, 215, 0, 0.4))"
                    filter="blur(20px)"
                    css={{ animation: "pulse 2s ease-in-out infinite" }}
                  />
                  <Box
                    position="relative"
                    bg="linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(255, 215, 0, 0.3))"
                    backdropFilter="blur(10px)"
                    borderWidth="2px"
                    borderColor="whiteAlpha.300"
                    color="white"
                    w="90px"
                    h="90px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="4xl"
                    boxShadow="0 8px 32px rgba(0, 212, 255, 0.3)"
                  >
                    🚀
                  </Box>
                </Box>

                <Stack gap={3}>
                  <Heading 
                    size={{ base: "lg", md: "2xl" }} 
                    letterSpacing="tight"
                    css={{
                      background: "linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #ffd700 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      backgroundSize: "200% auto",
                      animation: "shimmer 4s linear infinite",
                    }}
                  >
                    {t("ctaTitle")}
                  </Heading>
                  <Text color="whiteAlpha.900" fontSize={{ base: "md", md: "xl" }} lineHeight="1.8" maxW="600px">
                    {t("ctaDescription")}
                  </Text>
                </Stack>

                <Stack 
                  direction={{ base: "column", sm: "row" }} 
                  gap={4}
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-2px"
                      borderRadius="lg"
                      bg="linear-gradient(135deg, #00d4ff, #ffd700)"
                      filter="blur(8px)"
                      opacity={0.5}
                      css={{ animation: "pulse 2s ease-in-out infinite" }}
                    />
                    <Button 
                      position="relative"
                      bg="white" 
                      color="brand.900"
                      size="lg"
                      px={10}
                      h="56px"
                      fontSize="lg"
                      fontWeight="700"
                      boxShadow="0 8px 24px rgba(0, 0, 0, 0.15)"
                      _hover={{ 
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 12px 32px rgba(0, 212, 255, 0.3)"
                      }}
                      transition="all 0.3s ease"
                      w={{ base: "100%", sm: "auto" }}
                    >
                      {t("createStudentAccount")}
                    </Button>
                  </Box>
                  <Button
                    variant="outline"
                    borderColor="whiteAlpha.400"
                    borderWidth="2px"
                    color="white"
                    size="lg"
                    px={10}
                    h="56px"
                    fontSize="lg"
                    fontWeight="700"
                    bg="whiteAlpha.100"
                    backdropFilter="blur(10px)"
                    _hover={{ 
                      bg: "whiteAlpha.200",
                      transform: "translateY(-4px)",
                      borderColor: "cyan.300",
                      boxShadow: "0 8px 24px rgba(0, 212, 255, 0.2)"
                    }}
                    transition="all 0.3s ease"
                    w={{ base: "100%", sm: "auto" }}
                  >
                    {t("contactUs")}
                  </Button>
                </Stack>
                
                {/* Trust indicators with neon style */}
                <Flex 
                  gap={{ base: 4, md: 8 }}
                  pt={6}
                  wrap="wrap"
                  justify="center"
                  fontSize="sm"
                >
                  {[
                    { icon: "✓", text: t("trustIndicators.trustedContent"), color: "cyan.300" },
                    { icon: "✓", text: t("trustIndicators.certifiedCertificates"), color: "yellow.300" },
                    { icon: "✓", text: t("trustIndicators.continuousSupport"), color: "green.300" },
                  ].map((item, i) => (
                    <Flex 
                      key={i}
                      align="center" 
                      gap={2}
                      bg="whiteAlpha.100"
                      px={4}
                      py={2}
                      borderRadius="full"
                      borderWidth="1px"
                      borderColor="whiteAlpha.200"
                      backdropFilter="blur(10px)"
                    >
                      <Text fontSize="lg" color={item.color}>✓</Text>
                      <Text fontWeight="600" color="whiteAlpha.900">{item.text}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Container>
      </Box>
    </Box>
  );
}
