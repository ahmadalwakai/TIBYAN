import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

export default function TermsPage() {
  return (
    <Box 
      as="main" 
      bg="#000000" 
      minH="100vh"
      position="relative"
      overflow="hidden"
    >
      {/* Background glow effects */}
      <Box
        position="absolute"
        top="10%"
        right="5%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="20%"
        left="10%"
        w="250px"
        h="250px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.06) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      
      <Container maxW="4xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Box
          bg="#050505"
          borderRadius="2xl"
          border="1px solid"
          borderColor="rgba(0, 255, 42, 0.3)"
          boxShadow="0 0 30px rgba(0, 255, 42, 0.15), inset 0 0 30px rgba(0, 255, 42, 0.03)"
          p={{ base: 6, md: 10 }}
        >
          <Stack gap={8}>
            <Stack gap={3}>
              <Heading size="2xl" color="white">شروط الاستخدام</Heading>
              <Text color="gray.400" fontSize="lg">
                باستخدامك لمنصة تبيان، فإنك توافق على الالتزام بالشروط التالية.
              </Text>
            </Stack>
            
            <Stack gap={6}>
              {[
                {
                  title: "1) الحسابات والصلاحيات",
                  content: "يجب تقديم معلومات صحيحة، وتُدار الصلاحيات وفق الأدوار المعتمدة."
                },
                {
                  title: "2) المحتوى والملكية",
                  content: "جميع المواد التعليمية محمية بحقوق الملكية ولا يجوز إعادة استخدامها دون موافقة."
                },
                {
                  title: "3) السلوك المجتمعي",
                  content: "يلتزم المستخدمون بسياسات المجتمع وعدم إساءة الاستخدام أو التعدي على الآخرين."
                },
                {
                  title: "4) التعديلات",
                  content: "قد يتم تحديث الشروط عند الحاجة ويُشعَر المستخدمون بالتغييرات الجوهرية."
                }
              ].map((section, idx) => (
                <Box
                  key={idx}
                  bg="#0A0A0A"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.2)"
                  p={5}
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: "rgba(0, 255, 42, 0.4)",
                    boxShadow: "0 0 20px rgba(0, 255, 42, 0.15)",
                  }}
                >
                  <Text fontWeight="700" color="#00FF2A" mb={2}>{section.title}</Text>
                  <Text color="gray.400" lineHeight="1.8">
                    {section.content}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
