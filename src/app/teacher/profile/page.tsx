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
  Avatar,
  Fieldset,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import { toaster } from "@/components/ui/toaster";

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  specialization: string | null;
  experience: string | null;
  createdAt: string;
  emailVerified: boolean;
  stats: {
    totalCourses: number;
    totalStudents: number;
    totalEarnings: number;
    averageRating: number;
  };
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
    specialization: "",
    experience: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/teacher/profile");
        const data = await res.json();
        if (data.ok) {
          setProfile(data.data);
          setFormData({
            name: data.data.name || "",
            bio: data.data.bio || "",
            phone: data.data.phone || "",
            specialization: data.data.specialization || "",
            experience: data.data.experience || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        setProfile({ ...profile!, ...formData });
        toaster.create({
          title: "تم الحفظ",
          description: "تم تحديث الملف الشخصي بنجاح",
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

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل الملف الشخصي...</Text>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box textAlign="center" py={20}>
        <Text color="error">فشل تحميل الملف الشخصي</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          الملف الشخصي 👤
        </Heading>
        <Text color="muted">
          إدارة معلوماتك الشخصية وإعدادات الحساب
        </Text>
      </Box>

      <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={6}>
        {/* Profile Card */}
        <VStack gap={4} align="stretch">
          <PremiumCard variant="elevated">
            <VStack gap={4} p={6} textAlign="center">
              <Avatar.Root size="2xl">
                <Avatar.Fallback bg="avatarBg" color="avatarText" fontSize="3xl">
                  {profile.name.charAt(0)}
                </Avatar.Fallback>
              </Avatar.Root>
              <Box>
                <Heading size="md">{profile.name}</Heading>
                <Text color="muted" fontSize="sm">{profile.email}</Text>
              </Box>
              <HStack gap={2}>
                {profile.emailVerified ? (
                  <Text fontSize="sm" color="green.600">✓ بريد مفعّل</Text>
                ) : (
                  <Text fontSize="sm" color="orange.600">⚠ بريد غير مفعّل</Text>
                )}
              </HStack>
              <Text fontSize="xs" color="muted">
                مدرس منذ: {profile.createdAt}
              </Text>
            </VStack>
          </PremiumCard>

          {/* Stats */}
          <PremiumCard variant="elevated">
            <Box p={6}>
              <Heading size="sm" mb={4}>إحصائياتك</Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box textAlign="center" p={3} bg="backgroundAlt" borderRadius="md">
                  <Text fontSize="2xl" fontWeight="700" color="accent">
                    {profile.stats.totalCourses}
                  </Text>
                  <Text fontSize="xs" color="muted">دورة</Text>
                </Box>
                <Box textAlign="center" p={3} bg="backgroundAlt" borderRadius="md">
                  <Text fontSize="2xl" fontWeight="700" color="blue.600">
                    {profile.stats.totalStudents}
                  </Text>
                  <Text fontSize="xs" color="muted">طالب</Text>
                </Box>
                <Box textAlign="center" p={3} bg="backgroundAlt" borderRadius="md">
                  <Text fontSize="2xl" fontWeight="700" color="green.600">
                    {profile.stats.totalEarnings}
                  </Text>
                  <Text fontSize="xs" color="muted">ر.س</Text>
                </Box>
                <Box textAlign="center" p={3} bg="backgroundAlt" borderRadius="md">
                  <Text fontSize="2xl" fontWeight="700" color="yellow.600">
                    {profile.stats.averageRating.toFixed(1)}
                  </Text>
                  <Text fontSize="xs" color="muted">تقييم</Text>
                </Box>
              </Grid>
            </Box>
          </PremiumCard>
        </VStack>

        {/* Edit Form */}
        <PremiumCard variant="elevated">
          <Box p={6}>
            <Heading size="md" mb={6}>تعديل المعلومات</Heading>
            
            <Fieldset.Root>
              <Stack gap={4}>
                <Fieldset.Legend>المعلومات الأساسية</Fieldset.Legend>
                
                <Box>
                  <Text fontWeight="600" mb={2} fontSize="sm">الاسم الكامل</Text>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    bg="surface"
                  />
                </Box>

                <Box>
                  <Text fontWeight="600" mb={2} fontSize="sm">البريد الإلكتروني</Text>
                  <Input
                    value={profile.email}
                    disabled
                    bg="backgroundAlt"
                    color="muted"
                  />
                </Box>

                <Box>
                  <Text fontWeight="600" mb={2} fontSize="sm">رقم الهاتف</Text>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 5xx xxx xxx"
                    bg="surface"
                    dir="ltr"
                  />
                </Box>

                <Box>
                  <Text fontWeight="600" mb={2} fontSize="sm">التخصص</Text>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="مثال: علوم القرآن والتجويد"
                    bg="surface"
                  />
                </Box>

                <Box>
                  <Text fontWeight="600" mb={2} fontSize="sm">سنوات الخبرة</Text>
                  <Input
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="مثال: 5 سنوات"
                    bg="surface"
                  />
                </Box>

                <Box>
                  <Text fontWeight="600" mb={2} fontSize="sm">نبذة عنك</Text>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="اكتب نبذة تعريفية عن نفسك وخبراتك..."
                    bg="surface"
                    minH="120px"
                  />
                </Box>

                <Button
                  colorPalette="blue"
                  onClick={handleSave}
                  loading={saving}
                  loadingText="جاري الحفظ..."
                  mt={4}
                >
                  💾 حفظ التغييرات
                </Button>
              </Stack>
            </Fieldset.Root>
          </Box>
        </PremiumCard>
      </Grid>

      {/* Security Section */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>الأمان</Heading>
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <Box>
              <Text fontWeight="600">تغيير كلمة المرور</Text>
              <Text color="muted" fontSize="sm">
                قم بتحديث كلمة المرور بشكل دوري للحفاظ على أمان حسابك
              </Text>
            </Box>
            <Button variant="outline" colorPalette="blue">
              تغيير كلمة المرور
            </Button>
          </HStack>
        </Box>
      </PremiumCard>

      {/* Payout Settings */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>إعدادات الدفع</Heading>
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <Box>
              <Text fontWeight="600">الحساب البنكي</Text>
              <Text color="muted" fontSize="sm">
                أضف حسابك البنكي لاستلام أرباحك
              </Text>
            </Box>
            <Button variant="outline" colorPalette="green">
              إضافة حساب بنكي
            </Button>
          </HStack>
        </Box>
      </PremiumCard>
    </VStack>
  );
}
