"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PremiumCard from "@/components/ui/PremiumCard";

interface Session {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "VOICE";
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  privacy: "PUBLIC" | "PRIVATE";
  scheduledAt: string | null;
  teacherName: string;
  courseName: string | null;
  maxStudents: number;
  allowStudentMic: boolean;
  allowStudentCamera: boolean;
  participants: {
    id: string;
    userName: string;
    userRole: string;
  }[];
  _count: { participants: number; invitations: number };
}

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TeacherLessonsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sessionType, setSessionType] = useState<"VIDEO" | "VOICE">("VIDEO");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [allowStudentMic, setAllowStudentMic] = useState(false);
  const [allowStudentCamera, setAllowStudentCamera] = useState(false);
  const [allowChat, setAllowChat] = useState(true);
  const [allowHandRaise, setAllowHandRaise] = useState(true);
  const [notifyOnCreate, setNotifyOnCreate] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.ok && json.data) {
          if (json.data.role !== "INSTRUCTOR" && json.data.role !== "ADMIN") {
            toaster.create({ title: "هذه الصفحة للمعلمين فقط", type: "error" });
            router.push("/");
            return;
          }
          setUser(json.data);
        } else {
          router.push("/auth/login?redirect=/teacher/lessons");
        }
      } catch {
        router.push("/auth/login?redirect=/teacher/lessons");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/lessons?limit=20");
      const json = await res.json();
      if (json.ok) {
        setSessions(json.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }, []);

  // Fetch available students
  const fetchStudents = useCallback(async (search = "") => {
    setLoadingStudents(true);
    try {
      const excludeIds = selectedStudents.map((s) => s.id).join(",");
      const res = await fetch(
        `/api/teacher/lessons/available-students?search=${encodeURIComponent(search)}&exclude=${excludeIds}`
      );
      const json = await res.json();
      if (json.ok) {
        setAvailableStudents(json.data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedStudents]);

  useEffect(() => {
    if (user) {
      fetchSessions();
      const interval = setInterval(fetchSessions, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchSessions]);

  useEffect(() => {
    if (showNewForm && privacy === "PRIVATE") {
      fetchStudents(studentSearch);
    }
  }, [showNewForm, privacy, studentSearch, fetchStudents]);

  const resetForm = () => {
    setShowNewForm(false);
    setTitle("");
    setDescription("");
    setSessionType("VIDEO");
    setPrivacy("PRIVATE");
    setAllowStudentMic(false);
    setAllowStudentCamera(false);
    setAllowChat(true);
    setAllowHandRaise(true);
    setNotifyOnCreate(true);
    setSelectedStudents([]);
    setStudentSearch("");
  };

  const createSession = async (instant: boolean) => {
    if (!instant && !title.trim()) {
      toaster.create({ title: "يرجى إدخال عنوان الحصة", type: "error" });
      return;
    }

    if (!instant && privacy === "PRIVATE" && selectedStudents.length === 0) {
      toaster.create({ title: "يرجى اختيار الطلاب المدعوين", type: "error" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: instant ? `حصة ${user?.name}` : title,
          description: description || undefined,
          type: sessionType,
          privacy: instant ? "PUBLIC" : privacy,
          allowStudentMic,
          allowStudentCamera,
          allowChat,
          allowHandRaise,
          notifyOnCreate,
          sendInAppNotifications: notifyOnCreate,
          invitedStudentIds: privacy === "PRIVATE" ? selectedStudents.map((s) => s.id) : undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toaster.create({
          title: "تم إنشاء الحصة بنجاح",
          description: notifyOnCreate ? "تم إرسال الإشعارات للطلاب" : undefined,
          type: "success",
        });
        resetForm();
        fetchSessions();
        if (instant) {
          router.push(`/teacher/lessons/${json.data.id}`);
        }
      } else {
        toaster.create({ title: json.error, type: "error" });
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const startSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`/teacher/lessons/${sessionId}`);
      } else {
        toaster.create({ title: json.error, type: "error" });
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  const joinSession = (sessionId: string) => {
    router.push(`/teacher/lessons/${sessionId}`);
  };

  const addStudent = (student: Student) => {
    setSelectedStudents((prev) => [...prev, student]);
    setAvailableStudents((prev) => prev.filter((s) => s.id !== student.id));
  };

  const removeStudent = (student: Student) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== student.id));
    setAvailableStudents((prev) => [...prev, student]);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STUDENT":
        return <Badge colorPalette="blue" size="sm">طالب</Badge>;
      case "INSTRUCTOR":
        return <Badge colorPalette="green" size="sm">معلم</Badge>;
      case "ADMIN":
        return <Badge colorPalette="red" size="sm">إداري</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="background">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (!user) return null;

  return (
    <Box minH="100vh" bg="background" pt={20} pb={8}>
      <Container maxW="6xl">
        <Flex direction="column" gap={6}>
          {/* Header */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Stack gap={1}>
              <Heading size="xl" color="brand.500">
                📖 حصصي التعليمية
              </Heading>
              <Text color="muted">أنشئ وأدر حصصك الدراسية مع الطلاب</Text>
            </Stack>

            <HStack gap={3}>
              <Button
                colorPalette="green"
                size="lg"
                onClick={() => createSession(true)}
                disabled={creating}
              >
                🎥 بدء حصة فورية
              </Button>
              <Button
                variant="outline"
                colorPalette="brand"
                onClick={() => setShowNewForm(!showNewForm)}
              >
                + جدولة حصة
              </Button>
            </HStack>
          </Flex>

          {/* New Session Form */}
          {showNewForm && (
            <PremiumCard p={6}>
              <Heading size="md" mb={4}>إنشاء حصة جديدة</Heading>
              <Stack gap={5}>
                {/* Basic Info */}
                <Box>
                  <Text fontWeight="600" mb={2}>المعلومات الأساسية</Text>
                  <Stack gap={3}>
                    <Input
                      placeholder="عنوان الحصة *"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      bg="surface"
                    />
                    <Textarea
                      placeholder="وصف الحصة (اختياري)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      bg="surface"
                      rows={2}
                    />
                  </Stack>
                </Box>

                {/* Session Type */}
                <Box>
                  <Text fontWeight="600" mb={2}>نوع الحصة</Text>
                  <Flex gap={3}>
                    <Button
                      variant={sessionType === "VIDEO" ? "solid" : "outline"}
                      colorPalette="brand"
                      onClick={() => setSessionType("VIDEO")}
                      flex={1}
                    >
                      📹 فيديو
                    </Button>
                    <Button
                      variant={sessionType === "VOICE" ? "solid" : "outline"}
                      colorPalette="brand"
                      onClick={() => setSessionType("VOICE")}
                      flex={1}
                    >
                      🎤 صوت فقط
                    </Button>
                  </Flex>
                </Box>

                {/* Privacy */}
                <Box>
                  <Text fontWeight="600" mb={2}>🔒 الخصوصية</Text>
                  <Flex gap={3}>
                    <Button
                      variant={privacy === "PUBLIC" ? "solid" : "outline"}
                      colorPalette="green"
                      onClick={() => setPrivacy("PUBLIC")}
                      flex={1}
                    >
                      🌐 عام - جميع الطلاب
                    </Button>
                    <Button
                      variant={privacy === "PRIVATE" ? "solid" : "outline"}
                      colorPalette="purple"
                      onClick={() => setPrivacy("PRIVATE")}
                      flex={1}
                    >
                      🔐 خاص - مدعوون فقط
                    </Button>
                  </Flex>
                </Box>

                {/* Student Selection (Private) */}
                {privacy === "PRIVATE" && (
                  <Box>
                    <Text fontWeight="600" mb={2}>👥 اختر الطلاب المدعوين</Text>
                    <Stack gap={3}>
                      {selectedStudents.length > 0 && (
                        <Flex gap={2} flexWrap="wrap">
                          {selectedStudents.map((student) => (
                            <Badge
                              key={student.id}
                              colorPalette="brand"
                              py={1}
                              px={3}
                              borderRadius="full"
                              cursor="pointer"
                              onClick={() => removeStudent(student)}
                              _hover={{ opacity: 0.8 }}
                            >
                              {student.name} ✕
                            </Badge>
                          ))}
                        </Flex>
                      )}

                      <Input
                        placeholder="ابحث عن طالب..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        bg="surface"
                      />

                      {loadingStudents ? (
                        <Flex justify="center" py={4}>
                          <Spinner size="sm" />
                        </Flex>
                      ) : availableStudents.length > 0 ? (
                        <Box maxH="200px" overflowY="auto" bg="surface" borderRadius="lg" p={2}>
                          <Stack gap={1}>
                            {availableStudents.map((student) => (
                              <Flex
                                key={student.id}
                                align="center"
                                justify="space-between"
                                p={2}
                                borderRadius="md"
                                cursor="pointer"
                                _hover={{ bg: "brand.500/10" }}
                                onClick={() => addStudent(student)}
                              >
                                <Flex align="center" gap={2}>
                                  <Avatar.Root size="sm">
                                    <Avatar.Fallback>{student.name.charAt(0)}</Avatar.Fallback>
                                  </Avatar.Root>
                                  <Box>
                                    <Text fontSize="sm" fontWeight="500">{student.name}</Text>
                                    <Text fontSize="xs" color="muted">{student.email}</Text>
                                  </Box>
                                </Flex>
                                {getRoleBadge(student.role)}
                              </Flex>
                            ))}
                          </Stack>
                        </Box>
                      ) : studentSearch ? (
                        <Text fontSize="sm" color="muted" textAlign="center" py={4}>
                          لم يتم العثور على نتائج
                        </Text>
                      ) : null}
                    </Stack>
                  </Box>
                )}

                {/* Student Permissions */}
                <Box>
                  <Text fontWeight="600" mb={2}>⚙️ صلاحيات الطلاب</Text>
                  <Stack gap={2}>
                    <Flex align="center" gap={3}>
                      <Checkbox.Root
                        checked={allowStudentMic}
                        onCheckedChange={(e) => setAllowStudentMic(!!e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                        <Checkbox.Label>🎤 السماح بالمايكروفون</Checkbox.Label>
                      </Checkbox.Root>
                    </Flex>
                    <Flex align="center" gap={3}>
                      <Checkbox.Root
                        checked={allowStudentCamera}
                        onCheckedChange={(e) => setAllowStudentCamera(!!e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                        <Checkbox.Label>📹 السماح بالكاميرا</Checkbox.Label>
                      </Checkbox.Root>
                    </Flex>
                    <Flex align="center" gap={3}>
                      <Checkbox.Root
                        checked={allowChat}
                        onCheckedChange={(e) => setAllowChat(!!e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                        <Checkbox.Label>💬 السماح بالدردشة</Checkbox.Label>
                      </Checkbox.Root>
                    </Flex>
                    <Flex align="center" gap={3}>
                      <Checkbox.Root
                        checked={allowHandRaise}
                        onCheckedChange={(e) => setAllowHandRaise(!!e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                        <Checkbox.Label>✋ السماح برفع اليد</Checkbox.Label>
                      </Checkbox.Root>
                    </Flex>
                  </Stack>
                </Box>

                {/* Notifications */}
                <Box>
                  <Flex align="center" gap={3}>
                    <Checkbox.Root
                      checked={notifyOnCreate}
                      onCheckedChange={(e) => setNotifyOnCreate(!!e.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                      <Checkbox.Label>🔔 إرسال إشعارات للطلاب</Checkbox.Label>
                    </Checkbox.Root>
                  </Flex>
                </Box>

                {/* Actions */}
                <Flex gap={3} pt={2}>
                  <Button
                    colorPalette="brand"
                    flex={1}
                    onClick={() => createSession(false)}
                    loading={creating}
                    disabled={!title.trim() || (privacy === "PRIVATE" && selectedStudents.length === 0)}
                  >
                    إنشاء الحصة
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                </Flex>
              </Stack>
            </PremiumCard>
          )}

          {/* Live Sessions */}
          {sessions.filter((s) => s.status === "LIVE").length > 0 && (
            <Box>
              <Heading size="md" mb={4} color="green.400">
                🔴 حصص جارية الآن
              </Heading>
              <Stack gap={3}>
                {sessions
                  .filter((s) => s.status === "LIVE")
                  .map((session) => (
                    <PremiumCard
                      key={session.id}
                      p={4}
                      borderColor="green.500/50"
                      bg="green.900/10"
                    >
                      <Flex justify="space-between" align="center">
                        <Stack gap={1}>
                          <Flex align="center" gap={2} flexWrap="wrap">
                            <Box
                              w={3}
                              h={3}
                              borderRadius="full"
                              bg="green.500"
                              css={{ animation: "pulse 2s infinite" }}
                            />
                            <Text fontWeight="700" fontSize="lg">{session.title}</Text>
                            <Badge colorPalette="green">مباشر</Badge>
                            {session.privacy === "PRIVATE" && (
                              <Badge colorPalette="purple">🔐 خاص</Badge>
                            )}
                          </Flex>
                          <Flex align="center" gap={2} color="muted" fontSize="sm">
                            <Text>👥 {session._count.participants} مشارك</Text>
                            {session.courseName && (
                              <Text>• 📚 {session.courseName}</Text>
                            )}
                          </Flex>
                        </Stack>
                        <Button
                          colorPalette="green"
                          size="lg"
                          onClick={() => joinSession(session.id)}
                        >
                          دخول الحصة
                        </Button>
                      </Flex>
                    </PremiumCard>
                  ))}
              </Stack>
            </Box>
          )}

          {/* Scheduled Sessions */}
          {sessions.filter((s) => s.status === "SCHEDULED").length > 0 && (
            <Box>
              <Heading size="md" mb={4}>📅 حصص مجدولة</Heading>
              <Stack gap={3}>
                {sessions
                  .filter((s) => s.status === "SCHEDULED")
                  .map((session) => (
                    <PremiumCard key={session.id} p={4}>
                      <Flex justify="space-between" align="center">
                        <Stack gap={1}>
                          <Flex align="center" gap={2} flexWrap="wrap">
                            <Text fontWeight="700">{session.title}</Text>
                            <Badge colorPalette="blue">مجدول</Badge>
                            {session.privacy === "PRIVATE" && (
                              <Badge colorPalette="purple">🔐 خاص</Badge>
                            )}
                          </Flex>
                          <Flex align="center" gap={2} color="muted" fontSize="sm">
                            <Text>📨 {session._count.invitations} مدعو</Text>
                            {session.scheduledAt && (
                              <Text>• 📅 {new Date(session.scheduledAt).toLocaleDateString("ar-EG")}</Text>
                            )}
                          </Flex>
                        </Stack>
                        <Button
                          colorPalette="brand"
                          onClick={() => startSession(session.id)}
                        >
                          بدء الحصة
                        </Button>
                      </Flex>
                    </PremiumCard>
                  ))}
              </Stack>
            </Box>
          )}

          {/* Past Sessions */}
          {sessions.filter((s) => s.status === "ENDED").length > 0 && (
            <Box>
              <Heading size="md" mb={4} color="muted">📜 حصص سابقة</Heading>
              <Stack gap={3}>
                {sessions
                  .filter((s) => s.status === "ENDED")
                  .map((session) => (
                    <PremiumCard key={session.id} p={4} opacity={0.7}>
                      <Flex justify="space-between" align="center">
                        <Stack gap={1}>
                          <Text fontWeight="700">{session.title}</Text>
                          <Text fontSize="sm" color="muted">
                            👥 {session._count.participants} مشارك
                          </Text>
                        </Stack>
                        <Badge>منتهية</Badge>
                      </Flex>
                    </PremiumCard>
                  ))}
              </Stack>
            </Box>
          )}

          {sessions.length === 0 && !showNewForm && (
            <PremiumCard p={10}>
              <Flex direction="column" align="center" justify="center" color="muted">
                <Text fontSize="4xl" mb={4}>📖</Text>
                <Text fontSize="lg" fontWeight="600">لا توجد حصص</Text>
                <Text>أنشئ حصة جديدة لبدء التدريس</Text>
              </Flex>
            </PremiumCard>
          )}
        </Flex>
      </Container>
    </Box>
  );
}
