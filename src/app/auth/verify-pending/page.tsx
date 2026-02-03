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
      bg="#000000"
      py={{ base: 10, md: 16 }}
      display="flex"
      alignItems="center"
      position="relative"
      overflow="hidden"
    >
      {/* Neon glow orbs */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        w="500px"
        h="500px"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-30%"
        left="-15%"
        w="600px"
        h="600px"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="md" position="relative" zIndex={1}>
        <Stack gap={8} align="center">
          {/* Header */}
          <Stack gap={3} textAlign="center">
            <Box
              fontSize="4xl"
              w="80px"
              h="80px"
              mx="auto"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              bg="#050505"
              border="2px solid"
              borderColor="rgba(0, 255, 42, 0.5)"
              boxShadow="0 0 30px rgba(0, 255, 42, 0.3)"
            >
              ✉️
            </Box>
            <Heading
              as="h1"
              size={{ base: "xl", md: "2xl" }}
              color="white"
              fontWeight="800"
            >
              تحقق من بريدك الإلكتروني
            </Heading>
            <Text color="gray.400" fontSize="md">
              لقد أرسلنا لك رابط تحقق على بريدك الإلكتروني
            </Text>
          </Stack>

          {/* Info Card */}
          <Box
            bg="#050505"
            p={{ base: 6, md: 8 }}
            borderRadius="2xl"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            w="100%"
            boxShadow="0 0 40px rgba(0, 255, 42, 0.15)"
          >
            <Stack gap={6}>
              {/* Email Display */}
              <Box
                bg="#0A0A0A"
                p={4}
                borderRadius="lg"
                borderRight="4px solid"
                borderRightColor="#00FF2A"
              >
                <Text fontSize="sm" color="gray.500" mb={1}>
                  تم الإرسال إلى:
                </Text>
                <Text fontWeight="600" color="#00FF2A">
                  {email || "بريدك الإلكتروني"}
                </Text>
              </Box>

              {/* Instructions */}
              <Stack gap={3} fontSize="sm" color="gray.400">
                <Text color="#00FF2A">👉 اتبع هذه الخطوات:</Text>
                <Box as="ol" pl={6} gap={2} display="flex" flexDir="column">
                  <Text as="li">افتح بريدك الإلكتروني</Text>
                  <Text as="li">ابحث عن رسالة من تبيان</Text>
                  <Text as="li">انقر على رابط التحقق</Text>
                  <Text as="li">عد للدخول إلى حسابك</Text>
                </Box>
              </Stack>

              {/* Resend Section */}
              <Box borderTop="1px solid" borderTopColor="rgba(0, 255, 42, 0.2)" pt={4}>
                <Stack gap={3}>
                  <Text fontSize="sm" color="gray.400" fontWeight="600">
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
                        bg="#0A0A0A"
                        border="1px solid"
                        borderColor="rgba(0, 255, 42, 0.3)"
                        color="white"
                        _placeholder={{ color: "gray.500" }}
                        _focus={{ borderColor: "#00FF2A", boxShadow: "0 0 0 1px #00FF2A" }}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        bg="#00FF2A"
                        color="black"
                        fontWeight="700"
                        _hover={{ bg: "#4DFF6A", boxShadow: "0 0 20px rgba(0, 255, 42, 0.5)" }}
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
                      bg="rgba(0, 255, 42, 0.1)"
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.3)"
                      textAlign="center"
                    >
                      <Text color="#00FF2A" fontSize="sm" fontWeight="500">
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
            <ChakraLink
              as={Link}
              href="/auth/login"
              display="block"
              color="gray.400"
              fontSize="sm"
              _hover={{ color: "#00FF2A", textDecoration: "underline" }}
            >
              العودة لتسجيل الدخول
            </ChakraLink>
            <Text fontSize="xs" color="gray.500">
              هل تحتاج لمساعدة؟{" "}
              <ChakraLink as={Link} href="/help" color="#00FF2A" _hover={{ textDecoration: "underline" }}>
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
