"use client";

import { Badge, Box, Button, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useLogout } from "@/lib/auth-client";

const adminLinks = [
  { label: "نظرة عامة", href: "/admin" },
  { label: "المستخدمون", href: "/admin/users" },
  { label: "طلبات المدرسين", href: "/admin/applications" },
  { label: "الدورات", href: "/admin/courses" },
  { label: "المدفوعات", href: "/admin/payments" },
  { label: "الشهادات", href: "/admin/certificates" },
  { label: "المنشورات الاجتماعية", href: "/admin/social" },
  { label: "المراجعات", href: "/admin/reviews" },
  { label: "التقارير", href: "/admin/reports" },
  { label: "سجلات التدقيق", href: "/admin/audit-logs" },
  { label: "الصلاحيات والأدوار", href: "/admin/permissions" },
  { label: "التخزين والبث", href: "/admin/storage" },
  { label: "الإشعارات", href: "/admin/notifications" },
  { label: "الدردشة المباشرة", href: "/admin/live-chat" },
  { label: "سجل الأنشطة التعليمية", href: "/admin/activity" },
  { label: "التكاملات الخارجية", href: "/admin/integrations" },
  { label: "Zyphon AI", href: "/admin/zyphon-ai" },
  { label: "الإعدادات", href: "/admin/settings" },
];

export default function AdminSidebar() {
  const handleLogout = useLogout();

  return (
    <Box
      p={4}
      w={{ base: "100%", lg: "260px" }}
      position={{ base: "static", lg: "sticky" }}
      top={{ lg: 6 }}
      h="fit-content"
      bg="#050505"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.3)"
      borderRadius="xl"
      boxShadow="0 0 30px rgba(0, 255, 42, 0.1)"
    >
      <Stack gap={4}>
        <Box>
          <Text fontWeight="700" mb={2} color="white">
            إدارة تبيان
          </Text>
          <Badge
            bg="rgba(0, 255, 42, 0.1)"
            color="#00FF2A"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            px={2}
            py={1}
            borderRadius="full"
            fontSize="xs"
          >
            لوحة التحكم
          </Badge>
        </Box>
        <Stack gap={1}>
          {adminLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
              <Box
                px={3}
                py={2}
                borderRadius="lg"
                color="gray.400"
                fontWeight="600"
                transition="all 0.2s"
                _hover={{
                  bg: "rgba(0, 255, 42, 0.1)",
                  color: "#00FF2A",
                  transform: "translateX(-2px)"
                }}
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px",
                  height: 0,
                  bg: "#00FF2A",
                  borderRadius: "full",
                  transition: "height 0.2s",
                  boxShadow: "0 0 10px rgba(0, 255, 42, 0.5)"
                }}
              >
                {link.label}
              </Box>
            </Link>
          ))}
        </Stack>
        
        <Box pt={4} borderTop="1px solid" borderColor="rgba(0, 255, 42, 0.2)">
          <Button
            onClick={handleLogout}
            w="100%"
            variant="outline"
            borderColor="red.500"
            color="red.400"
            _hover={{
              bg: "rgba(220, 38, 38, 0.1)",
              borderColor: "red.400"
            }}
            size="sm"
          >
            🚪 تسجيل الخروج
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
