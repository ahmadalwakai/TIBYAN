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
  Input,
  Button,
  Menu,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

interface TeacherCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  price: number;
  students: number;
  earnings: number;
  rating: number;
  reviewCount: number;
  lessons: number;
  level: string;
  createdAt: string;
  publishedAt: string | null;
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "DRAFT" | "PUBLISHED" | "REVIEW">("all");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/teacher/courses");
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
    const matchesFilter = filter === "all" || course.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; color: string; label: string }> = {
      DRAFT: { bg: "gray.100", color: "gray.700", label: "مسودة" },
      REVIEW: { bg: "yellow.100", color: "yellow.700", label: "قيد المراجعة" },
      PUBLISHED: { bg: "green.100", color: "green.700", label: "منشور" },
      ARCHIVED: { bg: "red.100", color: "red.700", label: "مؤرشف" },
    };
    const s = statusMap[status] || statusMap.DRAFT;
    return <Badge bg={s.bg} color={s.color}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4} color="muted">جاري تحميل الدورات...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" color="text" mb={2}>
            دوراتي 📚
          </Heading>
          <Text color="muted">
            إدارة جميع دوراتك ومحتواها
          </Text>
        </Box>
        <Link href="/teacher/courses/new">
          <Button colorPalette="blue" size="lg">
            ➕ إنشاء دورة جديدة
          </Button>
        </Link>
      </HStack>

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
            variant={filter === "PUBLISHED" ? "solid" : "outline"}
            colorPalette="green"
            onClick={() => setFilter("PUBLISHED")}
          >
            منشور ({courses.filter((c) => c.status === "PUBLISHED").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "DRAFT" ? "solid" : "outline"}
            colorPalette="gray"
            onClick={() => setFilter("DRAFT")}
          >
            مسودة ({courses.filter((c) => c.status === "DRAFT").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "REVIEW" ? "solid" : "outline"}
            colorPalette="yellow"
            onClick={() => setFilter("REVIEW")}
          >
            قيد المراجعة ({courses.filter((c) => c.status === "REVIEW").length})
          </Button>
        </HStack>
      </HStack>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <PremiumCard variant="elevated">
          <Box textAlign="center" py={12}>
            <Text fontSize="5xl" mb={4}>📚</Text>
            <Heading size="md" color="text" mb={2}>
              {searchTerm ? "لا توجد نتائج" : "لم تنشئ أي دورات بعد"}
            </Heading>
            <Text color="muted" mb={4}>
              {searchTerm
                ? "جرب البحث بكلمات مختلفة"
                : "ابدأ بإنشاء دورتك الأولى الآن"}
            </Text>
            {!searchTerm && (
              <Link href="/teacher/courses/new">
                <Button colorPalette="blue">إنشاء دورة</Button>
              </Link>
            )}
          </Box>
        </PremiumCard>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          {filteredCourses.map((course) => (
            <PremiumCard
              key={course.id}
              variant="elevated"
              h="100%"
              _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              transition="all 0.2s"
            >
              <Box p={5}>
                {/* Status */}
                <HStack justify="space-between" mb={3}>
                  {getStatusBadge(course.status)}
                  <Badge bg="gray.100" color="gray.700" fontSize="xs">
                    {course.level === "BEGINNER"
                      ? "مبتدئ"
                      : course.level === "INTERMEDIATE"
                      ? "متوسط"
                      : "متقدم"}
                  </Badge>
                </HStack>

                {/* Title */}
                <Heading size="md" color="text" mb={2} lineClamp={2}>
                  {course.title}
                </Heading>
                <Text color="muted" fontSize="sm" mb={4} lineClamp={2}>
                  {course.description}
                </Text>

                {/* Stats */}
                <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={4}>
                  <Box textAlign="center" p={2} bg="backgroundAlt" borderRadius="md">
                    <Text fontWeight="700" color="brand.700">{course.students}</Text>
                    <Text fontSize="xs" color="muted">طالب</Text>
                  </Box>
                  <Box textAlign="center" p={2} bg="backgroundAlt" borderRadius="md">
                    <Text fontWeight="700" color="green.600">{course.earnings} ر.س</Text>
                    <Text fontSize="xs" color="muted">أرباح</Text>
                  </Box>
                  <Box textAlign="center" p={2} bg="backgroundAlt" borderRadius="md">
                    <Text fontWeight="700" color="yellow.600">{course.rating.toFixed(1)} ⭐</Text>
                    <Text fontSize="xs" color="muted">{course.reviewCount} تقييم</Text>
                  </Box>
                </Grid>

                {/* Meta */}
                <HStack justify="space-between" fontSize="xs" color="muted" mb={4}>
                  <Text>📖 {course.lessons} درس</Text>
                  <Text>💰 {course.price} ر.س</Text>
                </HStack>

                {/* Actions */}
                <HStack gap={2}>
                  <Link href={`/teacher/courses/${course.id}`} style={{ flex: 1 }}>
                    <Button w="100%" variant="outline" size="sm">
                      تعديل
                    </Button>
                  </Link>
                  <Link href={`/teacher/courses/${course.id}/students`} style={{ flex: 1 }}>
                    <Button w="100%" variant="outline" size="sm">
                      الطلاب
                    </Button>
                  </Link>
                  <Link href={`/teacher/courses/${course.id}/analytics`} style={{ flex: 1 }}>
                    <Button w="100%" colorPalette="blue" size="sm">
                      التحليلات
                    </Button>
                  </Link>
                </HStack>
              </Box>
            </PremiumCard>
          ))}
        </Grid>
      )}
    </VStack>
  );
}
