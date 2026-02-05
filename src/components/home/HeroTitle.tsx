"use client";

import { Box, Text, VStack } from "@chakra-ui/react";
import { useLocale } from "next-intl";
import { keyframes } from "@emotion/react";

// Animation keyframes
const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    text-shadow: 
      0 0 20px rgba(0, 255, 42, 0.3),
      0 0 40px rgba(0, 255, 42, 0.2),
      0 0 60px rgba(0, 255, 42, 0.1);
  }
  50% {
    text-shadow: 
      0 0 30px rgba(0, 255, 42, 0.5),
      0 0 60px rgba(0, 255, 42, 0.3),
      0 0 90px rgba(0, 255, 42, 0.2);
  }
`;

const subtitleReveal = keyframes`
  from {
    opacity: 0;
    letter-spacing: 0.3em;
  }
  to {
    opacity: 1;
    letter-spacing: 0.05em;
  }
`;

// Premium blur-to-clear text reveal animation (continuous)
const blurReveal = keyframes`
  0% {
    opacity: 0;
    filter: blur(20px);
    letter-spacing: 0.8em;
    transform: scale(0.9);
  }
  15% {
    opacity: 0.5;
    filter: blur(10px);
    letter-spacing: 0.6em;
  }
  30% {
    opacity: 0.8;
    filter: blur(4px);
    letter-spacing: 0.5em;
  }
  50% {
    opacity: 1;
    filter: blur(0px);
    letter-spacing: 0.4em;
    transform: scale(1);
  }
  85% {
    opacity: 1;
    filter: blur(0px);
    letter-spacing: 0.4em;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    filter: blur(20px);
    letter-spacing: 0.8em;
    transform: scale(0.9);
  }
`;

// Slide in from right with blur (for RTL Arabic text) - continuous
const slideBlurRevealRTL = keyframes`
  0% {
    opacity: 0;
    filter: blur(15px);
    transform: translateX(60px);
  }
  25% {
    opacity: 1;
    filter: blur(0px);
    transform: translateX(0);
  }
  75% {
    opacity: 1;
    filter: blur(0px);
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    filter: blur(15px);
    transform: translateX(-60px);
  }
`;

// Slide in from left with blur (for second line) - continuous
const slideBlurRevealLTR = keyframes`
  0% {
    opacity: 0;
    filter: blur(15px);
    transform: translateX(-60px);
  }
  25% {
    opacity: 1;
    filter: blur(0px);
    transform: translateX(0);
  }
  75% {
    opacity: 1;
    filter: blur(0px);
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    filter: blur(15px);
    transform: translateX(60px);
  }
`;

// Title reveal animation - drops from above with bounce
const titleDrop = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-100px) scale(0.8);
    filter: blur(20px);
  }
  50% {
    opacity: 1;
    transform: translateY(10px) scale(1.02);
    filter: blur(0px);
  }
  70% {
    transform: translateY(-5px) scale(0.99);
  }
  85% {
    transform: translateY(3px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }
`;

// Glow appear animation
const glowAppear = keyframes`
  0% {
    opacity: 0;
    filter: blur(40px);
  }
  100% {
    opacity: 0.5;
    filter: blur(25px);
  }
`;

// Lightning strike effect - triggers after drop animation
const lightningStrike = keyframes`
  0%, 100% {
    text-shadow: 
      0 0 20px rgba(0, 255, 42, 0.3),
      0 0 40px rgba(0, 255, 42, 0.2);
    filter: brightness(1);
  }
  /* First strike */
  2% {
    text-shadow: 
      0 0 60px rgba(255, 255, 255, 1),
      0 0 100px rgba(0, 255, 42, 1),
      0 0 140px rgba(0, 255, 42, 0.8),
      0 0 200px rgba(255, 255, 255, 0.6);
    filter: brightness(2);
  }
  4% {
    text-shadow: 
      0 0 20px rgba(0, 255, 42, 0.3);
    filter: brightness(1);
  }
  /* Second strike (quick flash) */
  6% {
    text-shadow: 
      0 0 80px rgba(255, 255, 255, 1),
      0 0 120px rgba(0, 255, 42, 1),
      0 0 180px rgba(0, 255, 42, 0.9),
      0 0 250px rgba(255, 255, 255, 0.7);
    filter: brightness(2.5);
  }
  8% {
    text-shadow: 
      0 0 40px rgba(255, 255, 255, 0.8),
      0 0 80px rgba(0, 255, 42, 0.6);
    filter: brightness(1.5);
  }
  10% {
    text-shadow: 
      0 0 20px rgba(0, 255, 42, 0.3);
    filter: brightness(1);
  }
  /* Third strike (strongest) */
  12% {
    text-shadow: 
      0 0 100px rgba(255, 255, 255, 1),
      0 0 150px rgba(0, 255, 42, 1),
      0 0 200px rgba(0, 255, 42, 1),
      0 0 300px rgba(255, 255, 255, 0.8),
      0 0 400px rgba(0, 255, 42, 0.5);
    filter: brightness(3);
  }
  15% {
    text-shadow: 
      0 0 50px rgba(255, 255, 255, 0.5),
      0 0 100px rgba(0, 255, 42, 0.4);
    filter: brightness(1.2);
  }
  20% {
    text-shadow: 
      0 0 20px rgba(0, 255, 42, 0.3),
      0 0 40px rgba(0, 255, 42, 0.2);
    filter: brightness(1);
  }
`;

// Lightning flash overlay
const lightningFlash = keyframes`
  0%, 100% {
    opacity: 0;
  }
  2% {
    opacity: 0.3;
  }
  4% {
    opacity: 0;
  }
  6% {
    opacity: 0.5;
  }
  8% {
    opacity: 0.2;
  }
  10% {
    opacity: 0;
  }
  12% {
    opacity: 0.7;
  }
  15% {
    opacity: 0.3;
  }
  20% {
    opacity: 0;
  }
`;

export function HeroTitle() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const titleText = isArabic ? "تِبْيَان" : "TIBYAN";

  return (
    <VStack gap={0} textAlign="center" position="relative">
      {/* Decorative top accent */}
      <Box
        w={{ base: "60px", md: "80px" }}
        h="2px"
        bg="linear-gradient(90deg, transparent, #00FF2A, transparent)"
        mb={{ base: 4, md: 6 }}
        css={{
          animation: `${fadeInUp} 0.8s ease-out`,
        }}
      />

      {/* Arabic Badge - "أكاديمية" label */}
      {isArabic && (
        <Text
          fontSize={{ base: "sm", md: "md" }}
          fontWeight="500"
          color="rgba(0, 255, 42, 0.8)"
          letterSpacing="0.2em"
          textTransform="uppercase"
          fontFamily="var(--font-tajawal)"
          mb={{ base: 2, md: 3 }}
          css={{
            animation: `${subtitleReveal} 1s ease-out`,
          }}
        >
          أَكَادِيمِيَّة
        </Text>
      )}

      {/* Main Title - "تِبيان" with drop animation and lightning */}
      <Box
        as="h1"
        position="relative"
        style={{ perspective: "1000px" }}
      >
        {/* Lightning flash overlay */}
        <Box
          position="absolute"
          inset={-20}
          borderRadius="50%"
          bg="radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(0,255,42,0.4) 30%, transparent 70%)"
          pointerEvents="none"
          css={{
            animation: `${lightningFlash} 5s ease-in-out 1.5s infinite`,
          }}
        />

        {/* Glow effect layer (behind) */}
        <Text
          as="span"
          position="absolute"
          inset={0}
          fontSize={{ base: "5xl", sm: "6xl", md: "8xl", lg: "9xl" }}
          fontWeight="700"
          fontFamily={isArabic ? "var(--font-amiri)" : "var(--font-inter)"}
          color="transparent"
          textAlign="center"
          css={{
            background: "linear-gradient(135deg, #00FF2A 0%, #4DFF6A 50%, #00FF2A 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            animation: `${glowAppear} 1s ease-out 0.3s both`,
          }}
          aria-hidden="true"
        >
          {titleText}
        </Text>

        {/* Main text with drop animation and lightning effect */}
        <Text
          as="span"
          display="block"
          fontSize={{ base: "5xl", sm: "6xl", md: "8xl", lg: "9xl" }}
          fontWeight="700"
          fontFamily={isArabic ? "var(--font-amiri)" : "var(--font-inter)"}
          lineHeight="1.1"
          position="relative"
          css={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #00FF2A 35%, #4DFF6A 50%, #00FF2A 65%, #FFFFFF 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animation: `
              ${titleDrop} 1s cubic-bezier(0.34, 1.56, 0.64, 1) both,
              ${shimmer} 4s linear infinite 1.2s,
              ${lightningStrike} 5s ease-in-out 1.5s infinite
            `,
          }}
        >
          {titleText}
        </Text>
      </Box>

      {/* English subtitle for Arabic locale - Premium blur reveal */}
      {isArabic && (
        <Text
          fontSize={{ base: "xs", md: "sm" }}
          fontWeight="600"
          color="rgba(255, 255, 255, 0.5)"
          letterSpacing="0.4em"
          textTransform="uppercase"
          fontFamily="var(--font-inter)"
          mt={{ base: 2, md: 4 }}
          css={{
            animation: `${blurReveal} 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.2s infinite`,
          }}
        >
          TIBYAN ACADEMY
        </Text>
      )}

      {/* Decorative bottom accent */}
      <Box
        w={{ base: "120px", md: "180px" }}
        h="1px"
        bg="linear-gradient(90deg, transparent, rgba(0, 255, 42, 0.5), transparent)"
        mt={{ base: 4, md: 6 }}
        css={{
          animation: `${fadeInUp} 0.8s ease-out 0.3s both`,
        }}
      />

      {/* Tagline / Subtitle with slide + blur animations */}
      <Box
        mt={{ base: 6, md: 10 }}
        maxW={{ base: "320px", md: "600px", lg: "700px" }}
      >
        <Text
          fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
          fontWeight="500"
          fontFamily={isArabic ? "var(--font-tajawal)" : "var(--font-inter)"}
          lineHeight="1.9"
          color="white"
          position="relative"
        >
          {/* Highlighted keywords with neon effect */}
          {isArabic ? (
            <>
              {/* First line - slides from right */}
              <Box
                as="span"
                display="block"
                css={{
                  animation: `${slideBlurRevealRTL} 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.5s infinite`,
                }}
              >
                <Text as="span" color="gray.300">حصص </Text>
                <Text
                  as="span"
                  color="#00FF2A"
                  fontWeight="700"
                  css={{
                    textShadow: "0 0 20px rgba(0, 255, 42, 0.4)",
                  }}
                >
                  قراءة عربية
                </Text>
                <Text as="span" color="gray.300"> أونلاين</Text>
              </Box>
              {/* Second line - slides from left */}
              <Box
                as="span"
                display="block"
                css={{
                  animation: `${slideBlurRevealLTR} 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.7s infinite`,
                }}
              >
                <Text as="span" color="gray.300">مع </Text>
                <Text
                  as="span"
                  color="white"
                  fontWeight="600"
                  css={{
                    borderBottom: "2px solid rgba(0, 255, 42, 0.4)",
                    paddingBottom: "2px",
                  }}
                >
                  معلمين حقيقيين
                </Text>
                <Text as="span" color="gray.300"> وتقدّم </Text>
                <Text
                  as="span"
                  color="#00FF2A"
                  fontWeight="700"
                  css={{
                    textShadow: "0 0 20px rgba(0, 255, 42, 0.4)",
                  }}
                >
                  ملموس
                </Text>
              </Box>
            </>
          ) : (
            <>
              {/* First line - slides from right */}
              <Box
                as="span"
                display="block"
                css={{
                  animation: `${slideBlurRevealRTL} 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.5s infinite`,
                }}
              >
                <Text as="span" color="gray.300">Online </Text>
                <Text
                  as="span"
                  color="#00FF2A"
                  fontWeight="700"
                  css={{
                    textShadow: "0 0 20px rgba(0, 255, 42, 0.4)",
                  }}
                >
                  Arabic reading
                </Text>
                <Text as="span" color="gray.300"> classes</Text>
              </Box>
              {/* Second line - slides from left */}
              <Box
                as="span"
                display="block"
                css={{
                  animation: `${slideBlurRevealLTR} 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.7s infinite`,
                }}
              >
                <Text as="span" color="gray.300">with </Text>
                <Text
                  as="span"
                  color="white"
                  fontWeight="600"
                  css={{
                    borderBottom: "2px solid rgba(0, 255, 42, 0.4)",
                    paddingBottom: "2px",
                  }}
                >
                  real teachers
                </Text>
                <Text as="span" color="gray.300"> and </Text>
                <Text
                  as="span"
                  color="#00FF2A"
                  fontWeight="700"
                  css={{
                    textShadow: "0 0 20px rgba(0, 255, 42, 0.4)",
                  }}
                >
                  real progress
                </Text>
              </Box>
            </>
          )}
        </Text>
      </Box>

      {/* Floating decorative elements */}
      <Box
        position="absolute"
        top={{ base: "-20px", md: "-40px" }}
        right={{ base: "-30px", md: "-80px" }}
        w={{ base: "60px", md: "100px" }}
        h={{ base: "60px", md: "100px" }}
        borderRadius="full"
        border="1px solid rgba(0, 255, 42, 0.15)"
        pointerEvents="none"
        css={{
          animation: `${fadeInUp} 1.2s ease-out 0.6s both`,
        }}
      />
      <Box
        position="absolute"
        bottom={{ base: "0", md: "-20px" }}
        left={{ base: "-20px", md: "-60px" }}
        w={{ base: "40px", md: "70px" }}
        h={{ base: "40px", md: "70px" }}
        borderRadius="full"
        bg="rgba(0, 255, 42, 0.05)"
        pointerEvents="none"
        css={{
          animation: `${fadeInUp} 1.2s ease-out 0.8s both`,
        }}
      />
    </VStack>
  );
}
