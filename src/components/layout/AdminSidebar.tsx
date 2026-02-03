"use client";

import { Badge, Box, Button, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useLogout } from "@/lib/auth-client";
import PremiumCard from "@/components/ui/PremiumCard";

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
    <PremiumCard
      variant="bordered"
      p={4}
      w={{ base: "100%", lg: "260px" }}
      position={{ base: "static", lg: "sticky" }}
      top={{ lg: 6 }}
      h="fit-content"
    >
      <Stack gap={4}>
        <Box>
          <Text fontWeight="700" mb={2}>
            إدارة تبيان
          </Text>
          <Badge
            bg="primary"
            color="primaryText"
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
                borderRadius="button"
                color="muted"
                fontWeight="600"
                transition="all 0.2s"
                _hover={{
                  bg: "surfaceHover",
                  color: "accent",
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
                  bg: "accent",
                  borderRadius: "full",
                  transition: "height 0.2s"
                }}
              >
                {link.label}
              </Box>
            </Link>
          ))}
        </Stack>
        
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
