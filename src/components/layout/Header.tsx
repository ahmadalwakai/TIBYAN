"use client";

import { Box, Button, Container, Flex, Stack, Text, IconButton } from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { getCurrentUserClient, useLogout } from "@/lib/auth-client";
import { useEffect, useState, useRef, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { setLocale } from "@/i18n/actions";
import { type Locale, locales, localeNames, localeFlags, isRtlLocale } from "@/i18n/config";

const languages = locales.map(code => ({
  code,
  label: localeNames[code],
  flag: localeFlags[code],
  dir: isRtlLocale(code) ? "rtl" : "ltr",
}));

export default function Header() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const langMenuRef = useRef<HTMLDivElement>(null);
  const handleLogout = useLogout();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const t = useTranslations();
  const currentLocale = useLocale() as Locale;

  const navLinks = [
    { label: t("common.courses"), href: "/courses", icon: "📚" },
    { label: t("common.programs"), href: "/programs", icon: "🎓" },
    { label: t("common.instructors"), href: "/instructors", icon: "👨‍🏫" },
    { label: t("common.pricing"), href: "/pricing", icon: "💎" },
    { label: t("common.help"), href: "/help", icon: "❓" },
  ];

  useEffect(() => {
    const currentUser = getCurrentUserClient();
    setUser(currentUser);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Set active link based on current path
    setActiveLink(window.location.pathname);

    // Close menu on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: Locale) => {
    startTransition(async () => {
      await setLocale(langCode);
      setLangMenuOpen(false);
      // Refresh the page to apply the new locale
      window.location.reload();
    });
  };

  const currentLanguage = languages.find(l => l.code === currentLocale) || languages[0];

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={100}
      bg={scrolled ? "rgba(11, 31, 59, 0.95)" : "brand.900"}
      backdropFilter="blur(20px) saturate(180%)"
      boxShadow={scrolled ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 4px 20px rgba(0, 0, 0, 0.2)"}
      transition="all 0.4s ease"
      suppressHydrationWarning
      css={{
        "@keyframes shimmerBorder": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "@keyframes pulseGlow": {
          "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
          "50%": { opacity: 0.7, transform: "scale(1.05)" },
        },
        "@keyframes floatIcon": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "@keyframes linkGlow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(200, 162, 74, 0)" },
          "50%": { boxShadow: "0 0 20px rgba(200, 162, 74, 0.3)" },
        },
      }}
    >
      {/* Animated Top Border */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="3px"
        background="linear-gradient(90deg, transparent, #c8a24a, #00d4ff, #c8a24a, transparent)"
        backgroundSize="200% 100%"
        css={{ animation: "shimmerBorder 6s linear infinite" }}
      />

      {/* Bottom glow line */}
      <Box
        position="absolute"
        bottom={0}
        left="10%"
        right="10%"
        height="1px"
        background="linear-gradient(90deg, transparent, rgba(200, 162, 74, 0.5), transparent)"
      />

      <Container maxW="7xl" py={{ base: 3, md: 4 }} px={{ base: 4, md: 8 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={{ base: 4, md: 8 }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
        >
          {/* Logo Section */}
          <Flex align="center" gap={3} justify={{ base: "space-between", md: "flex-start" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={3}
                transition="all 0.3s ease"
                _hover={{ transform: "scale(1.03)" }}
              >
                <Box position="relative">
                  {/* Logo glow effect */}
                  <Box
                    position="absolute"
                    inset="-8px"
                    borderRadius="full"
                    background="radial-gradient(circle, rgba(200, 162, 74, 0.3) 0%, transparent 70%)"
                    filter="blur(10px)"
                    css={{ animation: "pulseGlow 3s ease-in-out infinite" }}
                  />
                  <Box position="relative">
                    <Logo size={55} showText={true} />
                  </Box>
                </Box>
              </Box>
            </Link>

            {/* Mobile menu button placeholder */}
            <IconButton
              display={{ base: "flex", md: "none" }}
              aria-label="Menu"
              variant="ghost"
              color="white"
              fontSize="xl"
            >
              <span>☰</span>
            </IconButton>
          </Flex>

          {/* Navigation Links */}
          <Flex
            display={{ base: "none", md: "flex" }}
            gap={1}
            flexWrap="wrap"
            justify="center"
            align="center"
            bg="whiteAlpha.100"
            backdropFilter="blur(10px)"
            borderRadius="full"
            p={1.5}
            borderWidth="1px"
            borderColor="whiteAlpha.200"
          >
            {navLinks.map((link) => {
              const isActive = activeLink === link.href;
              return (
                <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                  <Box
                    px={5}
                    py={2.5}
                    borderRadius="full"
                    fontWeight="600"
                    fontSize="sm"
                    color={isActive ? "brand.900" : "whiteAlpha.900"}
                    bg={isActive ? "white" : "transparent"}
                    transition="all 0.3s ease"
                    position="relative"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    _hover={{ 
                      color: isActive ? "brand.900" : "white",
                      bg: isActive ? "white" : "whiteAlpha.200",
                      transform: "translateY(-2px)",
                    }}
                    css={isActive ? { animation: "linkGlow 2s ease-in-out infinite" } : {}}
                  >
                    <Text 
                      as="span" 
                      display={{ base: "none", lg: "inline" }}
                      css={{ animation: "floatIcon 2s ease-in-out infinite" }}
                    >
                      {link.icon}
                    </Text>
                    {link.label}
                    {isActive && (
                      <Box
                        position="absolute"
                        bottom="-2px"
                        left="50%"
                        transform="translateX(-50%)"
                        w="20px"
                        h="3px"
                        borderRadius="full"
                        bg="linear-gradient(90deg, #c8a24a, #00d4ff)"
                      />
                    )}
                  </Box>
                </Link>
              );
            })}
          </Flex>

          {/* Actions Section */}
          <Stack
            direction={{ base: "column", sm: "row" }}
            gap={3}
            justify={{ base: "center", md: "flex-end" }}
            align="center"
            display={{ base: "none", md: "flex" }}
            suppressHydrationWarning
          >
            {/* Language Selector */}
            <Box position="relative" ref={langMenuRef}>
              <Box
                as="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                display="flex"
                alignItems="center"
                gap={2}
                px={4}
                py={2}
                borderRadius="full"
                bg="whiteAlpha.100"
                backdropFilter="blur(10px)"
                borderWidth="1px"
                borderColor={langMenuOpen ? "whiteAlpha.400" : "whiteAlpha.200"}
                color="white"
                fontSize="sm"
                fontWeight="600"
                cursor="pointer"
                transition="all 0.3s ease"
                _hover={{
                  bg: "whiteAlpha.200",
                  borderColor: "whiteAlpha.300",
                }}
              >
                <Text fontSize="lg">{currentLanguage.flag}</Text>
                <Text display={{ base: "none", lg: "inline" }}>{currentLanguage.label}</Text>
                <Text 
                  as="span" 
                  fontSize="xs" 
                  transition="transform 0.3s ease"
                  transform={langMenuOpen ? "rotate(180deg)" : "rotate(0deg)"}
                >
                  ▼
                </Text>
              </Box>

              {/* Language Dropdown */}
              {langMenuOpen && (
                <Box
                  position="absolute"
                  top="calc(100% + 8px)"
                  right={0}
                  minW="180px"
                  bg="rgba(11, 31, 59, 0.98)"
                  backdropFilter="blur(20px)"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  boxShadow="0 20px 40px rgba(0, 0, 0, 0.4)"
                  overflow="hidden"
                  zIndex={200}
                  css={{
                    animation: "fadeInScale 0.2s ease-out",
                    "@keyframes fadeInScale": {
                      "0%": { opacity: 0, transform: "scale(0.95) translateY(-10px)" },
                      "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
                    },
                  }}
                >
                  {/* Header */}
                  <Box
                    px={4}
                    py={3}
                    borderBottom="1px solid"
                    borderColor="whiteAlpha.100"
                    bg="whiteAlpha.50"
                  >
                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="600">
                      🌐 {t("common.selectLanguage")}
                    </Text>
                  </Box>

                  {/* Language Options */}
                  <Stack gap={0} py={2}>
                    {languages.map((lang) => (
                      <Box
                        key={lang.code}
                        as="button"
                        onClick={() => handleLanguageChange(lang.code)}
                        aria-disabled={isPending}
                        display="flex"
                        alignItems="center"
                        gap={3}
                        w="full"
                        px={4}
                        py={2.5}
                        bg={currentLocale === lang.code ? "whiteAlpha.150" : "transparent"}
                        color="white"
                        fontSize="sm"
                        fontWeight={currentLocale === lang.code ? "700" : "500"}
                        cursor={isPending ? "wait" : "pointer"}
                        transition="all 0.2s ease"
                        opacity={isPending ? 0.7 : 1}
                        _hover={{
                          bg: "whiteAlpha.100",
                        }}
                        textAlign="start"
                      >
                        <Text fontSize="xl">{lang.flag}</Text>
                        <Text flex={1}>{lang.label}</Text>
                        {currentLocale === lang.code && (
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="full"
                            bg="#c8a24a"
                            boxShadow="0 0 10px #c8a24a"
                          />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Color Mode Toggle */}
            <IconButton
              onClick={toggleColorMode}
              aria-label="Toggle color mode"
              variant="ghost"
              size="sm"
              borderRadius="full"
              bg="whiteAlpha.200"
              color="white"
              w="40px"
              h="40px"
              _hover={{ 
                bg: "whiteAlpha.300",
                transform: "rotate(20deg) scale(1.1)",
              }}
              transition="all 0.3s ease"
              title={colorMode === "light" ? t("header.darkMode") : t("header.lightMode")}
              suppressHydrationWarning
            >
              <span suppressHydrationWarning style={{ fontSize: "1.2rem" }}>
                {colorMode === "light" ? "🌙" : "☀️"}
              </span>
            </IconButton>

            {user ? (
              <>
                {/* User Info with Avatar */}
                <Flex
                  align="center"
                  gap={3}
                  bg="whiteAlpha.100"
                  backdropFilter="blur(10px)"
                  px={4}
                  py={2}
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  suppressHydrationWarning
                >
                  <Box
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    bg="linear-gradient(135deg, #c8a24a, #ffd700)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="brand.900"
                    fontSize="sm"
                    fontWeight="800"
                    boxShadow="0 4px 12px rgba(200, 162, 74, 0.4)"
                  >
                    {user.name.charAt(0)}
                  </Box>
                  <Flex direction="column" align="flex-start">
                    <Text fontSize="sm" fontWeight="700" color="white" suppressHydrationWarning>
                      {user.name}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.700" suppressHydrationWarning>
                      {user.role === "admin" ? `🛡️ ${t("common.admin")}` : `👤 ${t("common.user")}`}
                    </Text>
                  </Flex>
                </Flex>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  borderColor="red.400"
                  color="red.300"
                  size="sm"
                  borderRadius="full"
                  px={5}
                  _hover={{
                    bg: "red.500",
                    borderColor: "red.500",
                    color: "white",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
                  }}
                  transition="all 0.3s ease"
                  suppressHydrationWarning
                >
                  🚪 {t("common.logout")}
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" style={{ textDecoration: "none" }}>
                  <Button
                    variant="ghost"
                    color="whiteAlpha.900"
                    borderRadius="full"
                    px={6}
                    fontWeight="600"
                    transition="all 0.3s ease"
                    _hover={{
                      bg: "whiteAlpha.200",
                      color: "white",
                      transform: "translateY(-2px)",
                    }}
                    suppressHydrationWarning
                  >
                    {t("common.login")}
                  </Button>
                </Link>
                <Link href="/auth/register" style={{ textDecoration: "none" }}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-3px"
                      borderRadius="full"
                      background="linear-gradient(135deg, #c8a24a, #00d4ff, #c8a24a)"
                      backgroundSize="200% 200%"
                      filter="blur(8px)"
                      opacity={0.5}
                      css={{ animation: "pulseGlow 2s ease-in-out infinite" }}
                    />
                    <Button
                      position="relative"
                      bg="linear-gradient(135deg, #c8a24a, #ffd700)"
                      color="brand.900"
                      borderRadius="full"
                      px={7}
                      fontWeight="800"
                      transition="all 0.3s ease"
                      boxShadow="0 4px 20px rgba(200, 162, 74, 0.4)"
                      _hover={{
                        transform: "translateY(-3px) scale(1.02)",
                        boxShadow: "0 8px 30px rgba(200, 162, 74, 0.5)",
                      }}
                      suppressHydrationWarning
                    >
                      ✨ {t("common.register")}
                    </Button>
                  </Box>
                </Link>
              </>
            )}
          </Stack>
        </Flex>
      </Container>
    </Box>
  );
}
