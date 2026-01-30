import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const storageCards = [
  {
    title: "☁️ التخزين السحابي",
    description: "إعدادات S3، الحاويات، وسياسات الوصول.",
  },
  {
    title: "🎥 البث والفيديو",
    description: "HLS، جودة البث، وإعدادات التفريغ النصي.",
  },
  {
    title: "🌐 الشبكات و CDN",
    description: "تحسين الأداء والتوزيع الجغرافي للمحتوى.",
  },
];

export default function AdminStoragePage() {
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
            التخزين والبث
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة التخزين
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            تحكم بالبنية التحتية للملفات والبث المرئي والتوزيع.
          </Text>
        </Stack>
        <Button 
          bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
          color="white"
          _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
          transition="all 0.3s ease"
          h="fit-content"
        >
          تحديث الإعدادات
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        {storageCards.map((card) => (
          <PremiumCard key={card.title} variant="default" p={6}>
            <Stack gap={4}>
              <Heading size="md" fontWeight="700">{card.title}</Heading>
              <Text color="muted" lineHeight="1.7" minH="60px">{card.description}</Text>
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
