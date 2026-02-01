"use client";

import { useState } from "react";
import { Box, Button, Container, Heading, Input, Stack, Text, Spinner } from "@chakra-ui/react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error ?? "حدث خطأ");
        return;
      }

      setSuccess(data.data.message);
      setEmail("");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box as="main" bg="background" minH="100vh" position="relative" overflow="hidden">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        w="400px"
        h="400px"
        bg="linear-gradient(135deg, rgba(126,34,206,0.1), rgba(109,40,217,0.05))"
        borderRadius="50%"
        filter="blur(80px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-10%"
        left="-5%"
        w="350px"
        h="350px"
        bg="linear-gradient(135deg, rgba(159,122,234,0.1), rgba(126,34,206,0.05))"
        borderRadius="50%"
        filter="blur(80px)"
        pointerEvents="none"
      />
      
      <Container maxW="lg" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative">
        <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
          <form onSubmit={handleSubmit}>
            <Stack gap={6}>
              <Heading
                size="lg"
                color="text"
              >
                استعادة كلمة المرور
              </Heading>
              <Text color="muted">
                أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.
              </Text>
              
              {error && (
                <Box
                  bg="red.50"
                  border="1px solid"
                  borderColor="red.200"
                  borderRadius="md"
                  p={3}
                >
                  <Text color="red.600" fontSize="sm">
                    {error}
                  </Text>
                </Box>
              )}
              
              {success && (
                <Box
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.200"
                  borderRadius="md"
                  p={3}
                >
                  <Text color="green.600" fontSize="sm">
                    {success}
                  </Text>
                </Box>
              )}
              
              <Box as="label">
                <Text mb={2} fontWeight="600">
                  البريد الإلكتروني
                </Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="name@example.com"
                  bg="background"
                  border="2px solid"
                  borderColor="border"
                  borderRadius="button"
                  px={4}
                  py={3}
                  w="100%"
                  transition="all 0.2s"
                  _hover={{ borderColor: "borderAccent" }}
                  _focus={{
                    outline: "none",
                    borderColor: "accent",
                    boxShadow: "0 0 0 1px var(--color-accent)"
                  }}
                  required
                  disabled={isLoading}
                />
              </Box>
              <Button
                type="submit"
                bg="primary"
                color="primaryText"
                _hover={{
                  bg: "primaryHover",
                  transform: "translateY(-1px)",
                  boxShadow: "lg"
                }}
                transition="all 0.2s"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" color="spinner" /> : "إرسال رابط الاستعادة"}
              </Button>
              <Text color="muted" fontSize="sm">
                تذكرت كلمة المرور؟{" "}
                <Link href="/auth/login" style={{ textDecoration: "none" }}>
                  <Box
                    as="span"
                    color="link"
                    fontWeight="600"
                    _hover={{ textDecoration: "underline" }}
                  >
                    عودة لتسجيل الدخول
                  </Box>
                </Link>
              </Text>
            </Stack>
          </form>
        </PremiumCard>
      </Container>
    </Box>
  );
}
