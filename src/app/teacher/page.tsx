"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
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
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageRating: number;
  totalReviews: number;
  thisMonthStudents: number;
  thisMonthEarnings: number;
}

interface RecentEnrollment {
  id: string;
  studentName: string;
  courseName: string;
  enrolledAt: string;
  amount: number;
}

interface TopCourse {
  id: string;
  title: string;
  students: number;
  earnings: number;
  rating: number;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/teacher/dashboard", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setStats(data.data.stats);
          setRecentEnrollments(data.data.recentEnrollments);
          setTopCourses(data.data.topCourses);
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
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري التحميل...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          مرحباً بك في بوابة المدرس 👨‍🏫
        </Heading>
        <Text color="muted">
          تابع أداء دوراتك وأرباحك وطلابك
        </Text>
      </Box>

      {/* Main Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
        <StatCard
          title="إجمالي الدورات"
          value={stats?.totalCourses ?? 0}
          icon="📚"
          color="accent"
        />
        <StatCard
          title="إجمالي الطلاب"
          value={stats?.totalStudents ?? 0}
          icon="👥"
          color="blue.500"
        />
        <StatCard
          title="إجمالي الأرباح"
          value={`${stats?.totalEarnings ?? 0} ر.س`}
          icon="💰"
          color="green.500"
        />
        <StatCard
          title="متوسط التقييم"
          value={`${stats?.averageRating?.toFixed(1) ?? 0} ⭐`}
          icon="⭐"
          color="yellow.500"
        />
      </Grid>

      {/* Secondary Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
        <StatCard
          title="دورات منشورة"
          value={stats?.publishedCourses ?? 0}
          icon="✅"
          color="green.600"
        />
        <StatCard
          title="أرباح معلقة"
          value={`${stats?.pendingEarnings ?? 0} ر.س`}
          icon="⏳"
          color="orange.500"
        />
        <StatCard
          title="طلاب هذا الشهر"
          value={stats?.thisMonthStudents ?? 0}
          icon="📈"
          color="purple.500"
        />
        <StatCard
          title="أرباح هذا الشهر"
          value={`${stats?.thisMonthEarnings ?? 0} ر.س`}
          icon="💵"
          color="teal.500"
        />
      </Grid>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
        {/* Top Courses */}
        <PremiumCard variant="elevated">
          <Box p={6}>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="text">
                أفضل الدورات
              </Heading>
              <Link href="/teacher/courses">
                <Text color="link" fontWeight="600" _hover={{ textDecoration: "underline", color: "linkHover" }}>
                  عرض الكل
                </Text>
              </Link>
            </HStack>

            {topCourses.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="4xl" mb={2}>📚</Text>
                <Text color="muted">لم تنشئ أي دورات بعد</Text>
                <Link href="/teacher/courses/new">
                  <Text color="link" fontWeight="600" mt={2}>
                    أنشئ دورتك الأولى
                  </Text>
                </Link>
              </Box>
            ) : (
              <VStack gap={3} align="stretch">
                {topCourses.map((course, index) => (
                  <Link key={course.id} href={`/teacher/courses/${course.id}`}>
                    <HStack
                      justify="space-between"
                      p={3}
                      borderRadius="card"
                      border="1px solid"
                      borderColor="cardBorder"
                      _hover={{ borderColor: "cardHoverBorder", bg: "surfaceHover" }}
                      transition="all 0.2s"
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
                        >
                          {index + 1}
                        </Box>
                        <Box>
                          <Text fontWeight="600" fontSize="sm" lineClamp={1}>
                            {course.title}
                          </Text>
                          <HStack gap={2} fontSize="xs" color="muted">
                            <Text>{course.students} طالب</Text>
                            <Text>•</Text>
                            <Text>{course.rating.toFixed(1)} ⭐</Text>
                          </HStack>
                        </Box>
                      </HStack>
                      <Text fontWeight="700" color="green.600" fontSize="sm">
                        {course.earnings} ر.س
                      </Text>
                    </HStack>
                  </Link>
                ))}
              </VStack>
            )}
          </Box>
        </PremiumCard>

        {/* Recent Enrollments */}
        <PremiumCard variant="elevated">
          <Box p={6}>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="text">
                التسجيلات الأخيرة
              </Heading>
              <Link href="/teacher/students">
                <Text color="link" fontWeight="600" _hover={{ textDecoration: "underline", color: "linkHover" }}>
                  عرض الكل
                </Text>
              </Link>
            </HStack>

            {recentEnrollments.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="4xl" mb={2}>👥</Text>
                <Text color="muted">لا توجد تسجيلات حتى الآن</Text>
              </Box>
            ) : (
              <VStack gap={3} align="stretch">
                {recentEnrollments.map((enrollment) => (
                  <HStack
                    key={enrollment.id}
                    justify="space-between"
                    p={3}
                    borderRadius="md"
                    bg="backgroundAlt"
                  >
                    <Box>
                      <Text fontWeight="600" fontSize="sm">
                        {enrollment.studentName}
                      </Text>
                      <Text fontSize="xs" color="muted">
                        {enrollment.courseName}
                      </Text>
                    </Box>
                    <VStack gap={0} align="end">
                      <Badge bg="green.100" color="green.700" fontSize="xs">
                        +{enrollment.amount} ر.س
                      </Badge>
                      <Text fontSize="xs" color="muted">
                        {enrollment.enrolledAt}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        </PremiumCard>
      </Grid>
    </VStack>
  );
}
