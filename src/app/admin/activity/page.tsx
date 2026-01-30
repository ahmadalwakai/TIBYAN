import { Badge, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import { allCourses } from "@/content/courses.ar";

const activity = [
  { title: "✅ اكتمال وحدة", detail: `${allCourses[0].name} · الوحدة 4`, time: "قبل 12 دقيقة", color: "success" },
  { title: "📝 بدء اختبار", detail: "اختبار مهارات البحث · المحاولة 1", time: "قبل 45 دقيقة", color: "brand.500" },
  { title: "💬 نقاش جديد", detail: "سؤال داخل درس 2", time: "اليوم", color: "warning" },
  { title: "🏆 شهادة صادرة", detail: "برنامج القيادة التعليمية", time: "أمس", color: "brand.600" },
];

export default function AdminActivityPage() {
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
          سجل الأنشطة
        </Badge>
        <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
          الأنشطة التعليمية
        </Heading>
        <Text color="muted" fontSize="lg" lineHeight="1.7">
          متابعة النشاط التعليمي المباشر عبر الدورات والبرامج.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {activity.map((item) => (
          <PremiumCard key={item.detail} variant="bordered" p={6}>
            <Stack gap={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="700" fontSize="lg">{item.title}</Text>
                <Badge 
                  bgGradient={`linear(135deg, ${item.color} 0%, ${item.color} 100%)`}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="badge"
                  fontSize="xs"
                >
                  {item.time}
                </Badge>
              </Flex>
              <Text color="muted" lineHeight="1.7">{item.detail}</Text>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
