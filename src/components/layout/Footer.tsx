"use client";

import { Box, Container, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { PHONE_NUMBER_DISPLAY, TEL_URL } from "@/config/contact";
import Logo from "@/components/ui/Logo";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations();
  
  const footerSections = [
    {
      title: t("footer.platform"),
      icon: "🏠",
      links: [
        { label: t("footer.about"), href: "/about" },
        { label: t("common.courses"), href: "/courses" },
        { label: t("common.programs"), href: "/programs" },
        { label: t("common.instructors"), href: "/instructors" },
      ],
    },
    {
      title: t("footer.resources"),
      icon: "📚",
      links: [
        { label: t("footer.helpCenter"), href: "/help" },
        { label: t("footer.blog"), href: "/blog" },
        { label: t("common.pricing"), href: "/pricing" },
        { label: t("footer.faq"), href: "/faq" },
      ],
    },
    {
      title: t("footer.legal"),
      icon: "📋",
      links: [
        { label: t("footer.privacy"), href: "/legal/privacy" },
        { label: t("footer.terms"), href: "/legal/terms" },
        { label: t("footer.contentPolicy"), href: "/legal/content" },
      ],
    },
  ];

  return (
    <Box
      as="footer"
      position="relative"
      overflow="hidden"
      bg="brand.900"
      color="white"
      suppressHydrationWarning
      css={{
        "@keyframes footerGlow": {
          "0%, 100%": { opacity: 0.3 },
          "50%": { opacity: 0.6 },
        },
        "@keyframes floatOrb": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        "@keyframes shimmerLine": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      }}
    >
      {/* Decorative Background Elements */}
      <Box
        position="absolute"
        top="-100px"
        right="-50px"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(200, 162, 74, 0.15) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
        css={{ animation: "floatOrb 10s ease-in-out infinite" }}
      />
      <Box
        position="absolute"
        bottom="-80px"
        left="10%"
        w="250px"
        h="250px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)"
        filter="blur(50px)"
        pointerEvents="none"
        css={{ animation: "floatOrb 12s ease-in-out infinite reverse" }}
      />

      {/* Top Gradient Line */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="4px"
        background="linear-gradient(90deg, transparent, #c8a24a, #00d4ff, #c8a24a, transparent)"
        backgroundSize="200% 100%"
        css={{ animation: "shimmerLine 6s linear infinite" }}
      />

      <Container maxW="6xl" py={{ base: 12, md: 16 }} px={{ base: 6, md: 8 }} position="relative">
        <Stack gap={12}>
          {/* Top Section */}
          <Flex 
            direction={{ base: "column", lg: "row" }} 
            gap={{ base: 10, lg: 16 }} 
            justify="space-between"
            align={{ base: "center", lg: "flex-start" }}
          >
            {/* Brand Section */}
            <Stack gap={5} maxW="md" align={{ base: "center", lg: "flex-start" }} textAlign={{ base: "center", lg: "start" }}>
              <Flex align="center" gap={3}>
                <Logo size={50} showText={true} />
              </Flex>
              <Text color="whiteAlpha.800" lineHeight="1.9" fontSize="md">
                {t("footer.description")}
              </Text>
              
              {/* Social Links Placeholder */}
              <Flex gap={3} pt={2} role="list" aria-label="Social media links">
                {[
                  { icon: "📧", label: "Email" },
                  { icon: "📱", label: "Phone" },
                  { icon: "🐦", label: "Twitter" },
                  { icon: "📸", label: "Instagram" }
                ].map((social, i) => (
                  <Box
                    key={i}
                    as="span"
                    role="listitem"
                    aria-label={social.label}
                    w="44px"
                    h="44px"
                    borderRadius="xl"
                    bg="whiteAlpha.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="lg"
                    transition="all 0.3s ease"
                    _hover={{
                      bg: "whiteAlpha.200",
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    {social.icon}
                  </Box>
                ))}
              </Flex>
            </Stack>

            {/* Contact Card */}
            <Box
              position="relative"
              borderRadius="2xl"
              overflow="hidden"
              minW={{ base: "100%", md: "320px" }}
            >
              {/* Animated border */}
              <Box
                position="absolute"
                inset="-2px"
                borderRadius="2xl"
                background="linear-gradient(135deg, #c8a24a, #00d4ff, #c8a24a)"
                backgroundSize="200% 200%"
                css={{ animation: "shimmerLine 4s linear infinite" }}
                opacity={0.6}
              />
              
              <Box
                position="relative"
                bg="whiteAlpha.100"
                backdropFilter="blur(20px)"
                borderRadius="xl"
                m="2px"
                p={6}
              >
                <Stack gap={4}>
                  <Flex align="center" gap={2}>
                    <Text fontSize="xl">📞</Text>
                    <Text fontWeight="800" fontSize="lg">{t("footer.contactUs")}</Text>
                  </Flex>
                  
                  <Stack gap={3}>
                    <Flex 
                      align="center" 
                      gap={3}
                      p={3}
                      borderRadius="lg"
                      bg="whiteAlpha.50"
                      transition="all 0.3s ease"
                      _hover={{ bg: "whiteAlpha.100", transform: "translateX(-4px)" }}
                    >
                      <Box
                        w="36px"
                        h="36px"
                        borderRadius="lg"
                        bg="linear-gradient(135deg, #c8a24a, #ffd700)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="md"
                      >
                        ✉️
                      </Box>
                      <Text color="whiteAlpha.900" fontSize="sm">support@tibyan.academy</Text>
                    </Flex>
                    
                    <a href={TEL_URL} style={{ textDecoration: "none" }}>
                      <Flex 
                        align="center" 
                        gap={3}
                        p={3}
                        borderRadius="lg"
                        bg="whiteAlpha.50"
                        transition="all 0.3s ease"
                        _hover={{ bg: "whiteAlpha.100", transform: "translateX(-4px)" }}
                      >
                        <Box
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          bg="linear-gradient(135deg, #00d4ff, #0099ff)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="md"
                        >
                          📱
                        </Box>
                        <Text color="whiteAlpha.900" fontSize="sm" dir="ltr">{PHONE_NUMBER_DISPLAY}</Text>
                      </Flex>
                    </a>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          </Flex>

          {/* Links Section */}
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={{ base: 8, md: 12 }}>
            {footerSections.map((section) => (
              <Stack key={section.title} gap={4}>
                <Flex align="center" gap={2}>
                  <Text fontSize="lg">{section.icon}</Text>
                  <Text 
                    fontWeight="800" 
                    fontSize="md"
                    css={{
                      background: "linear-gradient(135deg, #ffffff, #c8a24a)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {section.title}
                  </Text>
                </Flex>
                <Stack gap={2}>
                  {section.links.map((link) => (
                    <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                      <Box
                        color="whiteAlpha.800"
                        fontSize="sm"
                        py={1}
                        transition="all 0.3s ease"
                        position="relative"
                        _hover={{
                          color: "white",
                          transform: "translateX(-6px)",
                        }}
                        css={{
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            right: "-12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "4px",
                            height: "4px",
                            borderRadius: "full",
                            background: "#c8a24a",
                            opacity: 0,
                            transition: "opacity 0.3s ease",
                          },
                          "&:hover::before": {
                            opacity: 1,
                          },
                        }}
                      >
                        {link.label}
                      </Box>
                    </Link>
                  ))}
                </Stack>
              </Stack>
            ))}
          </SimpleGrid>

          {/* Bottom Section */}
          <Box
            borderTop="1px solid"
            borderColor="whiteAlpha.200"
            pt={8}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              gap={4}
              justify="space-between"
              align="center"
            >
              <Text color="whiteAlpha.800" fontSize="sm">
                {t("footer.rights")}
              </Text>
              

            </Flex>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
