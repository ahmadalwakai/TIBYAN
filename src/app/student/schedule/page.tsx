"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  lessonTitle: string;
  scheduledAt: string;
  duration: number;
  type: "live" | "recorded" | "assignment";
}

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/student/schedule");
        const data = await res.json();
        if (data.ok) {
          setSchedule(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  const getTypeInfo = (type: string) => {
    const types: Record<string, { label: string; bg: string; color: string; icon: string }> = {
      live: { label: "بث مباشر", bg: "red.100", color: "red.700", icon: "🔴" },
      recorded: { label: "درس مسجل", bg: "blue.100", color: "blue.700", icon: "📹" },
      assignment: { label: "تكليف", bg: "orange.100", color: "orange.700", icon: "📝" },
    };
    return types[type] || types.recorded;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4} color="muted">جاري تحميل الجدول...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          جدول الدراسة 📅
        </Heading>
        <Text color="muted">
          الدروس والمواعيد القادمة
        </Text>
      </Box>

      {/* Schedule List */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          {schedule.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="5xl" mb={4}>📅</Text>
              <Heading size="md" color="text" mb={2}>
                لا توجد مواعيد قادمة
              </Heading>
              <Text color="muted">
                سيظهر هنا جدولك الدراسي عند التسجيل في دورات
              </Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              {schedule.map((item) => {
                const typeInfo = getTypeInfo(item.type);
                return (
                  <Box
                    key={item.id}
                    p={4}
                    borderRadius="card"
                    border="1px solid"
                    borderColor="border"
                    _hover={{ borderColor: "brand.500" }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between" flexWrap="wrap" gap={2}>
                      <HStack gap={3}>
                        <Text fontSize="2xl">{typeInfo.icon}</Text>
                        <Box>
                          <Text fontWeight="700">{item.lessonTitle}</Text>
                          <Text fontSize="sm" color="muted">{item.courseName}</Text>
                        </Box>
                      </HStack>
                      <VStack align="end" gap={1}>
                        <Badge bg={typeInfo.bg} color={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <Text fontSize="sm" fontWeight="600">{item.scheduledAt}</Text>
                        <Text fontSize="xs" color="muted">{item.duration} دقيقة</Text>
                      </VStack>
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
