"use client";

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
import { toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/member";
  const errorParam = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Show error from URL params
  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        "rate-limited": "عدد المحاولات كثير جداً. يرجى المحاولة لاحقاً.",
        validation: "بيانات غير صالحة",
        "invalid-credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        unverified: "يرجى تأكيد بريدك الإلكتروني أولاً",
        suspended: "تم تعليق حسابك. يرجى التواصل مع الدعم.",
        pending: "حسابك قيد المراجعة",
        server: "حدث خطأ في الخادم",
      };
      toaster.error({ title: errorMessages[errorParam] || "حدث خطأ" });
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          redirect: redirectTo,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: "تم تسجيل الدخول بنجاح!" });
        // Redirect based on role
        const userRole = json.data?.user?.role;
        let finalRedirect = redirectTo;
        
        if (redirectTo === "/member" || redirectTo === "/admin") {
          // Use role-based default
          if (userRole === "ADMIN") {
            finalRedirect = "/admin";
          } else if (userRole === "INSTRUCTOR") {
            finalRedirect = "/teacher";
          } else if (userRole === "MEMBER") {
            finalRedirect = "/member";
          } else {
            finalRedirect = "/courses";
          }
        }
        
        router.push(finalRedirect);
        router.refresh();
      } else {
        toaster.error({ title: json.error || "حدث خطأ في تسجيل الدخول" });
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

        <Field label="كلمة المرور" required>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            size="lg"
            required
          />
        </Field>

        <Box textAlign="left">
          <Link href="/auth/forgot-password">
            <Text as="span" color="brand.500" fontSize="sm" _hover={{ textDecoration: "underline" }}>
              نسيت كلمة المرور؟
            </Text>
          </Link>
        </Box>

        <Button
          type="submit"
          size="lg"
          bg="linear-gradient(135deg, #c8a24a 0%, #b8943a 100%)"
          color="white"
          fontWeight="700"
          loading={loading}
          loadingText="جاري تسجيل الدخول..."
          _hover={{
            bg: "linear-gradient(135deg, #d4b05a 0%, #c8a24a 100%)",
            transform: "translateY(-2px)",
          }}
          transition="all 0.3s ease"
        >
          تسجيل الدخول
        </Button>

        <Text textAlign="center" color="gray.600" fontSize="sm">
          ليس لديك حساب؟{" "}
          <Link href={`/auth/member-signup?redirect=${encodeURIComponent(redirectTo)}`}>
            <Text as="span" color="brand.500" fontWeight="600" _hover={{ textDecoration: "underline" }}>
              إنشاء حساب جديد
            </Text>
          </Link>
        </Text>

        <Text textAlign="center" color="gray.500" fontSize="xs">
          هل أنت مسؤول؟{" "}
          <Link href="/auth/admin-login">
            <Text as="span" color="brand.500" _hover={{ textDecoration: "underline" }}>
              دخول المسؤول
            </Text>
          </Link>
        </Text>
      </Stack>
    </Box>
  );
}

export default function LoginPage() {
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
              مرحباً بعودتك
            </Heading>
            <Text color="gray.300" fontSize="lg">
              سجّل دخولك للوصول إلى حسابك
            </Text>
          </Stack>

          {/* Form */}
          <Suspense
            fallback={
              <Box
                bg="white"
                p={10}
                borderRadius="2xl"
                w="full"
                textAlign="center"
              >
                <Text color="gray.500">جاري التحميل...</Text>
              </Box>
            }
          >
            <LoginForm />
          </Suspense>

          {/* Back link */}
          <Link href="/">
            <Text color="gray.400" fontSize="sm" _hover={{ color: "white" }}>
              ← العودة للرئيسية
            </Text>
          </Link>
        </Stack>
      </Container>
    </Box>
  );
}
