"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "code";

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  /**
   * Step 1: Request verification code
   */
  const handleRequestCode = async () => {
    setError("");
    setSuccessMessage("");
    if (!email) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || "حدث خطأ");
        setLoading(false);
        return;
      }

      setSuccessMessage(data.data.message);
      setStep("code");
      setExpiresIn(data.data.expiresIn);

      // Start countdown timer
      const interval = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            clearInterval(interval);
            setStep("email");
            return null;
          }
        });
      }, 1000);
    } catch (err) {
      setError("خطأ في الاتصال بالخادم");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify code and login
   */
  const handleVerifyCode = async () => {
    setError("");
    if (!code || code.length !== 6) {
      setError("الرمز يجب أن يكون 6 أرقام");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || "الرمز غير صحيح");
        setLoading(false);
        return;
      }

      setSuccessMessage("تم تسجيل الدخول بنجاح");

      // Hard redirect to ensure cookies are properly loaded
      setTimeout(() => {
        window.location.href = "/admin";
      }, 500);
    } catch (err) {
      setError("خطأ في الاتصال بالخادم");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={8}
      dir="rtl"
    >
      <Container maxW="sm">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center" color="white">
            <Heading size="2xl">تبيان</Heading>
            <Text fontSize="md" opacity={0.9}>
              دخول المسؤول
            </Text>
          </VStack>

          {/* Login Card */}
          <Box
            bg="white"
            borderRadius="lg"
            shadow="xl"
            p={8}
            color="black"
          >
            {step === "email" ? (
              <VStack gap={6} as="form" onSubmit={(e) => {
                e.preventDefault();
                handleRequestCode();
              }}>
                <div>
                  <Heading size="md" mb={4}>
                    تسجيل الدخول
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    أدخل بريدك الإلكتروني لتلقي رمز التحقق
                  </Text>
                </div>

                {error && (
                  <Box
                    bg="red.50"
                    border="1px solid"
                    borderColor="red.200"
                    p={3}
                    borderRadius="md"
                    w="full"
                  >
                    <Text color="red.700" fontSize="sm">
                      {error}
                    </Text>
                  </Box>
                )}

                <Stack w="full">
                  <label style={{ fontWeight: 600, fontSize: "14px" }}>
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    dir="rtl"
                  />
                </Stack>

                <Button
                  type="submit"
                  w="full"
                  bg="linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%)"
                  color="white"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? <Spinner size="sm" /> : "إرسال الرمز"}
                </Button>
              </VStack>
            ) : (
              <VStack gap={6} as="form" onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCode();
              }}>
                <div>
                  <Heading size="md" mb={2}>
                    أدخل الرمز
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    تم إرسال رمز التحقق إلى{" "}
                    <strong>{email}</strong>
                  </Text>
                </div>

                {error && (
                  <Box
                    bg="red.50"
                    border="1px solid"
                    borderColor="red.200"
                    p={3}
                    borderRadius="md"
                    w="full"
                  >
                    <Text color="red.700" fontSize="sm">
                      {error}
                    </Text>
                  </Box>
                )}

                {successMessage && (
                  <Box
                    bg="green.50"
                    border="1px solid"
                    borderColor="green.200"
                    p={3}
                    borderRadius="md"
                    w="full"
                  >
                    <Text color="green.700" fontSize="sm">
                      {successMessage}
                    </Text>
                  </Box>
                )}

                <Stack w="full">
                  <label style={{ fontWeight: 600, fontSize: "14px", textAlign: "center" }}>
                    رمز التحقق (6 أرقام)
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                      setCode(value);
                    }}
                    disabled={loading}
                    textAlign="center"
                    fontSize="2xl"
                    letterSpacing="3px"
                    maxLength={6}
                  />
                </Stack>

                <Button
                  type="submit"
                  w="full"
                  bg="linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%)"
                  color="white"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? <Spinner size="sm" /> : "تحقق من الرمز"}
                </Button>

                <HStack w="full" justify="space-between" fontSize="sm" py={2} borderTop="1px solid" borderColor="gray.200" gap={4}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError("");
                      setSuccessMessage("");
                    }}
                    disabled={loading}
                  >
                    تغيير البريد
                  </Button>
                  {expiresIn && (
                    <Text color="gray.500">
                      ينتهي خلال: {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}
                    </Text>
                  )}
                </HStack>
              </VStack>
            )}
          </Box>

          {/* Footer */}
          <Text fontSize="xs" color="white" textAlign="center" opacity={0.8}>
            © {new Date().getFullYear()} منصة تبيان. جميع الحقوق محفوظة.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
