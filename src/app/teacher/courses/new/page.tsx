"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Input,
  Button,
  Fieldset,
  Stack,
  Textarea,
  NativeSelect,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PremiumCard from "@/components/ui/PremiumCard";
import { toaster } from "@/components/ui/toaster";

export default function CreateCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    level: "BEGINNER",
    duration: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/teacher/courses", {
        method: "POST",
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
        toaster.create({
          title: "تم الإنشاء",
          description: "تم إنشاء الدورة بنجاح",
          type: "success",
        });
        router.push(`/teacher/courses/${data.data.id}`);
      } else {
        toaster.create({
          title: "خطأ",
          description: data.error || "فشل إنشاء الدورة",
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

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          إنشاء دورة جديدة ➕
        </Heading>
        <Text color="muted">
          أنشئ دورة جديدة وابدأ بإضافة المحتوى
        </Text>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          {/* Main Content */}
          <PremiumCard variant="elevated">
            <Box p={6}>
              <Heading size="md" mb={6}>المعلومات الأساسية</Heading>
              
              <Fieldset.Root>
                <Stack gap={5}>
                  <Box>
                    <Text fontWeight="600" mb={2} fontSize="sm">عنوان الدورة *</Text>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="مثال: أساسيات التجويد للمبتدئين"
                      bg="surface"
                      required
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="600" mb={2} fontSize="sm">وصف الدورة *</Text>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="اكتب وصفاً تفصيلياً للدورة يوضح ما سيتعلمه الطالب..."
                      bg="surface"
                      minH="150px"
                      required
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
                      <Text fontWeight="600" mb={2} fontSize="sm">المدة الإجمالية (بالدقائق)</Text>
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="مثال: 120"
                        bg="surface"
                        min="0"
                      />
                    </Box>
                  </Grid>
                </Stack>
              </Fieldset.Root>
            </Box>
          </PremiumCard>

          {/* Sidebar */}
          <VStack gap={4} align="stretch">
            <PremiumCard variant="elevated">
              <Box p={6}>
                <Heading size="md" mb={4}>التسعير</Heading>
                
                <Box mb={4}>
                  <Text fontWeight="600" mb={2} fontSize="sm">سعر الدورة (ر.س)</Text>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0 = مجاني"
                    bg="surface"
                    min="0"
                    step="0.01"
                  />
                  <Text fontSize="xs" color="muted" mt={1}>
                    اتركه 0 لجعل الدورة مجانية
                  </Text>
                </Box>

                <Box p={3} bg="yellow.50" borderRadius="md" mb={4}>
                  <Text fontSize="xs" color="yellow.800">
                    💡 نسبة المنصة: 20% من سعر الدورة
                  </Text>
                </Box>
              </Box>
            </PremiumCard>

            <PremiumCard variant="elevated">
              <Box p={6}>
                <Heading size="md" mb={4}>الحالة</Heading>
                <Text color="muted" fontSize="sm" mb={4}>
                  سيتم إنشاء الدورة كمسودة. يمكنك نشرها بعد إضافة المحتوى.
                </Text>
                
                <VStack gap={3}>
                  <Button
                    type="submit"
                    colorPalette="blue"
                    w="100%"
                    loading={saving}
                    loadingText="جاري الإنشاء..."
                  >
                    إنشاء الدورة
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    w="100%"
                    onClick={() => router.back()}
                  >
                    إلغاء
                  </Button>
                </VStack>
              </Box>
            </PremiumCard>
          </VStack>
        </Grid>
      </form>
    </VStack>
  );
}
