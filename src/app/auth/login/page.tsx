"use client";

import {
  Box,
  Button as ChakraButton,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  type ButtonProps,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import { getRoleRedirect } from "@/lib/auth/roleRedirect";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect, useRef, type ComponentType } from "react";

/**
 * Validate redirect URL - prevent open redirects
 */
function isSafeRedirect(url: string | null): boolean {
  if (!url || !url.startsWith("/")) return false;

  const allowedPrefixes = ["/member", "/student", "/teacher", "/admin", "/courses", "/"];
  return allowedPrefixes.some((prefix) => url === prefix || url.startsWith(prefix + "/"));
}

type LoginButtonProps = ButtonProps & { isLoading?: boolean; isDisabled?: boolean };

const ChakraButtonTyped = ChakraButton as unknown as ComponentType<LoginButtonProps>;

function LoginButton({ isLoading, isDisabled, ...props }: LoginButtonProps) {
  return <ChakraButtonTyped isLoading={isLoading} isDisabled={isDisabled} {...props} />;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const defaultRedirect = getRoleRedirect("MEMBER");
  const redirectTo = searchParams.get("redirect") || defaultRedirect;
  const errorParam = searchParams.get("error");
  const isSubmittingRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Show error from URL params (sanitized)
  useEffect(() => {
    if (!errorParam) return;

    const errorMessages: Record<string, string> = {
      "rate-limited": "عدد المحاولات كثير جداً. يرجى المحاولة لاحقاً.",
      validation: "بيانات غير صالحة",
      "invalid-credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      unverified: "يرجى تأكيد بريدك الإلكتروني أولاً",
      "wrong-portal": "هذا الحساب لا يمكنه دخول بوابة العضوية",
      suspended: "تم تعليق حسابك. يرجى التواصل مع الدعم.",
      pending: "حسابك قيد المراجعة",
      server: "حدث خطأ في الخادم",
      "session-failed": "فشل تأسيس الجلسة. يرجى المحاولة مرة أخرى.",
    };

    // Only show error if it's in whitelist (XSS protection)
    if (errorParam in errorMessages) {
      toaster.error({ title: errorMessages[errorParam] });
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission (critical for preventing brute force)
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const safeRedirect = isSafeRedirect(redirectTo) ? redirectTo : defaultRedirect;
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          redirect: safeRedirect,
        }),
      });

      // Handle network errors (status 0)
      if (res.status === 0) {
        toaster.error({ title: "خطأ في الاتصال. يرجى التأكد من الإنترنت." });
        return;
      }

      // Handle rate limiting with user feedback
      if (res.status === 429) {
        const resetTime = parseInt(res.headers.get("X-RateLimit-Reset") || "0");
        const secondsLeft = Math.ceil((resetTime - Date.now()) / 1000);
        toaster.error({
          title: "حسابك مقفل مؤقتاً",
          description: `حاول مرة أخرى خلال ${Math.max(1, secondsLeft)} ثانية`,
        });
        return;
      }

      // Check if response is JSON before trying to parse
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Server returned non-JSON (likely error page)
        console.error("[Login] Non-JSON response:", {
          status: res.status,
          contentType,
        });
        toaster.error({ title: "خطأ في الخادم. يرجى المحاولة لاحقاً." });
        return;
      }

      const json = await res.json();

      if (!json.ok) {
        const nextAction = json?.data?.nextAction as
          | { type: string; url?: string }
          | undefined;

        if (nextAction?.type === "VERIFY_EMAIL") {
          toaster.error({ title: json.error || "يرجى تأكيد بريدك الإلكتروني أولاً" });
          if (formData.email.trim()) {
            const verifyUrl = `/auth/verify-pending?email=${encodeURIComponent(
              formData.email.trim()
            )}`;
            window.location.href = verifyUrl;
            return;
          }
        }

        if (nextAction?.type === "GO_TO_MEMBER_SIGNUP" && nextAction.url) {
          toaster.error({ title: json.error || "يرجى إنشاء حساب عضوية" });
          window.location.href = nextAction.url;
          return;
        }

        if (nextAction?.type === "GO_TO_ROLE_PORTAL" && nextAction.url) {
          toaster.error({ title: json.error || "انتقل إلى بوابتك الصحيحة" });
          window.location.href = nextAction.url;
          return;
        }

        toaster.error({ title: json.error || "حدث خطأ في تسجيل الدخول" });
        return;
      }

      const redirectUrl =
        (typeof json?.data?.redirectTo === "string" && json.data.redirectTo) || safeRedirect;
      toaster.success({ title: "تم تسجيل الدخول بنجاح!" });
      window.location.href = redirectUrl;
      return;
    } catch (error) {
      console.error("[Login] Error:", error);
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      // Only reset if we didn't navigate
      if (isSubmittingRef.current) {
        isSubmittingRef.current = false;
        setLoading(false);
      }
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      dir="rtl"
      bg="surface"
      p={{ base: 6, md: 10 }}
      borderRadius="2xl"
      boxShadow="0 8px 40px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="border"
    >
      <Stack gap={5}>
        <Field label="البريد الإلكتروني" required inputId="email-input">
          <Input
            id="email-input"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="example@email.com"
            size="lg"
            autoComplete="email"
            aria-label="البريد الإلكتروني"
            aria-required="true"
            required
            disabled={loading}
          />
        </Field>

        <Field label="كلمة المرور" required inputId="password-input">
          <Input
            id="password-input"
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            size="lg"
            minLength={8}
            autoComplete="current-password"
            aria-label="كلمة المرور"
            aria-required="true"
            title="كلمة المرور يجب أن تكون 8 أحرف على الأقل"
            required
            disabled={loading}
          />
        </Field>

        <Box textAlign="right">
          <Link href="/auth/forgot-password">
            <Text as="span" color="link" fontSize="sm" _hover={{ textDecoration: "underline" }}>
              نسيت كلمة المرور؟
            </Text>
          </Link>
        </Box>

        <LoginButton
          type="submit"
          size="lg"
          bg="linear-gradient(135deg, #c8a24a 0%, #b8943a 100%)"
          color="white"
          fontWeight="700"
          isLoading={loading}
          isDisabled={loading}
          loadingText="جاري تسجيل الدخول..."
          _hover={{
            bg: "linear-gradient(135deg, #d4b05a 0%, #c8a24a 100%)",
            transform: "translateY(-2px)",
          }}
          _focus={{
            outline: "2px solid",
            outlineColor: "gold",
            outlineOffset: "2px",
          }}
          _focusVisible={{
            outline: "2px solid",
            outlineColor: "gold",
            outlineOffset: "2px",
          }}
          transition="all 0.3s ease"
          aria-busy={loading}
        >
          تسجيل الدخول
        </LoginButton>

        <Text textAlign="center" color="gray.600" fontSize="sm">
          ليس لديك حساب؟{" "}
          <Link href={`/auth/member-signup?redirect=${encodeURIComponent(isSafeRedirect(redirectTo) ? redirectTo : "/member")}`}>
            <Text as="span" color="link" fontWeight="600" _hover={{ textDecoration: "underline" }}>
              إنشاء حساب جديد
            </Text>
          </Link>
        </Text>

        <Text textAlign="center" color="gray.500" fontSize="xs">
          هل أنت مسؤول؟{" "}
          <Link href="/auth/admin-login">
            <Text as="span" color="link" _hover={{ textDecoration: "underline" }}>
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
