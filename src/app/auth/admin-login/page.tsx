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

type Step = "email" | "code";

export default function AdminLoginPage() {

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
      bg="#000000"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={8}
      dir="rtl"
      position="relative"
      overflow="hidden"
    >
      {/* Neon glow orbs */}
      <Box
        position="absolute"
        top="10%"
        right="10%"
        width="300px"
        height="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="20%"
        left="15%"
        width="250px"
        height="250px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        filter="blur(50px)"
        pointerEvents="none"
      />
      <Container maxW="sm" position="relative" zIndex={1}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <Heading size="2xl" color="#00FF2A" textShadow="0 0 30px rgba(0, 255, 42, 0.5)">
              تبيان
            </Heading>
            <Text fontSize="md" color="gray.400">
              دخول المسؤول
            </Text>
          </VStack>

          {/* Login Card */}
          <Box
            bg="#050505"
            borderRadius="xl"
            shadow="xl"
            p={8}
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 30px rgba(0, 255, 42, 0.15), 0 0 60px rgba(0, 255, 42, 0.05)"
          >
            {step === "email" ? (
              <VStack gap={6} as="form" onSubmit={(e) => {
                e.preventDefault();
                handleRequestCode();
              }}>
                <div>
                  <Heading size="md" mb={4} color="white">
                    تسجيل الدخول
                  </Heading>
                  <Text fontSize="sm" color="gray.400">
                    أدخل بريدك الإلكتروني لتلقي رمز التحقق
                  </Text>
                </div>

                {error && (
                  <Box
                    bg="rgba(220, 38, 38, 0.1)"
                    border="1px solid"
                    borderColor="rgba(220, 38, 38, 0.3)"
                    p={3}
                    borderRadius="md"
                    w="full"
                  >
                    <Text color="red.400" fontSize="sm">
                      {error}
                    </Text>
                  </Box>
                )}

                <Stack w="full">
                  <label style={{ fontWeight: 600, fontSize: "14px", color: "white" }}>
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
                    bg="#0A0A0A"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.3)"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "#00FF2A", boxShadow: "0 0 10px rgba(0, 255, 42, 0.3)" }}
                    _hover={{ borderColor: "rgba(0, 255, 42, 0.5)" }}
                  />
                </Stack>

                <Button
                  type="submit"
                  w="full"
                  bg="#00FF2A"
                  color="#000000"
                  disabled={loading}
                  size="lg"
                  fontWeight="700"
                  _hover={{ bg: "#4DFF6A", boxShadow: "0 0 20px rgba(0, 255, 42, 0.5)" }}
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
                  <Heading size="md" mb={2} color="white">
                    أدخل الرمز
                  </Heading>
                  <Text fontSize="sm" color="gray.400">
                    تم إرسال رمز التحقق إلى{" "}
                    <Text as="strong" color="#00FF2A">{email}</Text>
                  </Text>
                </div>

                {error && (
                  <Box
                    bg="rgba(220, 38, 38, 0.1)"
                    border="1px solid"
                    borderColor="rgba(220, 38, 38, 0.3)"
                    p={3}
                    borderRadius="md"
                    w="full"
                  >
                    <Text color="red.400" fontSize="sm">
                      {error}
                    </Text>
                  </Box>
                )}

                {successMessage && (
                  <Box
                    bg="rgba(0, 255, 42, 0.1)"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.3)"
                    p={3}
                    borderRadius="md"
                    w="full"
                  >
                    <Text color="#00FF2A" fontSize="sm">
                      {successMessage}
                    </Text>
                  </Box>
                )}

                <Stack w="full">
                  <label style={{ fontWeight: 600, fontSize: "14px", textAlign: "center", color: "white" }}>
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
                    bg="#0A0A0A"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.3)"
                    color="#00FF2A"
                    _placeholder={{ color: "gray.600" }}
                    _focus={{ borderColor: "#00FF2A", boxShadow: "0 0 15px rgba(0, 255, 42, 0.4)" }}
                    _hover={{ borderColor: "rgba(0, 255, 42, 0.5)" }}
                  />
                </Stack>

                <Button
                  type="submit"
                  w="full"
                  bg="#00FF2A"
                  color="#000000"
                  disabled={loading}
                  size="lg"
                  fontWeight="700"
                  _hover={{ bg: "#4DFF6A", boxShadow: "0 0 20px rgba(0, 255, 42, 0.5)" }}
                >
                  {loading ? <Spinner size="sm" /> : "تحقق من الرمز"}
                </Button>

                <HStack w="full" justify="space-between" fontSize="sm" py={2} borderTop="1px solid" borderColor="rgba(0, 255, 42, 0.2)" gap={4}>
                  <Button
                    variant="ghost"
                    size="sm"
                    color="gray.400"
                    _hover={{ color: "#00FF2A", bg: "rgba(0, 255, 42, 0.1)" }}
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
                    <Text color="#00FF2A">
                      ينتهي خلال: {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}
                    </Text>
                  )}
                </HStack>
              </VStack>
            )}
          </Box>

          {/* Footer */}
          <Text fontSize="xs" color="gray.500" textAlign="center">
            © {new Date().getFullYear()} منصة تبيان. جميع الحقوق محفوظة.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
