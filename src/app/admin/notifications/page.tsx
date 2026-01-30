import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const notifications = [
  { title: "📢 إعلان منصة", channel: "البريد", status: "مجدول", color: "warning" },
  { title: "🔔 تذكير اختبار", channel: "داخل المنصة", status: "مفعل", color: "success" },
  { title: "💬 تنبيه اشتراك", channel: "SMS", status: "غير مفعل", color: "error" },
];

export default function AdminNotificationsPage() {
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
            الإشعارات
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة الإشعارات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            إدارة قنوات الإرسال وقوالب الإشعارات والحملات.
          </Text>
        </Stack>
        <Button 
          bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
          color="white"
          _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
          transition="all 0.3s ease"
          h="fit-content"
        >
          إنشاء حملة
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {notifications.map((item) => (
          <PremiumCard key={item.title} variant="bordered" p={6}>
            <Stack gap={4}>
              <Text fontWeight="700" fontSize="lg">{item.title}</Text>
              <Text color="muted" lineHeight="1.7">القناة: {item.channel}</Text>
              <Flex justify="space-between" align="center">
                <Badge 
                  bgGradient={`linear(135deg, ${item.color} 0%, ${item.color} 100%)`}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="badge"
                  fontSize="xs"
                >
                  {item.status}
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
                  تعديل
                </Button>
              </Flex>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
