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
import { useState, Suspense, useRef } from "react";

/**
 * Validate redirect URL to prevent open redirects
 */
function isSafeRedirect(url: string | null, defaultPath: string = "/member"): string {
  if (!url) return defaultPath;

  try {
    // Only allow relative URLs starting with /
    if (!url.startsWith("/")) return defaultPath;

    // Whitelist of allowed redirect paths
    const allowedPrefixes = ["/member", "/courses", "/"];
    const isAllowed = allowedPrefixes.some((prefix) => url === prefix || url.startsWith(prefix + "/"));

    return isAllowed ? url : defaultPath;
  } catch {
    return defaultPath;
  }
}

function MemberSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = isSafeRedirect(searchParams.get("redirect"));
  
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-submit attacks
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        toaster.error({ title: "كلمتا المرور غير متطابقتين" });
        return;
      }

      // Validate password strength on client
      if (formData.password.length < 8) {
        toaster.error({ title: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
        return;
      }

      // Validate name
      if (formData.name.trim().length < 2) {
        toaster.error({ title: "الاسم يجب أن يكون حرفين على الأقل" });
        return;
      }

      // Validate email format on client
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toaster.error({ title: "البريد الإلكتروني غير صحيح" });
        return;
      }

      const res = await fetch("/api/auth/register-member", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        redirect: "manual",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          bio: formData.bio.trim() || undefined,
        }),
      });

      // Handle network errors (status 0)
      if (res.status === 0) {
        toaster.error({ title: "خطأ في الاتصال. يرجى التأكد من الإنترنت." });
        return;
      }

      // Handle redirect responses (3xx status codes)
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        const redirectUrl = location || "/auth/verify-pending";
        
        toaster.success({
          title: "تم إنشاء حسابك بنجاح!",
          description: "يرجى تأكيد بريدك الإلكتروني للمتابعة",
        });
        window.location.href = redirectUrl;
        return;
      }

      // If we somehow got 2xx on a POST, that's unexpected
      if (res.status >= 200 && res.status < 300) {
        console.warn("[MemberSignup] Unexpected 2xx response on POST");
        toaster.error({ title: "استجابة غير متوقعة من الخادم" });
        return;
      }

      // Check if response is JSON before trying to parse
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Server returned non-JSON (likely error page)
        console.error("[MemberSignup] Non-JSON response:", {
          status: res.status,
          contentType,
        });
        toaster.error({ title: "خطأ في الخادم. يرجى المحاولة لاحقاً." });
        return;
      }
      
      const json = await res.json();
      
      if (json.ok) {
        toaster.success({ 
          title: "تم إنشاء حسابك بنجاح!",
          description: "يرجى تأكيد بريدك الإلكتروني للمتابعة",
        });

        // Wait for Set-Cookie headers to be processed
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Redirect members to email verification page
        // They must verify email before accessing member features
        router.push(`/auth/verify-pending?email=${encodeURIComponent(formData.email.toLowerCase())}`);
        return;
      } else if (res.status === 429) {
        toaster.error({ 
          title: "عدد المحاولات كثير جداً",
          description: "يرجى المحاولة لاحقاً" 
        });
      } else if (json.error === "البريد الإلكتروني مسجل مسبقاً") {
        toaster.error({ 
          title: "البريد الإلكتروني مسجل بالفعل",
          description: "جرب بريد آخر أو سجل دخول" 
        });
      } else if (res.status === 500) {
        toaster.error({ 
          title: "خطأ في الخادم",
          description: "يرجى المحاولة لاحقاً" 
        });
      } else {
        toaster.error({ title: json.error || "حدث خطأ في التسجيل" });
      }
    } catch (error) {
      console.error("[MemberSignup]", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toaster.error({ 
          title: "خطأ في الاتصال",
          description: "تأكد من اتصالك بالإنترنت" 
        });
      } else {
        toaster.error({ title: "حدث خطأ غير متوقع" });
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="surface"
      p={{ base: 6, md: 10 }}
      borderRadius="2xl"
      boxShadow="0 8px 40px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="border"
    >
      <Stack gap={5}>
        <Field label="الاسم الكامل" required inputId="name-input">
          <Input
            id="name-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسمك الكامل"
            size="lg"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            disabled={loading}
            required
          />
        </Field>

        <Field label="البريد الإلكتروني" required inputId="email-input">
          <Input
            id="email-input"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="example@email.com"
            size="lg"
            autoComplete="email"
            disabled={loading}
            required
          />
        </Field>

        <Field label="كلمة المرور" required inputId="password-input" helperText="8 أحرف على الأقل">
          <Input
            id="password-input"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            size="lg"
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            required
          />
        </Field>

        <Field label="تأكيد كلمة المرور" required inputId="confirm-password-input">
          <Input
            id="confirm-password-input"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            size="lg"
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            required
          />
        </Field>

        <Field label="نبذة عنك (اختياري)" inputId="bio-input" helperText="أخبرنا عن نفسك واهتماماتك">
          <Textarea
            id="bio-input"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="أنا مهتم بتعلم..."
            rows={3}
            maxLength={500}
            disabled={loading}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          bg="linear-gradient(135deg, #c8a24a 0%, #b8943a 100%)"
          color="white"
          fontWeight="700"
          disabled={loading || isSubmittingRef.current}
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
            <Text as="span" color="link" fontWeight="600" _hover={{ textDecoration: "underline" }}>
              تسجيل الدخول
            </Text>
          </Link>
        </Text>

        <Text textAlign="center" color="gray.500" fontSize="xs">
          تريد التسجيل كطالب؟{" "}
          <Link href="/auth/register">
            <Text as="span" color="link" _hover={{ textDecoration: "underline" }}>
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
