"use client";

import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service (e.g., Sentry)
    console.error("[Global Error]:", error);
  }, [error]);

  return (
    <Box
      as="main"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="background"
      position="relative"
      overflow="hidden"
    >
      {/* Background decoration */}
      <Box
        position="absolute"
        top="20%"
        left="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(240, 68, 56, 0.1) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />

      <Container maxW="2xl" py={20} textAlign="center" position="relative" zIndex={1}>
        <Stack gap={6} align="center">
          {/* Error Icon */}
          <Box
            fontSize={{ base: "6xl", md: "8xl" }}
            css={{
              animation: "shake 0.5s ease-in-out",
              "@keyframes shake": {
                "0%, 100%": { transform: "translateX(0)" },
                "25%": { transform: "translateX(-10px)" },
                "75%": { transform: "translateX(10px)" },
              },
            }}
          >
            ⚠️
          </Box>

          {/* Error Code */}
          <Heading
            as="h1"
            fontSize={{ base: "5xl", md: "7xl" }}
            fontWeight="900"
            color="text"
            css={{
              background: "linear-gradient(135deg, #F04438 0%, #D92D20 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            حدث خطأ
          </Heading>

          {/* Error Message */}
          <Stack gap={3}>
            <Heading as="h2" size={{ base: "lg", md: "xl" }} color="text">
              عذراً، حدث خطأ غير متوقع
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="muted" maxW="500px" lineHeight="1.7">
              نعتذر عن الإزعاج. فريقنا تم إخطاره بالمشكلة ويعمل على حلها. يرجى المحاولة مرة أخرى.
            </Text>
            {error.digest && (
              <Text fontSize="xs" color="muted" fontFamily="monospace" mt={2}>
                رمز الخطأ: {error.digest}
              </Text>
            )}
          </Stack>

          {/* Action Buttons */}
          <Stack direction={{ base: "column", sm: "row" }} gap={4} pt={6}>
            <Button
              onClick={reset}
              size="lg"
              colorScheme="red"
              fontWeight="700"
            >
              ↻ إعادة المحاولة
            </Button>
            <Button asChild size="lg" variant="outline" fontWeight="700">
              <a href="/">← العودة للرئيسية</a>
            </Button>
          </Stack>

          {/* Support Info */}
          <Box
            pt={8}
            borderTop="1px solid"
            borderColor="border"
            w="100%"
            mt={8}
            borderRadius="lg"
            bg="surface"
            p={6}
          >
            <Text fontSize="sm" color="muted" mb={2} fontWeight="600">
              هل تحتاج مساعدة؟
            </Text>
            <Text fontSize="sm" color="textBody">
              تواصل معنا عبر{" "}
              <a
                href="/help"
                style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }}
              >
                صفحة المساعدة
              </a>{" "}
              أو راسلنا على{" "}
              <a
                href="mailto:support@ti-by-an.com"
                style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }}
              >
                support@ti-by-an.com
              </a>
            </Text>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
