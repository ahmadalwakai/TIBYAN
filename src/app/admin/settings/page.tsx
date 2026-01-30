import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const settingsSections = [
  {
    title: "⚙️ إعدادات المنصة",
    description: "الشعار، الهوية، اللغة الافتراضية، والاتجاه.",
  },
  {
    title: "💳 المدفوعات والاشتراكات",
    description: "بوابات الدفع، الخطط، السياسات الضريبية.",
  },
  {
    title: "📧 البريد والإشعارات",
    description: "SMTP، قوالب الرسائل، وجدولة التنبيهات.",
  },
  {
    title: "☁️ التخزين والبث",
    description: "S3، CDN، إعدادات الفيديو والتفريغ النصي.",
  },
  {
    title: "📋 سياسات المحتوى",
    description: "ضوابط النشر، إجراءات المراجعة، وسياسات المجتمع.",
  },
  {
    title: "🔐 الأمان والوصول",
    description: "الأدوار، الصلاحيات، سجلات التدقيق.",
  },
];

export default function AdminSettingsPage() {
  return (
    <Stack gap={10}>
      <Flex direction={{ base: "column", md: "row" }} gap={6} justify="space-between">
        <Stack gap={3}>
          <Badge
            bgGradient="linear(135deg, brand.500 0%, brand.600 100%)"
            color="white"
            px={3}
            py={1}
            borderRadius="badge"
            fontSize="xs"
            fontWeight="600"
            w="fit-content"
          >
            إعدادات المنصة
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إعدادات الإدارة
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            تحكم كامل في المنصة وإعداداتها التشغيلية والبنية التحتية.
          </Text>
        </Stack>
        <Button 
          bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
          color="white"
          _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
          transition="all 0.3s ease"
          h="fit-content"
        >
          حفظ التغييرات
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {settingsSections.map((section) => (
          <PremiumCard key={section.title} variant="default" p={6}>
            <Stack gap={4}>
              <Heading size="md" fontWeight="700">{section.title}</Heading>
              <Text color="muted" lineHeight="1.7">{section.description}</Text>
              <Button 
                variant="outline" 
                borderColor="brand.500"
                borderWidth="2px"
                color="brand.900" 
                alignSelf="start"
                _hover={{ bg: "brand.50", borderColor: "brand.600" }}
                transition="all 0.3s ease"
              >
                فتح الإعدادات
              </Button>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
