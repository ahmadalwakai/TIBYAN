"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";

interface Analytics {
  overview: {
    totalViews: number;
    totalEnrollments: number;
    conversionRate: number;
    averageWatchTime: number;
  };
  monthlyStats: {
    month: string;
    views: number;
    enrollments: number;
    earnings: number;
  }[];
  topCourses: {
    id: string;
    title: string;
    views: number;
    enrollments: number;
    earnings: number;
  }[];
  recentActivity: {
    type: "view" | "enrollment" | "completion";
    courseName: string;
    timestamp: string;
  }[];
}

export default function TeacherAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/teacher/analytics");
        const data = await res.json();
        if (data.ok) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4} color="muted">جاري تحميل الإحصائيات...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          الإحصائيات 📈
        </Heading>
        <Text color="muted">
          تحليلات أداء دوراتك
        </Text>
      </Box>

      {/* Overview Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
        <StatCard
          title="إجمالي المشاهدات"
          value={analytics?.overview.totalViews ?? 0}
          icon="👁️"
          color="brand.500"
        />
        <StatCard
          title="إجمالي التسجيلات"
          value={analytics?.overview.totalEnrollments ?? 0}
          icon="📝"
          color="green.500"
        />
        <StatCard
          title="معدل التحويل"
          value={`${analytics?.overview.conversionRate?.toFixed(1) ?? 0}%`}
          icon="📊"
          color="blue.500"
        />
        <StatCard
          title="متوسط وقت المشاهدة"
          value={`${analytics?.overview.averageWatchTime ?? 0} د`}
          icon="⏱️"
          color="purple.500"
        />
      </Grid>

      {/* Monthly Stats */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>الإحصائيات الشهرية</Heading>
          
          {analytics?.monthlyStats && analytics.monthlyStats.length > 0 ? (
            <Box overflowX="auto">
              <Grid templateColumns={`repeat(${Math.min(analytics.monthlyStats.length, 6)}, 1fr)`} gap={4}>
                {analytics.monthlyStats.slice(0, 6).map((month) => (
                  <Box
                    key={month.month}
                    p={4}
                    bg="backgroundAlt"
                    borderRadius="card"
                    textAlign="center"
                  >
                    <Text fontWeight="700" color="brand.700" mb={2}>
                      {month.month}
                    </Text>
                    <VStack gap={1}>
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="xs" color="muted">مشاهدات</Text>
                        <Text fontSize="sm" fontWeight="600">{month.views}</Text>
                      </HStack>
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="xs" color="muted">تسجيلات</Text>
                        <Text fontSize="sm" fontWeight="600">{month.enrollments}</Text>
                      </HStack>
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="xs" color="muted">أرباح</Text>
                        <Text fontSize="sm" fontWeight="600" color="green.600">
                          {month.earnings} ر.س
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <Text color="muted">لا توجد بيانات كافية</Text>
            </Box>
          )}
        </Box>
      </PremiumCard>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
        {/* Top Courses */}
        <PremiumCard variant="elevated">
          <Box p={6}>
            <Heading size="md" mb={4}>أفضل الدورات أداءً</Heading>
            
            {analytics?.topCourses && analytics.topCourses.length > 0 ? (
              <VStack gap={3} align="stretch">
                {analytics.topCourses.map((course, index) => (
                  <HStack
                    key={course.id}
                    justify="space-between"
                    p={3}
                    bg="backgroundAlt"
                    borderRadius="md"
                  >
                    <HStack gap={3}>
                      <Box
                        w={8}
                        h={8}
                        borderRadius="full"
                        bg={index === 0 ? "yellow.400" : index === 1 ? "gray.300" : "orange.300"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="700"
                        fontSize="sm"
                      >
                        {index + 1}
                      </Box>
                      <Text fontWeight="600" fontSize="sm" lineClamp={1}>
                        {course.title}
                      </Text>
                    </HStack>
                    <VStack gap={0} align="end">
                      <Text fontSize="xs" color="muted">
                        {course.views} مشاهدة
                      </Text>
                      <Text fontSize="xs" color="green.600" fontWeight="600">
                        {course.earnings} ر.س
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="muted">لا توجد بيانات</Text>
              </Box>
            )}
          </Box>
        </PremiumCard>

        {/* Recent Activity */}
        <PremiumCard variant="elevated">
          <Box p={6}>
            <Heading size="md" mb={4}>النشاط الأخير</Heading>
            
            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              <VStack gap={3} align="stretch">
                {analytics.recentActivity.map((activity, index) => (
                  <HStack
                    key={index}
                    justify="space-between"
                    p={3}
                    borderBottom={index < analytics.recentActivity.length - 1 ? "1px solid" : "none"}
                    borderColor="border"
                  >
                    <HStack gap={2}>
                      <Text>
                        {activity.type === "view" ? "👁️" : activity.type === "enrollment" ? "📝" : "✅"}
                      </Text>
                      <Text fontSize="sm">
                        {activity.type === "view"
                          ? "مشاهدة جديدة"
                          : activity.type === "enrollment"
                          ? "تسجيل جديد"
                          : "إتمام دورة"}
                      </Text>
                    </HStack>
                    <VStack gap={0} align="end">
                      <Text fontSize="xs" lineClamp={1}>
                        {activity.courseName}
                      </Text>
                      <Text fontSize="xs" color="muted">
                        {activity.timestamp}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="muted">لا يوجد نشاط حديث</Text>
              </Box>
            )}
          </Box>
        </PremiumCard>
      </Grid>
    </VStack>
  );
}
