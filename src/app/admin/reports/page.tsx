import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const reports = [
  { title: "🚨 بلاغ مجتمع", detail: "نقاش درس 3", severity: "مرتفع", color: "error" },
  { title: "⚠️ بلاغ محتوى", detail: "وحدة الدرس 2", severity: "متوسط", color: "warning" },
  { title: "ℹ️ بلاغ تقييم", detail: "سؤال اختبار", severity: "منخفض", color: "brand.500" },
];

export default function AdminReportsPage() {
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
            مركز التقارير
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة البلاغات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            متابعة البلاغات والامتثال وتطبيق سياسات المحتوى.
          </Text>
        </Stack>
        <Button 
          variant="outline" 
          borderColor="brand.500"
          borderWidth="2px"
          color="brand.900"
          _hover={{ bg: "brand.50", borderColor: "brand.600" }}
          transition="all 0.3s ease"
          h="fit-content"
        >
          إعدادات البلاغات
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {reports.map((report) => (
          <PremiumCard key={report.title} variant="bordered" p={6}>
            <Stack gap={4}>
              <Text fontWeight="700" fontSize="lg">{report.title}</Text>
              <Text color="muted" lineHeight="1.7">التفاصيل: {report.detail}</Text>
              <Flex justify="space-between" align="center">
                <Badge
                  bgGradient={`linear(135deg, ${report.color} 0%, ${report.color} 100%)`}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="badge"
                  fontSize="xs"
                >
                  {report.severity}
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline" 
                  borderColor="brand.500"
                  borderWidth="2px"
                  color="brand.900"
                  _hover={{ bg: "brand.50", borderColor: "brand.600" }}
                  transition="all 0.3s ease"
                >
                  معالجة
                </Button>
              </Flex>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
