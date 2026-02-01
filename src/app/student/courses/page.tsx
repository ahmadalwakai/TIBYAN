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
  Input,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  enrolledAt: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  level: string;
  duration: number | null;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/student/courses");
        const data = await res.json();
        if (data.ok) {
          setCourses(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && course.status === "ACTIVE") ||
      (filter === "completed" && course.status === "COMPLETED");
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل الدورات...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          دوراتي 📚
        </Heading>
        <Text color="muted">
          جميع الدورات التي سجلت فيها ومتابعة تقدمك
        </Text>
      </Box>

      {/* Filters */}
      <HStack gap={4} flexWrap="wrap">
        <Input
          placeholder="ابحث عن دورة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="300px"
          bg="surface"
        />
        <HStack gap={2}>
          <Button
            size="sm"
            variant={filter === "all" ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() => setFilter("all")}
          >
            الكل ({courses.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "active" ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() => setFilter("active")}
          >
            قيد الدراسة ({courses.filter((c) => c.status === "ACTIVE").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "completed" ? "solid" : "outline"}
            colorPalette="green"
            onClick={() => setFilter("completed")}
          >
            مكتملة ({courses.filter((c) => c.status === "COMPLETED").length})
          </Button>
        </HStack>
      </HStack>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <PremiumCard variant="elevated">
          <Box textAlign="center" py={12}>
            <Text fontSize="5xl" mb={4}>📚</Text>
            <Heading size="md" color="text" mb={2}>
              {searchTerm ? "لا توجد نتائج" : "لم تسجل في أي دورة بعد"}
            </Heading>
            <Text color="muted" mb={4}>
              {searchTerm
                ? "جرب البحث بكلمات مختلفة"
                : "ابدأ رحلتك التعليمية الآن"}
            </Text>
            {!searchTerm && (
              <Button asChild colorPalette="blue">
                <Link href="/courses">تصفح الدورات</Link>
              </Button>
            )}
          </Box>
        </PremiumCard>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          {filteredCourses.map((course) => (
            <Link key={course.id} href={`/student/courses/${course.id}`}>
              <PremiumCard
                variant="elevated"
                h="100%"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                transition="all 0.2s"
              >
                <Box p={5}>
                  {/* Course Header */}
                  <HStack justify="space-between" mb={3}>
                    <Badge
                      bg={course.status === "COMPLETED" ? "green.100" : "blue.100"}
                      color={course.status === "COMPLETED" ? "green.700" : "blue.700"}
                    >
                      {course.status === "COMPLETED" ? "مكتمل ✓" : "قيد الدراسة"}
                    </Badge>
                    <Badge bg="gray.100" color="gray.700" fontSize="xs">
                      {course.level === "BEGINNER"
                        ? "مبتدئ"
                        : course.level === "INTERMEDIATE"
                        ? "متوسط"
                        : "متقدم"}
                    </Badge>
                  </HStack>

                  {/* Title & Description */}
                  <Heading size="md" color="text" mb={2} lineClamp={2}>
                    {course.title}
                  </Heading>
                  <Text color="muted" fontSize="sm" mb={3} lineClamp={2}>
                    {course.description}
                  </Text>

                  {/* Instructor */}
                  <Text fontSize="sm" color="accent" mb={3}>
                    👨‍🏫 {course.instructor}
                  </Text>

                  {/* Progress */}
                  <Box mb={3}>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="sm" color="muted">
                        التقدم
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="text">
                        {course.completedLessons}/{course.totalLessons} درس
                      </Text>
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
                    <Text fontSize="xs" color="muted" mt={1} textAlign="left">
                      {course.progress}%
                    </Text>
                  </Box>

                  {/* Meta */}
                  <HStack justify="space-between" fontSize="xs" color="muted">
                    <Text>📅 تسجيل: {course.enrolledAt}</Text>
                    {course.duration && (
                      <Text>⏱️ {Math.round(course.duration / 60)} ساعة</Text>
                    )}
                  </HStack>
                </Box>
              </PremiumCard>
            </Link>
          ))}
        </Grid>
      )}
    </VStack>
  );
}
