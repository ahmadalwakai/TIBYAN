"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Participant {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userRole: string;
  isActive: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  canSpeak: boolean;
}

interface Session {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "VOICE";
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  privacy: "PUBLIC" | "PRIVATE";
  teacherId: string;
  teacherName: string;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowHandRaise: boolean;
  allowStudentMic: boolean;
  allowStudentCamera: boolean;
  participants: Participant[];
  isTeacher: boolean;
  canControl: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

export default function StudentLessonRoomPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth and fetch session
  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const authRes = await fetch("/api/auth/me");
        const authJson = await authRes.json();
        if (!authJson.ok || !authJson.data) {
          router.push(`/auth/login?redirect=/student/lessons/${sessionId}`);
          return;
        }
        setUser(authJson.data);

        // Fetch session details
        const sessionRes = await fetch(`/api/teacher/lessons/${sessionId}`);
        const sessionJson = await sessionRes.json();
        if (!sessionJson.ok) {
          toaster.create({ title: sessionJson.error || "الحصة غير موجودة", type: "error" });
          router.push("/student/lessons");
          return;
        }
        setSession(sessionJson.data);
      } catch (error) {
        console.error("Error initializing:", error);
        router.push("/student/lessons");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sessionId, router]);

  // Join session
  const joinSession = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}/join`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.ok) {
        setHasJoined(true);
        toaster.create({ title: "تم الانضمام للحصة", type: "success" });
        fetchUpdates();
      } else {
        toaster.create({ title: json.error || "لا يمكن الانضمام", type: "error" });
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    } finally {
      setJoining(false);
    }
  };

  // Poll for updates
  const fetchUpdates = useCallback(async () => {
    if (!session || !hasJoined) return;
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}`);
      const json = await res.json();
      if (json.ok) {
        setSession(json.data);
        if (json.data.status === "ENDED") {
          toaster.create({ title: "انتهت الحصة", type: "info" });
          router.push("/student/lessons");
        }
      }
    } catch (error) {
      console.error("Error polling:", error);
    }
  }, [session, hasJoined, sessionId, router]);

  useEffect(() => {
    if (hasJoined && session?.status === "LIVE") {
      pollRef.current = setInterval(fetchUpdates, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasJoined, session?.status, fetchUpdates]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Leave session
  const leaveSession = async () => {
    try {
      await fetch(`/api/teacher/lessons/${sessionId}/join`, { method: "DELETE" });
    } catch {
      // Ignore error
    }
    router.push("/student/lessons");
  };

  // Self controls
  const toggleMute = async () => {
    if (!session?.allowStudentMic) {
      toaster.create({ title: "الميكروفون غير مسموح", type: "error" });
      return;
    }
    const action = isMuted ? "unmute" : "mute";
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setIsMuted(!isMuted);
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  const toggleCamera = async () => {
    if (!session?.allowStudentCamera) {
      toaster.create({ title: "الكاميرا غير مسموحة", type: "error" });
      return;
    }
    const action = isCameraOff ? "camera-on" : "camera-off";
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setIsCameraOff(!isCameraOff);
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  const toggleHand = async () => {
    if (!session?.allowHandRaise) {
      toaster.create({ title: "رفع اليد غير مسموح", type: "error" });
      return;
    }
    const action = isHandRaised ? "lower-hand" : "raise-hand";
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setIsHandRaised(!isHandRaised);
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.allowChat) return;
    const localMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      authorId: user?.id || "",
      authorName: user?.name || "",
      authorRole: "STUDENT",
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, localMessage]);
    setNewMessage("");
    // TODO: Send to server via WebSocket
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (!session || !user) return null;

  // Pre-join screen
  if (!hasJoined) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900" color="white" dir="rtl">
        <Box
          bg="gray.800"
          p={8}
          borderRadius="2xl"
          maxW="500px"
          w="90%"
          textAlign="center"
        >
          <Box
            w="80px"
            h="80px"
            borderRadius="full"
            bg="brand.500"
            mx="auto"
            mb={4}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="3xl"
          >
            {session.teacherName.charAt(0)}
          </Box>

          <Heading size="lg" mb={2}>
            {session.title}
          </Heading>
          
          <Text color="gray.400" mb={4}>
            المعلم: {session.teacherName}
          </Text>

          {session.description && (
            <Text color="gray.300" mb={4}>
              {session.description}
            </Text>
          )}

          <HStack justify="center" gap={2} mb={6}>
            <Badge colorPalette={session.type === "VIDEO" ? "purple" : "blue"}>
              {session.type === "VIDEO" ? "🎥 فيديو" : "🎤 صوت"}
            </Badge>
            <Badge colorPalette={session.status === "LIVE" ? "red" : "yellow"}>
              {session.status === "LIVE" ? "🔴 مباشر" : "⏳ مجدول"}
            </Badge>
            {session.privacy === "PRIVATE" && (
              <Badge colorPalette="purple">🔐 خاص</Badge>
            )}
          </HStack>

          {/* Permissions Info */}
          <Box bg="gray.700" p={4} borderRadius="lg" mb={6} textAlign="right">
            <Text fontWeight="600" mb={2}>الصلاحيات في هذه الحصة:</Text>
            <Stack gap={1} fontSize="sm">
              <Text color={session.allowStudentMic ? "green.400" : "red.400"}>
                {session.allowStudentMic ? "✅" : "❌"} استخدام الميكروفون
              </Text>
              <Text color={session.allowStudentCamera ? "green.400" : "red.400"}>
                {session.allowStudentCamera ? "✅" : "❌"} استخدام الكاميرا
              </Text>
              <Text color={session.allowChat ? "green.400" : "red.400"}>
                {session.allowChat ? "✅" : "❌"} الدردشة الكتابية
              </Text>
              <Text color={session.allowHandRaise ? "green.400" : "red.400"}>
                {session.allowHandRaise ? "✅" : "❌"} رفع اليد
              </Text>
            </Stack>
          </Box>

          {session.status === "LIVE" ? (
            <Button
              colorPalette="green"
              size="lg"
              w="100%"
              onClick={joinSession}
              loading={joining}
            >
              🚀 انضم للحصة الآن
            </Button>
          ) : (
            <Box>
              <Text color="yellow.400" mb={4}>
                الحصة لم تبدأ بعد
              </Text>
              <Button
                variant="outline"
                colorPalette="brand"
                onClick={() => router.push("/student/lessons")}
              >
                العودة للحصص
              </Button>
            </Box>
          )}
        </Box>
      </Flex>
    );
  }

  // In-session view
  const activeParticipants = session.participants.filter((p) => p.isActive);
  const raisedHands = activeParticipants.filter((p) => p.isHandRaised);

  return (
    <Box minH="100vh" bg="gray.900" color="white" dir="rtl">
      {/* Header */}
      <Box bg="gray.800" px={4} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={3}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg="red.500"
              css={{ animation: "pulse 2s infinite" }}
            />
            <Heading size="md">{session.title}</Heading>
            <Badge colorPalette="red">مباشر</Badge>
          </Flex>

          <HStack gap={3}>
            <Badge colorPalette="blue" fontSize="sm" px={3} py={1}>
              👥 {activeParticipants.length} مشارك
            </Badge>
            <Button variant="outline" colorPalette="red" size="sm" onClick={leaveSession}>
              🚪 مغادرة
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Flex h="calc(100vh - 130px)">
        {/* Main Video Area */}
        <Box flex={1} p={4}>
          <Flex direction="column" h="100%" gap={4}>
            {/* Main Stage - Teacher */}
            <Box
              flex={1}
              bg="gray.800"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              <VStack gap={4}>
                <Box
                  w="120px"
                  h="120px"
                  borderRadius="full"
                  bg="brand.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="4xl"
                  fontWeight="bold"
                >
                  {session.teacherName.charAt(0)}
                </Box>
                <Text fontSize="lg" fontWeight="600">
                  {session.teacherName}
                </Text>
                <Badge colorPalette="yellow">المعلم</Badge>
              </VStack>

              {raisedHands.length > 0 && (
                <Box
                  position="absolute"
                  top={4}
                  right={4}
                  bg="yellow.500"
                  color="black"
                  px={3}
                  py={2}
                  borderRadius="lg"
                  fontWeight="600"
                >
                  ✋ {raisedHands.length} يد مرفوعة
                </Box>
              )}
            </Box>

            {/* Other Students */}
            {activeParticipants.length > 1 && (
              <Flex gap={2} overflowX="auto" py={2}>
                {activeParticipants
                  .filter((p) => p.userId !== session.teacherId && p.userId !== user.id)
                  .slice(0, 5)
                  .map((participant) => (
                    <Box
                      key={participant.id}
                      w="100px"
                      h="80px"
                      bg="gray.800"
                      borderRadius="lg"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                      flexShrink={0}
                      border={participant.isHandRaised ? "2px solid" : "none"}
                      borderColor="yellow.500"
                    >
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>{participant.userName.charAt(0)}</Avatar.Fallback>
                      </Avatar.Root>
                      <Text fontSize="xs" mt={1} lineClamp={1}>
                        {participant.userName}
                      </Text>
                      {participant.isMuted && (
                        <Box position="absolute" bottom={1} left={1} fontSize="xs" bg="red.600" px={1} borderRadius="sm">
                          🔇
                        </Box>
                      )}
                    </Box>
                  ))}
              </Flex>
            )}
          </Flex>
        </Box>

        {/* Chat Sidebar */}
        {showChat && session.allowChat && (
          <Box w="300px" bg="gray.800" borderRight="1px solid" borderColor="gray.700" display="flex" flexDirection="column">
            <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.700">
              <Text fontWeight="600">💬 الدردشة</Text>
            </Box>
            <Box flex={1} overflowY="auto" p={3}>
              <Stack gap={2}>
                {chatMessages.map((msg) => (
                  <Box key={msg.id} bg="gray.700" p={2} borderRadius="lg">
                    <Text fontSize="xs" fontWeight="600" color="brand.400" mb={1}>
                      {msg.authorName}
                    </Text>
                    <Text fontSize="sm">{msg.content}</Text>
                  </Box>
                ))}
                {chatMessages.length === 0 && (
                  <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                    لا توجد رسائل بعد
                  </Text>
                )}
                <div ref={chatEndRef} />
              </Stack>
            </Box>
            <Flex p={3} gap={2} borderTop="1px solid" borderColor="gray.700">
              <Input
                flex={1}
                placeholder="اكتب رسالة..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                bg="gray.700"
                border="none"
              />
              <Button colorPalette="brand" onClick={sendMessage}>
                إرسال
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>

      {/* Controls Bar */}
      <Box bg="gray.800" px={4} py={3} borderTop="1px solid" borderColor="gray.700">
        <Flex justify="center" gap={4}>
          {/* Mute */}
          <Button
            size="lg"
            borderRadius="full"
            colorPalette={isMuted ? "red" : "green"}
            onClick={toggleMute}
            disabled={!session.allowStudentMic}
            title={session.allowStudentMic ? (isMuted ? "تشغيل الميكروفون" : "كتم الميكروفون") : "غير مسموح"}
          >
            {isMuted ? "🔇" : "🎤"}
          </Button>

          {/* Camera */}
          {session.type === "VIDEO" && (
            <Button
              size="lg"
              borderRadius="full"
              colorPalette={isCameraOff ? "red" : "green"}
              onClick={toggleCamera}
              disabled={!session.allowStudentCamera}
              title={session.allowStudentCamera ? (isCameraOff ? "تشغيل الكاميرا" : "إيقاف الكاميرا") : "غير مسموح"}
            >
              {isCameraOff ? "📷" : "🎥"}
            </Button>
          )}

          {/* Raise Hand */}
          <Button
            size="lg"
            borderRadius="full"
            colorPalette={isHandRaised ? "yellow" : "gray"}
            onClick={toggleHand}
            disabled={!session.allowHandRaise}
            title={session.allowHandRaise ? (isHandRaised ? "إنزال اليد" : "رفع اليد") : "غير مسموح"}
          >
            ✋
          </Button>

          {/* Toggle Chat */}
          {session.allowChat && (
            <Button
              size="lg"
              borderRadius="full"
              colorPalette={showChat ? "brand" : "gray"}
              onClick={() => setShowChat(!showChat)}
              title="الدردشة"
            >
              💬
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
