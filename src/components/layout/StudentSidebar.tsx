"use client";

import { Avatar, Badge, Box, Button, Stack, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/lib/auth-client";
import PremiumCard from "@/components/ui/PremiumCard";

const studentLinks = [
  { label: "نظرة عامة", href: "/student", icon: "📊" },
  { label: "دوراتي", href: "/student/courses", icon: "📚" },
  { label: "جدول الدراسة", href: "/student/schedule", icon: "📅" },
  { label: "الشهادات", href: "/student/certificates", icon: "🏆" },
  { label: "المدفوعات", href: "/student/payments", icon: "💳" },
  { label: "الإشعارات", href: "/student/notifications", icon: "🔔" },
  { label: "الملف الشخصي", href: "/student/profile", icon: "👤" },
];

interface StudentSidebarProps {
  userName: string;
}

export default function StudentSidebar({ userName }: StudentSidebarProps) {
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
            <Avatar.Fallback bg="brand.500" color="white">
              {userName.charAt(0)}
            </Avatar.Fallback>
          </Avatar.Root>
          <Box textAlign="center">
            <Text fontWeight="700" fontSize="md">
              {userName}
            </Text>
            <Badge
              bg="brand.50"
              color="brand.900"
              px={2}
              py={1}
              borderRadius="full"
              fontSize="xs"
            >
              طالب
            </Badge>
          </Box>
        </VStack>

        {/* Navigation */}
        <Stack gap={1}>
          {studentLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                <Box
                  px={3}
                  py={2}
                  borderRadius="button"
                  color={isActive ? "brand.900" : "muted"}
                  bg={isActive ? "brand.50" : "transparent"}
                  fontWeight="600"
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  _hover={{
                    bg: "brand.50",
                    color: "brand.900",
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
