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
}

export default function MemberProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);
  const [formData, setFormData] = useState({ name: "", bio: "" });

  useEffect(() => {
    const loadProfile = async () => {
      const cached = getCurrentUserClient();
      if (!cached) {
        router.push("/auth/login?redirect=/member/profile");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const json = await res.json();
        if (json.ok) {
          setProfile(json.data);
          setFormData({ name: json.data.name, bio: json.data.bio || "" });
        }
      } catch {
        setProfile(cached as MemberProfile);
        setFormData({ name: cached.name, bio: "" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, bio: formData.bio }),
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