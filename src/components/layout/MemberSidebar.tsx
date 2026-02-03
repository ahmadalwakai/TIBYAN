"use client";

import { Avatar, Badge, Box, Button, Stack, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/lib/auth-client";
import PremiumCard from "@/components/ui/PremiumCard";

const memberLinks = [
  { label: "نظرة عامة", href: "/member", icon: "📊" },
  { label: "الإعلانات", href: "/member/announcements", icon: "📣" },
  { label: "الموارد الحصرية", href: "/member/resources", icon: "📚" },
  { label: "الدعم والمساعدة", href: "/member/support", icon: "🛟" },
  { label: "سجل الدعم", href: "/member/support/tickets", icon: "🧾" },
  { label: "الملف الشخصي", href: "/member/profile", icon: "👤" },
  { label: "الإعدادات", href: "/member/settings", icon: "⚙️" },
];

interface MemberSidebarProps {
  userName: string;
  onNavigate?: () => void;
}

export default function MemberSidebar({ userName, onNavigate }: MemberSidebarProps) {
  const handleLogout = useLogout();
  const pathname = usePathname();

  return (
    <PremiumCard
      variant="bordered"
      p={4}
      w={{ base: "100%", lg: "260px" }}
      position={{ base: "static", lg: "sticky" }}
      top={{ lg: 6 }}
      h="fit-content"
    >
      <Stack gap={4}>
        {/* User Info */}
        <VStack gap={3} pb={4} borderBottom="1px solid" borderColor="border">
          <Avatar.Root size="lg">
            <Avatar.Fallback bg="#0A0A0A" color="#00FF2A" border="2px solid" borderColor="#00FF2A">
              {userName.charAt(0)}
            </Avatar.Fallback>
          </Avatar.Root>
          <Box textAlign="center">
            <Text fontWeight="700" fontSize="md">
              {userName}
            </Text>
            <Badge
              bg="#0A0A0A"
              color="#00FF2A"
              border="1px solid"
              borderColor="#00FF2A"
              px={2}
              py={1}
              borderRadius="full"
              fontSize="xs"
            >
              عضو
            </Badge>
          </Box>
        </VStack>

        {/* Navigation */}
        <Stack gap={1}>
          {memberLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                style={{ textDecoration: "none" }}
              >
                <Box
                  px={3}
                  py={2}
                  borderRadius="button"
                  color={isActive ? "accent" : "muted"}
                  bg={isActive ? "accentSubtle" : "transparent"}
                  fontWeight="600"
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  _hover={{
                    bg: "surfaceHover",
                    color: "accent",
                    transform: "translateX(2px)"
                  }}
                >
                  <Text as="span">{link.icon}</Text>
                  {link.label}
                </Box>
              </Link>
            );
          })}
        </Stack>
        
        {/* Logout */}
        <Box pt={4} borderTop="1px solid" borderColor="border">
          <Button
            onClick={() => {
              handleLogout();
              onNavigate?.();
            }}
            w="100%"
            variant="outline"
            borderColor="error"
            color="error"
            _hover={{
              bg: "rgba(220, 38, 38, 0.1)",
              borderColor: "error"
            }}
            size="sm"
          >
            🚪 تسجيل الخروج
          </Button>
        </Box>
      </Stack>
    </PremiumCard>
  );
}
