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

export default function LessonRoomPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth and fetch session
  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const authRes = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const authJson = await authRes.json();
        if (!authJson.ok || !authJson.data) {
          router.push(`/auth/login?redirect=/teacher/lessons/${sessionId}`);
          return;
        }
        setUser(authJson.data);

        // Fetch session
        const sessionRes = await fetch(`/api/teacher/lessons/${sessionId}`, {
          credentials: "include",
        });
        const sessionJson = await sessionRes.json();
        if (!sessionJson.ok) {
          toaster.create({ title: sessionJson.error, type: "error" });
          router.push("/teacher/lessons");
          return;
        }
        setSession(sessionJson.data);

        // Join session if not teacher
        if (!sessionJson.data.isTeacher && sessionJson.data.status === "LIVE") {
          await fetch(`/api/teacher/lessons/${sessionId}/join`, {
            method: "POST",
            credentials: "include",
          });
        }
      } catch (error) {
        console.error("Error initializing:", error);
        router.push("/teacher/lessons");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sessionId, router]);

  // Poll for updates
  const fetchUpdates = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        setSession(json.data);
        if (json.data.status === "ENDED") {
          toaster.create({ title: "انتهت الحصة", type: "info" });
          router.push("/teacher/lessons");
        }
      }
    } catch (error) {
      console.error("Error polling:", error);
    }
  }, [session, sessionId, router]);

  useEffect(() => {
    if (session?.status === "LIVE") {
      pollRef.current = setInterval(fetchUpdates, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session?.status, fetchUpdates]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Session controls
  const endSession = async () => {
    try {
      const res = await fetch(`/api/teacher/lessons/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.create({ title: "تم إنهاء الحصة", type: "success" });
        router.push("/teacher/lessons");
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  const leaveSession = async () => {
    try {
      await fetch(`/api/teacher/lessons/${sessionId}/join`, {
        method: "DELETE",
        credentials: "include",
      });
      router.push("/student/lessons");
    } catch {
      router.push("/student/lessons");
    }
  };

  // Participant controls (teacher only)
  const controlParticipant = async (participantId: string, action: string) => {
    try {
      await fetch(`/api/teacher/lessons/${sessionId}/participant`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, action }),
        credentials: "include",
      });
      fetchUpdates();
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  // Self controls
  const toggleMute = async () => {
    const action = isMuted ? "unmute" : "mute";
    try {
      await fetch(`/api/teacher/lessons/${sessionId}/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      });
      setIsMuted(!isMuted);
    } catch {
      toaster.create({ title: "غير مسموح", type: "error" });
    }
  };

  const toggleCamera = async () => {
    const action = isCameraOff ? "camera-on" : "camera-off";
    try {
      await fetch(`/api/teacher/lessons/${sessionId}/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      });
      setIsCameraOff(!isCameraOff);
    } catch {
      toaster.create({ title: "غير مسموح", type: "error" });
    }
  };

  const toggleHand = async () => {
    const action = isHandRaised ? "lower-hand" : "raise-hand";
    try {
      await fetch(`/api/teacher/lessons/${sessionId}/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      });
      setIsHandRaised(!isHandRaised);
    } catch {
      toaster.create({ title: "غير مسموح", type: "error" });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    // Add local message immediately
    const localMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      authorId: user?.id || "",
      authorName: user?.name || "",
      authorRole: user?.role || "",
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, localMessage]);
    setNewMessage("");
    // TODO: Send to server
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="spinner" />
      </Flex>
    );
  }

  if (!session || !user) return null;

  const isTeacher = session.isTeacher;
  const activeParticipants = session.participants.filter((p) => p.isActive);
  const raisedHands = activeParticipants.filter((p) => p.isHandRaised);

  return (
    <Box minH="100vh" bg="gray.900" color="white">
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
            {session.privacy === "PRIVATE" && (
              <Badge colorPalette="purple">🔐 خاص</Badge>
            )}
          </Flex>

          <HStack gap={3}>
            <Badge colorPalette="blue" fontSize="sm" px={3} py={1}>
              👥 {activeParticipants.length} مشارك
            </Badge>
            {isTeacher ? (
              <Button colorPalette="red" size="sm" onClick={endSession}>
                🛑 إنهاء الحصة
              </Button>
            ) : (
              <Button variant="outline" colorPalette="red" size="sm" onClick={leaveSession}>
                🚪 مغادرة
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      <Flex h="calc(100vh - 130px)">
        {/* Main Video Area */}
        <Box flex={1} p={4}>
          <Flex direction="column" h="100%" gap={4}>
            {/* Main Stage */}
            <Box
              flex={1}
              bg="gray.800"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              {/* Teacher Video Placeholder */}
              <VStack gap={4}>
                <Box
                  w="120px"
                  h="120px"
                  borderRadius="full"
                  bg="accent"
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

              {/* Raised Hands Indicator */}
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

            {/* Participants Thumbnails */}
            {activeParticipants.length > 1 && (
              <Flex gap={2} overflowX="auto" py={2}>
                {activeParticipants
                  .filter((p) => p.userId !== session.teacherId)
                  .slice(0, 6)
                  .map((participant) => (
                    <Box
                      key={participant.id}
                      w="120px"
                      h="90px"
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
                      <Flex position="absolute" bottom={1} gap={1}>
                        {participant.isMuted && (
                          <Box fontSize="xs" bg="red.600" px={1} borderRadius="sm">🔇</Box>
                        )}
                        {participant.isHandRaised && (
                          <Box fontSize="xs" bg="yellow.500" px={1} borderRadius="sm" color="black">✋</Box>
                        )}
                      </Flex>
                    </Box>
                  ))}
              </Flex>
            )}
          </Flex>
        </Box>

        {/* Sidebar */}
        <Box w="320px" bg="gray.800" borderRight="1px solid" borderColor="gray.700" display="flex" flexDirection="column">
          {/* Sidebar Tabs */}
          <Flex borderBottom="1px solid" borderColor="gray.700">
            <Button
              flex={1}
              variant={showParticipants ? "solid" : "ghost"}
              colorPalette={showParticipants ? "brand" : "gray"}
              borderRadius={0}
              onClick={() => { setShowParticipants(true); setShowChat(false); }}
            >
              👥 المشاركون ({activeParticipants.length})
            </Button>
            <Button
              flex={1}
              variant={showChat ? "solid" : "ghost"}
              colorPalette={showChat ? "brand" : "gray"}
              borderRadius={0}
              onClick={() => { setShowChat(true); setShowParticipants(false); }}
            >
              💬 الدردشة
            </Button>
          </Flex>

          {/* Participants List */}
          {showParticipants && (
            <Box flex={1} overflowY="auto" p={3}>
              <Stack gap={2}>
                {activeParticipants.map((participant) => (
                  <Flex
                    key={participant.id}
                    align="center"
                    justify="space-between"
                    p={2}
                    bg="gray.700"
                    borderRadius="lg"
                  >
                    <Flex align="center" gap={2}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>{participant.userName.charAt(0)}</Avatar.Fallback>
                      </Avatar.Root>
                      <Box>
                        <Text fontSize="sm" fontWeight="500">
                          {participant.userName}
                          {participant.isHandRaised && " ✋"}
                        </Text>
                        <Badge size="sm" colorPalette={participant.userRole === "INSTRUCTOR" ? "yellow" : "blue"}>
                          {participant.userRole === "INSTRUCTOR" ? "معلم" : "طالب"}
                        </Badge>
                      </Box>
                    </Flex>

                    {/* Teacher controls */}
                    {isTeacher && participant.userId !== user.id && (
                      <HStack gap={1}>
                        <IconButton
                          aria-label={participant.isMuted ? "Unmute" : "Mute"}
                          size="xs"
                          variant="ghost"
                          colorPalette={participant.isMuted ? "red" : "green"}
                          onClick={() => controlParticipant(participant.id, participant.isMuted ? "unmute" : "mute")}
                        >
                          {participant.isMuted ? "🔇" : "🔊"}
                        </IconButton>
                        {participant.isHandRaised && (
                          <IconButton
                            aria-label="Lower hand"
                            size="xs"
                            variant="ghost"
                            onClick={() => controlParticipant(participant.id, "lower-hand")}
                          >
                            👇
                          </IconButton>
                        )}
                        <IconButton
                          aria-label="Kick"
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => controlParticipant(participant.id, "kick")}
                        >
                          🚫
                        </IconButton>
                      </HStack>
                    )}
                  </Flex>
                ))}
              </Stack>
            </Box>
          )}

          {/* Chat */}
          {showChat && session.allowChat && (
            <Flex flex={1} direction="column">
              <Box flex={1} overflowY="auto" p={3}>
                <Stack gap={2}>
                  {chatMessages.map((msg) => (
                    <Box key={msg.id} bg="gray.700" p={2} borderRadius="lg">
                      <Flex align="center" gap={2} mb={1}>
                        <Text fontSize="xs" fontWeight="600" color="accent">
                          {msg.authorName}
                        </Text>
                        <Badge size="sm">
                          {msg.authorRole === "INSTRUCTOR" ? "معلم" : "طالب"}
                        </Badge>
                      </Flex>
                      <Text fontSize="sm">{msg.content}</Text>
                    </Box>
                  ))}
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
            </Flex>
          )}
        </Box>
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
            disabled={!isTeacher && !session.allowStudentMic}
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
              disabled={!isTeacher && !session.allowStudentCamera}
            >
              {isCameraOff ? "📷" : "🎥"}
            </Button>
          )}

          {/* Screen Share (Teacher only) */}
          {isTeacher && session.allowScreenShare && (
            <Button
              size="lg"
              borderRadius="full"
              colorPalette={isScreenSharing ? "green" : "gray"}
              onClick={() => setIsScreenSharing(!isScreenSharing)}
            >
              🖥️
            </Button>
          )}

          {/* Raise Hand (Students) */}
          {!isTeacher && session.allowHandRaise && (
            <Button
              size="lg"
              borderRadius="full"
              colorPalette={isHandRaised ? "yellow" : "gray"}
              onClick={toggleHand}
            >
              ✋
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
