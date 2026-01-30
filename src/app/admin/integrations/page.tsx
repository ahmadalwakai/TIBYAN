import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const integrations = [
  {
    title: "💳 بوابة الدفع",
    description: "Stripe / PayTabs / HyperPay",
  },
  {
    title: "📧 البريد والإشعارات",
    description: "Resend / SMTP / SMS Gateway",
  },
  {
    title: "☁️ التخزين والبث",
    description: "S3 / Cloudflare R2 / CDN",
  },
  {
    title: "📊 التحليلات والمراقبة",
    description: "Sentry / OpenTelemetry / Analytics",
  },
];

export default function AdminIntegrationsPage() {
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
            التكاملات الخارجية
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة التكاملات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            إدارة الربط مع الخدمات الخارجية والأنظمة المتكاملة.
          </Text>
        </Stack>
        <Button 
          bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
          color="white"
          _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
          transition="all 0.3s ease"
          h="fit-content"
        >
          إضافة تكامل
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {integrations.map((item) => (
          <PremiumCard key={item.title} variant="default" p={6}>
            <Stack gap={4}>
              <Heading size="md" fontWeight="700">{item.title}</Heading>
              <Text color="muted" lineHeight="1.7">{item.description}</Text>
              <Button 
                variant="outline" 
                borderColor="brand.500"
                borderWidth="2px"
                color="brand.900" 
                alignSelf="start"
                _hover={{ bg: "brand.50", borderColor: "brand.600" }}
                transition="all 0.3s ease"
              >
                إدارة التكامل
              </Button>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
