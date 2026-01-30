"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  Progress,
  VStack,
  HStack,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";

interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  totalProgress: number;
  totalPaid: number;
  upcomingLessons: number;
  certificatesEarned: number;
}

interface RecentCourse {
  id: string;
  title: string;
  progress: number;
  lastAccessed: string;
  thumbnail: string | null;
}

interface RecentPayment {
  id: string;
  courseName: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/student/dashboard");
        const data = await res.json();
        if (data.ok) {
          setStats(data.data.stats);
          setRecentCourses(data.data.recentCourses);
          setRecentPayments(data.data.recentPayments);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4} color="muted">جاري التحميل...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          مرحباً بك في بوابة الطالب 👋
        </Heading>
        <Text color="muted">
          تابع تقدمك في الدورات واستكمل رحلتك التعليمية
        </Text>
      </Box>

      {/* Stats Grid */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
        <StatCard
          title="الدورات المسجلة"
          value={stats?.enrolledCourses ?? 0}
          icon="📚"
          color="brand.500"
        />
        <StatCard
          title="الدورات المكتملة"
          value={stats?.completedCourses ?? 0}
          icon="✅"
          color="green.500"
        />
        <StatCard
          title="التقدم الإجمالي"
          value={`${stats?.totalProgress ?? 0}%`}
          icon="📈"
          color="blue.500"
        />
        <StatCard
          title="إجمالي المدفوعات"
          value={`${stats?.totalPaid ?? 0} ر.س`}
          icon="💰"
          color="yellow.600"
        />
        <StatCard
          title="الدروس القادمة"
          value={stats?.upcomingLessons ?? 0}
          icon="📅"
          color="purple.500"
        />
        <StatCard
          title="الشهادات المكتسبة"
          value={stats?.certificatesEarned ?? 0}
          icon="🏆"
          color="orange.500"
        />
      </Grid>

      {/* Recent Courses */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <HStack justify="space-between" mb={4}>
            <Heading size="md" color="text">
              الدورات الأخيرة
            </Heading>
            <Link href="/student/courses">
              <Text color="brand.500" fontWeight="600" _hover={{ textDecoration: "underline" }}>
                عرض الكل
              </Text>
            </Link>
          </HStack>

          {recentCourses.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="4xl" mb={2}>📚</Text>
              <Text color="muted">لم تسجل في أي دورة بعد</Text>
              <Link href="/courses">
                <Text color="brand.500" fontWeight="600" mt={2}>
                  تصفح الدورات المتاحة
                </Text>
              </Link>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              {recentCourses.map((course) => (
                <Link key={course.id} href={`/student/courses/${course.id}`}>
                  <Box
                    p={4}
                    borderRadius="card"
                    border="1px solid"
                    borderColor="border"
                    _hover={{ borderColor: "brand.500", bg: "brand.50" }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="600" color="text">
                        {course.title}
                      </Text>
                      <Badge
                        bg={course.progress === 100 ? "green.100" : "brand.50"}
                        color={course.progress === 100 ? "green.700" : "brand.700"}
                      >
                        {course.progress === 100 ? "مكتمل" : `${course.progress}%`}
                      </Badge>
                    </HStack>
                    <Progress.Root
                      value={course.progress}
                      size="sm"
                      colorPalette={course.progress === 100 ? "green" : "blue"}
                    >
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                    <Text fontSize="sm" color="muted" mt={2}>
                      آخر دخول: {course.lastAccessed}
                    </Text>
                  </Box>
                </Link>
              ))}
            </VStack>
          )}
        </Box>
      </PremiumCard>

      {/* Recent Payments */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <HStack justify="space-between" mb={4}>
            <Heading size="md" color="text">
              المدفوعات الأخيرة
            </Heading>
            <Link href="/student/payments">
              <Text color="brand.500" fontWeight="600" _hover={{ textDecoration: "underline" }}>
                عرض الكل
              </Text>
            </Link>
          </HStack>

          {recentPayments.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="4xl" mb={2}>💳</Text>
              <Text color="muted">لا توجد مدفوعات حتى الآن</Text>
            </Box>
          ) : (
            <VStack gap={3} align="stretch">
              {recentPayments.map((payment) => (
                <HStack
                  key={payment.id}
                  justify="space-between"
                  p={3}
                  borderRadius="md"
                  bg="backgroundAlt"
                >
                  <Box>
                    <Text fontWeight="600" fontSize="sm">
                      {payment.courseName}
                    </Text>
                    <Text fontSize="xs" color="muted">
                      {payment.date}
                    </Text>
                  </Box>
                  <Box textAlign="left">
                    <Text fontWeight="700" color="brand.700">
                      {payment.amount} {payment.currency}
                    </Text>
                    <Badge
                      size="sm"
                      bg={payment.status === "COMPLETED" ? "green.100" : "yellow.100"}
                      color={payment.status === "COMPLETED" ? "green.700" : "yellow.700"}
                    >
                      {payment.status === "COMPLETED" ? "مكتمل" : "معلق"}
                    </Badge>
                  </Box>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      </PremiumCard>
    </VStack>
  );
}
