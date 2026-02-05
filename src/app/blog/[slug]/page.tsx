import { Box, Container, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/content/blog-posts";
import type { Metadata } from "next";
import ThemeButton from "@/components/ui/ThemeButton";
import ThemeBadge from "@/components/ui/ThemeBadge";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  
  if (!post) {
    return {
      title: "المقال غير موجود | تبيان",
    };
  }
  
  return {
    title: `${post.title} | مدونة تبيان`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  
  if (!post) {
    notFound();
  }

  // Find related posts (same category, excluding current)
  const relatedPosts = posts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2);

  return (
    <Box as="main" bg="background" minH="100vh" position="relative">
      {/* Decorative background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="600px"
        height="600px"
        bgGradient="radial(circle, brand.50 0%, transparent 70%)"
        opacity={0.2}
        pointerEvents="none"
        zIndex={0}
      />
      
      <Container maxW="4xl" py={{ base: 8, md: 16 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        {/* Back button */}
        <Link href="/blog">
          <ThemeButton
            themeVariant="ghost"
            mb={8}
          >
            → العودة للمدونة
          </ThemeButton>
        </Link>

        <article>
          {/* Header */}
          <Stack gap={6} mb={10}>
            <ThemeBadge 
              themeVariant="primary" 
              w="fit-content" 
              px={4} 
              py={1.5}
              fontSize="sm"
            >
              {post.category}
            </ThemeBadge>
            
            <Heading 
              as="h1"
              size="3xl"
              lineHeight="1.3"
              color="text"
            >
              {post.title}
            </Heading>
            
            <Text color="muted" fontSize="xl" lineHeight="1.8">
              {post.excerpt}
            </Text>
            
            <Flex gap={6} color="muted" fontSize="md" flexWrap="wrap">
              <Flex align="center" gap={2}>
                <Text>📅</Text>
                <Text>{post.date}</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Text>⏱️</Text>
                <Text>{post.readTime} قراءة</Text>
              </Flex>
            </Flex>
          </Stack>

          {/* Divider */}
          <Box 
            h="2px" 
            bg="border"
            mb={10}
          />

          {/* Content */}
          <Box
            className="blog-content"
            color="textBody"
            fontSize="lg"
            lineHeight="2"
            css={{
              "& h2": {
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "var(--color-text)",
                marginTop: "2.5rem",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "2px solid var(--color-border)",
              },
              "& h3": {
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "var(--color-text)",
                marginTop: "2rem",
                marginBottom: "0.75rem",
              },
              "& p": {
                marginBottom: "1.5rem",
              },
              "& ul, & ol": {
                paddingInlineStart: "2rem",
                marginBottom: "1.5rem",
              },
              "& li": {
                marginBottom: "0.5rem",
              },
              "& strong": {
                color: "var(--color-text)",
                fontWeight: "600",
              },
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Share section */}
        <Box 
          mt={16} 
          p={8} 
          bg="cardBg" 
          borderRadius="xl" 
          border="1px solid" 
          borderColor="cardBorder"
        >
          <Heading size="md" mb={4} color="text">شارك هذا المقال</Heading>
          <Flex gap={3} flexWrap="wrap">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://ti-by-an.com/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ThemeButton themeVariant="outline">
                𝕏 تويتر
              </ThemeButton>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://ti-by-an.com/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ThemeButton themeVariant="outline">
                LinkedIn
              </ThemeButton>
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${post.title} - https://ti-by-an.com/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ThemeButton themeVariant="outline">
                واتساب
              </ThemeButton>
            </a>
          </Flex>
        </Box>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <Box mt={16}>
            <Heading size="lg" mb={6} color="text">مقالات ذات صلة</Heading>
            <Stack gap={4}>
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                  <Box
                    p={6}
                    bg="cardBg"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="cardBorder"
                    transition="all 0.3s ease"
                    _hover={{
                      borderColor: "cardHoverBorder",
                      transform: "translateY(-2px)",
                      shadow: "md",
                    }}
                  >
                    <Heading size="md" color="text" mb={2}>
                      {relatedPost.title}
                    </Heading>
                    <Text color="muted">{relatedPost.excerpt}</Text>
                  </Box>
                </Link>
              ))}
            </Stack>
          </Box>
        )}

        {/* Back to blog */}
        <Flex justify="center" mt={16}>
          <Link href="/blog">
            <ThemeButton size="lg" themeVariant="primary">
              استعرض جميع المقالات
            </ThemeButton>
          </Link>
        </Flex>
      </Container>
    </Box>
  );
}
