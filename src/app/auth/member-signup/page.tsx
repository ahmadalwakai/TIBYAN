"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function MemberSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/member";
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toaster.error({ title: "كلمتا المرور غير متطابقتين" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          bio: formData.bio || undefined,
        }),
      });
      
      const json = await res.json();
      
      if (json.ok) {
        toaster.success({ 
          title: "تم إنشاء حسابك بنجاح!",
          description: "يمكنك الآن تسجيل الدخول",
        });
        router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        toaster.error({ title: json.error || "حدث خطأ في التسجيل" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="white"
      p={{ base: 6, md: 10 }}
      borderRadius="2xl"
      boxShadow="0 8px 40px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="gray.100"
    >
      <Stack gap={5}>
        <Field label="الاسم الكامل" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسمك الكامل"
            size="lg"
            required
          />
        </Field>

        <Field label="البريد الإلكتروني" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="example@email.com"
            size="lg"
            required
          />
        </Field>

        <Field label="كلمة المرور" required helperText="8 أحرف على الأقل">
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            size="lg"
            minLength={8}
            required
          />
        </Field>

        <Field label="تأكيد كلمة المرور" required>
          <Input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            size="lg"
            required
          />
        </Field>

        <Field label="نبذة عنك (اختياري)" helperText="أخبرنا عن نفسك واهتماماتك">
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="أنا مهتم بتعلم..."
            rows={3}
            maxLength={500}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          bg="linear-gradient(135deg, #c8a24a 0%, #b8943a 100%)"
          color="white"
          fontWeight="700"
          loading={loading}
          loadingText="جاري التسجيل..."
          _hover={{
            bg: "linear-gradient(135deg, #d4b05a 0%, #c8a24a 100%)",
            transform: "translateY(-2px)",
          }}
          transition="all 0.3s ease"
        >
          إنشاء حساب العضوية
        </Button>

        <Text textAlign="center" color="gray.600" fontSize="sm">
          لديك حساب بالفعل؟{" "}
          <Link href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}>
            <Text as="span" color="brand.500" fontWeight="600" _hover={{ textDecoration: "underline" }}>
              تسجيل الدخول
            </Text>
          </Link>
        </Text>

        <Text textAlign="center" color="gray.500" fontSize="xs">
          تريد التسجيل كطالب؟{" "}
          <Link href="/auth/register">
            <Text as="span" color="brand.500" _hover={{ textDecoration: "underline" }}>
              التسجيل كطالب
            </Text>
          </Link>
        </Text>
      </Stack>
    </Box>
  );
}

export default function MemberSignupPage() {
  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #0B1F3A 0%, #1a365d 50%, #0B1F3A 100%)"
      py={{ base: 10, md: 16 }}
      display="flex"
      alignItems="center"
    >
      <Container maxW="md">
        <Stack gap={8} align="center">
          {/* Header */}
          <Stack gap={3} textAlign="center">
            <Heading
              as="h1"
              size={{ base: "xl", md: "2xl" }}
              color="white"
              fontWeight="800"
            >
              انضم إلى مجتمع تبيان
            </Heading>
            <Text color="gray.300" fontSize="lg">
              أنشئ حساب عضوية للمشاركة في المنشورات والتفاعل مع المجتمع
            </Text>
          </Stack>

          {/* Benefits */}
          <Stack
            direction={{ base: "column", sm: "row" }}
            gap={4}
            w="100%"
            justify="center"
          >
            {[
              { icon: "✍️", text: "نشر المحتوى" },
              { icon: "💬", text: "التعليق والتفاعل" },
              { icon: "🔔", text: "متابعة الجديد" },
            ].map((item, i) => (
              <Box
                key={i}
                bg="whiteAlpha.100"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Text>{item.icon}</Text>
                <Text color="white" fontSize="sm" fontWeight="500">
                  {item.text}
                </Text>
              </Box>
            ))}
          </Stack>

          {/* Form */}
          <Suspense fallback={<Box>جاري التحميل...</Box>}>
            <MemberSignupForm />
          </Suspense>
        </Stack>
      </Container>
    </Box>
  );
}
