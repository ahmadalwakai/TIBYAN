import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

export default function PrivacyPage() {
  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="4xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <Stack gap={6}>
          <Heading size="2xl">سياسة الخصوصية</Heading>
          <Text color="muted">
            توضح هذه السياسة كيفية جمع البيانات واستخدامها وحمايتها داخل منصة تبيان.
          </Text>
          <Stack gap={4}>
            <Text fontWeight="700">1) البيانات التي نجمعها</Text>
            <Text color="muted">
              نجمع معلومات التسجيل، بيانات الاستخدام، ومعلومات الدفع عند الحاجة.
            </Text>
            <Text fontWeight="700">2) استخدام البيانات</Text>
            <Text color="muted">
              تُستخدم البيانات لتحسين التجربة، إدارة المحتوى، ودعم العمليات التعليمية.
            </Text>
            <Text fontWeight="700">3) مشاركة البيانات</Text>
            <Text color="muted">
              لا نشارك البيانات مع أطراف خارجية إلا عند الضرورة التشغيلية أو القانونية.
            </Text>
            <Text fontWeight="700">4) حقوق المستخدم</Text>
            <Text color="muted">
              يمكنك طلب تحديث أو حذف بياناتك عبر التواصل مع فريق الدعم.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
