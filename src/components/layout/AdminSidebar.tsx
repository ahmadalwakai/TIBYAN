"use client";

import { Badge, Box, Button, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useLogout } from "@/lib/auth-client";
import { useTranslations } from "next-intl";

export default function AdminSidebar() {
  const handleLogout = useLogout();
  const t = useTranslations("sidebar");

  const adminLinks = [
    { label: t("admin.overview"), href: "/admin" },
    { label: t("admin.users"), href: "/admin/users" },
    { label: t("admin.teacherApplications"), href: "/admin/applications" },
    { label: t("admin.courses"), href: "/admin/courses" },
    { label: t("admin.payments"), href: "/admin/payments" },
    { label: t("admin.certificates"), href: "/admin/certificates" },
    { label: t("admin.socialPosts"), href: "/admin/social" },
    { label: t("admin.reviews"), href: "/admin/reviews" },
    { label: t("admin.reports"), href: "/admin/reports" },
    { label: t("admin.auditLogs"), href: "/admin/audit-logs" },
    { label: t("admin.permissions"), href: "/admin/permissions" },
    { label: t("admin.storage"), href: "/admin/storage" },
    { label: t("admin.notifications"), href: "/admin/notifications" },
    { label: t("admin.liveChat"), href: "/admin/live-chat" },
    { label: t("admin.activityLog"), href: "/admin/activity" },
    { label: t("admin.integrations"), href: "/admin/integrations" },
    { label: "Zyphon AI", href: "/admin/zyphon-ai" },
    { label: t("admin.settings"), href: "/admin/settings" },
  ];

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
            {t("admin.title")}
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
            {t("admin.controlPanel")}
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
            🚪 {t("logout")}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
