"use client";

import { Badge, Box, Container, Heading, Stack, Text, Button } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * HeroSection - Main homepage hero with video background
 * Extracted from page.tsx for modularity
 */
export default function HeroSection() {
  const t = useTranslations("home");

  return (
    <Box
      position="relative"
      minH={{ base: "100vh", md: "95vh" }}
      overflow="hidden"
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onError={(e) => {
          e.currentTarget.style.display = "none";
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
        <track kind="captions" src="/videos/hero-captions.vtt" srcLang="ar" label="Arabic" default />
      </video>

      {/* Fallback Gradient Background - Cyber Black */}
      <Box
        position="absolute"
        inset={0}
        zIndex={-1}
        bg="linear-gradient(135deg, #000000 0%, #050505 25%, #0A0A0A 50%, #050505 75%, #000000 100%)"
        backgroundSize="400% 400%"
        css={{
          animation: "gradientShift 20s ease infinite",
          "@keyframes gradientShift": {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
        }}
      />

      {/* Floating Orbs - Neon Green */}
      <Box position="absolute" inset={0} zIndex={1} overflow="hidden" pointerEvents="none">
        <Box
          position="absolute"
          top="10%"
          right="15%"
          w={{ base: "150px", md: "250px" }}
          h={{ base: "150px", md: "250px" }}
          borderRadius="full"
          bg="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
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
          bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
          filter="blur(35px)"
          css={{ animation: "heroFloat 12s ease-in-out infinite reverse" }}
        />
      </Box>

      {/* Dark Overlay - Pure Black */}
      <Box
        position="absolute"
        inset={0}
        zIndex={2}
        bg="linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0.75) 70%, rgba(0, 0, 0, 0.85) 100%)"
        backdropFilter="blur(1px)"
        pointerEvents="none"
      />

      {/* Bottom Gradient Transition - To Black */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        h="50%"
        zIndex={3}
        bg="linear-gradient(to top, #000000 0%, #000000 5%, rgba(0, 0, 0, 0.95) 15%, rgba(0, 0, 0, 0.7) 30%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)"
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
          {/* Badge */}
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
              background: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(0, 255, 42, 0.1)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "full",
                padding: "2px",
                background: "linear-gradient(135deg, #00FF2A, #4DFF6A, #00FF2A, #00FF2A)",
                backgroundSize: "300% 300%",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                animation: "gradientShift 4s ease infinite",
              },
            }}
          >
            {t("heroBadge")}
          </Badge>

          {/* Platform Name */}
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
                textShadow: "0 0 80px rgba(0, 255, 42, 0.5)",
                filter: "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))",
              }}
            >
              {t("platformName")}
            </Heading>
            <Box
              position="absolute"
              bottom={{ base: "-8px", md: "-12px" }}
              left="50%"
              transform="translateX(-50%)"
              w={{ base: "60%", md: "50%" }}
              h={{ base: "3px", md: "4px" }}
              borderRadius="full"
              background="linear-gradient(90deg, transparent, #00FF2A, #4DFF6A, #00FF2A, transparent)"
              css={{ animation: "sparkle 3s ease-in-out infinite" }}
            />
          </Box>

          {/* Titles */}
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

          {/* Description */}
          <Text
            color="rgba(255, 255, 255, 0.8)"
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
                bg="linear-gradient(135deg, #00FF2A 0%, #00DD24 100%)"
                color="#000000"
                size="lg"
                px={{ base: 8, md: 12 }}
                h={{ base: "56px", md: "64px" }}
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="800"
                borderRadius="xl"
                boxShadow="0 8px 30px rgba(0, 255, 42, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                _hover={{
                  bg: "linear-gradient(135deg, #4DFF6A 0%, #00FF2A 100%)",
                  transform: "translateY(-4px) scale(1.02)",
                  boxShadow: "0 16px 50px rgba(0, 255, 42, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                }}
                _active={{ transform: "translateY(-2px) scale(1.01)" }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                w={{ base: "100%", sm: "auto" }}
              >
                <Link href="/assessment">{t("startAssessment")}</Link>
              </Button>
            </Box>

            <Button
              asChild
              variant="outline"
              borderWidth="2px"
              borderColor="rgba(0, 255, 42, 0.5)"
              color="white"
              size="lg"
              px={{ base: 8, md: 12 }}
              h={{ base: "56px", md: "64px" }}
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="700"
              borderRadius="xl"
              bg="rgba(0, 0, 0, 0.5)"
              backdropFilter="blur(10px)"
              _hover={{
                bg: "rgba(0, 255, 42, 0.15)",
                borderColor: "#00FF2A",
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0, 255, 42, 0.2)",
              }}
              _active={{ transform: "translateY(-2px)" }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              w={{ base: "100%", sm: "auto" }}
            >
              <Link href="/programs">{t("explorePrograms")}</Link>
            </Button>
          </Stack>

          {/* Hero Stats */}
          <HeroStats />
        </Stack>
      </Container>

      {/* Global keyframes */}
      <style jsx global>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </Box>
  );
}

/** Hero Stats Sub-component */
function HeroStats() {
  const t = useTranslations("home");
  
  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(3, 1fr)"
      gap={{ base: 3, md: 6 }}
      pt={{ base: 8, md: 12 }}
      w="100%"
      maxW="700px"
    >
      {[
        { value: "+5", label: t("stats.programs") },
        { value: "معتمد", label: t("stats.certified") },
        { value: "مختصون", label: t("stats.expertInstructors"), highlight: true },
      ].map((stat) => (
        <Box
          key={stat.label}
          bg="rgba(0, 0, 0, 0.8)"
          backdropFilter="blur(10px)"
          borderRadius="2xl"
          p={{ base: 4, md: 6 }}
          border="1px solid"
          borderColor="rgba(0, 255, 42, 0.2)"
          transition="all 0.3s ease"
          _hover={{
            bg: "rgba(0, 0, 0, 0.9)",
            borderColor: "rgba(0, 255, 42, 0.5)",
            transform: "translateY(-4px)",
            boxShadow: "0 0 20px rgba(0, 255, 42, 0.2)",
          }}
        >
          <Stack gap={1} align="center">
            <Text
              fontSize={{ base: "2xl", md: "4xl" }}
              fontWeight="900"
              color={stat.highlight ? "#00FF2A" : "white"}
            >
              {stat.value}
            </Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="rgba(255, 255, 255, 0.7)" fontWeight="600">
              {stat.label}
            </Text>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
