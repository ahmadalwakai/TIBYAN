"use client";

import { Box, Button, Container, Heading, Input, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, Suspense } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import { login } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");
  const redirect = searchParams.get("redirect");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.ok) {
        // Get user role from cookie to determine redirect
        const userRole = document.cookie
          .split('; ')
          .find(row => row.startsWith('user-role='))
          ?.split('=')[1];
        
        // If there's a redirect param, use it, otherwise redirect based on role
        const destination = redirect || (userRole === 'admin' ? '/admin' : '/courses');
        
        router.push(destination);
        router.refresh();
      } else {
        setError(result.error || "فشل تسجيل الدخول");
      }
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
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
          <Stack gap={6}>
            <Heading
              size="lg"
              bgGradient="linear(to-r, brand.900, brand.600)"
              bgClip="text"
            >
              تسجيل الدخول
            </Heading>
            <Text color="muted">
              مرحبًا بعودتك. أدخل بياناتك للوصول إلى دوراتك ومساراتك.
            </Text>

            {urlError === "unauthorized" && (
              <Box
                bg="orange.50"
                border="1px solid"
                borderColor="orange.200"
                borderRadius="button"
                p={3}
              >
                <Text fontSize="sm" color="orange.900">
                  ⚠️ يجب تسجيل الدخول كمسؤول للوصول إلى لوحة التحكم
                </Text>
              </Box>
            )}

            {error && (
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="button"
                p={3}
              >
                <Text fontSize="sm" color="red.900">
                  ❌ {error}
                </Text>
              </Box>
            )}

            <Box
              bg="brand.50"
              border="1px solid"
              borderColor="brand.400"
              borderRadius="button"
              p={4}
            >
              <Text fontSize="sm" fontWeight="600" mb={2}>🔐 بيانات تسجيل الدخول التجريبية:</Text>
              <Text fontSize="sm" color="muted">
                <strong>مسؤول:</strong> admin@tibyan.academy / admin123
              </Text>
              <Text fontSize="sm" color="muted">
                <strong>طالب:</strong> أي بريد إلكتروني / أي كلمة مرور
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Box as="label">
                  <Text mb={2} fontWeight="600">
                    البريد الإلكتروني
                  </Text>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                  />
                </Box>
                <Box as="label">
                  <Text mb={2} fontWeight="600">
                    كلمة المرور
                  </Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                  />
                </Box>
                <Button
                  type="submit"
                  bgGradient="linear(to-r, brand.900, brand.700)"
                  color="white"
                  disabled={loading}
                  _hover={{
                    bgGradient: "linear(to-r, brand.800, brand.600)",
                    transform: "translateY(-1px)",
                    boxShadow: "lg"
                  }}
                  transition="all 0.2s"
                >
                  {loading ? "جارٍ تسجيل الدخول..." : "دخول"}
                </Button>
              </Stack>
            </form>

            <Text color="muted" fontSize="sm">
              ليس لديك حساب؟{" "}
              <Link href="/auth/register" style={{ textDecoration: "none" }}>
                <Box
                  as="span"
                  color="brand.900"
                  fontWeight="600"
                  _hover={{ textDecoration: "underline" }}
                >
                  أنشئ حسابًا
                </Box>
              </Link>
            </Text>
          </Stack>
        </PremiumCard>
      </Container>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Box minH="100vh" bg="background" />}>
      <LoginForm />
    </Suspense>
  );
}
