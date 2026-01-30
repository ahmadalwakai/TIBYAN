"use client";

import { useState, Suspense } from "react";
import { Box, Button, Container, Heading, Input, Stack, Text, Spinner } from "@chakra-ui/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PremiumCard from "@/components/ui/PremiumCard";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "حدث خطأ");
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Box as="main" bg="background" minH="100vh" position="relative" overflow="hidden">
        <Container maxW="lg" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative">
          <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
            <Stack gap={6} align="center" textAlign="center">
              <Box
                w="80px"
                h="80px"
                bg="red.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="3xl"
              >
                ✕
              </Box>
              <Heading size="lg" color="red.500">
                رابط غير صالح
              </Heading>
              <Text color="muted">
                الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.
              </Text>
              <Button
                asChild
                w="100%"
                bgGradient="linear(to-r, brand.900, brand.700)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, brand.800, brand.600)",
                }}
              >
                <Link href="/auth/forgot-password">طلب رابط جديد</Link>
              </Button>
            </Stack>
          </PremiumCard>
        </Container>
      </Box>
    );
  }

  if (success) {
    return (
      <Box as="main" bg="background" minH="100vh" position="relative" overflow="hidden">
        <Container maxW="lg" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative">
          <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
            <Stack gap={6} align="center" textAlign="center">
              <Box
                w="80px"
                h="80px"
                bg="green.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="3xl"
              >
                ✓
              </Box>
              <Heading
                size="lg"
                bgGradient="linear(to-r, green.500, green.600)"
                bgClip="text"
              >
                تم تغيير كلمة المرور!
              </Heading>
              <Text color="muted">
                تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.
              </Text>
              <Button
                asChild
                w="100%"
                bgGradient="linear(to-r, brand.900, brand.700)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, brand.800, brand.600)",
                  transform: "translateY(-1px)",
                  boxShadow: "lg"
                }}
                transition="all 0.2s"
              >
                <Link href="/auth/login">تسجيل الدخول</Link>
              </Button>
            </Stack>
          </PremiumCard>
        </Container>
      </Box>
    );
  }

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
                إعادة تعيين كلمة المرور
              </Heading>
              <Text color="muted">
                أدخل كلمة المرور الجديدة لحسابك.
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
              
              <Stack gap={4}>
                <Box as="label">
                  <Text mb={2} fontWeight="600">
                    كلمة المرور الجديدة
                  </Text>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
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
                <Box as="label">
                  <Text mb={2} fontWeight="600">
                    تأكيد كلمة المرور
                  </Text>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
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
                    required
                    disabled={isLoading}
                  />
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
                {isLoading ? <Spinner size="sm" /> : "تغيير كلمة المرور"}
              </Button>
            </Stack>
          </form>
        </PremiumCard>
      </Container>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box as="main" bg="background" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="brand.500" />
      </Box>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
