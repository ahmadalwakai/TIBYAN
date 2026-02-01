"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Container, Flex, IconButton, Stack, Text } from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/ui/NotificationBell";
import { logout, getCurrentUserClient, type CookieUserData } from "@/lib/auth-client";
import { isRtlLocale, locales, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { BRAND } from "@/theme/brand";

// ============================================================================
// CONSTANTS - Single source of truth for all sizing
// ============================================================================
const HEADER_HEIGHT = 72;
const INTERACTIVE_HEIGHT = 44;
const INTERACTIVE_RADIUS = 12;
const ICON_BUTTON_SIZE = 44;
const DROPDOWN_RADIUS = 16;
const TRANSITION = "all 0.2s ease";

// Language display names
const LANGUAGE_NAMES: Record<Locale, { native: string; flag: string }> = {
  ar: { native: "العربية", flag: "🇸🇦" },
  en: { native: "English", flag: "🇬🇧" },
  de: { native: "Deutsch", flag: "🇩🇪" },
  fr: { native: "Français", flag: "🇫🇷" },
  es: { native: "Español", flag: "🇪🇸" },
  sv: { native: "Svenska", flag: "🇸🇪" },
  tr: { native: "Türkçe", flag: "🇹🇷" },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface NavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

function NavLink({ href, isActive, children }: NavLinkProps) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Box
        px={4}
        py={2}
        height={`${INTERACTIVE_HEIGHT}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius={`${INTERACTIVE_RADIUS}px`}
        fontSize="sm"
        fontWeight={isActive ? "700" : "500"}
        color={isActive ? BRAND.gold[500] : "white"}
        bg={isActive ? "whiteAlpha.200" : "transparent"}
        transition={TRANSITION}
        whiteSpace="nowrap"
        _hover={{
          bg: "whiteAlpha.150",
          color: BRAND.gold[400],
        }}
      >
        {children}
      </Box>
    </Link>
  );
}

interface LanguageSelectorProps {
  currentLocale: Locale;
  isRtl: boolean;
  onLocaleChange: (locale: Locale) => void;
}

function LanguageSelector({ currentLocale, isRtl, onLocaleChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = LANGUAGE_NAMES[currentLocale];

  return (
    <Box position="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Box
        as="button"
        onClick={() => setIsOpen(!isOpen)}
        height={`${INTERACTIVE_HEIGHT}px`}
        px={3}
        display="flex"
        alignItems="center"
        gap={2}
        bg="whiteAlpha.100"
        borderRadius={`${INTERACTIVE_RADIUS}px`}
        border="1px solid"
        borderColor="whiteAlpha.200"
        color="white"
        fontSize="sm"
        fontWeight="500"
        cursor="pointer"
        transition={TRANSITION}
        _hover={{
          bg: "whiteAlpha.200",
          borderColor: "whiteAlpha.300",
        }}
      >
        <Text fontSize="lg" lineHeight="1">{current.flag}</Text>
        <Text display={{ base: "none", md: "block" }}>{current.native}</Text>
        <Text fontSize="xs" opacity={0.7} transform={isOpen ? "rotate(180deg)" : "none"} transition={TRANSITION}>
          ▼
        </Text>
      </Box>

      {/* Dropdown Menu */}
      {isOpen && (
        <Box
          position="absolute"
          top={`calc(100% + 8px)`}
          {...(isRtl ? { right: 0 } : { left: 0 })}
          minW="180px"
          bg="rgba(11, 31, 58, 0.98)"
          backdropFilter="blur(20px)"
          borderRadius={`${DROPDOWN_RADIUS}px`}
          border="1px solid"
          borderColor="whiteAlpha.200"
          boxShadow="0 20px 40px rgba(0, 0, 0, 0.4)"
          overflow="hidden"
          zIndex={100}
          py={2}
        >
          {locales.map((locale) => {
            const lang = LANGUAGE_NAMES[locale];
            const isActive = locale === currentLocale;
            return (
              <Box
                key={locale}
                as="button"
                onClick={() => {
                  onLocaleChange(locale);
                  setIsOpen(false);
                }}
                width="100%"
                height={`${INTERACTIVE_HEIGHT}px`}
                px={4}
                display="flex"
                alignItems="center"
                gap={3}
                bg={isActive ? "whiteAlpha.200" : "transparent"}
                color={isActive ? BRAND.gold[400] : "white"}
                fontSize="sm"
                fontWeight={isActive ? "600" : "400"}
                cursor="pointer"
                transition={TRANSITION}
                _hover={{
                  bg: "whiteAlpha.150",
                }}
              >
                <Text fontSize="lg">{lang.flag}</Text>
                <Text>{lang.native}</Text>
                {isActive && <Text ms="auto">✓</Text>}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <IconButton
      aria-label="تبديل المظهر"
      onClick={onToggle}
      variant="ghost"
      width={`${ICON_BUTTON_SIZE}px`}
      height={`${ICON_BUTTON_SIZE}px`}
      minW={`${ICON_BUTTON_SIZE}px`}
      borderRadius={`${INTERACTIVE_RADIUS}px`}
      bg="whiteAlpha.100"
      color="white"
      border="1px solid"
      borderColor="whiteAlpha.200"
      fontSize="lg"
      transition={TRANSITION}
      _hover={{
        bg: "whiteAlpha.200",
        borderColor: "whiteAlpha.300",
        transform: "scale(1.05)",
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </IconButton>
  );
}

interface ActionButtonProps {
  href: string;
  variant: "primary" | "secondary" | "ghost";
  children: React.ReactNode;
}

function ActionButton({ href, variant, children }: ActionButtonProps) {
  const styles = {
    primary: {
      bg: `linear-gradient(135deg, ${BRAND.gold[500]} 0%, ${BRAND.gold[600]} 100%)`,
      color: BRAND.navy[900],
      border: "none",
      fontWeight: "700",
      _hover: {
        transform: "translateY(-2px)",
        boxShadow: `0 8px 20px ${BRAND.gold[500]}40`,
      },
    },
    secondary: {
      bg: "whiteAlpha.100",
      color: "white",
      border: "1px solid",
      borderColor: "whiteAlpha.300",
      fontWeight: "600",
      _hover: {
        bg: "whiteAlpha.200",
        borderColor: "whiteAlpha.400",
      },
    },
    ghost: {
      bg: "transparent",
      color: "white",
      border: "1px solid transparent",
      fontWeight: "500",
      _hover: {
        bg: "whiteAlpha.100",
      },
    },
  };

  const style = styles[variant];

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Box
        height={`${INTERACTIVE_HEIGHT}px`}
        px={5}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius={`${INTERACTIVE_RADIUS}px`}
        fontSize="sm"
        whiteSpace="nowrap"
        transition={TRANSITION}
        {...style}
      >
        {children}
      </Box>
    </Link>
  );
}

interface UserMenuProps {
  user: CookieUserData;
  isRtl: boolean;
  onLogout: () => void;
  t: ReturnType<typeof useTranslations>;
}

function UserMenu({ user, isRtl, onLogout, t }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Determine user portal based on role
  const userRole = user.role as string;
  const portalHref =
    userRole === "ADMIN" ? "/admin" :
    userRole === "INSTRUCTOR" ? "/teacher" :
    userRole === "STUDENT" ? "/student" :
    "/member";

  const roleName =
    userRole === "ADMIN" ? t("roles.admin") :
    userRole === "INSTRUCTOR" ? t("roles.instructor") :
    userRole === "STUDENT" ? t("roles.student") :
    t("roles.member");

  // Get initials for avatar
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : user.email[0].toUpperCase();

  return (
    <Box position="relative" ref={menuRef}>
      {/* Avatar Trigger */}
      <Box
        as="button"
        onClick={() => setIsOpen(!isOpen)}
        height={`${INTERACTIVE_HEIGHT}px`}
        display="flex"
        alignItems="center"
        gap={2}
        px={2}
        bg="whiteAlpha.100"
        borderRadius={`${INTERACTIVE_RADIUS}px`}
        border="1px solid"
        borderColor="whiteAlpha.200"
        cursor="pointer"
        transition={TRANSITION}
        _hover={{
          bg: "whiteAlpha.200",
          borderColor: "whiteAlpha.300",
        }}
      >
        {/* Avatar */}
        <Box
          width="32px"
          height="32px"
          borderRadius="full"
          bg={`linear-gradient(135deg, ${BRAND.gold[500]} 0%, ${BRAND.gold[600]} 100%)`}
          color={BRAND.navy[900]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="sm"
          fontWeight="700"
        >
          {initials}
        </Box>
        {/* Name (desktop only) */}
        <Box display={{ base: "none", lg: "block" }} textAlign={isRtl ? "right" : "left"}>
          <Text color="white" fontSize="sm" fontWeight="600" lineHeight="1.2">
            {user.name || user.email.split("@")[0]}
          </Text>
          <Text color="whiteAlpha.700" fontSize="xs" lineHeight="1.2">
            {roleName}
          </Text>
        </Box>
        <Text fontSize="xs" color="whiteAlpha.600" display={{ base: "none", lg: "block" }}>▼</Text>
      </Box>

      {/* Dropdown Menu */}
      {isOpen && (
        <Box
          position="absolute"
          top={`calc(100% + 8px)`}
          {...(isRtl ? { right: 0 } : { left: 0 })}
          minW="220px"
          bg="rgba(11, 31, 58, 0.98)"
          backdropFilter="blur(20px)"
          borderRadius={`${DROPDOWN_RADIUS}px`}
          border="1px solid"
          borderColor="whiteAlpha.200"
          boxShadow="0 20px 40px rgba(0, 0, 0, 0.4)"
          overflow="hidden"
          zIndex={100}
          py={2}
        >
          {/* User Info Header */}
          <Box px={4} py={3} borderBottom="1px solid" borderColor="whiteAlpha.100">
            <Text color="white" fontSize="sm" fontWeight="600">
              {user.name || user.email.split("@")[0]}
            </Text>
            <Text color="whiteAlpha.600" fontSize="xs">
              {user.email}
            </Text>
          </Box>

          {/* Menu Items */}
          <Box py={2}>
            <Link href={portalHref} style={{ textDecoration: "none" }} onClick={() => setIsOpen(false)}>
              <Box
                height={`${INTERACTIVE_HEIGHT}px`}
                px={4}
                display="flex"
                alignItems="center"
                gap={3}
                color="white"
                fontSize="sm"
                cursor="pointer"
                transition={TRANSITION}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                <Text>📊</Text>
                <Text>{t("nav.dashboard")}</Text>
              </Box>
            </Link>

            <Link href="/member/profile" style={{ textDecoration: "none" }} onClick={() => setIsOpen(false)}>
              <Box
                height={`${INTERACTIVE_HEIGHT}px`}
                px={4}
                display="flex"
                alignItems="center"
                gap={3}
                color="white"
                fontSize="sm"
                cursor="pointer"
                transition={TRANSITION}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                <Text>👤</Text>
                <Text>{t("nav.profile")}</Text>
              </Box>
            </Link>

            <Link href="/member/settings" style={{ textDecoration: "none" }} onClick={() => setIsOpen(false)}>
              <Box
                height={`${INTERACTIVE_HEIGHT}px`}
                px={4}
                display="flex"
                alignItems="center"
                gap={3}
                color="white"
                fontSize="sm"
                cursor="pointer"
                transition={TRANSITION}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                <Text>⚙️</Text>
                <Text>{t("nav.settings")}</Text>
              </Box>
            </Link>
          </Box>

          {/* Logout */}
          <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt={2}>
            <Box
              as="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              width="100%"
              height={`${INTERACTIVE_HEIGHT}px`}
              px={4}
              display="flex"
              alignItems="center"
              gap={3}
              color="red.400"
              fontSize="sm"
              cursor="pointer"
              transition={TRANSITION}
              _hover={{ bg: "whiteAlpha.100" }}
            >
              <Text>🚪</Text>
              <Text>{t("auth.logout")}</Text>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ href: string; label: string }>;
  pathname: string;
  user: CookieUserData | null;
  isRtl: boolean;
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onLogout: () => void;
  t: ReturnType<typeof useTranslations>;
}

function MobileMenu({
  isOpen,
  onClose,
  navLinks,
  pathname,
  user,
  isRtl,
  currentLocale,
  onLocaleChange,
  onLogout,
  t,
}: MobileMenuProps) {
  if (!isOpen) return null;

  const userRole = user?.role as string | undefined;
  const portalHref =
    userRole === "ADMIN" ? "/admin" :
    userRole === "INSTRUCTOR" ? "/teacher" :
    userRole === "STUDENT" ? "/student" :
    "/member";

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.600"
        backdropFilter="blur(4px)"
        zIndex={998}
        onClick={onClose}
      />

      {/* Drawer */}
      <Box
        position="fixed"
        top={0}
        {...(isRtl ? { right: 0 } : { left: 0 })}
        height="100vh"
        width="300px"
        maxW="85vw"
        bg={BRAND.navy[900]}
        zIndex={999}
        overflowY="auto"
        boxShadow="0 0 40px rgba(0, 0, 0, 0.5)"
      >
        {/* Header */}
        <Flex
          height={`${HEADER_HEIGHT}px`}
          px={4}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
        >
          <Link href="/" onClick={onClose}>
            <Logo size={40} showText={false} />
          </Link>
          <IconButton
            aria-label="إغلاق القائمة"
            onClick={onClose}
            variant="ghost"
            color="white"
            fontSize="xl"
            _hover={{ bg: "whiteAlpha.100" }}
          >
            ✕
          </IconButton>
        </Flex>

        {/* Navigation Links */}
        <Stack gap={1} p={4}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={onClose} style={{ textDecoration: "none" }}>
              <Box
                height={`${INTERACTIVE_HEIGHT}px`}
                px={4}
                display="flex"
                alignItems="center"
                borderRadius={`${INTERACTIVE_RADIUS}px`}
                fontSize="md"
                fontWeight={pathname === link.href ? "700" : "500"}
                color={pathname === link.href ? BRAND.gold[400] : "white"}
                bg={pathname === link.href ? "whiteAlpha.100" : "transparent"}
                transition={TRANSITION}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                {link.label}
              </Box>
            </Link>
          ))}
        </Stack>

        {/* Language Selection */}
        <Box px={4} py={4} borderTop="1px solid" borderColor="whiteAlpha.100">
          <Text color="whiteAlpha.600" fontSize="xs" fontWeight="600" mb={3} textTransform="uppercase">
            {t("nav.language")}
          </Text>
          <Stack gap={1}>
            {locales.map((locale) => {
              const lang = LANGUAGE_NAMES[locale];
              const isActive = locale === currentLocale;
              return (
                <Box
                  key={locale}
                  as="button"
                  onClick={() => {
                    onLocaleChange(locale);
                    onClose();
                  }}
                  height={`${INTERACTIVE_HEIGHT}px`}
                  px={4}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  borderRadius={`${INTERACTIVE_RADIUS}px`}
                  bg={isActive ? "whiteAlpha.200" : "transparent"}
                  color={isActive ? BRAND.gold[400] : "white"}
                  fontSize="sm"
                  fontWeight={isActive ? "600" : "400"}
                  transition={TRANSITION}
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  <Text fontSize="lg">{lang.flag}</Text>
                  <Text>{lang.native}</Text>
                  {isActive && <Text ms="auto">✓</Text>}
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* User Actions */}
        <Box px={4} py={4} borderTop="1px solid" borderColor="whiteAlpha.100">
          {user ? (
            <Stack gap={2}>
              {/* User Info */}
              <Flex align="center" gap={3} mb={2}>
                <Box
                  width="40px"
                  height="40px"
                  borderRadius="full"
                  bg={`linear-gradient(135deg, ${BRAND.gold[500]} 0%, ${BRAND.gold[600]} 100%)`}
                  color={BRAND.navy[900]}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="sm"
                  fontWeight="700"
                >
                  {user.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : user.email[0].toUpperCase()}
                </Box>
                <Box>
                  <Text color="white" fontSize="sm" fontWeight="600">
                    {user.name || user.email.split("@")[0]}
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">
                    {user.email}
                  </Text>
                </Box>
              </Flex>

              <Link href={portalHref} onClick={onClose} style={{ textDecoration: "none" }}>
                <Box
                  height={`${INTERACTIVE_HEIGHT}px`}
                  px={4}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  borderRadius={`${INTERACTIVE_RADIUS}px`}
                  bg="whiteAlpha.100"
                  color="white"
                  fontSize="sm"
                  transition={TRANSITION}
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  <Text>📊</Text>
                  <Text>{t("nav.dashboard")}</Text>
                </Box>
              </Link>

              <Box
                as="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                height={`${INTERACTIVE_HEIGHT}px`}
                px={4}
                display="flex"
                alignItems="center"
                gap={3}
                borderRadius={`${INTERACTIVE_RADIUS}px`}
                bg="red.500/20"
                color="red.400"
                fontSize="sm"
                cursor="pointer"
                transition={TRANSITION}
                _hover={{ bg: "red.500/30" }}
              >
                <Text>🚪</Text>
                <Text>{t("auth.logout")}</Text>
              </Box>
            </Stack>
          ) : (
            <Stack gap={2}>
              <Link href="/auth/login" onClick={onClose} style={{ textDecoration: "none" }}>
                <Box
                  height={`${INTERACTIVE_HEIGHT}px`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius={`${INTERACTIVE_RADIUS}px`}
                  bg="whiteAlpha.100"
                  color="white"
                  fontSize="sm"
                  fontWeight="600"
                  transition={TRANSITION}
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  {t("auth.login")}
                </Box>
              </Link>
              <Link href="/auth/register" onClick={onClose} style={{ textDecoration: "none" }}>
                <Box
                  height={`${INTERACTIVE_HEIGHT}px`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius={`${INTERACTIVE_RADIUS}px`}
                  bg={`linear-gradient(135deg, ${BRAND.gold[500]} 0%, ${BRAND.gold[600]} 100%)`}
                  color={BRAND.navy[900]}
                  fontSize="sm"
                  fontWeight="700"
                  transition={TRANSITION}
                  _hover={{ transform: "translateY(-2px)" }}
                >
                  {t("auth.register")}
                </Box>
              </Link>
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
}

// ============================================================================
// MAIN HEADER COMPONENT
// ============================================================================

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const { colorMode, toggleColorMode } = useColorMode();

  const [user, setUser] = useState<CookieUserData | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isRtl = isRtlLocale(locale);
  const isDark = colorMode === "dark";

  // Fetch session on mount
  useEffect(() => {
    const userData = getCurrentUserClient();
    setUser(userData);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handlers
  const handleLocaleChange = useCallback(async (newLocale: Locale) => {
    await setLocale(newLocale);
    router.refresh();
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  // Navigation links
  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/courses", label: t("nav.courses") },
    { href: "/programs", label: t("nav.programs") },
    { href: "/instructors", label: t("nav.instructors") },
    { href: "/about", label: t("nav.about") },
    { href: "/blog", label: t("nav.blog") },
  ];

  return (
    <>
      <Box
        as="header"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        height={`${HEADER_HEIGHT}px`}
        bg={isScrolled ? "rgba(11, 31, 58, 0.95)" : BRAND.navy[900]}
        backdropFilter={isScrolled ? "blur(12px)" : "none"}
        borderBottom="1px solid"
        borderColor={isScrolled ? "whiteAlpha.100" : "transparent"}
        transition="all 0.3s ease"
      >
        <Container maxW="container.xl" height="100%">
          <Flex
            height="100%"
            align="center"
            justify="space-between"
            gap={4}
          >
            {/* ===== LEFT SECTION: Logo ===== */}
            <Flex align="center" gap={3} flexShrink={0}>
              {/* Mobile Menu Button */}
              <IconButton
                aria-label="القائمة"
                display={{ base: "flex", lg: "none" }}
                onClick={() => setMobileMenuOpen(true)}
                variant="ghost"
                width={`${ICON_BUTTON_SIZE}px`}
                height={`${ICON_BUTTON_SIZE}px`}
                minW={`${ICON_BUTTON_SIZE}px`}
                borderRadius={`${INTERACTIVE_RADIUS}px`}
                bg="whiteAlpha.100"
                color="white"
                fontSize="lg"
                _hover={{ bg: "whiteAlpha.200" }}
              >
                ☰
              </IconButton>

              {/* Logo */}
              <Link href="/" style={{ textDecoration: "none" }}>
                <Flex align="center" gap={3}>
                  <Logo size={44} showText={false} />
                  <Box display={{ base: "none", sm: "block" }}>
                    <Text
                      color={BRAND.gold[500]}
                      fontSize="xl"
                      fontWeight="800"
                      lineHeight="1.2"
                    >
                      تبيان
                    </Text>
                    <Text
                      color="whiteAlpha.700"
                      fontSize="xs"
                      fontWeight="600"
                      letterSpacing="wider"
                      lineHeight="1"
                    >
                      TIBYAN ACADEMY
                    </Text>
                  </Box>
                </Flex>
              </Link>
            </Flex>

            {/* ===== CENTER SECTION: Navigation (Desktop Only) ===== */}
            <Flex
              display={{ base: "none", lg: "flex" }}
              align="center"
              gap={1}
              bg="whiteAlpha.50"
              px={2}
              py={1}
              borderRadius={`${INTERACTIVE_RADIUS + 4}px`}
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  isActive={pathname === link.href}
                >
                  {link.label}
                </NavLink>
              ))}
            </Flex>

            {/* ===== RIGHT SECTION: Actions ===== */}
            <Flex align="center" gap={2} flexShrink={0}>
              {/* Language Selector */}
              <Box display={{ base: "none", md: "block" }}>
                <LanguageSelector
                  currentLocale={locale}
                  isRtl={isRtl}
                  onLocaleChange={handleLocaleChange}
                />
              </Box>

              {/* Theme Toggle */}
              <ThemeToggle isDark={isDark} onToggle={toggleColorMode} />

              {/* Notification Bell (logged in only) */}
              {user && <NotificationBell />}

              {/* User Menu or Auth Buttons */}
              {user ? (
                <UserMenu
                  user={user}
                  isRtl={isRtl}
                  onLogout={handleLogout}
                  t={t}
                />
              ) : (
                <Flex display={{ base: "none", md: "flex" }} gap={2}>
                  <ActionButton href="/auth/login" variant="ghost">
                    {t("auth.login")}
                  </ActionButton>
                  <ActionButton href="/auth/register" variant="primary">
                    {t("auth.register")}
                  </ActionButton>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Spacer to prevent content from going under fixed header */}
      <Box height={`${HEADER_HEIGHT}px`} />

      {/* Mobile Menu Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
        pathname={pathname}
        user={user}
        isRtl={isRtl}
        currentLocale={locale}
        onLocaleChange={handleLocaleChange}
        onLogout={handleLogout}
        t={t}
      />
    </>
  );
}
