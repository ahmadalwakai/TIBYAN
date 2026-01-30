import { Box, Button, Container, Heading, Input, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

export default function ForgotPasswordPage() {
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
              استعادة كلمة المرور
            </Heading>
            <Text color="muted">
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.
            </Text>
            <Box as="label">
              <Text mb={2} fontWeight="600">
                البريد الإلكتروني
              </Text>
              <Input
                type="email"
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
              />
            </Box>
            <Button
              bgGradient="linear(to-r, brand.900, brand.700)"
              color="white"
              _hover={{
                bgGradient: "linear(to-r, brand.800, brand.600)",
                transform: "translateY(-1px)",
                boxShadow: "lg"
              }}
              transition="all 0.2s"
            >
              إرسال رابط الاستعادة
            </Button>
            <Text color="muted" fontSize="sm">
              تذكرت كلمة المرور؟{" "}
              <Link href="/auth/login" style={{ textDecoration: "none" }}>
                <Box
                  color="brand.900"
                  fontWeight="600"
                  _hover={{ textDecoration: "underline" }}
                >
                  عودة لتسجيل الدخول
                </Box>
              </Link>
            </Text>
          </Stack>
        </PremiumCard>
      </Container>
    </Box>
  );
}
