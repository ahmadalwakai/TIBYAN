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
  Fieldset,
  Stack,
  Textarea,
  NativeSelect,
  Tabs,
} from "@chakra-ui/react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import PremiumCard from "@/components/ui/PremiumCard";
import { toaster } from "@/components/ui/toaster";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  order: number;
  videoUrl: string | null;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  slug: string;
  thumbnail: string | null;
  status: string;
  price: number;
  duration: number | null;
  level: string;
  lessons: Lesson[];
  students: number;
  earnings: number;
  createdAt: string;
  publishedAt: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCoursePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    level: "BEGINNER",
    duration: "",
  });
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    duration: "",
    videoUrl: "",
  });

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/teacher/courses/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setCourse(data.data);
          setFormData({
            title: data.data.title,
            description: data.data.description,
            price: data.data.price.toString(),
            level: data.data.level,
            duration: data.data.duration?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          duration: parseInt(formData.duration) || null,
        }),
        credentials: "include",
      });
      const data = await res.json();

      if (data.ok) {
        setCourse({
          ...course!,
          ...formData,
          price: parseFloat(formData.price) || 0,
          duration: parseInt(formData.duration) || null,
        });
        toaster.create({
          title: "تم الحفظ",
          description: "تم تحديث الدورة بنجاح",
          type: "success",
        });
      } else {
        toaster.create({
          title: "خطأ",
          description: data.error || "فشل حفظ التغييرات",
          type: "error",
        });
      }
    } catch {
      toaster.create({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.title) {
      toaster.create({
        title: "خطأ",
        description: "يرجى إدخال عنوان الدرس",
        type: "error",
      });
      return;
    }

    try {
      const res = await fetch(`/api/teacher/courses/${id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLesson,
          duration: parseInt(newLesson.duration) || null,
          order: (course?.lessons.length || 0) + 1,
        }),
        credentials: "include",
      });
      const data = await res.json();

      if (data.ok) {
        setCourse({
          ...course!,
          lessons: [...(course?.lessons || []), data.data],
        });
        setNewLesson({ title: "", description: "", duration: "", videoUrl: "" });
        toaster.create({
          title: "تمت الإضافة",
          description: "تم إضافة الدرس بنجاح",
          type: "success",
        });
      } else {
        toaster.create({
          title: "خطأ",
          description: data.error || "فشل إضافة الدرس",
          type: "error",
        });
      }
    } catch {
      toaster.create({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        type: "error",
      });
    }
  };

  const handlePublish = async () => {
    if (!course?.lessons.length) {
      toaster.create({
        title: "تنبيه",
        description: "يجب إضافة درس واحد على الأقل قبل النشر",
        type: "warning",
      });
      return;
    }

    try {
      const res = await fetch(`/api/teacher/courses/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data.ok) {
        setCourse({ ...course!, status: "REVIEW" });
        toaster.create({
          title: "تم الإرسال",
          description: "تم إرسال الدورة للمراجعة",
          type: "success",
        });
      } else {
        toaster.create({
          title: "خطأ",
          description: data.error || "فشل إرسال الدورة",
          type: "error",
        });
      }
    } catch {
      toaster.create({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        type: "error",
      });
    }
  };

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
        <Button colorPalette="blue" onClick={() => router.back()}>
          العودة
        </Button>
      </Box>
    );
  }

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

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <HStack gap={2} mb={2}>
            <Heading size="xl" color="text">
              تعديل الدورة
            </Heading>
            {getStatusBadge(course.status)}
          </HStack>
          <Text color="muted">{course.title}</Text>
        </Box>
        <HStack gap={2}>
          {course.status === "DRAFT" && (
            <Button colorPalette="green" onClick={handlePublish}>
              📤 إرسال للمراجعة
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            العودة
          </Button>
        </HStack>
      </HStack>

      {/* Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
        <Box p={4} bg="backgroundAlt" borderRadius="card" textAlign="center">
          <Text fontWeight="700" fontSize="2xl" color="accent">{course.students}</Text>
          <Text fontSize="sm" color="muted">طالب مسجل</Text>
        </Box>
        <Box p={4} bg="backgroundAlt" borderRadius="card" textAlign="center">
          <Text fontWeight="700" fontSize="2xl" color="green.600">{course.earnings} ر.س</Text>
          <Text fontSize="sm" color="muted">إجمالي الأرباح</Text>
        </Box>
        <Box p={4} bg="backgroundAlt" borderRadius="card" textAlign="center">
          <Text fontWeight="700" fontSize="2xl" color="blue.600">{course.lessons.length}</Text>
          <Text fontSize="sm" color="muted">درس</Text>
        </Box>
      </Grid>

      {/* Tabs */}
      <Tabs.Root defaultValue="info" variant="enclosed">
        <Tabs.List>
          <Tabs.Trigger value="info">📝 المعلومات الأساسية</Tabs.Trigger>
          <Tabs.Trigger value="lessons">📖 الدروس ({course.lessons.length})</Tabs.Trigger>
          <Tabs.Trigger value="pricing">💰 التسعير</Tabs.Trigger>
        </Tabs.List>

        {/* Info Tab */}
        <Tabs.Content value="info">
          <PremiumCard variant="elevated" mt={4}>
            <Box p={6}>
              <Fieldset.Root>
                <Stack gap={5}>
                  <Box>
                    <Text fontWeight="600" mb={2} fontSize="sm">عنوان الدورة</Text>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      bg="surface"
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="600" mb={2} fontSize="sm">وصف الدورة</Text>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      bg="surface"
                      minH="150px"
                    />
                  </Box>

                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <Box>
                      <Text fontWeight="600" mb={2} fontSize="sm">مستوى الدورة</Text>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                          bg="surface"
                        >
                          <option value="BEGINNER">مبتدئ</option>
                          <option value="INTERMEDIATE">متوسط</option>
                          <option value="ADVANCED">متقدم</option>
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    </Box>

                    <Box>
                      <Text fontWeight="600" mb={2} fontSize="sm">المدة (دقائق)</Text>
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        bg="surface"
                      />
                    </Box>
                  </Grid>

                  <Button
                    colorPalette="blue"
                    onClick={handleSave}
                    loading={saving}
                    alignSelf="start"
                  >
                    💾 حفظ التغييرات
                  </Button>
                </Stack>
              </Fieldset.Root>
            </Box>
          </PremiumCard>
        </Tabs.Content>

        {/* Lessons Tab */}
        <Tabs.Content value="lessons">
          <PremiumCard variant="elevated" mt={4}>
            <Box p={6}>
              <Heading size="md" mb={4}>الدروس الحالية</Heading>
              
              {course.lessons.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text fontSize="4xl" mb={2}>📖</Text>
                  <Text color="muted">لم تضف أي دروس بعد</Text>
                </Box>
              ) : (
                <VStack gap={3} align="stretch" mb={6}>
                  {course.lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                      <HStack
                        key={lesson.id}
                        justify="space-between"
                        p={4}
                        borderRadius="card"
                        border="1px solid"
                        borderColor="border"
                      >
                        <HStack gap={3}>
                          <Box
                            w={8}
                            h={8}
                            borderRadius="full"
                            bg="accentSubtle"
                            color="accent"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontWeight="700"
                          >
                            {index + 1}
                          </Box>
                          <Box>
                            <Text fontWeight="600">{lesson.title}</Text>
                            {lesson.duration && (
                              <Text fontSize="xs" color="muted">
                                {lesson.duration} دقيقة
                              </Text>
                            )}
                          </Box>
                        </HStack>
                        <HStack gap={2}>
                          <Badge bg={lesson.videoUrl ? "green.100" : "gray.100"} color={lesson.videoUrl ? "green.700" : "gray.500"}>
                            {lesson.videoUrl ? "فيديو ✓" : "بدون فيديو"}
                          </Badge>
                          <Button size="xs" variant="outline">
                            تعديل
                          </Button>
                        </HStack>
                      </HStack>
                    ))}
                </VStack>
              )}

              {/* Add New Lesson */}
              <Box p={4} bg="backgroundAlt" borderRadius="card">
                <Heading size="sm" mb={4}>➕ إضافة درس جديد</Heading>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" mb={1}>عنوان الدرس *</Text>
                    <Input
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                      placeholder="عنوان الدرس"
                      bg="surface"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" mb={1}>المدة (دقائق)</Text>
                    <Input
                      type="number"
                      value={newLesson.duration}
                      onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                      placeholder="15"
                      bg="surface"
                    />
                  </Box>
                  <Box gridColumn={{ md: "span 2" }}>
                    <Text fontSize="sm" fontWeight="600" mb={1}>رابط الفيديو</Text>
                    <Input
                      value={newLesson.videoUrl}
                      onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                      placeholder="https://..."
                      bg="surface"
                      dir="ltr"
                    />
                  </Box>
                </Grid>
                <Button colorPalette="green" mt={4} onClick={handleAddLesson}>
                  إضافة الدرس
                </Button>
              </Box>
            </Box>
          </PremiumCard>
        </Tabs.Content>

        {/* Pricing Tab */}
        <Tabs.Content value="pricing">
          <PremiumCard variant="elevated" mt={4}>
            <Box p={6}>
              <Heading size="md" mb={4}>التسعير</Heading>
              
              <Box mb={4}>
                <Text fontWeight="600" mb={2} fontSize="sm">سعر الدورة (ر.س)</Text>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  bg="surface"
                  maxW="200px"
                />
              </Box>

              <Box p={4} bg="yellow.50" borderRadius="card" mb={4}>
                <Text fontWeight="600" color="yellow.800" mb={2}>تفاصيل الأرباح</Text>
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} fontSize="sm">
                  <Box>
                    <Text color="muted">سعر الدورة</Text>
                    <Text fontWeight="700">{formData.price || 0} ر.س</Text>
                  </Box>
                  <Box>
                    <Text color="muted">نسبة المنصة (20%)</Text>
                    <Text fontWeight="700" color="red.600">
                      -{(parseFloat(formData.price) * 0.2 || 0).toFixed(2)} ر.س
                    </Text>
                  </Box>
                  <Box>
                    <Text color="muted">صافي ربحك</Text>
                    <Text fontWeight="700" color="green.600">
                      {(parseFloat(formData.price) * 0.8 || 0).toFixed(2)} ر.س
                    </Text>
                  </Box>
                </Grid>
              </Box>

              <Button colorPalette="blue" onClick={handleSave} loading={saving}>
                💾 حفظ التسعير
              </Button>
            </Box>
          </PremiumCard>
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}
