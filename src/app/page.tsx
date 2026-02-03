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
import StatCard from "@/components/ui/StatCard";
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
        "@keyframes meshGradient": {
          "0%": { backgroundPosition: "0% 0%" },
          "25%": { backgroundPosition: "100% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "75%": { backgroundPosition: "0% 100%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
        "@keyframes aurora": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "33%": { transform: "rotate(120deg) scale(1.1)" },
          "66%": { transform: "rotate(240deg) scale(0.9)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "@keyframes pulse": {
          "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
          "50%": { opacity: 0.8, transform: "scale(1.05)" },
        },
        "@keyframes moveRight": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100vw)" },
        },
        "@keyframes moveUp": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(-100vh)" },
        },
        "@keyframes twinkle": {
          "0%, 100%": { opacity: 0.2, transform: "scale(0.8)" },
          "50%": { opacity: 1, transform: "scale(1.2)" },
        },
        "@keyframes waveMove": {
          "0%": { transform: "translateX(0) translateY(0)" },
          "50%": { transform: "translateX(-25px) translateY(-15px)" },
          "100%": { transform: "translateX(0) translateY(0)" },
        },
      }}
    >
      {/* === ANIMATED MESH GRADIENT BACKGROUND === */}
      <Box
        position="fixed"
        inset={0}
        zIndex={0}
        overflow="hidden"
        pointerEvents="none"
      >
        {/* Base animated gradient */}
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(125deg, #000000 0%, #000000 15%, #050505 30%, #030303 45%, #000000 60%, #050505 75%, #000000 100%)"
          backgroundSize="400% 400%"
          css={{ animation: "meshGradient 25s ease infinite" }}
        />
        
        {/* Aurora effect layer 1 - Gold */}
        <Box
          position="absolute"
          top="-50%"
          left="-50%"
          w="200%"
          h="200%"
          bg="conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(200, 162, 74, 0.08) 60deg, transparent 120deg, rgba(200, 162, 74, 0.05) 180deg, transparent 240deg, rgba(200, 162, 74, 0.08) 300deg, transparent 360deg)"
          css={{ animation: "aurora 30s linear infinite" }}
        />
        
        {/* Aurora effect layer 2 - Cyan */}
        <Box
          position="absolute"
          top="-50%"
          left="-50%"
          w="200%"
          h="200%"
          bg="conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(0, 212, 255, 0.06) 45deg, transparent 90deg, rgba(0, 153, 255, 0.04) 135deg, transparent 180deg, rgba(0, 212, 255, 0.06) 225deg, transparent 270deg, rgba(0, 153, 255, 0.04) 315deg, transparent 360deg)"
          css={{ animation: "aurora 40s linear infinite reverse" }}
        />
        
        {/* Aurora effect layer 3 - Purple accent */}
        <Box
          position="absolute"
          top="-50%"
          left="-50%"
          w="200%"
          h="200%"
          bg="conic-gradient(from 90deg at 50% 50%, transparent 0deg, rgba(139, 92, 246, 0.04) 30deg, transparent 60deg, rgba(168, 85, 247, 0.03) 150deg, transparent 180deg, rgba(139, 92, 246, 0.04) 210deg, transparent 240deg, rgba(168, 85, 247, 0.03) 330deg, transparent 360deg)"
          css={{ animation: "aurora 35s linear infinite" }}
        />

        {/* Floating gradient orbs */}
        <Box
          position="absolute"
          top="10%"
          right="10%"
          w={{ base: "300px", md: "500px" }}
          h={{ base: "300px", md: "500px" }}
          borderRadius="full"
          bg="radial-gradient(circle, rgba(200, 162, 74, 0.15) 0%, rgba(200, 162, 74, 0.05) 40%, transparent 70%)"
          filter="blur(60px)"
          css={{ animation: "heroFloat 15s ease-in-out infinite, pulse 8s ease-in-out infinite" }}
        />
        <Box
          position="absolute"
          top="50%"
          left="5%"
          w={{ base: "250px", md: "400px" }}
          h={{ base: "250px", md: "400px" }}
          borderRadius="full"
          bg="radial-gradient(circle, rgba(0, 212, 255, 0.12) 0%, rgba(0, 153, 255, 0.05) 40%, transparent 70%)"
          filter="blur(50px)"
          css={{ animation: "heroFloat 18s ease-in-out infinite reverse, pulse 10s ease-in-out infinite 2s" }}
        />
        <Box
          position="absolute"
          bottom="20%"
          right="30%"
          w={{ base: "200px", md: "350px" }}
          h={{ base: "200px", md: "350px" }}
          borderRadius="full"
          bg="radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.04) 40%, transparent 70%)"
          filter="blur(45px)"
          css={{ animation: "heroFloat 20s ease-in-out infinite 3s, pulse 12s ease-in-out infinite" }}
        />
        <Box
          position="absolute"
          top="30%"
          left="40%"
          w={{ base: "180px", md: "300px" }}
          h={{ base: "180px", md: "300px" }}
          borderRadius="full"
          bg="radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 40%, transparent 70%)"
          filter="blur(40px)"
          css={{ animation: "heroFloat 22s ease-in-out infinite reverse 1s, pulse 9s ease-in-out infinite 4s" }}
        />

        {/* Animated wave lines */}
        <Box position="absolute" inset={0} overflow="hidden" opacity={0.3}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              position="absolute"
              left={0}
              right={0}
              h="2px"
              top={`${20 + i * 15}%`}
              bg={`linear-gradient(90deg, transparent, ${i % 2 === 0 ? 'rgba(200, 162, 74, 0.3)' : 'rgba(0, 212, 255, 0.3)'}, transparent)`}
              css={{ 
                animation: `waveMove ${6 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </Box>

        {/* Particle stars */}
        <Box position="absolute" inset={0} overflow="hidden">
          {[...Array(20)].map((_, i) => (
            <Box
              key={i}
              position="absolute"
              w={`${2 + (i % 3)}px`}
              h={`${2 + (i % 3)}px`}
              borderRadius="full"
              bg={i % 3 === 0 ? "rgba(200, 162, 74, 0.8)" : i % 3 === 1 ? "rgba(0, 212, 255, 0.8)" : "rgba(255, 255, 255, 0.6)"}
              top={`${(i * 17) % 100}%`}
              left={`${(i * 23) % 100}%`}
              boxShadow={`0 0 ${4 + (i % 3) * 2}px ${i % 3 === 0 ? 'rgba(200, 162, 74, 0.5)' : i % 3 === 1 ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`}
              css={{
                animation: `twinkle ${3 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${(i * 0.3) % 5}s`,
              }}
            />
          ))}
        </Box>

        {/* Moving light streaks */}
        <Box
          position="absolute"
          top="20%"
          left={0}
          w="150px"
          h="2px"
          bg="linear-gradient(90deg, transparent, rgba(200, 162, 74, 0.6), rgba(255, 215, 0, 0.8), rgba(200, 162, 74, 0.6), transparent)"
          filter="blur(1px)"
          css={{ animation: "moveRight 8s linear infinite" }}
        />
        <Box
          position="absolute"
          top="60%"
          left={0}
          w="100px"
          h="1px"
          bg="linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), rgba(0, 153, 255, 0.7), rgba(0, 212, 255, 0.5), transparent)"
          filter="blur(1px)"
          css={{ animation: "moveRight 12s linear infinite 3s" }}
        />
        <Box
          position="absolute"
          top="80%"
          left={0}
          w="120px"
          h="1px"
          bg="linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(168, 85, 247, 0.7), rgba(139, 92, 246, 0.5), transparent)"
          filter="blur(1px)"
          css={{ animation: "moveRight 10s linear infinite 6s" }}
        />
      </Box>

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
            opacity: 0.4,
          }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          {/* Captions track for accessibility compliance - video is decorative/muted */}
          <track kind="captions" src="/videos/hero-captions.vtt" srcLang="ar" label="Arabic" default />
        </video>

        {/* Enhanced animated overlay */}
        <Box
          position="absolute"
          inset={0}
          zIndex={1}
          overflow="hidden"
          pointerEvents="none"
        >
          {/* Floating orbs with more vibrant colors */}
          <Box
            position="absolute"
            top="10%"
            right="15%"
            w={{ base: "150px", md: "300px" }}
            h={{ base: "150px", md: "300px" }}
            borderRadius="full"
            bg="radial-gradient(circle, rgba(200, 162, 74, 0.25) 0%, rgba(255, 215, 0, 0.1) 40%, transparent 70%)"
            filter="blur(40px)"
            css={{ animation: "heroFloat 8s ease-in-out infinite, pulse 6s ease-in-out infinite" }}
          />
          <Box
            position="absolute"
            top="60%"
            left="10%"
            w={{ base: "100px", md: "250px" }}
            h={{ base: "100px", md: "250px" }}
            borderRadius="full"
            bg="radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, rgba(0, 153, 255, 0.08) 40%, transparent 70%)"
            filter="blur(35px)"
            css={{ animation: "heroFloat 12s ease-in-out infinite reverse, pulse 8s ease-in-out infinite 2s" }}
          />
          <Box
            position="absolute"
            bottom="20%"
            right="25%"
            w={{ base: "80px", md: "200px" }}
            h={{ base: "80px", md: "200px" }}
            borderRadius="full"
            bg="radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.06) 40%, transparent 70%)"
            filter="blur(30px)"
            css={{ animation: "heroFloat 10s ease-in-out infinite 2s, pulse 7s ease-in-out infinite 1s" }}
          />
          <Box
            position="absolute"
            top="40%"
            left="50%"
            w={{ base: "120px", md: "220px" }}
            h={{ base: "120px", md: "220px" }}
            borderRadius="full"
            bg="radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 40%, transparent 70%)"
            filter="blur(35px)"
            css={{ animation: "heroFloat 14s ease-in-out infinite 4s, pulse 9s ease-in-out infinite 3s" }}
          />
        </Box>

        {/* Dark Overlay for Readability */}
        <Box
          position="absolute"
          inset={0}
          zIndex={2}
          bg="linear-gradient(180deg, rgba(10, 22, 40, 0.5) 0%, rgba(11, 31, 59, 0.6) 40%, rgba(10, 22, 40, 0.65) 70%, rgba(10, 22, 40, 0.8) 100%)"
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
                  background: "linear-gradient(135deg, #00FF2A, #4DFF6A, #00FF2A, #00FF2A, #00FF2A)",
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
                    background: "linear-gradient(180deg, #ffffff 0%, #f0f0f0 40%, #00FF2A 100%)",
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
                  background="linear-gradient(90deg, transparent, #00FF2A, #4DFF6A, #00FF2A, transparent)"
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
                    background: "linear-gradient(135deg, #00FF2A 0%, #4DFF6A 50%, #00FF2A 100%)",
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
                  color: "#00FF2A",
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
                  background="linear-gradient(135deg, #00FF2A, #4DFF6A, #00FF2A)"
                  filter="blur(20px)"
                  opacity={0.5}
                  pointerEvents="none"
                  css={{ animation: "sparkle 3s ease-in-out infinite" }}
                />
                <Button
                  asChild
                  position="relative"
                  bg="linear-gradient(135deg, #00FF2A 0%, #00CC22 100%)"
                  color="primary"
                  size="lg"
                  px={{ base: 8, md: 12 }}
                  h={{ base: "56px", md: "64px" }}
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="800"
                  borderRadius="xl"
                  boxShadow="0 8px 30px rgba(200, 162, 74, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                  _hover={{ 
                    bg: "linear-gradient(135deg, #4DFF6A 0%, #00FF2A 100%)",
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
                  borderColor: "#00FF2A",
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
            
            {/* Stats Grid - Enhanced like AlMaghrib/SeekersGuidance */}
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              gap={{ base: 4, md: 6 }}
              pt={{ base: 8, md: 12 }}
              w="100%"
              maxW="900px"
            >
              {[
                { value: "500+", label: t("stats.students"), icon: "👥" },
                { value: "20+", label: t("stats.courses"), icon: "📚" },
                { value: "10+", label: t("stats.instructors"), icon: "👨‍🏫" },
                { value: "5+", label: t("stats.programs"), icon: "🎓" },
              ].map((stat, index) => (
                <Box
                  key={stat.label}
                  bg="#050505"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  p={{ base: 4, md: 6 }}
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.3)"
                  boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                  transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    bg: "#0A0A0A",
                    borderColor: "rgba(0, 255, 42, 0.6)",
                    transform: "translateY(-6px) scale(1.02)",
                    boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
                  }}
                  css={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                    "@keyframes fadeInUp": {
                      "0%": { opacity: 0, transform: "translateY(20px)" },
                      "100%": { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  <Stack gap={2} align="center">
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg="#0A0A0A"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.3)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="lg"
                      boxShadow="0 0 10px rgba(0, 255, 42, 0.2)"
                    >
                      {stat.icon}
                    </Box>
                    <Text 
                      fontSize={{ base: "2xl", md: "4xl" }} 
                      fontWeight="900" 
                      color="#00FF2A"
                    >
                      {stat.value}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }} color="rgba(255, 255, 255, 0.7)" fontWeight="600" textAlign="center">
                      {stat.label}
                    </Text>
                  </Stack>
                </Box>
              ))}
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
                bg="#050505"
                backdropFilter="blur(10px)"
                px={6}
                py={4}
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(0, 255, 42, 0.3)"
                boxShadow="0 0 15px rgba(0, 255, 42, 0.15)"
                transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: "#0A0A0A",
                  borderColor: "rgba(0, 255, 42, 0.6)",
                  transform: "translateY(-4px)",
                  boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
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
                          stroke="#00FF2A" 
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
          
          {/* Community Posts Section - Premium Design */}
          <Box
            position="relative"
            py={{ base: 10, md: 16 }}
            borderRadius="3xl"
            overflow="hidden"
            css={{
              "@keyframes socialFloat": {
                "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
                "50%": { transform: "translateY(-10px) rotate(2deg)" },
              },
              "@keyframes socialGlow": {
                "0%, 100%": { opacity: 0.5, transform: "scale(1)" },
                "50%": { opacity: 0.8, transform: "scale(1.05)" },
              },
            }}
          >
            {/* Black card with neon glow */}
            <Box
              position="relative"
              bg="#050505"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              px={{ base: 6, md: 10 }}
              py={{ base: 10, md: 14 }}
              overflow="hidden"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
            >
              {/* Decorative floating orbs */}
              <Box
                position="absolute"
                top="-20%"
                right="-10%"
                w={{ base: "200px", md: "350px" }}
                h={{ base: "200px", md: "350px" }}
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
                filter="blur(40px)"
                css={{ animation: "socialFloat 12s ease-in-out infinite" }}
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="-15%"
                left="-5%"
                w={{ base: "150px", md: "280px" }}
                h={{ base: "150px", md: "280px" }}
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.12) 0%, transparent 70%)"
                filter="blur(35px)"
                css={{ animation: "socialFloat 15s ease-in-out infinite reverse" }}
                pointerEvents="none"
              />
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w={{ base: "180px", md: "300px" }}
                h={{ base: "180px", md: "300px" }}
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
                filter="blur(50px)"
                css={{ animation: "socialGlow 8s ease-in-out infinite" }}
                pointerEvents="none"
              />

              <Stack gap={10} position="relative" zIndex={2}>
                {/* Section Header - Enhanced */}
                <Stack gap={5} textAlign="center" align="center">
                  {/* Animated icon */}
                  <Box
                    position="relative"
                    css={{ animation: "socialFloat 6s ease-in-out infinite" }}
                  >
                    <Box
                      position="absolute"
                      inset="-8px"
                      borderRadius="full"
                      bg="linear-gradient(135deg, rgba(0, 255, 42, 0.4), rgba(77, 255, 106, 0.4))"
                      filter="blur(15px)"
                      css={{ animation: "socialGlow 4s ease-in-out infinite" }}
                    />
                    <Box
                      position="relative"
                      w="80px"
                      h="80px"
                      borderRadius="full"
                      bg="#0A0A0A"
                      border="2px solid"
                      borderColor="rgba(0, 255, 42, 0.5)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="2xl"
                      boxShadow="0 0 30px rgba(0, 255, 42, 0.4)"
                    >
                      💬
                    </Box>
                  </Box>

                  <Badge
                    position="relative"
                    overflow="hidden"
                    bg="#0A0A0A"
                    color="#00FF2A"
                    px={6}
                    py={2.5}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="700"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.3)"
                    boxShadow="0 0 15px rgba(0, 255, 42, 0.2)"
                    css={{
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        borderRadius: "full",
                        padding: "1.5px",
                        background: "linear-gradient(135deg, #00FF2A, #00FF2A, #00FF2A)",
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "exclude",
                      },
                    }}
                  >
                    {t("socialBadge")}
                  </Badge>
                  
                  <Heading
                    size={{ base: "xl", md: "2xl" }}
                    fontWeight="800"
                    letterSpacing="-0.02em"
                    css={{
                      background: "linear-gradient(135deg, #ffffff 0%, #00FF2A 50%, #00FF2A 100%)",
                      backgroundSize: "200% auto",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      animation: "borderShine 4s linear infinite",
                    }}
                  >
                    {t("socialTitle")}
                  </Heading>
                  
                  <Text 
                    color="whiteAlpha.800" 
                    fontSize={{ base: "md", md: "lg" }} 
                    maxW="600px"
                    lineHeight="1.8"
                  >
                    {t("socialDescription")}
                  </Text>

                  {/* Decorative line */}
                  <Box
                    w="80px"
                    h="4px"
                    borderRadius="full"
                    bg="linear-gradient(90deg, #00FF2A, #4DFF6A)"
                    boxShadow="0 0 20px rgba(0, 255, 42, 0.5)"
                  />
                </Stack>

                {/* Social Feed Component */}
                <Box 
                  maxW="4xl" 
                  mx="auto" 
                  w="100%"
                  bg="#0A0A0A"
                  borderRadius="2xl"
                  p={{ base: 4, md: 6 }}
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.3)"
                  boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                >
                  <SocialFeed showTitle={false} maxPosts={3} />
                </Box>

                {/* View All Button - Enhanced */}
                <Flex justify="center" pt={2}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-4px"
                      borderRadius="xl"
                      bg="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                      filter="blur(12px)"
                      opacity={0.5}
                      css={{ animation: "socialGlow 3s ease-in-out infinite" }}
                    />
                    <Button
                      asChild
                      position="relative"
                      size="lg"
                      bg="#0A0A0A"
                      color="#00FF2A"
                      px={10}
                      h="56px"
                      fontWeight="800"
                      borderRadius="xl"
                      fontSize="md"
                      border="2px solid"
                      borderColor="rgba(0, 255, 42, 0.5)"
                      boxShadow="0 0 20px rgba(0, 255, 42, 0.3)"
                      _hover={{
                        bg: "#0A0A0A",
                        borderColor: "#00FF2A",
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 0 40px rgba(0, 255, 42, 0.5), 0 16px 50px rgba(0, 255, 42, 0.3)",
                      }}
                      _active={{
                        transform: "translateY(-2px) scale(1.01)",
                      }}
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    >
                      <Link href="/social">
                        <Flex align="center" gap={2}>
                          <Text>{t("viewAllPosts")}</Text>
                          <Text fontSize="lg">→</Text>
                        </Flex>
                      </Link>
                    </Button>
                  </Box>
                </Flex>
              </Stack>
            </Box>
          </Box>

          {/* Quranic Verse Section - Premium Islamic Design */}
          <Box
            position="relative"
            py={{ base: 6, md: 10 }}
            borderRadius="3xl"
            overflow="hidden"
            css={{
              "@keyframes verseGlow": {
                "0%, 100%": { opacity: 0.3, transform: "scale(1)" },
                "50%": { opacity: 0.6, transform: "scale(1.02)" },
              },
              "@keyframes starTwinkle": {
                "0%, 100%": { opacity: 0.4, transform: "scale(0.8)" },
                "50%": { opacity: 1, transform: "scale(1.2)" },
              },
              "@keyframes floatVerse": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-8px)" },
              },
            }}
          >
            {/* Main card background with neon glow */}
            <Box
              position="relative"
              bg="#050505"
              borderRadius="3xl"
              px={{ base: 6, md: 12 }}
              py={{ base: 10, md: 16 }}
              overflow="hidden"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
            >
              {/* Islamic geometric pattern overlay */}
              <Box
                position="absolute"
                inset={0}
                opacity={0.05}
                bg="repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(200, 162, 74, 0.03) 10px, rgba(200, 162, 74, 0.03) 20px)"
                pointerEvents="none"
              />

              {/* Decorative corner ornaments */}
              <Box
                position="absolute"
                top={4}
                left={4}
                w="60px"
                h="60px"
                borderTop="3px solid"
                borderLeft="3px solid"
                borderColor="rgba(0, 255, 42, 0.4)"
                borderTopLeftRadius="xl"
              />
              <Box
                position="absolute"
                top={4}
                right={4}
                w="60px"
                h="60px"
                borderTop="3px solid"
                borderRight="3px solid"
                borderColor="rgba(0, 255, 42, 0.4)"
                borderTopRightRadius="xl"
              />
              <Box
                position="absolute"
                bottom={4}
                left={4}
                w="60px"
                h="60px"
                borderBottom="3px solid"
                borderLeft="3px solid"
                borderColor="rgba(0, 255, 42, 0.4)"
                borderBottomLeftRadius="xl"
              />
              <Box
                position="absolute"
                bottom={4}
                right={4}
                w="60px"
                h="60px"
                borderBottom="3px solid"
                borderRight="3px solid"
                borderColor="rgba(0, 255, 42, 0.4)"
                borderBottomRightRadius="xl"
              />

              {/* Glowing orbs */}
              <Box
                position="absolute"
                top="-10%"
                left="20%"
                w={{ base: "150px", md: "250px" }}
                h={{ base: "150px", md: "250px" }}
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
                filter="blur(40px)"
                css={{ animation: "verseGlow 6s ease-in-out infinite" }}
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="-10%"
                right="20%"
                w={{ base: "120px", md: "200px" }}
                h={{ base: "120px", md: "200px" }}
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.12) 0%, transparent 70%)"
                filter="blur(35px)"
                css={{ animation: "verseGlow 8s ease-in-out infinite reverse" }}
                pointerEvents="none"
              />

              {/* Twinkling stars */}
              {[...Array(8)].map((_, i) => (
                <Box
                  key={i}
                  position="absolute"
                  w="4px"
                  h="4px"
                  borderRadius="full"
                  bg="#00FF2A"
                  boxShadow="0 0 8px rgba(0, 255, 42, 0.8)"
                  top={`${15 + (i * 10) % 70}%`}
                  left={`${10 + (i * 13) % 80}%`}
                  css={{
                    animation: `starTwinkle ${2 + (i % 3)}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}

              <Stack gap={8} align="center" position="relative" zIndex={2}>
                {/* Quran icon */}
                <Box
                  position="relative"
                  css={{ animation: "floatVerse 5s ease-in-out infinite" }}
                >
                  <Box
                    position="absolute"
                    inset="-10px"
                    borderRadius="full"
                    bg="radial-gradient(circle, rgba(0, 255, 42, 0.4) 0%, transparent 70%)"
                    filter="blur(15px)"
                    css={{ animation: "verseGlow 4s ease-in-out infinite" }}
                  />
                  <Box
                    position="relative"
                    w="70px"
                    h="70px"
                    borderRadius="full"
                    bg="#0A0A0A"
                    border="2px solid"
                    borderColor="rgba(0, 255, 42, 0.5)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                    boxShadow="0 0 30px rgba(0, 255, 42, 0.4)"
                  >
                    📖
                  </Box>
                </Box>

                {/* Arabic Verse */}
                <Box
                  position="relative"
                  textAlign="center"
                  css={{ animation: "floatVerse 7s ease-in-out infinite 1s" }}
                >
                  <Text
                    fontSize={{ base: "2xl", md: "4xl", lg: "5xl" }}
                    fontWeight="700"
                    lineHeight="2.2"
                    fontFamily="var(--font-ibm-plex)"
                    css={{
                      background: "linear-gradient(135deg, #4DFF6A 0%, #00FF2A 25%, #ffffff 50%, #00FF2A 75%, #4DFF6A 100%)",
                      backgroundSize: "200% auto",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      animation: "borderGold 6s ease infinite",
                      textShadow: "0 0 60px rgba(200, 162, 74, 0.3)",
                    }}
                  >
                    وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
                  </Text>
                </Box>

                {/* Decorative separator */}
                <Flex align="center" gap={4} w="100%" maxW="400px">
                  <Box flex={1} h="1px" bg="linear-gradient(90deg, transparent, #00FF2A)" />
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="sm"
                    transform="rotate(45deg)"
                    bg="linear-gradient(135deg, #00FF2A, #4DFF6A)"
                    boxShadow="0 0 15px rgba(200, 162, 74, 0.5)"
                  />
                  <Box flex={1} h="1px" bg="linear-gradient(90deg, #00FF2A, transparent)" />
                </Flex>
                
                {/* Translation */}
                <Text
                  fontSize={{ base: "md", md: "lg", lg: "xl" }}
                  color="whiteAlpha.800"
                  fontStyle="italic"
                  maxW="700px"
                  lineHeight="1.9"
                  textAlign="center"
                  px={4}
                >
                  {t("quranicVerse.translation")}
                </Text>
                
                {/* Reference Badge */}
                <Badge
                  position="relative"
                  overflow="hidden"
                  bg="transparent"
                  color="white"
                  px={6}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                  css={{
                    background: "linear-gradient(135deg, rgba(200, 162, 74, 0.2), rgba(212, 175, 55, 0.3))",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 4px 20px rgba(200, 162, 74, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "full",
                      padding: "1.5px",
                      background: "linear-gradient(135deg, #00FF2A, #4DFF6A, #00FF2A)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                    },
                  }}
                >
                  ✨ {t("quranicVerse.reference")}
                </Badge>
              </Stack>
            </Box>
          </Box>

          {/* Elegant Divider */}
          <Box 
            h="1px" 
            bg="linear-gradient(90deg, transparent, #00FF2A, transparent)"
            borderRadius="full"
          />

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
                "0%, 100%": { boxShadow: "0 0 20px rgba(0, 255, 42, 0.3)" },
                "50%": { boxShadow: "0 0 40px rgba(0, 255, 42, 0.5)" },
              },
              "@keyframes iconBounce": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
              },
            }}
          >
            {/* Main card with neon glow */}
            <Box
              position="relative"
              bg="#050505"
              borderRadius="xl"
              p={{ base: 8, md: 12 }}
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
            >
              {/* Background decorations */}
              <Box
                position="absolute"
                top="10%"
                right="5%"
                w="200px"
                h="200px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
                filter="blur(40px)"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="10%"
                left="5%"
                w="150px"
                h="150px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
                filter="blur(30px)"
                pointerEvents="none"
              />

              <Stack gap={10} position="relative" zIndex={1}>
                {/* Section Header */}
                <Stack gap={3} textAlign="center">
                  <Text 
                    color="#00FF2A" 
                    fontWeight="700" 
                    fontSize="sm" 
                    letterSpacing="wider"
                  >
                    {t("whyTibyan")}
                  </Text>
                  <Heading 
                    size={{ base: "lg", md: "xl" }} 
                    color="white"
                    css={{
                      background: "linear-gradient(135deg, #ffffff 0%, #00FF2A 100%)",
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
                      gradient: "linear-gradient(135deg, #00FF2A, #4DFF6A)",
                      delay: "0s",
                    },
                    {
                      title: t("features.questionBank.title"),
                      text: t("features.questionBank.description"),
                      icon: "🎯",
                      gradient: "linear-gradient(135deg, #00FF2A, #00CC22)",
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
                      bg="#0A0A0A"
                      backdropFilter="blur(10px)"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.3)"
                      boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                      p={6}
                      transition="all 0.4s ease"
                      css={{
                        animation: `floatCard 4s ease-in-out infinite`,
                        animationDelay: card.delay,
                      }}
                      _hover={{
                        bg: "#0A0A0A",
                        borderColor: "rgba(0, 255, 42, 0.6)",
                        transform: "translateY(-12px) scale(1.02)",
                        boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
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
                            bg="#0A0A0A"
                            border="2px solid"
                            borderColor="rgba(0, 255, 42, 0.5)"
                            w="72px"
                            h="72px"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            boxShadow="0 0 20px rgba(0, 255, 42, 0.3)"
                            transition="transform 0.3s ease"
                            _hover={{ transform: "scale(1.1)", borderColor: "#00FF2A" }}
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
                          bg="#00FF2A"
                          boxShadow="0 0 10px rgba(0, 255, 42, 0.5)"
                          opacity={0.8}
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
              "@keyframes neonGlow": {
                "0%, 100%": { boxShadow: "0 0 20px rgba(0, 255, 42, 0.3)" },
                "50%": { boxShadow: "0 0 40px rgba(0, 255, 42, 0.5)" },
              },
            }}
          >
            <Stack gap={10} textAlign="center">
              <Stack gap={5} align="center" maxW="800px" mx="auto">
                <Badge
                  bg="#0A0A0A"
                  color="#00FF2A"
                  px={6}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="800"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.5)"
                  boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                >
                  {t("advisoryBadge")}
                </Badge>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  color="white"
                >
                  {t("advisoryTitle")}
                </Heading>
                <Text color="gray.400" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  {t("advisorySubtitle")}
                </Text>
              </Stack>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {[
                  { key: "scholar1", icon: "👨‍🎓" },
                  { key: "scholar2", icon: "📖" },
                  { key: "scholar3", icon: "✨" },
                ].map((advisor, index) => (
                  <Box
                    key={advisor.key}
                    position="relative"
                    bg="#050505"
                    borderRadius="2xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.3)"
                    boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                    transition="all 0.4s ease"
                    css={{
                      animation: `advisorFloat 5s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                    _hover={{
                      transform: "translateY(-12px) scale(1.02)",
                      borderColor: "rgba(0, 255, 42, 0.6)",
                      boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
                    }}
                  >
                    {/* Neon border accent */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      h="4px"
                      bg="#00FF2A"
                      boxShadow="0 0 15px rgba(0, 255, 42, 0.5)"
                    />
                    <Stack p={8} gap={4} align="center">
                      {/* Avatar placeholder with neon glow */}
                      <Box position="relative">
                        <Box
                          position="absolute"
                          inset="-8px"
                          borderRadius="full"
                          bg="radial-gradient(circle, rgba(0, 255, 42, 0.3) 0%, transparent 70%)"
                          filter="blur(15px)"
                          css={{ animation: "neonGlow 3s ease-in-out infinite" }}
                        />
                        <Box
                          position="relative"
                          w="100px"
                          h="100px"
                          borderRadius="full"
                          bg="#0A0A0A"
                          border="2px solid"
                          borderColor="rgba(0, 255, 42, 0.5)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="3xl"
                          boxShadow="0 0 20px rgba(0, 255, 42, 0.3)"
                        >
                          {advisor.icon}
                        </Box>
                      </Box>
                      <Stack gap={1} align="center">
                        <Heading size="md" color="white">
                          {t(`advisors.${advisor.key}.name`)}
                        </Heading>
                        <Text fontSize="sm" fontWeight="700" color="#00FF2A">
                          {t(`advisors.${advisor.key}.title`)}
                        </Text>
                        <Text fontSize="sm" color="gray.400" textAlign="center">
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
            bg="linear-gradient(90deg, transparent, #00FF2A, transparent)"
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
                  bg="#0A0A0A"
                  color="#00FF2A"
                  px={6}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="800"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.5)"
                  boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                >
                  {t("methodologyBadge")}
                </Badge>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  color="white"
                >
                  {t("methodologyTitle")}
                </Heading>
                <Text color="gray.400" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
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
                  bg="#00FF2A"
                  boxShadow="0 0 15px rgba(0, 255, 42, 0.5)"
                  borderRadius="full"
                  zIndex={0}
                />

                <SimpleGrid columns={{ base: 1, md: 5 }} gap={{ base: 6, md: 4 }}>
                  {[
                    { step: "step1", icon: "🏗️" },
                    { step: "step2", icon: "💡" },
                    { step: "step3", icon: "⚡" },
                    { step: "step4", icon: "📊" },
                    { step: "step5", icon: "🏆" },
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
                          bg="radial-gradient(circle, rgba(0, 255, 42, 0.4) 0%, transparent 70%)"
                          filter="blur(12px)"
                        />
                        <Box
                          position="relative"
                          w="80px"
                          h="80px"
                          borderRadius="full"
                          bg="#0A0A0A"
                          border="3px solid"
                          borderColor="#00FF2A"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="2xl"
                          boxShadow="0 0 20px rgba(0, 255, 42, 0.4)"
                          transition="all 0.3s ease"
                          _hover={{ transform: "scale(1.1)", boxShadow: "0 0 30px rgba(0, 255, 42, 0.6)" }}
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
                          bg="#00FF2A"
                          color="black"
                          fontSize="sm"
                          fontWeight="900"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 0 15px rgba(0, 255, 42, 0.5)"
                        >
                          {index + 1}
                        </Box>
                      </Box>
                      <Stack gap={1} align="center">
                        <Text fontWeight="800" color="white" fontSize="md">
                          {t(`methodologySteps.${item.step}.title`)}
                        </Text>
                        <Text fontSize="xs" color="gray.400" textAlign="center" maxW="160px">
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
            bg="linear-gradient(90deg, transparent, #00FF2A, transparent)"
            borderRadius="full"
          />

          {/* Educational Programs Section - Enhanced */}
          <Box
            position="relative"
            py={4}
            css={{
              "@keyframes cardFloat": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-8px)" },
              },
            }}
          >
            <Stack gap={10} textAlign={{ base: "center", md: "start" }}>
              {/* Section Header */}
              <Stack gap={5} align={{ base: "center", md: "flex-start" }} maxW="750px">
                <Badge
                  bg="#0A0A0A"
                  color="#00FF2A"
                  px={5}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.5)"
                  boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                >
                  {t("programsBadge")}
                </Badge>
                <Heading 
                  size={{ base: "lg", md: "xl" }} 
                  lineHeight="1.3"
                  color="white"
                >
                  {t("programsTitle")}
                </Heading>
                <Text color="gray.400" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  {t("programsDescription")}
                </Text>
              </Stack>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {[
                  { 
                    title: t("programsList.preparatory.title"), 
                    desc: t("programsList.preparatory.description"),
                    icon: "🎓", 
                    sessions: t("programsList.preparatory.sessions"),
                    delay: "0s",
                    slug: "preparatory-year",
                  },
                  { 
                    title: t("programsList.shariah.title"), 
                    desc: t("programsList.shariah.description"),
                    icon: "📖", 
                    sessions: t("programsList.shariah.sessions"),
                    delay: "0.15s",
                    slug: "shariah-track",
                  },
                  { 
                    title: t("programsList.arabicReading.title"), 
                    desc: t("programsList.arabicReading.description"),
                    icon: "✍️", 
                    sessions: t("programsList.arabicReading.sessions"),
                    delay: "0.3s",
                    slug: "arabic-reading",
                  },
                ].map((item) => (
                  <Link key={item.title} href={`/programs#${item.slug}`} style={{ textDecoration: "none" }}>
                    <Box
                      position="relative"
                      bg="#050505"
                      borderRadius="2xl"
                      overflow="hidden"
                      cursor="pointer"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.3)"
                      boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                      p={8}
                      transition="all 0.4s ease"
                      css={{
                        animation: `cardFloat 5s ease-in-out infinite`,
                        animationDelay: item.delay,
                      }}
                      _hover={{
                        transform: "translateY(-12px) scale(1.02)",
                        borderColor: "rgba(0, 255, 42, 0.6)",
                        boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
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
                              bg="radial-gradient(circle, rgba(0, 255, 42, 0.3) 0%, transparent 70%)"
                              filter="blur(12px)"
                            />
                            <Box
                              position="relative"
                              bg="#0A0A0A"
                              border="2px solid"
                              borderColor="rgba(0, 255, 42, 0.5)"
                              color="white"
                              w="64px"
                              h="64px"
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="2xl"
                              boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                              transition="transform 0.3s ease"
                              _hover={{ transform: "scale(1.1) rotate(5deg)" }}
                            >
                              {item.icon}
                            </Box>
                          </Box>
                          <Badge
                            bg="#0A0A0A"
                            color="#00FF2A"
                            px={4}
                            py={2}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="800"
                            border="1px solid"
                            borderColor="rgba(0, 255, 42, 0.4)"
                            boxShadow="0 0 10px rgba(0, 255, 42, 0.2)"
                          >
                            {item.sessions}
                          </Badge>
                        </Flex>

                        {/* Content */}
                        <Box>
                          <Heading 
                            size="md" 
                            mb={3}
                            color="white"
                          >
                            {item.title}
                          </Heading>
                          <Text color="gray.400" fontSize="sm" lineHeight="1.8">
                            {item.desc}
                          </Text>
                        </Box>

                        {/* Bottom accent */}
                        <Box
                          h="4px"
                          bg="#00FF2A"
                          boxShadow="0 0 10px rgba(0, 255, 42, 0.5)"
                          borderRadius="full"
                          w="50px"
                          transition="width 0.4s ease"
                          _groupHover={{ w: "80px" }}
                        />

                        {/* Learn more indicator */}
                        <Flex 
                          align="center" 
                          gap={2}
                          color="gray.500"
                          fontSize="sm"
                          fontWeight="600"
                          aria-hidden="true"
                          transition="all 0.3s ease"
                          _groupHover={{ 
                            color: "#00FF2A",
                            gap: 3,
                          }}
                        >
                          <Text>{t("learnMore")}</Text>
                          <Text>←</Text>
                        </Flex>
                      </Stack>
                    </Box>
                  </Link>
                ))}
              </SimpleGrid>
            </Stack>
          </Box>

          {/* Elegant Divider */}
          <Box 
            h="1px" 
            bg="linear-gradient(90deg, transparent, #00FF2A, transparent)"
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
                    bg="#0A0A0A"
                    color="#00FF2A"
                    px={5}
                    py={2.5}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="700"
                    w="fit-content"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.5)"
                    boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                  >
                    {t("teachersBadge")}
                  </Badge>
                  <Heading 
                    size={{ base: "lg", md: "xl" }} 
                    lineHeight="1.3"
                    color="white"
                  >
                    {t("teachersTitle")}<br />{t("teachersSubtitle")}
                  </Heading>
                </Stack>
                <Text color="gray.400" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9" maxW="500px">
                  {t("teachersDescription")}
                </Text>
                <Flex gap={4} pt={2}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-3px"
                      borderRadius="xl"
                      bg="radial-gradient(circle, rgba(0, 255, 42, 0.4) 0%, transparent 70%)"
                      filter="blur(10px)"
                    />
                    <Button
                      position="relative"
                      bg="#00FF2A"
                      color="black"
                      size="lg"
                      px={10}
                      fontWeight="700"
                      boxShadow="0 0 20px rgba(0, 255, 42, 0.4)"
                      _hover={{ 
                        bg: "#4DFF6A",
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 0 30px rgba(0, 255, 42, 0.6)"
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
                bg="#050505"
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(0, 255, 42, 0.3)"
                boxShadow="0 0 30px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
                p={8}
              >
                  <SimpleGrid columns={2} gap={4}>
                    {[
                      { 
                        text: t("teacherFeatures.dragDrop"), 
                        icon: "🎨",
                        delay: "0s",
                      },
                      { 
                        text: t("teacherFeatures.qualityReview"), 
                        icon: "✅",
                        delay: "0.1s",
                      },
                      { 
                        text: t("teacherFeatures.analytics"), 
                        icon: "📊",
                        delay: "0.2s",
                      },
                      { 
                        text: t("teacherFeatures.smartAssessment"), 
                        icon: "🎯",
                        delay: "0.3s",
                      },
                    ].map((item, _index) => (
                      <Box
                        key={item.text}
                        position="relative"
                        bg="#0A0A0A"
                        borderRadius="xl"
                        p={5}
                        transition="all 0.4s ease"
                        border="1px solid"
                        borderColor="rgba(0, 255, 42, 0.2)"
                        css={{
                          animation: `featureSlide 0.6s ease forwards`,
                          animationDelay: item.delay,
                        }}
                        _hover={{
                          bg: "#0A0A0A",
                          borderColor: "rgba(0, 255, 42, 0.6)",
                          transform: "translateY(-8px) scale(1.03)",
                          boxShadow: "0 0 20px rgba(0, 255, 42, 0.3)",
                        }}
                      >
                        <Stack gap={4} align="center" textAlign="center">
                          {/* Icon with glow */}
                          <Box position="relative">
                            <Box
                              position="absolute"
                              inset="-6px"
                              borderRadius="xl"
                              bg="radial-gradient(circle, rgba(0, 255, 42, 0.3) 0%, transparent 70%)"
                              filter="blur(10px)"
                            />
                            <Box
                              position="relative"
                              bg="#0A0A0A"
                              border="2px solid"
                              borderColor="rgba(0, 255, 42, 0.5)"
                              w="56px"
                              h="56px"
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="xl"
                              boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
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
                            color="white"
                          >
                            {item.text}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </SimpleGrid>
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
            }}
          >
            <Stack gap={10} textAlign="center">
              <Stack gap={5} align="center" maxW="800px" mx="auto">
                <Badge
                  bg="#0A0A0A"
                  color="#00FF2A"
                  px={6}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="800"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.5)"
                  boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                >
                  {t("testimonialsBadge")}
                </Badge>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  color="white"
                >
                  {t("testimonialsTitle")}
                </Heading>
                <Text color="gray.400" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  {t("testimonialsSubtitle")}
                </Text>
              </Stack>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {[
                  { key: "student1" },
                  { key: "student2" },
                  { key: "student3" },
                ].map((student, index) => (
                  <Box
                    key={student.key}
                    position="relative"
                    bg="#050505"
                    borderRadius="2xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.3)"
                    boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                    transition="all 0.4s ease"
                    css={{
                      animation: `testimonialFloat 5s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                    _hover={{
                      transform: "translateY(-12px) scale(1.02)",
                      borderColor: "rgba(0, 255, 42, 0.6)",
                      boxShadow: "0 0 30px rgba(0, 255, 42, 0.3)",
                    }}
                  >
                    {/* Quote icon accent */}
                    <Box
                      position="absolute"
                      top={4}
                      right={4}
                      fontSize="4xl"
                      color="rgba(0, 255, 42, 0.2)"
                    >
                      ❝
                    </Box>
                    
                    <Stack p={8} gap={5}>
                      {/* Quote */}
                      <Text
                        fontSize="sm"
                        color="gray.400"
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
                        bg="#00FF2A"
                        boxShadow="0 0 10px rgba(0, 255, 42, 0.5)"
                        borderRadius="full"
                      />

                      {/* Author */}
                      <Flex align="center" gap={4}>
                        {/* Avatar */}
                        <Box
                          w="50px"
                          h="50px"
                          borderRadius="full"
                          bg="#0A0A0A"
                          border="2px solid"
                          borderColor="rgba(0, 255, 42, 0.5)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="xl"
                          color="#00FF2A"
                          fontWeight="800"
                          boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                        >
                          {t(`testimonials.${student.key}.name`).charAt(0)}
                        </Box>
                        <Stack gap={0}>
                          <Text fontWeight="800" fontSize="sm" color="white">
                            {t(`testimonials.${student.key}.name`)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {t(`testimonials.${student.key}.location`)}
                          </Text>
                          <Badge
                            bg="#0A0A0A"
                            color="#00FF2A"
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            mt={1}
                            border="1px solid"
                            borderColor="rgba(0, 255, 42, 0.3)"
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
                  bg="#0A0A0A"
                  color="#00FF2A"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.4)"
                >
                  {t("partnersBadge")}
                </Badge>
                <Text fontSize="lg" fontWeight="700" color="white">
                  {t("partnersTitle")}
                </Text>
              </Stack>
              
              {/* Partner logos placeholder - replace with actual logos */}
              <Flex
                gap={{ base: 8, md: 16 }}
                wrap="wrap"
                justify="center"
                align="center"
                opacity={0.7}
                transition="all 0.3s ease"
                _hover={{ opacity: 1 }}
              >
                {["🏛️ Al-Azhar", "📚 Islamic University", "🎓 Dar Al-Uloom", "🌍 ISNA", "📖 Quran Academy"].map((partner) => (
                  <Box
                    key={partner}
                    bg="#0A0A0A"
                    px={6}
                    py={3}
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight="600"
                    color="gray.400"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.2)"
                    transition="all 0.3s ease"
                    _hover={{
                      bg: "#050505",
                      color: "#00FF2A",
                      borderColor: "rgba(0, 255, 42, 0.5)",
                      transform: "scale(1.05)",
                      boxShadow: "0 0 15px rgba(0, 255, 42, 0.2)",
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
            bg="#050505"
            borderRadius="2xl"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 30px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
            p={{ base: 8, md: 12 }}
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
                    bg="#0A0A0A"
                    color="#00FF2A"
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="800"
                    w="fit-content"
                    mx={{ base: "auto", md: 0 }}
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.5)"
                    boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                  >
                    {t("assessmentBadge")}
                  </Badge>
                  <Heading size={{ base: "md", md: "lg" }} color="white">
                    {t("assessmentTitle")}
                  </Heading>
                  <Text color="gray.400" fontSize={{ base: "sm", md: "md" }} lineHeight="1.8">
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
                        bg="#0A0A0A"
                        border="1px solid"
                        borderColor="rgba(0, 255, 42, 0.3)"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="600"
                        color="gray.300"
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
                    bg="radial-gradient(circle, rgba(0, 255, 42, 0.4) 0%, transparent 70%)"
                    filter="blur(15px)"
                  />
                  <Button
                    asChild
                    position="relative"
                    bg="#00FF2A"
                    color="black"
                    size="lg"
                    px={10}
                    h="60px"
                    fontSize="lg"
                    fontWeight="800"
                    boxShadow="0 0 20px rgba(0, 255, 42, 0.4)"
                    _hover={{
                      bg: "#4DFF6A",
                      transform: "translateY(-4px) scale(1.02)",
                      boxShadow: "0 0 30px rgba(0, 255, 42, 0.6)",
                    }}
                    transition="all 0.3s ease"
                  >
                    <Link href="/assessment">{t("assessmentCta")}</Link>
                  </Button>
                </Box>
              </Flex>
          </Box>

          {/* Newsletter Signup Section - Like SeekersGuidance */}
          <Box
            position="relative"
            py={{ base: 10, md: 14 }}
            bg="#050505"
            borderRadius="2xl"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
            overflow="hidden"
          >
            {/* Decorative background */}
            <Box
              position="absolute"
              top="-50%"
              right="-10%"
              w="400px"
              h="400px"
              borderRadius="full"
              bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
              pointerEvents="none"
            />
            
            <Container maxW="3xl">
              <Stack gap={6} align="center" textAlign="center">
                <Box
                  w="70px"
                  h="70px"
                  borderRadius="full"
                  bg="#0A0A0A"
                  border="2px solid"
                  borderColor="rgba(0, 255, 42, 0.5)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  boxShadow="0 0 20px rgba(0, 255, 42, 0.3)"
                >
                  📬
                </Box>
                
                <Stack gap={2}>
                  <Heading size={{ base: "md", md: "lg" }} color="white">
                    {t("newsletter.title")}
                  </Heading>
                  <Text color="gray.400" fontSize={{ base: "sm", md: "md" }} maxW="500px">
                    {t("newsletter.description")}
                  </Text>
                </Stack>
                
                <Flex
                  direction={{ base: "column", sm: "row" }}
                  gap={3}
                  w="100%"
                  maxW="500px"
                >
                  <input
                    type="email"
                    placeholder={t("newsletter.placeholder")}
                    style={{
                      flex: 1,
                      padding: "16px 20px",
                      borderRadius: "12px",
                      border: "1px solid rgba(0, 255, 42, 0.3)",
                      backgroundColor: "#0A0A0A",
                      color: "white",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#00FF2A";
                      e.target.style.boxShadow = "0 0 15px rgba(0, 255, 42, 0.3)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(0, 255, 42, 0.3)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <Button
                    bg="#00FF2A"
                    color="black"
                    px={8}
                    h="auto"
                    py={4}
                    fontWeight="700"
                    borderRadius="xl"
                    boxShadow="0 0 15px rgba(0, 255, 42, 0.3)"
                    _hover={{
                      bg: "#4DFF6A",
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 25px rgba(0, 255, 42, 0.5)",
                    }}
                    transition="all 0.3s ease"
                  >
                    {t("newsletter.button")}
                  </Button>
                </Flex>
                
                <Text fontSize="xs" color="gray.500">
                  {t("newsletter.privacy")}
                </Text>
              </Stack>
            </Container>
          </Box>

          {/* Enhanced CTA Section with Neon Effect */}
          <Box
            position="relative"
            bg="#050505"
            borderRadius="2xl"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.4)"
            boxShadow="0 0 40px rgba(0, 255, 42, 0.3), inset 0 0 40px rgba(0, 255, 42, 0.05)"
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
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
                filter="blur(40px)"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="15%"
                left="10%"
                width="100px"
                height="100px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
                filter="blur(40px)"
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
                <Box position="relative">
                  <Box
                    position="absolute"
                    inset="-10px"
                    borderRadius="full"
                    bg="radial-gradient(circle, rgba(0, 255, 42, 0.4) 0%, transparent 70%)"
                    filter="blur(20px)"
                  />
                  <Box
                    position="relative"
                    bg="#0A0A0A"
                    border="2px solid"
                    borderColor="rgba(0, 255, 42, 0.5)"
                    color="white"
                    w="90px"
                    h="90px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="4xl"
                    boxShadow="0 0 30px rgba(0, 255, 42, 0.4)"
                  >
                    🚀
                  </Box>
                </Box>

                <Stack gap={3}>
                  <Heading 
                    size={{ base: "lg", md: "2xl" }} 
                    letterSpacing="tight"
                    color="white"
                  >
                    {t("ctaTitle")}
                  </Heading>
                  <Text color="gray.400" fontSize={{ base: "md", md: "xl" }} lineHeight="1.8" maxW="600px">
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
                      bg="radial-gradient(circle, rgba(0, 255, 42, 0.5) 0%, transparent 70%)"
                      filter="blur(8px)"
                    />
                    <Button 
                      position="relative"
                      bg="#00FF2A" 
                      color="black"
                      size="lg"
                      px={10}
                      h="56px"
                      fontSize="lg"
                      fontWeight="700"
                      boxShadow="0 0 20px rgba(0, 255, 42, 0.4)"
                      _hover={{ 
                        bg: "#4DFF6A",
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 0 30px rgba(0, 255, 42, 0.6)"
                      }}
                      transition="all 0.3s ease"
                      w={{ base: "100%", sm: "auto" }}
                    >
                      {t("createStudentAccount")}
                    </Button>
                  </Box>
                  <Button
                    variant="outline"
                    borderColor="rgba(0, 255, 42, 0.4)"
                    borderWidth="2px"
                    color="#00FF2A"
                    size="lg"
                    px={10}
                    h="56px"
                    fontSize="lg"
                    fontWeight="700"
                    bg="transparent"
                    _hover={{ 
                      bg: "rgba(0, 255, 42, 0.1)",
                      transform: "translateY(-4px)",
                      borderColor: "#00FF2A",
                      boxShadow: "0 0 20px rgba(0, 255, 42, 0.3)"
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
                    { icon: "✓", text: t("trustIndicators.trustedContent") },
                    { icon: "✓", text: t("trustIndicators.certifiedCertificates") },
                    { icon: "✓", text: t("trustIndicators.continuousSupport") },
                  ].map((item, i) => (
                    <Flex 
                      key={i}
                      align="center" 
                      gap={2}
                      bg="#0A0A0A"
                      px={4}
                      py={2}
                      borderRadius="full"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.3)"
                    >
                      <Text fontSize="lg" color="#00FF2A">✓</Text>
                      <Text fontWeight="600" color="gray.300">{item.text}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Stack>
          </Box>
        </Stack>
      </Container>
      </Box>
    </Box>
  );
}
