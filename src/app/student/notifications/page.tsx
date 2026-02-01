"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "course" | "payment";
  read: boolean;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/student/notifications", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setNotifications(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const getTypeInfo = (type: string) => {
    const types: Record<string, { icon: string; color: string }> = {
      info: { icon: "ℹ️", color: "blue.500" },
      success: { icon: "✅", color: "green.500" },
      warning: { icon: "⚠️", color: "orange.500" },
      course: { icon: "📚", color: "purple.500" },
      payment: { icon: "💳", color: "green.500" },
    };
    return types[type] || types.info;
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/student/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/student/notifications/read-all", {
        method: "PUT",
        credentials: "include",
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل الإشعارات...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <HStack gap={2}>
            <Heading size="xl" color="text">
              الإشعارات 🔔
            </Heading>
            {unreadCount > 0 && (
              <Badge bg="red.500" color="white" borderRadius="full" px={2}>
                {unreadCount}
              </Badge>
            )}
          </HStack>
          <Text color="muted">
            جميع إشعاراتك وتنبيهاتك
          </Text>
        </Box>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            تحديد الكل كمقروء
          </Button>
        )}
      </HStack>

      {/* Notifications List */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          {notifications.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="5xl" mb={4}>🔔</Text>
              <Heading size="md" color="text" mb={2}>
                لا توجد إشعارات
              </Heading>
              <Text color="muted">
                ستظهر هنا إشعاراتك الجديدة
              </Text>
            </Box>
          ) : (
            <VStack gap={3} align="stretch">
              {notifications.map((notification) => {
                const typeInfo = getTypeInfo(notification.type);
                return (
                  <Box
                    key={notification.id}
                    p={4}
                    borderRadius="card"
                    border="1px solid"
                    borderColor={notification.read ? "border" : "borderAccent"}
                    bg={notification.read ? "transparent" : "accentSubtle"}
                    _hover={{ borderColor: "borderAccent" }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <HStack justify="space-between" align="start">
                      <HStack gap={3} align="start">
                        <Text fontSize="xl">{typeInfo.icon}</Text>
                        <Box>
                          <HStack gap={2}>
                            <Text fontWeight="700" color="text">
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <Badge bg="primary" color="primaryText" fontSize="xs">
                                جديد
                              </Badge>
                            )}
                          </HStack>
                          <Text color="muted" fontSize="sm" mt={1}>
                            {notification.message}
                          </Text>
                        </Box>
                      </HStack>
                      <Text fontSize="xs" color="muted" whiteSpace="nowrap">
                        {notification.createdAt}
                      </Text>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      </PremiumCard>
    </VStack>
  );
}
