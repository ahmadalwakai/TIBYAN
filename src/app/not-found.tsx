import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";

export default function NotFound() {
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
        right="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(200, 162, 74, 0.1) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />

      <Container maxW="2xl" py={20} textAlign="center" position="relative" zIndex={1}>
        <Stack gap={6} align="center">
          {/* Error Icon */}
          <Box
            fontSize={{ base: "6xl", md: "8xl" }}
            css={{
              animation: "float 3s ease-in-out infinite",
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-20px)" },
              },
            }}
          >
            🔍
          </Box>

          {/* Error Code */}
          <Heading
            as="h1"
            fontSize={{ base: "6xl", md: "8xl" }}
            fontWeight="900"
            color="text"
            css={{
              background: "linear-gradient(135deg, #c8a24a 0%, #0b1f3b 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </Heading>

          {/* Error Message */}
          <Stack gap={3}>
            <Heading as="h2" size={{ base: "lg", md: "xl" }} color="text">
              الصفحة غير موجودة
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="muted" maxW="500px">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى موقع آخر.
            </Text>
          </Stack>

          {/* Action Buttons */}
          <Stack direction={{ base: "column", sm: "row" }} gap={4} pt={6}>
            <Button asChild size="lg" colorScheme="blue" fontWeight="700">
              <Link href="/">← العودة للرئيسية</Link>
            </Button>
            <Button asChild size="lg" variant="outline" fontWeight="700">
              <Link href="/help">المساعدة</Link>
            </Button>
          </Stack>

          {/* Quick Links */}
          <Box pt={8} borderTop="1px solid" borderColor="border" w="100%" mt={8}>
            <Text fontSize="sm" color="muted" mb={4} fontWeight="600">
              روابط سريعة
            </Text>
            <Stack direction="row" gap={6} justify="center" flexWrap="wrap">
              <Link href="/programs" style={{ color: "var(--chakra-colors-link)", fontSize: "14px" }}>
                البرامج
              </Link>
              <Link href="/pricing" style={{ color: "var(--chakra-colors-link)", fontSize: "14px" }}>
                التسعير
              </Link>
              <Link href="/instructors" style={{ color: "var(--chakra-colors-link)", fontSize: "14px" }}>
                المدرسون
              </Link>
              <Link href="/about" style={{ color: "var(--chakra-colors-link)", fontSize: "14px" }}>
                عن تبيان
              </Link>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
