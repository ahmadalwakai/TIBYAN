import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

export default function ContentPolicyPage() {
  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="4xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <Stack gap={6}>
          <Heading size="2xl">سياسة المحتوى</Heading>
          <Text color="muted">
            توضح هذه السياسة معايير قبول المحتوى التعليمي داخل منصة تبيان.
          </Text>
          <Stack gap={4}>
            <Text fontWeight="700">1) الجودة الأكاديمية</Text>
            <Text color="muted">
              يجب أن يلتزم المحتوى بمعايير الجودة والموثوقية ومراجعة الخبراء.
            </Text>
            <Text fontWeight="700">2) الالتزام الأخلاقي</Text>
            <Text color="muted">
              يُمنع نشر محتوى يسيء أو يحرض على الكراهية أو يخالف الأنظمة.
            </Text>
            <Text fontWeight="700">3) حقوق الملكية</Text>
            <Text color="muted">
              يجب أن يكون المحتوى أصليًا أو مملوكًا بحقوق واضحة.
            </Text>
            <Text fontWeight="700">4) إجراءات المراجعة</Text>
            <Text color="muted">
              تمر الدورات بمراحل مراجعة قبل اعتمادها ونشرها.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
