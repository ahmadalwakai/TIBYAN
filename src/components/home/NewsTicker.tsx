"use client";

import { Box, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  textAr: string;
  textEn: string;
  link: string | null;
}

export function NewsTicker() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news-ticker");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data?.length > 0) {
            setNews(data.data);
          }
        }
      } catch {
        // Silently fail - ticker just won't show
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  // Don't render if no news or loading
  if (loading || news.length === 0) {
    return null;
  }

  // Create duplicated content for seamless loop
  const newsContent = [...news, ...news];
  const animationDuration = `${news.length * 10}s`;

  return (
    <>
      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes newsTickerScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
      
      <Box
        position="relative"
        w="100%"
        bg="rgba(34, 197, 94, 0.1)"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="rgba(34, 197, 94, 0.3)"
        py={3}
        overflow="hidden"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {/* Gradient fade edges */}
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          w="60px"
          bg={isArabic 
            ? "linear-gradient(to left, transparent, black)" 
            : "linear-gradient(to right, black, transparent)"
          }
          zIndex={2}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          w="60px"
          bg={isArabic 
            ? "linear-gradient(to right, transparent, black)" 
            : "linear-gradient(to left, black, transparent)"
          }
          zIndex={2}
          pointerEvents="none"
        />

        {/* Scrolling content */}
        <Box
          display="flex"
          gap={12}
          style={{
            animation: `newsTickerScroll ${animationDuration} linear infinite`,
          }}
          _hover={{
            animationPlayState: "paused",
          }}
          dir="ltr"
        >
        {newsContent.map((item, index) => (
          <Box
            key={`${item.id}-${index}`}
            display="flex"
            alignItems="center"
            gap={2}
            flexShrink={0}
            whiteSpace="nowrap"
          >
            <Box
              as="span"
              display="inline-block"
              w={2}
              h={2}
              borderRadius="full"
              bg="green.400"
              boxShadow="0 0 8px rgba(34, 197, 94, 0.6)"
            />
            {item.link ? (
              <Link href={item.link}>
                <Text
                  color="gray.200"
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="500"
                  cursor="pointer"
                  transition="color 0.2s"
                  _hover={{ color: "green.400" }}
                  dir={isArabic ? "rtl" : "ltr"}
                >
                  {isArabic ? item.textAr : item.textEn}
                </Text>
              </Link>
            ) : (
              <Text
                color="gray.200"
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="500"
                dir={isArabic ? "rtl" : "ltr"}
              >
                {isArabic ? item.textAr : item.textEn}
              </Text>
            )}
          </Box>
        ))}
      </Box>
    </Box>
    </>
  );
}
