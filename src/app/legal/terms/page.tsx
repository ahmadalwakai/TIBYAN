import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

export default function TermsPage() {
  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="4xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <Stack gap={6}>
          <Heading size="2xl">شروط الاستخدام</Heading>
          <Text color="muted">
            باستخدامك لمنصة تبيان، فإنك توافق على الالتزام بالشروط التالية.
          </Text>
          <Stack gap={4}>
            <Text fontWeight="700">1) الحسابات والصلاحيات</Text>
            <Text color="muted">
              يجب تقديم معلومات صحيحة، وتُدار الصلاحيات وفق الأدوار المعتمدة.
            </Text>
            <Text fontWeight="700">2) المحتوى والملكية</Text>
            <Text color="muted">
              جميع المواد التعليمية محمية بحقوق الملكية ولا يجوز إعادة استخدامها
              دون موافقة.
            </Text>
            <Text fontWeight="700">3) السلوك المجتمعي</Text>
            <Text color="muted">
              يلتزم المستخدمون بسياسات المجتمع وعدم إساءة الاستخدام أو التعدي على
              الآخرين.
            </Text>
            <Text fontWeight="700">4) التعديلات</Text>
            <Text color="muted">
              قد يتم تحديث الشروط عند الحاجة ويُشعَر المستخدمون بالتغييرات الجوهرية.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
