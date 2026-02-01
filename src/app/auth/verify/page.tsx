"use client";

import { useEffect, useState, Suspense } from "react";
import { Box, Button, Container, Heading, Stack, Text, Spinner } from "@chakra-ui/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PremiumCard from "@/components/ui/PremiumCard";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("رابط التحقق غير صالح");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.ok) {
          setStatus("success");
          setMessage(data.data.message);
        } else {
          setStatus("error");
          setMessage(data.error ?? "حدث خطأ في التحقق");
        }
      } catch {
        setStatus("error");
        setMessage("حدث خطأ في الاتصال بالخادم");
      }
    };

    verifyEmail();
  }, [searchParams]);

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
          <Stack gap={6} align="center" textAlign="center">
            {status === "loading" && (
              <>
                <Spinner size="xl" color="spinner" />
                <Heading size="lg">جاري التحقق...</Heading>
                <Text color="muted">يرجى الانتظار بينما نتحقق من بريدك الإلكتروني</Text>
              </>
            )}
            
            {status === "success" && (
              <>
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
                  تم التحقق بنجاح!
                </Heading>
                <Text color="muted">{message}</Text>
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
              </>
            )}
            
            {status === "error" && (
              <>
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
                <Heading
                  size="lg"
                  bgGradient="linear(to-r, red.500, red.600)"
                  bgClip="text"
                >
                  فشل التحقق
                </Heading>
                <Text color="muted">{message}</Text>
                <Stack direction="row" gap={4} w="100%">
                  <Button
                    asChild
                    w="100%"
                    variant="outline"
                    borderColor="outlineBorder"
                    color="link"
                    _hover={{ bg: "brand.50" }}
                  >
                    <Link href="/auth/register">تسجيل جديد</Link>
                  </Button>
                  <Button
                    asChild
                    w="100%"
                    bgGradient="linear(to-r, brand.900, brand.700)"
                    color="white"
                    _hover={{
                      bgGradient: "linear(to-r, brand.800, brand.600)",
                    }}
                  >
                    <Link href="/auth/login">تسجيل الدخول</Link>
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </PremiumCard>
      </Container>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Box as="main" bg="background" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="spinner" />
      </Box>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
