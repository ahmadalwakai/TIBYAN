import { Badge, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import { allCourses } from "@/content/courses.ar";

const logs = [
  { actor: "admin@tibyan", action: "✓ اعتماد برنامج", target: allCourses[0].name, time: "قبل 10 دقائق", color: "success" },
  { actor: "moderator@tibyan", action: "🔒 إغلاق بلاغ", target: "نقاش الدرس 2", time: "قبل ساعة", color: "warning" },
  { actor: "admin@tibyan", action: "✏️ تحديث خطة", target: "احترافي", time: "أمس", color: "brand.500" },
  { actor: "admin@tibyan", action: "➕ إضافة دور", target: "مراجع", time: "قبل يومين", color: "brand.600" },
];

export default function AdminAuditLogsPage() {
  return (
    <Stack gap={10}>
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
          سجلات التدقيق
        </Badge>
        <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
          متابعة الأنشطة الإدارية
        </Heading>
        <Text color="muted" fontSize="lg" lineHeight="1.7">
          متابعة شاملة ومفصلة لكل الأنشطة الإدارية الحساسة.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {logs.map((log) => (
          <PremiumCard key={`${log.actor}-${log.action}-${log.time}`} variant="bordered" p={6}>
            <Stack gap={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="700" fontSize="lg">{log.action}</Text>
                <Badge 
                  bgGradient={`linear(135deg, ${log.color} 0%, ${log.color} 100%)`}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="badge"
                  fontSize="xs"
                >
                  {log.time}
                </Badge>
              </Flex>
              <Text color="muted" lineHeight="1.7">المنفّذ: {log.actor}</Text>
              <Text color="muted" lineHeight="1.7">الهدف: {log.target}</Text>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
