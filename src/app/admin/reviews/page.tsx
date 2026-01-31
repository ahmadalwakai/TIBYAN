"use client";

import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
  course: { id: string; title: string; slug: string };
}

interface Stats {
  total: number;
  averageRating: string;
  distribution: Record<number, number>;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, averageRating: "0", distribution: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) {
        params.set("minRating", filter.toString());
        params.set("maxRating", filter.toString());
      }

      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();
      if (data.ok) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;

    try {
      const response = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleModerate = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (data.ok) {
        alert(`تم ${status === "approved" ? "اعتماد" : status === "rejected" ? "رفض" : "تعليم"} التقييم`);
      }
    } catch (error) {
      console.error("Error moderating review:", error);
    }
  };

  const renderStars = (rating: number) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

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
            إدارة التقييمات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            مراجعة وإدارة تقييمات الطلاب للدورات.
          </Text>
        </Stack>
      </Flex>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold">{stats.total}</Text>
          <Text color="muted" fontSize="sm">إجمالي التقييمات</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" color="yellow.500">
            {stats.averageRating}
          </Text>
          <Text color="muted" fontSize="sm">متوسط التقييم</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" color="green.500">
            {stats.distribution[5] || 0}
          </Text>
          <Text color="muted" fontSize="sm">تقييم 5 نجوم</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" color="red.500">
            {(stats.distribution[1] || 0) + (stats.distribution[2] || 0)}
          </Text>
          <Text color="muted" fontSize="sm">تقييمات منخفضة</Text>
        </PremiumCard>
      </SimpleGrid>

      {/* Rating Distribution */}
      <PremiumCard p={6}>
        <Heading size="sm" mb={4}>📊 توزيع التقييمات</Heading>
        <Flex gap={4} wrap="wrap" justify="space-around">
          {[5, 4, 3, 2, 1].map((rating) => (
            <Stack key={rating} align="center" gap={1}>
              <Text fontSize="2xl" fontWeight="bold">
                {stats.distribution[rating] || 0}
              </Text>
              <Text fontSize="sm">{renderStars(rating)}</Text>
              <Button
                size="xs"
                variant={filter === rating ? "solid" : "outline"}
                onClick={() => setFilter(filter === rating ? null : rating)}
              >
                {filter === rating ? "إلغاء" : "تصفية"}
              </Button>
            </Stack>
          ))}
        </Flex>
      </PremiumCard>

      {/* Reviews Table */}
      <PremiumCard p={0} overflow="hidden">
        {loading ? (
          <Flex justify="center" p={8}>
            <Text color="muted">جاري التحميل...</Text>
          </Flex>
        ) : reviews.length === 0 ? (
          <Flex justify="center" p={8}>
            <Text color="muted">لا توجد تقييمات</Text>
          </Flex>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>المستخدم</Table.ColumnHeader>
                <Table.ColumnHeader>الدورة</Table.ColumnHeader>
                <Table.ColumnHeader>التقييم</Table.ColumnHeader>
                <Table.ColumnHeader>التعليق</Table.ColumnHeader>
                <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
                <Table.ColumnHeader>الإجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reviews.map((review) => (
                <Table.Row key={review.id}>
                  <Table.Cell>
                    <Stack gap={0}>
                      <Text fontWeight="500">{review.user.name}</Text>
                      <Text fontSize="xs" color="muted">{review.user.email}</Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>{review.course.title}</Table.Cell>
                  <Table.Cell>
                    <Flex align="center" gap={1}>
                      <Badge
                        colorPalette={review.rating >= 4 ? "green" : review.rating >= 3 ? "yellow" : "red"}
                        fontSize="sm"
                      >
                        {review.rating}/5
                      </Badge>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell maxW="300px">
                    <Text lineClamp={2} fontSize="sm">
                      {review.comment || "بدون تعليق"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(review.createdAt).toLocaleDateString("ar-SA")}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <Button
                        size="xs"
                        colorPalette="green"
                        variant="outline"
                        onClick={() => handleModerate(review.id, "approved")}
                      >
                        ✓
                      </Button>
                      <Button
                        size="xs"
                        colorPalette="yellow"
                        variant="outline"
                        onClick={() => handleModerate(review.id, "flagged")}
                      >
                        ⚠
                      </Button>
                      <Button
                        size="xs"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => handleDelete(review.id)}
                      >
                        ✕
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </PremiumCard>
    </Stack>
  );
}
