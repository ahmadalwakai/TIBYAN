"use client";

import { useState } from "react";
import { Box, Button, Container, Heading, Input, Stack, Text, Spinner } from "@chakra-ui/react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error ?? "حدث خطأ في التسجيل");
        return;
      }

      setSuccess(data.data.message);
      // Clear form
      setFormData({ name: "", email: "", password: "" });
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
                bgGradient="linear(to-r, brand.900, brand.600)"
                bgClip="text"
              >
                إنشاء حساب
              </Heading>
              <Text color="muted">
                أنشئ حسابك للوصول إلى الدورات، البرامج، والمجتمع التعليمي.
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
              
              <Stack gap={4}>
                <Box as="label">
                  <Text mb={2} fontWeight="600">
                    الاسم الكامل
                  </Text>
                  <Input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="اسمك الكامل"
                    bg="background"
                    border="2px solid"
                    borderColor="border"
                    borderRadius="button"
                    px={4}
                    py={3}
                    w="100%"
                    transition="all 0.2s"
                    _hover={{ borderColor: "brand.200" }}
                    _focus={{
                      outline: "none",
                      borderColor: "brand.500",
                      boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)"
                    }}
                    required
                    disabled={isLoading}
                  />
                </Box>
                <Box as="label">
                  <Text mb={2} fontWeight="600">
                    البريد الإلكتروني
                  </Text>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    bg="background"
                    border="2px solid"
                    borderColor="border"
                    borderRadius="button"
                    px={4}
                    py={3}
                    w="100%"
                    transition="all 0.2s"
                    _hover={{ borderColor: "brand.200" }}
                    _focus={{
                      outline: "none",
                      borderColor: "brand.500",
                      boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)"
                    }}
                    required
                    disabled={isLoading}
                  />
                </Box>
                <Box as="label">
                  <Text mb={2} fontWeight="600">
                    كلمة المرور
                  </Text>
                  <Input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    bg="background"
                    border="2px solid"
                    borderColor="border"
                    borderRadius="button"
                    px={4}
                    py={3}
                    w="100%"
                    transition="all 0.2s"
                    _hover={{ borderColor: "brand.200" }}
                    _focus={{
                      outline: "none",
                      borderColor: "brand.500",
                      boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)"
                    }}
                    minLength={8}
                    required
                    disabled={isLoading}
                  />
                  <Text color="muted" fontSize="xs" mt={1}>
                    يجب أن تكون 8 أحرف على الأقل
                  </Text>
                </Box>
              </Stack>
              <Button
                type="submit"
                bgGradient="linear(to-r, brand.900, brand.700)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, brand.800, brand.600)",
                  transform: "translateY(-1px)",
                  boxShadow: "lg"
                }}
                transition="all 0.2s"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : "إنشاء الحساب"}
              </Button>
              <Text color="muted" fontSize="sm">
                لديك حساب بالفعل؟{" "}
                <Link href="/auth/login" style={{ textDecoration: "none" }}>
                  <Text
                    as="span"
                    color="brand.900"
                    fontWeight="600"
                    _hover={{ textDecoration: "underline" }}
                  >
                    سجّل الدخول
                  </Text>
                </Link>
              </Text>
            </Stack>
          </form>
        </PremiumCard>
      </Container>
    </Box>
  );
}
