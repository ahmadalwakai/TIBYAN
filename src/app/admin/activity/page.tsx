"use client";

import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Activity {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface Stats {
  totalUsers: number;
  totalEnrollments: number;
  totalPayments: number;
  totalCourses: number;
}

const typeColors: Record<string, string> = {
  user_joined: "green",
  enrollment: "blue",
  payment: "yellow",
  course_created: "purple",
  review: "orange",
};

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEnrollments: 0,
    totalPayments: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (filter) params.set("type", filter);

      const response = await fetch(`/api/admin/activity?${params}`);
      const data = await response.json();

      if (data.ok) {
        setActivities(data.data.activities);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
    if (diffHours < 24) return `قبل ${diffHours} ساعة`;
    if (diffDays < 7) return `قبل ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  return (
    <Stack gap={10}>
      {/* Header */}
      <Flex justify="space-between" align="start" wrap="wrap" gap={4}>
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
            سجل الأنشطة
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            الأنشطة التعليمية
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            متابعة النشاط التعليمي المباشر عبر الدورات والبرامج.
          </Text>
        </Stack>
        <Button
          onClick={fetchActivity}
          bg="brand.900"
          color="white"
          _hover={{ bg: "brand.700" }}
        >
          🔄 تحديث
        </Button>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
        <PremiumCard p={6} textAlign="center">
          <Text fontSize="3xl" fontWeight="800" color="brand.900">{stats.totalUsers}</Text>
          <Text color="muted" fontSize="sm">👥 المستخدمين</Text>
        </PremiumCard>
        <PremiumCard p={6} textAlign="center">
          <Text fontSize="3xl" fontWeight="800" color="brand.900">{stats.totalEnrollments}</Text>
          <Text color="muted" fontSize="sm">📚 التسجيلات</Text>
        </PremiumCard>
        <PremiumCard p={6} textAlign="center">
          <Text fontSize="3xl" fontWeight="800" color="brand.900">{stats.totalPayments}</Text>
          <Text color="muted" fontSize="sm">💰 المدفوعات</Text>
        </PremiumCard>
        <PremiumCard p={6} textAlign="center">
          <Text fontSize="3xl" fontWeight="800" color="brand.900">{stats.totalCourses}</Text>
          <Text color="muted" fontSize="sm">🎓 الدورات</Text>
        </PremiumCard>
      </SimpleGrid>

      {/* Filter Buttons */}
      <Flex gap={2} wrap="wrap">
        {[
          { value: "", label: "الكل" },
          { value: "users", label: "👤 المستخدمين" },
          { value: "enrollments", label: "📚 التسجيلات" },
          { value: "payments", label: "💰 المدفوعات" },
          { value: "courses", label: "🎓 الدورات" },
          { value: "reviews", label: "⭐ التقييمات" },
        ].map((btn) => (
          <Button
            key={btn.value}
            size="sm"
            variant={filter === btn.value ? "solid" : "outline"}
            bg={filter === btn.value ? "brand.900" : undefined}
            color={filter === btn.value ? "white" : undefined}
            onClick={() => setFilter(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </Flex>

      {/* Activity Feed */}
      {loading ? (
        <Flex justify="center" py={20}>
          <Text color="muted">جاري التحميل...</Text>
        </Flex>
      ) : activities.length === 0 ? (
        <PremiumCard p={10} textAlign="center">
          <Text fontSize="4xl" mb={4}>📊</Text>
          <Text color="muted">لا توجد أنشطة حتى الآن</Text>
        </PremiumCard>
      ) : (
        <Stack gap={4}>
          {activities.map((activity) => (
            <PremiumCard key={activity.id} variant="bordered" p={5}>
              <Flex justify="space-between" align="center" gap={4}>
                <Flex gap={4} align="center" flex={1}>
                  <Flex
                    w="50px"
                    h="50px"
                    borderRadius="xl"
                    bg={`${typeColors[activity.type] || "gray"}.100`}
                    align="center"
                    justify="center"
                    fontSize="xl"
                  >
                    {activity.icon}
                  </Flex>
                  <Stack gap={0} flex={1}>
                    <Text fontWeight="700" color="text">{activity.title}</Text>
                    <Text color="muted" fontSize="sm" lineHeight="1.6">
                      {activity.description}
                    </Text>
                  </Stack>
                </Flex>
                <Badge
                  colorPalette={typeColors[activity.type] || "gray"}
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                >
                  {formatTime(activity.timestamp)}
                </Badge>
              </Flex>
            </PremiumCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
