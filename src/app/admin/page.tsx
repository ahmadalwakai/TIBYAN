import { Badge, Box, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";
import { allCourses, teachers } from "@/content/courses.ar";

const kpis = [
  { label: "مستخدمون نشطون", value: "+18.2k", trend: "+6%", color: "brand.500" },
  { label: "البرامج المنشورة", value: "5", trend: "+2", color: "success" },
  { label: "الاشتراكات المدفوعة", value: "1,420", trend: "+4%", color: "warning" },
  { label: "معدل الإكمال", value: "72%", trend: "+3%", color: "brand.600" },
];

const reviewQueue = [
  { title: allCourses[4].name, instructor: teachers[4].name, status: "قيد المراجعة" },
  { title: allCourses[2].name, instructor: teachers[6].name, status: "بانتظار الجودة" },
  { title: allCourses[3].name, instructor: teachers[8].name, status: "قيد المراجعة" },
];

const reports = [
  { title: "بلاغ محتوى", detail: "وحدة الدرس 4", severity: "متوسط" },
  { title: "بلاغ مجتمع", detail: "مناقشة الدرس 2", severity: "مرتفع" },
  { title: "بلاغ تقييم", detail: "سؤال اختبار", severity: "منخفض" },
];

export default function AdminDashboardPage() {
  return (
    <Stack gap={10}>
      <Flex direction={{ base: "column", md: "row" }} gap={6} justify="space-between">
        <Stack gap={3}>
          <Badge
            bg="rgba(0, 255, 42, 0.1)"
            color="#00FF2A"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="600"
            w="fit-content"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
          >
            🏠 لوحة التحكم
          </Badge>
          <Heading size="2xl" color="white">
            لوحة تحكم الإدارة
          </Heading>
          <Text color="gray.400" fontSize="lg" lineHeight="1.7">
            تحكم شامل بالمنصة: المحتوى، المستخدمين، المدفوعات، الجودة، والمجتمع.
          </Text>
        </Stack>
        <Stack direction={{ base: "column", sm: "row" }} gap={3} h="fit-content">
          <Button 
            variant="outline" 
            borderColor="rgba(0, 255, 42, 0.3)"
            borderWidth="1px"
            color="gray.300"
            _hover={{ bg: "rgba(0, 255, 42, 0.1)", borderColor: "#00FF2A", color: "#00FF2A" }}
            transition="all 0.3s ease"
          >
            تصدير التقارير
          </Button>
          <Button 
            bg="#00FF2A"
            color="#000000"
            fontWeight="700"
            _hover={{ bg: "#4DFF6A", transform: "translateY(-2px)", boxShadow: "0 0 20px rgba(0, 255, 42, 0.4)" }}
            transition="all 0.3s ease"
          >
            إنشاء إعلان عام
          </Button>
        </Stack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={6}>
        {kpis.map((item) => (
          <StatCard key={item.label} accentColor="#00FF2A" p={6}>
            <Stack gap={3}>
              <Text color="gray.400" fontSize="sm" fontWeight="600">
                {item.label}
              </Text>
              <Flex align="baseline" gap={2}>
                <Text 
                  fontSize="3xl" 
                  fontWeight="800"
                  color="#00FF2A"
                >
                  {item.value}
                </Text>
                <Badge 
                  bg="rgba(0, 255, 42, 0.15)"
                  color="#00FF2A"
                  px={2}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                >
                  {item.trend}
                </Badge>
              </Flex>
            </Stack>
          </StatCard>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <PremiumCard variant="bordered" p={6}>
          <Stack gap={5}>
            <Flex align="center" gap={3}>
              <Text fontSize="2xl">📋</Text>
              <Heading size="md" color="white">قائمة المهام الإدارية</Heading>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {[
                { text: "مراجعة الدورات الجديدة", icon: "📚" },
                { text: "اعتماد المدرّسين", icon: "✅" },
                { text: "تحديث سياسات المحتوى", icon: "📝" },
                { text: "مراجعة بلاغات المجتمع", icon: "⚠️" },
                { text: "تسوية المدفوعات", icon: "💰" },
                { text: "مراقبة الأداء", icon: "📊" },
              ].map((task) => (
                <Flex
                  key={task.text}
                  align="center"
                  gap={2}
                  bg="#0A0A0A"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.2)"
                  p={3}
                  transition="all 0.3s ease"
                  _hover={{
                    bg: "rgba(0, 255, 42, 0.1)",
                    borderColor: "#00FF2A",
                    transform: "translateX(-4px)",
                  }}
                >
                  <Text fontSize="lg">{task.icon}</Text>
                  <Text fontWeight="600" fontSize="sm" color="gray.300">{task.text}</Text>
                </Flex>
              ))}
            </SimpleGrid>
          </Stack>
        </PremiumCard>

        <PremiumCard variant="gradient" p={6}>
          <Stack gap={4}>
            <Flex align="center" gap={3}>
              <Text fontSize="2xl">🚨</Text>
              <Heading size="md" color="white">تنبيهات حرجة</Heading>
            </Flex>
            {reports.map((item) => (
              <Flex 
                key={item.title} 
                justify="space-between" 
                gap={4} 
                flexWrap="wrap"
                p={3}
                bg="#0A0A0A"
                borderRadius="lg"
                transition="all 0.3s ease"
                _hover={{ boxShadow: "0 0 15px rgba(0, 255, 42, 0.1)" }}
              >
                <Stack gap={1}>
                  <Text fontWeight="700" color="white">{item.title}</Text>
                  <Text color="gray.400" fontSize="sm">
                    {item.detail}
                  </Text>
                </Stack>
                <Badge
                  bg={item.severity === "مرتفع" ? "rgba(220, 38, 38, 0.2)" : item.severity === "متوسط" ? "rgba(234, 179, 8, 0.2)" : "rgba(0, 255, 42, 0.2)"}
                  color={item.severity === "مرتفع" ? "red.400" : item.severity === "متوسط" ? "yellow.400" : "#00FF2A"}
                  alignSelf="center"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontWeight="600"
                >
                  {item.severity}
                </Badge>
              </Flex>
            ))}
            <Button 
              variant="outline" 
              borderColor="rgba(0, 255, 42, 0.3)"
              borderWidth="1px"
              color="gray.300"
              _hover={{ bg: "rgba(0, 255, 42, 0.1)", borderColor: "#00FF2A", color: "#00FF2A" }}
              transition="all 0.3s ease"
            >
              فتح مركز البلاغات
            </Button>
          </Stack>
        </PremiumCard>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <PremiumCard variant="default" p={6}>
          <Stack gap={5}>
            <Flex align="center" gap={3}>
              <Text fontSize="2xl">🔍</Text>
              <Heading size="md" color="white">مراجعات الدورات</Heading>
            </Flex>
            {reviewQueue.map((item) => (
              <Flex 
                key={item.title} 
                justify="space-between" 
                gap={4} 
                flexWrap="wrap"
                p={3}
                bg="#0A0A0A"
                borderRadius="lg"
                border="1px solid"
                borderColor="rgba(0, 255, 42, 0.2)"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(0, 255, 42, 0.05)",
                  borderColor: "rgba(0, 255, 42, 0.4)",
                }}
              >
                <Stack gap={1}>
                  <Text fontWeight="700" color="white">{item.title}</Text>
                  <Text color="gray.400" fontSize="sm">
                    👤 {item.instructor}
                  </Text>
                </Stack>
                <Badge 
                  bg="rgba(0, 255, 42, 0.15)"
                  color="#00FF2A"
                  alignSelf="center"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontWeight="600"
                >
                  {item.status}
                </Badge>
              </Flex>
            ))}
            <Button 
              variant="outline" 
              borderColor="rgba(0, 255, 42, 0.3)"
              borderWidth="1px"
              color="gray.300"
              _hover={{ bg: "rgba(0, 255, 42, 0.1)", borderColor: "#00FF2A", color: "#00FF2A" }}
              transition="all 0.3s ease"
            >
              عرض جميع المراجعات
            </Button>
          </Stack>
        </PremiumCard>

        <PremiumCard variant="elevated" p={6}>
          <Stack gap={5}>
            <Flex align="center" gap={3}>
              <Text fontSize="2xl">💳</Text>
              <Heading size="md" color="white">ملخص المدفوعات</Heading>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              {[
                { label: "الإيراد الشهري", value: "€ 42,300", icon: "💰", color: "#00FF2A" },
                { label: "اشتراكات جديدة", value: "312", icon: "✨", color: "#00FF2A" },
                { label: "نسبة التحويل", value: "3.8%", icon: "📈", color: "#00FF2A" },
              ].map((item) => (
                <Box
                  key={item.label}
                  bg="#0A0A0A"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.2)"
                  p={4}
                  textAlign="center"
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "translateY(-4px)",
                    boxShadow: "0 0 20px rgba(0, 255, 42, 0.15)",
                    borderColor: "rgba(0, 255, 42, 0.4)",
                  }}
                >
                  <Text fontSize="2xl" mb={2}>{item.icon}</Text>
                  <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1}>
                    {item.label}
                  </Text>
                  <Text 
                    fontWeight="800"
                    fontSize="lg"
                    color="#00FF2A"
                  >
                    {item.value}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
            <Button 
              variant="outline" 
              borderColor="rgba(0, 255, 42, 0.3)"
              borderWidth="1px"
              color="gray.300"
              _hover={{ bg: "rgba(0, 255, 42, 0.1)", borderColor: "#00FF2A", color: "#00FF2A" }}
              transition="all 0.3s ease"
            >
              إدارة المدفوعات
            </Button>
          </Stack>
        </PremiumCard>
      </SimpleGrid>

      <PremiumCard variant="gradient" p={{ base: 6, md: 8 }}>
        <Stack gap={5}>
          <Flex align="center" gap={3}>
            <Text fontSize="2xl">⚡</Text>
            <Heading size="md" color="white">التحكم السريع</Heading>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {[
              { label: "إدارة المستخدمين", href: "/admin/users", icon: "👥" },
              { label: "إدارة الدورات", href: "/admin/courses", icon: "📚" },
              { label: "مركز البلاغات", href: "/admin/reports", icon: "📊" },
              { label: "إعدادات الدفع", href: "/admin/payments", icon: "💳" },
              { label: "سياسات المحتوى", href: "/admin/settings", icon: "⚙️" },
              { label: "إدارة الإعلانات", href: "/admin/reviews", icon: "📢" },
            ].map((item) => (
              <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={3}
                  bg="#0A0A0A"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(0, 255, 42, 0.2)"
                  p={4}
                  fontWeight="700"
                  color="gray.300"
                  transition="all 0.3s ease"
                  _hover={{ 
                    bg: "rgba(0, 255, 42, 0.1)",
                    borderColor: "#00FF2A",
                    transform: "translateY(-2px)",
                    boxShadow: "0 0 20px rgba(0, 255, 42, 0.15)",
                    color: "#00FF2A",
                  }}
                >
                  <Text fontSize="xl">{item.icon}</Text>
                  <Text>{item.label}</Text>
                </Box>
              </Link>
            ))}
          </SimpleGrid>
        </Stack>
      </PremiumCard>
    </Stack>
  );
}
