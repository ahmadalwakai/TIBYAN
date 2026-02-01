"use client";

import { Box, Flex, IconButton, Stack, Text, Badge, Spinner } from "@chakra-ui/react";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      const json = await res.json();
      if (json.ok) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MEETING_INVITATION":
        return "🎥";
      case "MEETING_CREATED":
        return "📢";
      case "MEETING_STARTING":
        return "⏰";
      case "GENERAL":
      default:
        return "🔔";
    }
  };

  return (
    <Box position="relative" ref={menuRef}>
      {/* Bell Button */}
      <IconButton
        aria-label="الإشعارات"
        variant="ghost"
        size="sm"
        borderRadius="full"
        bg="whiteAlpha.200"
        color="white"
        w="40px"
        h="40px"
        position="relative"
        onClick={() => setIsOpen(!isOpen)}
        _hover={{
          bg: "whiteAlpha.300",
          transform: "scale(1.1)",
        }}
        transition="all 0.3s ease"
      >
        <span style={{ fontSize: "1.2rem" }}>🔔</span>
        {unreadCount > 0 && (
          <Box
            position="absolute"
            top="-2px"
            right="-2px"
            bg="red.500"
            color="white"
            fontSize="xs"
            fontWeight="bold"
            borderRadius="full"
            minW="18px"
            h="18px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="2px solid"
            borderColor="primary"
            css={{
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
              },
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Box>
        )}
      </IconButton>

      {/* Notifications Dropdown */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 12px)"
          right={0}
          w="360px"
          maxH="480px"
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
          <Flex
            px={4}
            py={3}
            borderBottom="1px solid"
            borderColor="whiteAlpha.100"
            bg="whiteAlpha.50"
            align="center"
            justify="space-between"
          >
            <Flex align="center" gap={2}>
              <Text fontWeight="700" color="white">
                🔔 الإشعارات
              </Text>
              {unreadCount > 0 && (
                <Badge colorPalette="red" size="sm">
                  {unreadCount} جديد
                </Badge>
              )}
            </Flex>
            {unreadCount > 0 && (
              <Box
                as="button"
                fontSize="xs"
                color="accent"
                cursor="pointer"
                onClick={markAllAsRead}
                _hover={{ textDecoration: "underline" }}
              >
                {loading ? <Spinner size="xs" /> : "تحديد الكل كمقروء"}
              </Box>
            )}
          </Flex>

          {/* Notifications List */}
          <Box maxH="380px" overflowY="auto">
            {notifications.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={10} color="whiteAlpha.600">
                <Text fontSize="3xl" mb={2}>📭</Text>
                <Text>لا توجد إشعارات</Text>
              </Flex>
            ) : (
              <Stack gap={0}>
                {notifications.map((notification) => {
                  const content = (
                    <Flex gap={3}>
                      <Text fontSize="xl">{getNotificationIcon(notification.type)}</Text>
                      <Box flex={1}>
                        <Flex align="center" gap={2} mb={1}>
                          <Text fontWeight="600" fontSize="sm" color="white" lineClamp={1}>
                            {notification.title}
                          </Text>
                          {!notification.isRead && (
                            <Box w="6px" h="6px" borderRadius="full" bg="accent" />
                          )}
                        </Flex>
                        <Text fontSize="xs" color="whiteAlpha.700" lineClamp={2}>
                          {notification.message}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.500" mt={1}>
                          {formatTime(notification.createdAt)}
                        </Text>
                      </Box>
                    </Flex>
                  );

                  const commonProps = {
                    key: notification.id,
                    display: "block",
                    px: 4,
                    py: 3,
                    bg: notification.isRead ? "transparent" : "whiteAlpha.50",
                    borderBottom: "1px solid",
                    borderColor: "whiteAlpha.50",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    _hover: { bg: "whiteAlpha.100" },
                    onClick: () => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      setIsOpen(false);
                    },
                  };

                  return notification.link ? (
                    <Link key={notification.id} href={notification.link} style={{ textDecoration: "none" }}>
                      <Box {...commonProps}>{content}</Box>
                    </Link>
                  ) : (
                    <Box {...commonProps}>{content}</Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Footer */}
          {notifications.length > 0 && (
            <Box
              px={4}
              py={3}
              borderTop="1px solid"
              borderColor="whiteAlpha.100"
              bg="whiteAlpha.50"
              textAlign="center"
            >
              <Text
                as="button"
                fontSize="sm"
                color="accent"
                fontWeight="600"
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                onClick={() => setIsOpen(false)}
              >
                عرض جميع الإشعارات
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
