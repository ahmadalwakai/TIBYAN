"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Avatar,
  Progress,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";

interface Review {
  id: string;
  courseName: string;
  courseId: string;
  studentName: string;
  studentAvatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

export default function TeacherReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/teacher/reviews", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setReviews(data.data.reviews);
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل المراجعات...</Text>
      </Box>
    );
  }

  const totalRatings = stats
    ? stats.fiveStars + stats.fourStars + stats.threeStars + stats.twoStars + stats.oneStar
    : 0;

  const getRatingPercentage = (count: number) =>
    totalRatings > 0 ? (count / totalRatings) * 100 : 0;

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          المراجعات ⭐
        </Heading>
        <Text color="muted">
          تقييمات الطلاب لدوراتك
        </Text>
      </Box>

      {/* Stats */}
      <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={6}>
        {/* Rating Summary */}
        <PremiumCard variant="elevated">
          <Box p={6} textAlign="center">
            <Text fontSize="5xl" fontWeight="700" color="accent">
              {stats?.averageRating?.toFixed(1) ?? "0.0"}
            </Text>
            <HStack justify="center" gap={1} mb={2}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  color={star <= Math.round(stats?.averageRating ?? 0) ? "yellow.400" : "gray.300"}
                  fontSize="xl"
                >
                  ★
                </Text>
              ))}
            </HStack>
            <Text color="muted" fontSize="sm">
              بناءً على {stats?.totalReviews ?? 0} تقييم
            </Text>
          </Box>
        </PremiumCard>

        {/* Rating Breakdown */}
        <PremiumCard variant="elevated">
          <Box p={6}>
            <Heading size="md" mb={4}>توزيع التقييمات</Heading>
            <VStack gap={3} align="stretch">
              {[
                { stars: 5, count: stats?.fiveStars ?? 0 },
                { stars: 4, count: stats?.fourStars ?? 0 },
                { stars: 3, count: stats?.threeStars ?? 0 },
                { stars: 2, count: stats?.twoStars ?? 0 },
                { stars: 1, count: stats?.oneStar ?? 0 },
              ].map(({ stars, count }) => (
                <HStack key={stars} gap={3}>
                  <HStack gap={1} minW="80px">
                    <Text fontSize="sm" fontWeight="600">{stars}</Text>
                    <Text color="yellow.400">★</Text>
                  </HStack>
                  <Box flex="1">
                    <Progress.Root value={getRatingPercentage(count)} size="sm" colorPalette="yellow">
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>
                  <Text fontSize="sm" color="muted" minW="40px">
                    ({count})
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </PremiumCard>
      </Grid>

      {/* Reviews List */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>جميع المراجعات</Heading>
          
          {reviews.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="5xl" mb={4}>⭐</Text>
              <Heading size="md" color="text" mb={2}>
                لا توجد مراجعات بعد
              </Heading>
              <Text color="muted">
                ستظهر هنا تقييمات الطلاب لدوراتك
              </Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              {reviews.map((review) => (
                <Box
                  key={review.id}
                  p={4}
                  borderRadius="card"
                  border="1px solid"
                  borderColor="border"
                >
                  <HStack justify="space-between" mb={3}>
                    <HStack gap={3}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback bg="avatarBg" color="avatarText">
                          {review.studentName.charAt(0)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <Box>
                        <Text fontWeight="600" fontSize="sm">
                          {review.studentName}
                        </Text>
                        <Text fontSize="xs" color="muted">
                          {review.courseName}
                        </Text>
                      </Box>
                    </HStack>
                    <VStack gap={0} align="end">
                      <HStack gap={0}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text
                            key={star}
                            color={star <= review.rating ? "yellow.400" : "gray.300"}
                            fontSize="sm"
                          >
                            ★
                          </Text>
                        ))}
                      </HStack>
                      <Text fontSize="xs" color="muted">
                        {review.createdAt}
                      </Text>
                    </VStack>
                  </HStack>
                  {review.comment && (
                    <Text color="textBody" fontSize="sm">
                      {review.comment}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </PremiumCard>
    </VStack>
  );
}
