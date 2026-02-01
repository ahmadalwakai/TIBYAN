"use client";

import { Avatar, Badge, Box, Button, Stack, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/lib/auth-client";
import PremiumCard from "@/components/ui/PremiumCard";

const teacherLinks = [
  { label: "نظرة عامة", href: "/teacher", icon: "📊" },
  { label: "دوراتي", href: "/teacher/courses", icon: "📚" },
  { label: "إنشاء دورة", href: "/teacher/courses/new", icon: "➕" },
  { label: "حصصي التعليمية", href: "/teacher/lessons", icon: "🎥" },
  { label: "منشوراتي", href: "/teacher/posts", icon: "✍️" },
  { label: "طلابي", href: "/teacher/students", icon: "👥" },
  { label: "الأرباح", href: "/teacher/earnings", icon: "💰" },
  { label: "المراجعات", href: "/teacher/reviews", icon: "⭐" },
  { label: "الإحصائيات", href: "/teacher/analytics", icon: "📈" },
  { label: "الإشعارات", href: "/teacher/notifications", icon: "🔔" },
  { label: "الملف الشخصي", href: "/teacher/profile", icon: "👤" },
];

interface TeacherSidebarProps {
  userName: string;
}

export default function TeacherSidebar({ userName }: TeacherSidebarProps) {
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
            <Avatar.Fallback bg="avatarBg" color="avatarText">
              {userName.charAt(0)}
            </Avatar.Fallback>
          </Avatar.Root>
          <Box textAlign="center">
            <Text fontWeight="700" fontSize="md">
              {userName}
            </Text>
            <Badge
              bg="primary"
              color="primaryText"
              px={2}
              py={1}
              borderRadius="full"
              fontSize="xs"
            >
              مدرس
            </Badge>
          </Box>
        </VStack>

        {/* Navigation */}
        <Stack gap={1}>
          {teacherLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== "/teacher" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
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
                    transform: "translateX(-2px)"
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
            onClick={handleLogout}
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
