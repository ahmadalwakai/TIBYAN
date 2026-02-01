"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  Avatar,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import PremiumCard from "@/components/ui/PremiumCard";
import { toaster } from "@/components/ui/toaster";
import { getCurrentUserClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface MemberProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
}

export default function MemberProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);
  const [formData, setFormData] = useState({ name: "", bio: "", avatar: "" });

  useEffect(() => {
    const loadProfile = async () => {
      const cached = getCurrentUserClient();
      if (!cached) {
        router.push("/auth/login?redirect=/member/profile");
        return;
      }

      try {
        const res = await fetch("/api/member/profile", { credentials: "include" });
        const json = await res.json();
        if (json.ok) {
          setProfile(json.data);
          setFormData({
            name: json.data.name,
            bio: json.data.bio || "",
            avatar: json.data.avatar || "",
          });
        }
      } catch {
        setProfile(cached as MemberProfile);
        setFormData({ name: cached.name, bio: "", avatar: "" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/member/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          avatar: formData.avatar,
        }),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.success({ title: "تم حفظ التغييرات" });
        setProfile((prev) => (prev ? { ...prev, ...formData } : prev));
      } else {
        toaster.error({ title: json.error || "حدث خطأ" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    setRequestingReset(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.success({
          title: "تم إرسال رابط إعادة تعيين كلمة المرور",
          description: "يرجى التحقق من بريدك الإلكتروني",
        });
      } else {
        toaster.error({ title: json.error || "حدث خطأ" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setRequestingReset(false);
    }
  };

  if (loading) {
    return (
      <Box minH="50vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="muted">جاري التحميل...</Text>
      </Box>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        <Heading size="lg">الملف الشخصي والإعدادات</Heading>

        <PremiumCard variant="bordered" p={{ base: 5, md: 6 }}>
          <Stack direction={{ base: "column", md: "row" }} gap={4} align="center">
            <Avatar.Root size="2xl">
              <Avatar.Image src={profile.avatar || undefined} alt={profile.name} />
              <Avatar.Fallback bg="avatarBg" color="avatarText">
                {profile.name.charAt(0)}
              </Avatar.Fallback>
            </Avatar.Root>
            <Stack gap={1} textAlign={{ base: "center", md: "start" }}>
              <Text fontWeight="700">{profile.name}</Text>
              <Text color="muted" fontSize="sm">
                {profile.email}
              </Text>
            </Stack>
          </Stack>
        </PremiumCard>

        <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
          <Stack gap={4}>
            <Field label="الاسم الكامل" required inputId="member-name">
              <Input
                id="member-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="اسمك الكامل"
                bg="background"
              />
            </Field>

            <Field label="نبذة عنك" inputId="member-bio">
              <Input
                id="member-bio"
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="نبذة قصيرة"
                bg="background"
              />
            </Field>

            <Field label="رابط الصورة الشخصية" inputId="member-avatar">
              <Input
                id="member-avatar"
                value={formData.avatar}
                onChange={(e) => setFormData((prev) => ({ ...prev, avatar: e.target.value }))}
                placeholder="https://..."
                bg="background"
              />
            </Field>

            <Stack direction={{ base: "column", md: "row" }} gap={3}>
              <Button
                onClick={handleSave}
                bg="primary"
                color="primaryText"
                disabled={saving}
                loading={saving}
              >
                حفظ التغييرات
              </Button>
              <Button
                variant="outline"
                borderColor="border"
                disabled={requestingReset}
                loading={requestingReset}
                onClick={handleResetPassword}
              >
                إرسال رابط تغيير كلمة المرور
              </Button>
            </Stack>
          </Stack>
        </PremiumCard>
      </Stack>
    </Container>
  );
}