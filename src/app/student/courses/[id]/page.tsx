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
  Button,
  Tabs,
} from "@chakra-ui/react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  order: number;
  completed: boolean;
  videoUrl: string | null;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  };
  progress: number;
  enrolledAt: string;
  status: string;
  level: string;
  duration: number | null;
  lessons: Lesson[];
  totalLessons: number;
  completedLessons: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentCourseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/student/courses/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setCourse(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل الدورة...</Text>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box textAlign="center" py={20}>
        <Text fontSize="5xl" mb={4}>❌</Text>
        <Heading size="md" mb={2}>الدورة غير موجودة</Heading>
        <Button asChild colorPalette="blue">
          <Link href="/student/courses">العودة للدورات</Link>
        </Button>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Course Header */}
      <PremiumCard variant="gradient">
        <Box p={6}>
          <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
            <Badge
              bg={course.status === "COMPLETED" ? "green.500" : "primary"}
              color="white"
              px={3}
              py={1}
              borderRadius="full"
            >
              {course.status === "COMPLETED" ? "مكتمل ✓" : "قيد الدراسة"}
            </Badge>
            <Badge bg="#00FF2A" color="#000000" px={3} py={1} borderRadius="full">
              {course.level === "BEGINNER"
                ? "مبتدئ"
                : course.level === "INTERMEDIATE"
                ? "متوسط"
                : "متقدم"}
            </Badge>
          </HStack>

          <Heading size="xl" color="white" mb={3}>
            {course.title}
          </Heading>
          <Text color="whiteAlpha.900" mb={4}>
            {course.description}
          </Text>

          <HStack gap={4} flexWrap="wrap" color="whiteAlpha.800" fontSize="sm">
            <Text>👨‍🏫 {course.instructor.name}</Text>
            <Text>📅 تاريخ التسجيل: {course.enrolledAt}</Text>
            {course.duration && (
              <Text>⏱️ {Math.round(course.duration / 60)} ساعة</Text>
            )}
          </HStack>
        </Box>
      </PremiumCard>

      {/* Progress Card */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>تقدمك في الدورة</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            <Box textAlign="center">
              <Text fontSize="4xl" fontWeight="700" color="accent">
                {course.progress}%
              </Text>
              <Text color="muted">نسبة الإنجاز</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="4xl" fontWeight="700" color="green.600">
                {course.completedLessons}
              </Text>
              <Text color="muted">دروس مكتملة</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="4xl" fontWeight="700" color="blue.600">
                {course.totalLessons - course.completedLessons}
              </Text>
              <Text color="muted">دروس متبقية</Text>
            </Box>
          </Grid>
          <Box mt={4}>
            <Progress.Root value={course.progress} size="lg" colorPalette="green">
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          </Box>
        </Box>
      </PremiumCard>

      {/* Lessons */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Tabs.Root defaultValue="lessons" variant="enclosed">
            <Tabs.List mb={4}>
              <Tabs.Trigger value="lessons">
                📖 الدروس ({course.totalLessons})
              </Tabs.Trigger>
              <Tabs.Trigger value="materials">
                📁 المرفقات
              </Tabs.Trigger>
              <Tabs.Trigger value="notes">
                📝 ملاحظاتي
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="lessons">
              <VStack gap={3} align="stretch">
                {course.lessons.map((lesson, index) => (
                  <Box
                    key={lesson.id}
                    p={4}
                    borderRadius="card"
                    border="1px solid"
                    borderColor={lesson.completed ? "green.200" : "border"}
                    bg={lesson.completed ? "green.50" : "transparent"}
                    _hover={{ borderColor: "brand.500" }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between">
                      <HStack gap={3}>
                        <Box
                          w={8}
                          h={8}
                          borderRadius="full"
                          bg={lesson.completed ? "green.500" : "gray.200"}
                          color={lesson.completed ? "white" : "gray.600"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontWeight="700"
                          fontSize="sm"
                        >
                          {lesson.completed ? "✓" : index + 1}
                        </Box>
                        <Box>
                          <Text fontWeight="600" color="text">
                            {lesson.title}
                          </Text>
                          {lesson.description && (
                            <Text fontSize="sm" color="muted">
                              {lesson.description}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                      <HStack gap={2}>
                        {lesson.duration && (
                          <Badge bg="#1A1A1A" color="rgba(255,255,255,0.6)" fontSize="xs">
                            {lesson.duration} دقيقة
                          </Badge>
                        )}
                        {lesson.videoUrl ? (
                          <Button size="sm" colorPalette="blue">
                            {lesson.completed ? "مراجعة" : "ابدأ"}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            قريباً
                          </Button>
                        )}
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Tabs.Content>

            <Tabs.Content value="materials">
              <Box textAlign="center" py={8}>
                <Text fontSize="4xl" mb={2}>📁</Text>
                <Text color="muted">لا توجد مرفقات حالياً</Text>
              </Box>
            </Tabs.Content>

            <Tabs.Content value="notes">
              <Box textAlign="center" py={8}>
                <Text fontSize="4xl" mb={2}>📝</Text>
                <Text color="muted">لم تضف أي ملاحظات بعد</Text>
              </Box>
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </PremiumCard>
    </VStack>
  );
}
