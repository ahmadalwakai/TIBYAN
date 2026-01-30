import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const reviews = [
  { title: "🎯 دورة التفكير النقدي", type: "جودة المحتوى", status: "بانتظار الموافقة", color: "warning" },
  { title: "👑 برنامج القيادة", type: "فحص تسويق", status: "قيد المراجعة", color: "brand.500" },
  { title: "📚 دورة البحث العلمي", type: "مراجعة أكاديمية", status: "بانتظار تعديلات", color: "error" },
];

export default function AdminReviewsPage() {
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
            مراجعات الجودة
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            مراجعة المحتوى
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            ضمان التزام المحتوى بمعايير الجودة وسياسات النشر.
          </Text>
        </Stack>
        <Button 
          bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
          color="white"
          _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
          transition="all 0.3s ease"
          h="fit-content"
        >
          إعدادات المراجعة
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {reviews.map((review) => (
          <PremiumCard key={review.title} variant="bordered" p={6}>
            <Stack gap={4}>
              <Text fontWeight="700" fontSize="lg">{review.title}</Text>
              <Text color="muted" lineHeight="1.7">نوع المراجعة: {review.type}</Text>
              <Flex justify="space-between" align="center">
                <Badge 
                  bgGradient={`linear(135deg, ${review.color} 0%, ${review.color} 100%)`}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="badge"
                  fontSize="xs"
                >
                  {review.status}
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
                  متابعة
                </Button>
              </Flex>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
