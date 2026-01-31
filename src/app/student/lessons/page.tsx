"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PremiumCard from "@/components/ui/PremiumCard";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "VOICE";
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  privacy: "PUBLIC" | "PRIVATE";
  scheduledAt: string | null;
  startedAt: string | null;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string | null;
  courseName: string | null;
  invitationStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
  isInvited: boolean;
  participantCount: number;
}

export default function StudentLessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "scheduled">("all");

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const authRes = await fetch("/api/auth/me");
        const authJson = await authRes.json();
        if (!authJson.ok || !authJson.data) {
          router.push("/auth/login?redirect=/student/lessons");
          return;
        }

        // Fetch lessons
        const lessonsRes = await fetch("/api/student/lessons");
        const lessonsJson = await lessonsRes.json();
        if (lessonsJson.ok) {
          setLessons(lessonsJson.data);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const acceptInvitation = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/student/lessons/${lessonId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: "accept" }),
      });
      const json = await res.json();
      if (json.ok) {
        toaster.create({ title: "تم قبول الدعوة", type: "success" });
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId ? { ...l, invitationStatus: "ACCEPTED" } : l
          )
        );
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  const declineInvitation = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/student/lessons/${lessonId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: "decline" }),
      });
      const json = await res.json();
      if (json.ok) {
        toaster.create({ title: "تم رفض الدعوة", type: "info" });
        setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  const joinLesson = (lessonId: string) => {
    router.push(`/student/lessons/${lessonId}`);
  };

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "live" && lesson.status === "LIVE") ||
      (filterStatus === "scheduled" && lesson.status === "SCHEDULED");
    return matchesSearch && matchesStatus;
  });

  const liveLessons = filteredLessons.filter((l) => l.status === "LIVE");
  const scheduledLessons = filteredLessons.filter((l) => l.status === "SCHEDULED");
  const pendingInvitations = lessons.filter((l) => l.invitationStatus === "PENDING");

  if (loading) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <Container maxW="7xl" py={8} dir="rtl">
      <VStack align="stretch" gap={8}>
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="xl" mb={2}>
              📚 الحصص المتاحة
            </Heading>
            <Text color="gray.400">
              انضم للحصص المباشرة مع معلميك
            </Text>
          </Box>
        </Flex>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <PremiumCard variant="gradient" p={6}>
            <Heading size="md" mb={4}>
              ✉️ دعوات جديدة ({pendingInvitations.length})
            </Heading>
            <Stack gap={3}>
              {pendingInvitations.map((lesson) => (
                <Flex
                  key={lesson.id}
                  align="center"
                  justify="space-between"
                  p={4}
                  bg="whiteAlpha.100"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="yellow.500"
                >
                  <Flex align="center" gap={3}>
                    <Avatar.Root size="md">
                      {lesson.teacherAvatar && (
                        <Avatar.Image src={lesson.teacherAvatar} />
                      )}
                      <Avatar.Fallback>{lesson.teacherName.charAt(0)}</Avatar.Fallback>
                    </Avatar.Root>
                    <Box>
                      <Text fontWeight="600">{lesson.title}</Text>
                      <Text fontSize="sm" color="gray.400">
                        المعلم: {lesson.teacherName}
                      </Text>
                      <HStack gap={2} mt={1}>
                        <Badge colorPalette={lesson.type === "VIDEO" ? "purple" : "blue"}>
                          {lesson.type === "VIDEO" ? "🎥 فيديو" : "🎤 صوت"}
                        </Badge>
                        {lesson.status === "LIVE" && (
                          <Badge colorPalette="red">🔴 مباشر الآن</Badge>
                        )}
                      </HStack>
                    </Box>
                  </Flex>
                  <HStack gap={2}>
                    <Button
                      colorPalette="green"
                      size="sm"
                      onClick={() => acceptInvitation(lesson.id)}
                    >
                      ✅ قبول
                    </Button>
                    <Button
                      variant="outline"
                      colorPalette="red"
                      size="sm"
                      onClick={() => declineInvitation(lesson.id)}
                    >
                      ❌ رفض
                    </Button>
                  </HStack>
                </Flex>
              ))}
            </Stack>
          </PremiumCard>
        )}

        {/* Search & Filters */}
        <Flex gap={4} wrap="wrap">
          <Input
            flex={1}
            minW="250px"
            placeholder="🔍 ابحث عن حصة أو معلم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="whiteAlpha.100"
          />
          <HStack gap={2}>
            <Button
              variant={filterStatus === "all" ? "solid" : "outline"}
              colorPalette="brand"
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              الكل
            </Button>
            <Button
              variant={filterStatus === "live" ? "solid" : "outline"}
              colorPalette="red"
              size="sm"
              onClick={() => setFilterStatus("live")}
            >
              🔴 مباشر ({liveLessons.length})
            </Button>
            <Button
              variant={filterStatus === "scheduled" ? "solid" : "outline"}
              colorPalette="blue"
              size="sm"
              onClick={() => setFilterStatus("scheduled")}
            >
              📅 مجدول ({scheduledLessons.length})
            </Button>
          </HStack>
        </Flex>

        {/* Live Lessons */}
        {liveLessons.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>
              🔴 حصص مباشرة الآن
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {liveLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onJoin={() => joinLesson(lesson.id)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Scheduled Lessons */}
        {scheduledLessons.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>
              📅 حصص مجدولة
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {scheduledLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onJoin={() => joinLesson(lesson.id)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Empty State */}
        {filteredLessons.length === 0 && (
          <PremiumCard p={12} textAlign="center">
            <Text fontSize="5xl" mb={4}>📚</Text>
            <Heading size="md" mb={2}>
              لا توجد حصص متاحة
            </Heading>
            <Text color="gray.400">
              {searchQuery
                ? "جرب البحث بكلمات مختلفة"
                : "سيظهر هنا الحصص عندما يقوم المعلمون بإنشائها"}
            </Text>
          </PremiumCard>
        )}
      </VStack>
    </Container>
  );
}

// Lesson Card Component
function LessonCard({ lesson, onJoin }: { lesson: Lesson; onJoin: () => void }) {
  const isLive = lesson.status === "LIVE";
  const canJoin = isLive && (lesson.invitationStatus === "ACCEPTED" || lesson.privacy === "PUBLIC");

  return (
    <PremiumCard
      p={5}
      position="relative"
      overflow="hidden"
      borderColor={isLive ? "red.500" : undefined}
      borderWidth={isLive ? "2px" : undefined}
    >
      {/* Live indicator */}
      {isLive && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h={1}
          bg="red.500"
          css={{
            animation: "pulse 2s infinite",
          }}
        />
      )}

      <Flex direction="column" h="100%">
        {/* Header */}
        <Flex align="center" gap={3} mb={4}>
          <Avatar.Root size="md">
            {lesson.teacherAvatar && <Avatar.Image src={lesson.teacherAvatar} />}
            <Avatar.Fallback>{lesson.teacherName.charAt(0)}</Avatar.Fallback>
          </Avatar.Root>
          <Box flex={1}>
            <Text fontWeight="600" lineClamp={1}>
              {lesson.title}
            </Text>
            <Text fontSize="sm" color="gray.400">
              {lesson.teacherName}
            </Text>
          </Box>
        </Flex>

        {/* Description */}
        {lesson.description && (
          <Text fontSize="sm" color="gray.300" mb={3} lineClamp={2}>
            {lesson.description}
          </Text>
        )}

        {/* Badges */}
        <HStack gap={2} mb={4} flexWrap="wrap">
          <Badge colorPalette={lesson.type === "VIDEO" ? "purple" : "blue"}>
            {lesson.type === "VIDEO" ? "🎥 فيديو" : "🎤 صوت"}
          </Badge>
          {isLive && (
            <Badge colorPalette="red">🔴 مباشر</Badge>
          )}
          {lesson.privacy === "PRIVATE" && (
            <Badge colorPalette="purple">🔐 خاص</Badge>
          )}
          {lesson.isInvited && (
            <Badge colorPalette="green">✉️ مدعو</Badge>
          )}
          <Badge colorPalette="gray">👥 {lesson.participantCount}</Badge>
        </HStack>

        {/* Course */}
        {lesson.courseName && (
          <Text fontSize="xs" color="gray.500" mb={3}>
            📖 {lesson.courseName}
          </Text>
        )}

        {/* Schedule */}
        {lesson.scheduledAt && !isLive && (
          <Text fontSize="sm" color="brand.400" mb={3}>
            📅 {new Date(lesson.scheduledAt).toLocaleString("ar-SA")}
          </Text>
        )}

        {/* Spacer */}
        <Box flex={1} />

        {/* Actions */}
        <Button
          colorPalette={isLive ? "green" : "brand"}
          size="sm"
          w="100%"
          onClick={onJoin}
          disabled={!canJoin && lesson.privacy === "PRIVATE"}
        >
          {isLive ? "🚀 انضم الآن" : "عرض التفاصيل"}
        </Button>
      </Flex>
    </PremiumCard>
  );
}
