"use client";

import { Badge, Box, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Spinner } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import { useEffect, useState } from "react";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  level: string;
  price: number;
  instructor: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    lessons: number;
    enrollments: number;
    reviews: number;
  };
}

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  REVIEW: "قيد المراجعة",
  PUBLISHED: "منشورة",
  ARCHIVED: "مؤرشفة",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
};

const statusColors: Record<string, string> = {
  DRAFT: "brand.500",
  REVIEW: "warning",
  PUBLISHED: "success",
  ARCHIVED: "gray.500",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchCourses();
  }, [statusFilter, search]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/courses?${params}`, {
        credentials: "include",
      });
      const result = await response.json();

      if (result.ok) {
        setCourses(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;

    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();

      if (result.ok) {
        fetchCourses();
      } else {
        alert(result.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      const result = await response.json();

      if (result.ok) {
        fetchCourses();
      } else {
        alert(result.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Stack gap={8}>
      <Flex direction={{ base: "column", md: "row" }} gap={4} justify="space-between">
        <Stack gap={3}>
          <Badge
            bgGradient="linear(135deg, brand.500 0%, brand.600 100%)"
            color="white"
            px={3}
            py={1}
            borderRadius="badge"
            fontSize="xs"
            fontWeight="600"
            w="fit-content"
          >
            📚 إدارة الدورات
          </Badge>
          <Heading size="xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة الدورات
          </Heading>
          <Text color="muted" fontSize="lg">مراجعة الدورات، اعتماد المحتوى، ومراقبة الأداء.</Text>
        </Stack>
      </Flex>

      <PremiumCard variant="bordered" p={6}>
        <Stack gap={4}>
          <Input
            placeholder="🔍 البحث عن دورة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="background"
          />
          <Flex gap={3} flexWrap="wrap">
            <Button
              size="sm"
              variant={statusFilter === "" ? "solid" : "outline"}
              onClick={() => setStatusFilter("")}
            >
              الكل
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "PUBLISHED" ? "solid" : "outline"}
              onClick={() => setStatusFilter("PUBLISHED")}
            >
              المنشورة
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "REVIEW" ? "solid" : "outline"}
              onClick={() => setStatusFilter("REVIEW")}
            >
              قيد المراجعة
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "DRAFT" ? "solid" : "outline"}
              onClick={() => setStatusFilter("DRAFT")}
            >
              المسودات
            </Button>
          </Flex>
        </Stack>
      </PremiumCard>

      {loading && (
        <Flex justify="center" py={10}>
          <Spinner size="xl" color="spinner" />
        </Flex>
      )}

      {error && (
        <PremiumCard variant="bordered" p={6} borderColor="red.500">
          <Text color="red.500">❌ {error}</Text>
        </PremiumCard>
      )}

      {!loading && !error && courses.length === 0 && (
        <PremiumCard variant="bordered" p={6}>
          <Text color="muted" textAlign="center">لا توجد دورات</Text>
        </PremiumCard>
      )}

      {!loading && !error && courses.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {courses.map((course) => (
            <PremiumCard key={course.id} variant="bordered" p={6}>
              <Stack gap={4}>
                <Flex justify="space-between" align="start">
                  <Stack gap={1} flex={1}>
                    <Text fontWeight="800" fontSize="lg">{course.title}</Text>
                    <Text fontSize="sm" color="muted" css={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", display: "-webkit-box" }}>
                      {course.description}
                    </Text>
                  </Stack>
                  <Badge 
                    bg={statusColors[course.status]}
                    color="white"
                    px={3}
                    py={1}
                    borderRadius="badge"
                    fontWeight="600"
                  >
                    {statusLabels[course.status]}
                  </Badge>
                </Flex>

                <Flex gap={4} fontSize="sm" color="muted" flexWrap="wrap">
                  <Text>👨‍🏫 {course.instructor.name}</Text>
                  <Text>📊 {levelLabels[course.level]}</Text>
                  <Text>💰 {course.price === 0 ? "مجاني" : `${course.price} ريال`}</Text>
                </Flex>

                <Flex gap={4} fontSize="sm" color="muted">
                  <Text>📝 {course._count.lessons} درس</Text>
                  <Text>👥 {course._count.enrollments} طالب</Text>
                  <Text>⭐ {course._count.reviews} تقييم</Text>
                </Flex>

                <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="border" gap={2} flexWrap="wrap">
                  {course.status === "REVIEW" && (
                    <Button 
                      size="sm" 
                      bg="success"
                      color="white"
                      _hover={{ bg: "green.600" }}
                      onClick={() => updateStatus(course.id, "PUBLISHED")}
                    >
                      ✅ نشر
                    </Button>
                  )}
                  {course.status === "PUBLISHED" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      borderColor="gray.500"
                      color="gray.700"
                      _hover={{ bg: "gray.50" }}
                      onClick={() => updateStatus(course.id, "ARCHIVED")}
                    >
                      📦 أرشفة
                    </Button>
                  )}
                  {(course.status === "DRAFT" || course.status === "ARCHIVED") && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      borderColor="borderAccent"
                      color="primary"
                      _hover={{ bg: "accentSubtle" }}
                      onClick={() => updateStatus(course.id, "REVIEW")}
                    >
                      📤 للمراجعة
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    borderColor="red.500"
                    color="red.500"
                    _hover={{ bg: "red.50" }}
                    onClick={() => deleteCourse(course.id)}
                  >
                    🗑️ حذف
                  </Button>
                </Flex>
              </Stack>
            </PremiumCard>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
