import { Box, Container, Text } from "@chakra-ui/react";
import type { Metadata } from "next";
import SocialFeed from "@/components/ui/SocialFeed";

export const metadata: Metadata = {
  title: "المجتمع | تبيان",
  description: "تابع آخر المنشورات والأخبار من مجتمع تبيان التعليمي",
};

export default function SocialPage() {
  return (
    <Box as="section" bg="background" minH="100vh" py={{ base: 8, md: 12 }}>
      <Container maxW="4xl" px={{ base: 6, md: 8 }}>
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <Text
            as="h1"
            fontSize={{ base: "3xl", md: "4xl" }}
            fontWeight="800"
            mb={3}
            bgGradient="to-r"
            gradientFrom="brand.700"
            gradientTo="brand.500"
            bgClip="text"
          >
            مجتمع تبيان
          </Text>
          <Text color="muted" fontSize="lg" maxW="600px" mx="auto">
            تابع آخر المنشورات والأخبار من المعلمين والإدارة، وشارك بتعليقاتك
          </Text>
        </Box>

        {/* Feed */}
        <SocialFeed showTitle={false} maxPosts={20} />
      </Container>
    </Box>
  );
}
