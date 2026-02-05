"use client";

import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { posts } from "@/content/blog-posts";

export default function BlogPage() {
  const t = useTranslations("blogPage");

  return (
    <Box 
      as="main" 
      bg="#000000" 
      minH="100vh" 
      position="relative"
      overflow="hidden"
      css={{
        "@keyframes floatOrb": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-30px) scale(1.05)" },
        },
        "@keyframes cardFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      }}
    >
      {/* Decorative background elements - Neon Green */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        css={{ animation: "floatOrb 10s ease-in-out infinite" }}
      />
      <Box
        position="absolute"
        bottom="10%"
        right="0"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(50px)"
        pointerEvents="none"
        zIndex={0}
        css={{ animation: "floatOrb 12s ease-in-out infinite reverse" }}
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={10}>
          <Flex 
            direction={{ base: "column", md: "row" }} 
            gap={4} 
            justify="space-between" 
            align={{ base: "center", md: "flex-start" }}
            p={{ base: 6, md: 8 }}
            borderRadius="2xl"
            bg="#050505"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.3)"
            boxShadow="0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2), inset 0 0 30px rgba(0, 255, 42, 0.05)"
          >
            <Stack gap={2}>
              <Heading 
                size="2xl"
                css={{
                  background: "linear-gradient(135deg, #ffffff 0%, #00FF2A 50%, #ffffff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                📝 {t("title")}
              </Heading>
              <Text color="rgba(255, 255, 255, 0.85)" fontSize="lg">{t("subtitle")}</Text>
            </Stack>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {posts.map((post, index) => (
              <Box 
                key={post.slug} 
                p={6}
                bg="#050505"
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(0, 255, 42, 0.3)"
                boxShadow="0 0 20px rgba(0, 255, 42, 0.15)"
                transition="all 0.4s ease"
                css={{
                  animation: `cardFloat 4s ease-in-out infinite`,
                  animationDelay: `${index * 0.2}s`,
                }}
                _hover={{
                  transform: "translateY(-8px)",
                  boxShadow: "0 0 30px rgba(0, 255, 42, 0.4), 0 0 60px rgba(0, 255, 42, 0.2)",
                  borderColor: "rgba(0, 255, 42, 0.6)",
                }}
              >
                <Stack gap={4} h="100%">
                  <Box
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    bg="#0A0A0A"
                    border="1px solid"
                    borderColor="rgba(0, 255, 42, 0.3)"
                    w="fit-content"
                  >
                    <Text fontSize="xs" color="#00FF2A" fontWeight="600">
                      {post.category}
                    </Text>
                  </Box>
                  <Heading 
                    size="md"
                    color="white"
                  >
                    {post.title}
                  </Heading>
                  <Text color="rgba(255, 255, 255, 0.7)" lineHeight="1.7" flex="1">{post.excerpt}</Text>
                  <Flex justify="space-between" align="center" color="rgba(255, 255, 255, 0.6)" fontSize="sm" pt={2}>
                    <Flex align="center" gap={2}>
                      <Text>📅</Text>
                      <Text>{post.date}</Text>
                    </Flex>
                    <Text>⏱️ {post.readTime}</Text>
                  </Flex>
                  <Link href={`/blog/${post.slug}`} style={{ width: "100%" }}>
                    <Button 
                      w="100%"
                      bg="#0A0A0A"
                      color="#00FF2A"
                      border="1px solid"
                      borderColor="rgba(0, 255, 42, 0.4)"
                      borderRadius="full"
                      fontWeight="700"
                      _hover={{
                        borderColor: "#00FF2A",
                        boxShadow: "0 0 20px rgba(0, 255, 42, 0.4)",
                      }}
                      transition="all 0.3s ease"
                    >
                      {t("readMore")} ←
                    </Button>
                  </Link>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
