import { Badge, Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

const posts = [
  {
    title: "كيف تبني مسارًا تعليميًا احترافيًا",
    category: "تجربة التعلم",
    excerpt: "نصائح عملية لتصميم مسارات تعليمية تزيد الالتزام وتحسن النتائج.",
    date: "يناير 2026",
  },
  {
    title: "قياس الأثر التعليمي في منصات LMS",
    category: "التحليلات",
    excerpt: "مؤشرات الأداء الأهم لمتابعة تقدّم الطلاب وفاعلية المحتوى.",
    date: "ديسمبر 2025",
  },
  {
    title: "أفضل الممارسات لبناء مجتمع معرفي",
    category: "المجتمع",
    excerpt: "كيف تحافظ على تفاعل صحي وأسئلة عالية الجودة داخل الدورات.",
    date: "نوفمبر 2025",
  },
];

export default function BlogPage() {
  return (
    <Box as="main" bg="background" minH="100vh" position="relative">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="500px"
        height="500px"
        bgGradient="radial(circle, brand.50 0%, transparent 70%)"
        opacity={0.3}
        pointerEvents="none"
        zIndex={0}
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={10}>
          <Flex direction={{ base: "column", md: "row" }} gap={4} justify="space-between" align={{ base: "center", md: "flex-start" }}>
            <Stack gap={2}>
              <Heading 
                size="2xl"
                bgGradient="linear(135deg, text 0%, brand.900 100%)"
                bgClip="text"
              >
                📝 مدونة تبيان
              </Heading>
              <Text color="muted" fontSize="lg">رؤى وأفكار لمستقبل التعليم العربي.</Text>
            </Stack>
            <Button 
              variant="outline" 
              borderColor="brand.500"
              borderWidth="2px"
              color="brand.900"
              _hover={{
                bg: "brand.50",
                transform: "translateY(-2px)",
                borderColor: "brand.600"
              }}
              transition="all 0.3s ease"
            >
              أرشيف المدونة
            </Button>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {posts.map((post) => (
              <PremiumCard key={post.title} variant="default" p={6}>
                <Stack gap={4}>
                  <Badge 
                    bgGradient="linear(135deg, brand.500 0%, brand.600 100%)"
                    color="white" 
                    w="fit-content" 
                    px={3} 
                    py={1}
                    borderRadius="badge"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {post.category}
                  </Badge>
                  <Heading 
                    size="md"
                    bgGradient="linear(135deg, text 0%, brand.900 100%)"
                    bgClip="text"
                  >
                    {post.title}
                  </Heading>
                  <Text color="muted" lineHeight="1.7">{post.excerpt}</Text>
                  <Flex justify="space-between" align="center" color="muted" fontSize="sm" pt={2}>
                    <Flex align="center" gap={2}>
                      <Text>📅</Text>
                      <Text>{post.date}</Text>
                    </Flex>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      borderColor="brand.500"
                      borderWidth="2px"
                      color="brand.900"
                      _hover={{
                        bg: "brand.50",
                        transform: "translateY(-2px)"
                      }}
                      transition="all 0.3s ease"
                    >
                      اقرأ المزيد
                    </Button>
                  </Flex>
                </Stack>
              </PremiumCard>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
