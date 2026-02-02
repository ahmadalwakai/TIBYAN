"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import Link from "next/link";

function VerifyPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [resendEmail, setResendEmail] = useState(email);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (email) {
      setResendEmail(email);
    }
  }, [email]);

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resendEmail.trim()) {
      toaster.error({ title: "أدخل بريدك الإلكتروني" });
      return;
    }

    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });

      // Check if response is JSON before trying to parse
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Server returned non-JSON (likely error page)
        console.error("[VerifyPending] Non-JSON response:", {
          status: res.status,
          contentType,
        });
        toaster.error({ title: "خطأ في الخادم. يرجى المحاولة لاحقاً." });
        return;
      }

      const json = await res.json();

      if (json.ok) {
        toaster.success({
          title: "تم الإرسال",
          description: "تحقق من صندوق بريدك الجديد",
        });
        setResendSent(true);
      } else {
        toaster.error({ title: json.error || "فشل الإرسال" });
      }
    } catch (error) {
      console.error("[VerifyPending]", error);
      toaster.error({
        title: "خطأ في الاتصال",
        description: "يرجى المحاولة لاحقاً",
      });
    } finally {
      setResendLoading(false);
    }
  };

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
            <Box fontSize="4xl">✉️</Box>
            <Heading
              as="h1"
              size={{ base: "xl", md: "2xl" }}
              color="white"
              fontWeight="800"
            >
              تحقق من بريدك الإلكتروني
            </Heading>
            <Text color="gray.300" fontSize="md">
              لقد أرسلنا لك رابط تحقق على بريدك الإلكتروني
            </Text>
          </Stack>

          {/* Info Card */}
          <Box
            bg="surface"
            p={{ base: 6, md: 8 }}
            borderRadius="2xl"
            border="1px solid"
            borderColor="border"
            w="100%"
            boxShadow="0 8px 40px rgba(0, 0, 0, 0.1)"
          >
            <Stack gap={6}>
              {/* Email Display */}
              <Box
                bg="brand.50"
                p={4}
                borderRadius="lg"
                borderLeft="4px solid"
                borderLeftColor="brand.500"
              >
                <Text fontSize="sm" color="gray.600" mb={1}>
                  تم الإرسال إلى:
                </Text>
                <Text fontWeight="600" color="brand.900">
                  {email || "بريدك الإلكتروني"}
                </Text>
              </Box>

              {/* Instructions */}
              <Stack gap={3} fontSize="sm" color="gray.600">
                <Text>👉 اتبع هذه الخطوات:</Text>
                <Box as="ol" pl={6} gap={2} display="flex" flexDir="column">
                  <Text as="li">افتح بريدك الإلكتروني</Text>
                  <Text as="li">ابحث عن رسالة من تبيان</Text>
                  <Text as="li">انقر على رابط التحقق</Text>
                  <Text as="li">عد للدخول إلى حسابك</Text>
                </Box>
              </Stack>

              {/* Resend Section */}
              <Box borderTop="1px solid" borderTopColor="border" pt={4}>
                <Stack gap={3}>
                  <Text fontSize="sm" color="gray.600" fontWeight="600">
                    لم تستقبل البريد؟
                  </Text>

                  {!resendSent ? (
                    <Box
                      as="form"
                      onSubmit={handleResendEmail}
                      display="flex"
                      gap={2}
                      flexDir={{ base: "column", sm: "row" }}
                    >
                      <Input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="أدخل بريدك الإلكتروني"
                        size="sm"
                        disabled={resendLoading}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        bg="brand.500"
                        color="white"
                        _hover={{ bg: "brand.600" }}
                        disabled={resendLoading}
                        loading={resendLoading}
                        loadingText="جاري الإرسال..."
                        whiteSpace="nowrap"
                      >
                        إعادة إرسال
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      bg="green.50"
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="green.200"
                      textAlign="center"
                    >
                      <Text color="green.700" fontSize="sm" fontWeight="500">
                        ✓ تم إرسال البريد بنجاح!
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Help Text */}
              <Text fontSize="xs" color="gray.500" textAlign="center">
                البريد قد يأخذ بضع دقائق. تحقق من مجلد البريد المزعج أيضاً.
              </Text>
            </Stack>
          </Box>

          {/* Links */}
          <Stack gap={3} w="100%" textAlign="center">
            <Link href="/auth/login">
              <ChakraLink
                display="block"
                color="gray.300"
                fontSize="sm"
                _hover={{ color: "white", textDecoration: "underline" }}
              >
                العودة لتسجيل الدخول
              </ChakraLink>
            </Link>
            <Text fontSize="xs" color="gray.500">
              هل تحتاج لمساعدة؟{" "}
              <ChakraLink as={Link} href="/help" color="link" _hover={{ textDecoration: "underline" }}>
                اتصل بنا
              </ChakraLink>
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default function VerifyPendingPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">جاري التحميل...</Text>
      </Box>
    }>
      <VerifyPendingContent />
    </Suspense>
  );
}
