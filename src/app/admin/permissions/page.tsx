import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const roles = [
  { name: "👑 مدير عام", scope: "كل الصلاحيات", status: "نشط", color: "brand.500" },
  { name: "🔍 مراجع", scope: "مراجعة المحتوى", status: "نشط", color: "success" },
  { name: "👥 مشرف مجتمع", scope: "مراقبة البلاغات", status: "نشط", color: "warning" },
  { name: "💰 محاسب", scope: "إدارة المدفوعات", status: "مقيّد", color: "error" },
];

export default function AdminPermissionsPage() {
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
            الصلاحيات والأدوار
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة الصلاحيات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            تخصيص الصلاحيات حسب فرق العمل والأدوار المختلفة.
          </Text>
        </Stack>
        <Button 
          bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
          color="white"
          _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
          transition="all 0.3s ease"
          h="fit-content"
        >
          إنشاء دور جديد
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {roles.map((role) => (
          <PremiumCard key={role.name} variant="bordered" p={6}>
            <Stack gap={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="700" fontSize="lg">{role.name}</Text>
                <Badge 
                  bgGradient={`linear(135deg, ${role.color} 0%, ${role.color} 100%)`}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="badge"
                  fontSize="xs"
                >
                  {role.status}
                </Badge>
              </Flex>
              <Text color="muted" lineHeight="1.7">النطاق: {role.scope}</Text>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="brand.500"
                borderWidth="2px"
                color="brand.900" 
                alignSelf="start"
                _hover={{ bg: "brand.50", borderColor: "brand.600" }}
                transition="all 0.3s ease"
              >
                إدارة الصلاحيات
              </Button>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
