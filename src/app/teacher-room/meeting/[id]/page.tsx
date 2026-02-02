"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
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
import PremiumCard from "@/components/ui/PremiumCard";

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
  isCoHost: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "VOICE";
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  hostId: string;
  hostName: string;
  participants: Participant[];
  chatMessages: ChatMessage[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function MeetingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);

  // Local media state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Refs for media
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const json = await res.json();
        if (json.ok && json.data) {
          if (json.data.role !== "INSTRUCTOR" && json.data.role !== "ADMIN") {
            toaster.create({
              title: "غرفة المعلمين للمدرسين والإداريين فقط",
              type: "error",
            });
            router.push("/");
            return;
          }
          setUser(json.data);
        } else {
          router.push("/auth/login?redirect=/teacher-room");
        }
      } catch {
        router.push("/auth/login?redirect=/teacher-room");
      }
    };
    checkAuth();
  }, [router]);

  // Fetch meeting details
  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher-room/meetings/${meetingId}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        setMeeting(json.data);
        setParticipants(json.data.participants.filter((p: Participant) => p.isActive));
        setChatMessages(json.data.chatMessages);
        if (json.data.status === "ENDED") {
          toaster.create({ title: "الاجتماع انتهى", type: "info" });
          router.push("/teacher-room");
        }
      } else {
        toaster.create({ title: json.error, type: "error" });
        router.push("/teacher-room");
      }
    } catch (error) {
      console.error("Error fetching meeting:", error);
    } finally {
      setLoading(false);
    }
  }, [meetingId, router]);

  useEffect(() => {
    if (user && meetingId) {
      fetchMeeting();
    }
  }, [user, meetingId, fetchMeeting]);

  // Poll for updates when joined
  useEffect(() => {
    if (hasJoined) {
      pollIntervalRef.current = setInterval(() => {
        fetchParticipants();
        fetchNewChatMessages();
      }, 2000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [hasJoined]);

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/teacher-room/meetings/${meetingId}/participant`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        setParticipants(json.data);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  // Fetch new chat messages
  const fetchNewChatMessages = async () => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    const after = lastMessage?.createdAt || "";
    try {
      const res = await fetch(
        `/api/teacher-room/meetings/${meetingId}/chat${after ? `?after=${after}` : ""}`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (json.ok && json.data.length > 0) {
        setChatMessages((prev) => [...prev, ...json.data]);
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Start local media
  const startLocalMedia = async () => {
    try {
      const constraints = {
        video: meeting?.type === "VIDEO" ? { width: 640, height: 480 } : false,
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media:", error);
      toaster.create({
        title: "لا يمكن الوصول للكاميرا أو الميكروفون",
        type: "error",
      });
    }
  };

  // Stop local media
  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  // Join meeting
  const joinMeeting = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/teacher-room/meetings/${meetingId}/join`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        setHasJoined(true);
        await startLocalMedia();
        toaster.create({ title: "تم الانضمام للاجتماع", type: "success" });
      } else {
        toaster.create({ title: json.error, type: "error" });
      }
    } catch {
      toaster.create({ title: "حدث خطأ في الانضمام", type: "error" });
    } finally {
      setJoining(false);
    }
  };

  // Leave meeting
  const leaveMeeting = async () => {
    try {
      await fetch(`/api/teacher-room/meetings/${meetingId}/join`, {
        method: "DELETE",
        credentials: "include",
      });
      stopLocalMedia();
      router.push("/teacher-room");
    } catch {
      router.push("/teacher-room");
    }
  };

  // End meeting (host only)
  const endMeeting = async () => {
    try {
      const res = await fetch(`/api/teacher-room/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.create({ title: "تم إنهاء الاجتماع", type: "success" });
        stopLocalMedia();
        router.push("/teacher-room");
      } else {
        toaster.create({ title: json.error, type: "error" });
      }
    } catch {
      toaster.create({ title: "حدث خطأ", type: "error" });
    }
  };

  // Toggle mute
  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }
    await fetch(`/api/teacher-room/meetings/${meetingId}/participant`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isMuted: newMuted }),
      credentials: "include",
    });
  };

  // Toggle camera
  const toggleCamera = async () => {
    const newCameraOff = !isCameraOff;
    setIsCameraOff(newCameraOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !newCameraOff;
      });
    }
    await fetch(`/api/teacher-room/meetings/${meetingId}/participant`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCameraOff: newCameraOff }),
      credentials: "include",
    });
  };

  // Toggle hand raised
  const toggleHandRaised = async () => {
    const newHandRaised = !isHandRaised;
    setIsHandRaised(newHandRaised);
    await fetch(`/api/teacher-room/meetings/${meetingId}/participant`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHandRaised: newHandRaised }),
      credentials: "include",
    });
  };

  // Screen share (browser API)
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        // In production, you'd replace the video track in your WebRTC connection
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (error) {
        console.error("Screen share error:", error);
      }
    } else {
      setIsScreenSharing(false);
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

  // Send chat message
  const sendChatMessage = async () => {
    if (!newChatMessage.trim()) return;
    try {
      const res = await fetch(`/api/teacher-room/meetings/${meetingId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newChatMessage }),
      });
      const json = await res.json();
      if (json.ok) {
        setChatMessages((prev) => [...prev, json.data]);
        setNewChatMessage("");
      }
    } catch (error) {
      console.error("Error sending chat:", error);
    }
  };

  const isHost = user?.id === meeting?.hostId;

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="spinner" />
      </Flex>
    );
  }

  if (!meeting || !user) return null;

  // Pre-join screen
  if (!hasJoined) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900" p={4}>
        <PremiumCard maxW="500px" w="100%" p={8}>
          <Stack gap={6} align="center" textAlign="center">
            <Box
              bg="accentSubtle"
              w="80px"
              h="80px"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="3xl"
            >
              {meeting.type === "VIDEO" ? "📹" : "🎤"}
            </Box>

            <Stack gap={2}>
              <Heading size="lg">{meeting.title}</Heading>
              <Text color="muted">المضيف: {meeting.hostName}</Text>
              <Badge colorPalette={meeting.status === "LIVE" ? "green" : "blue"}>
                {meeting.status === "LIVE" ? "🔴 مباشر الآن" : "مجدول"}
              </Badge>
            </Stack>

            {meeting.description && (
              <Text color="muted" fontSize="sm">
                {meeting.description}
              </Text>
            )}

            <Text fontSize="sm" color="muted">
              {participants.length} مشارك حالياً
            </Text>

            {meeting.status === "LIVE" ? (
              <Button
                colorPalette="green"
                size="lg"
                w="100%"
                onClick={joinMeeting}
                loading={joining}
              >
                انضم للاجتماع
              </Button>
            ) : (
              <Text color="muted">الاجتماع لم يبدأ بعد</Text>
            )}

            <Button variant="ghost" onClick={() => router.push("/teacher-room")}>
              العودة لغرفة المعلمين
            </Button>
          </Stack>
        </PremiumCard>
      </Flex>
    );
  }

  // Meeting room
  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
      {/* Header */}
      <Flex
        bg="gray.800"
        px={4}
        py={3}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <Stack gap={0}>
          <Text fontWeight="700" color="white">
            {meeting.title}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {participants.length} مشارك
          </Text>
        </Stack>

        <HStack gap={2}>
          <Badge colorPalette="green">🔴 مباشر</Badge>
          {isHost && (
            <Button colorPalette="red" size="sm" onClick={endMeeting}>
              إنهاء الاجتماع
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Main Content */}
      <Flex flex={1} overflow="hidden">
        {/* Video Grid */}
        <Box flex={1} p={4} overflow="auto">
          <Grid
            templateColumns={{
              base: "1fr",
              md: participants.length > 1 ? "repeat(2, 1fr)" : "1fr",
              lg:
                participants.length > 2
                  ? "repeat(3, 1fr)"
                  : participants.length > 1
                    ? "repeat(2, 1fr)"
                    : "1fr",
            }}
            gap={4}
            h="100%"
          >
            {/* Local Video (Self) */}
            <Box
              position="relative"
              bg="gray.800"
              borderRadius="xl"
              overflow="hidden"
              aspectRatio="16/9"
              border="3px solid"
              borderColor="borderAccent"
            >
              {meeting.type === "VIDEO" && !isCameraOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                  }}
                />
              ) : (
                <Flex
                  position="absolute"
                  inset={0}
                  align="center"
                  justify="center"
                  bg="gray.800"
                >
                  <Avatar.Root size="2xl">
                    <Avatar.Fallback bg="avatarBg" color="avatarText">{user.name.charAt(0)}</Avatar.Fallback>
                  </Avatar.Root>
                </Flex>
              )}

              {/* Name badge */}
              <Flex
                position="absolute"
                bottom={2}
                left={2}
                right={2}
                justify="space-between"
                align="center"
              >
                <Badge bg="blackAlpha.700" color="white" px={2}>
                  {user.name} (أنت)
                </Badge>
                <HStack gap={1}>
                  {isMuted && (
                    <Badge bg="red.600" color="white">
                      🔇
                    </Badge>
                  )}
                  {isCameraOff && (
                    <Badge bg="red.600" color="white">
                      📷
                    </Badge>
                  )}
                </HStack>
              </Flex>
            </Box>

            {/* Other Participants */}
            {participants
              .filter((p) => p.userId !== user.id)
              .map((participant) => (
                <Box
                  key={participant.id}
                  position="relative"
                  bg="gray.800"
                  borderRadius="xl"
                  overflow="hidden"
                  aspectRatio="16/9"
                >
                  {/* In production, this would show their video stream via WebRTC */}
                  <Flex
                    position="absolute"
                    inset={0}
                    align="center"
                    justify="center"
                    bg="gray.800"
                  >
                    <Avatar.Root size="2xl">
                      <Avatar.Fallback bg="green.600">{participant.userName.charAt(0)}</Avatar.Fallback>
                    </Avatar.Root>
                  </Flex>

                  {/* Hand raised indicator */}
                  {participant.isHandRaised && (
                    <Box
                      position="absolute"
                      top={2}
                      right={2}
                      fontSize="2xl"
                      css={{
                        animation: "bounce 1s infinite",
                        "@keyframes bounce": {
                          "0%, 100%": { transform: "translateY(0)" },
                          "50%": { transform: "translateY(-10px)" },
                        },
                      }}
                    >
                      ✋
                    </Box>
                  )}

                  <Flex
                    position="absolute"
                    bottom={2}
                    left={2}
                    right={2}
                    justify="space-between"
                    align="center"
                  >
                    <Badge bg="blackAlpha.700" color="white" px={2}>
                      {participant.userName}
                      {participant.isCoHost && " (مساعد)"}
                    </Badge>
                    <HStack gap={1}>
                      {participant.isMuted && (
                        <Badge bg="red.600" color="white">
                          🔇
                        </Badge>
                      )}
                      {participant.isCameraOff && (
                        <Badge bg="red.600" color="white">
                          📷
                        </Badge>
                      )}
                    </HStack>
                  </Flex>
                </Box>
              ))}
          </Grid>
        </Box>

        {/* Side Panels */}
        {(showChat || showParticipants) && (
          <Box
            w="320px"
            bg="gray.800"
            borderRight="1px solid"
            borderColor="gray.700"
            display="flex"
            flexDirection="column"
          >
            {/* Panel Toggle */}
            <HStack p={2} borderBottom="1px solid" borderColor="gray.700">
              <Button
                size="sm"
                variant={showChat ? "solid" : "ghost"}
                colorPalette="brand"
                onClick={() => {
                  setShowChat(true);
                  setShowParticipants(false);
                }}
                flex={1}
              >
                💬 الدردشة
              </Button>
              <Button
                size="sm"
                variant={showParticipants ? "solid" : "ghost"}
                colorPalette="brand"
                onClick={() => {
                  setShowChat(false);
                  setShowParticipants(true);
                }}
                flex={1}
              >
                👥 المشاركون ({participants.length})
              </Button>
            </HStack>

            {/* Chat Panel */}
            {showChat && (
              <>
                <VStack
                  flex={1}
                  overflow="auto"
                  p={3}
                  gap={2}
                  align="stretch"
                >
                  {chatMessages.map((msg) => (
                    <Box
                      key={msg.id}
                      bg={msg.authorId === user.id ? "accentSubtle" : "gray.700"}
                      borderRadius="lg"
                      px={3}
                      py={2}
                    >
                      <Text fontSize="xs" color="accent" fontWeight="600">
                        {msg.authorName}
                      </Text>
                      <Text fontSize="sm" color="white">
                        {msg.content}
                      </Text>
                    </Box>
                  ))}
                  <div ref={chatEndRef} />
                </VStack>

                <Flex p={2} gap={2} borderTop="1px solid" borderColor="gray.700">
                  <Input
                    size="sm"
                    placeholder="اكتب رسالة..."
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendChatMessage();
                    }}
                    bg="gray.700"
                    border="none"
                  />
                  <Button
                    size="sm"
                    colorPalette="brand"
                    onClick={sendChatMessage}
                  >
                    إرسال
                  </Button>
                </Flex>
              </>
            )}

            {/* Participants Panel */}
            {showParticipants && (
              <VStack flex={1} overflow="auto" p={3} gap={2} align="stretch">
                {participants.map((p) => (
                  <Flex
                    key={p.id}
                    align="center"
                    gap={3}
                    bg="gray.700"
                    p={2}
                    borderRadius="lg"
                  >
                    <Avatar.Root size="sm">
                      <Avatar.Fallback bg={p.userRole === "ADMIN" ? "brand.600" : "green.600"}>
                        {p.userName.charAt(0)}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <Stack gap={0} flex={1}>
                      <Text fontSize="sm" color="white" fontWeight="600">
                        {p.userName}
                        {p.userId === meeting.hostId && " (المضيف)"}
                        {p.userId === user.id && " (أنت)"}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {p.userRole === "ADMIN" ? "إدارة" : "معلم"}
                      </Text>
                    </Stack>
                    <HStack gap={1}>
                      {p.isHandRaised && <Text>✋</Text>}
                      {p.isMuted && <Text>🔇</Text>}
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        )}
      </Flex>

      {/* Control Bar */}
      <Flex
        bg="gray.800"
        px={4}
        py={4}
        justify="center"
        gap={3}
        borderTop="1px solid"
        borderColor="gray.700"
      >
        {/* Mute/Unmute */}
        <IconButton
          aria-label={isMuted ? "فتح الميكروفون" : "كتم الميكروفون"}
          size="lg"
          borderRadius="full"
          bg={isMuted ? "red.600" : "gray.600"}
          _hover={{ bg: isMuted ? "red.700" : "gray.500" }}
          onClick={toggleMute}
        >
          {isMuted ? "🔇" : "🎤"}
        </IconButton>

        {/* Camera */}
        {meeting.type === "VIDEO" && (
          <IconButton
            aria-label={isCameraOff ? "فتح الكاميرا" : "إغلاق الكاميرا"}
            size="lg"
            borderRadius="full"
            bg={isCameraOff ? "red.600" : "gray.600"}
            _hover={{ bg: isCameraOff ? "red.700" : "gray.500" }}
            onClick={toggleCamera}
          >
            {isCameraOff ? "📷" : "📹"}
          </IconButton>
        )}

        {/* Screen Share */}
        {meeting.type === "VIDEO" && (
          <IconButton
            aria-label="مشاركة الشاشة"
            size="lg"
            borderRadius="full"
            bg={isScreenSharing ? "green.600" : "gray.600"}
            _hover={{ bg: isScreenSharing ? "green.700" : "gray.500" }}
            onClick={toggleScreenShare}
          >
            🖥️
          </IconButton>
        )}

        {/* Raise Hand */}
        <IconButton
          aria-label={isHandRaised ? "إنزال اليد" : "رفع اليد"}
          size="lg"
          borderRadius="full"
          bg={isHandRaised ? "yellow.600" : "gray.600"}
          _hover={{ bg: isHandRaised ? "yellow.700" : "gray.500" }}
          onClick={toggleHandRaised}
        >
          ✋
        </IconButton>

        {/* Toggle Chat */}
        <IconButton
          aria-label="الدردشة"
          size="lg"
          borderRadius="full"
          bg={showChat ? "brand.600" : "gray.600"}
          _hover={{ bg: showChat ? "brand.700" : "gray.500" }}
          onClick={() => {
            setShowChat(!showChat);
            setShowParticipants(false);
          }}
        >
          💬
        </IconButton>

        {/* Toggle Participants */}
        <IconButton
          aria-label="المشاركون"
          size="lg"
          borderRadius="full"
          bg={showParticipants ? "brand.600" : "gray.600"}
          _hover={{ bg: showParticipants ? "brand.700" : "gray.500" }}
          onClick={() => {
            setShowParticipants(!showParticipants);
            setShowChat(false);
          }}
        >
          👥
        </IconButton>

        {/* Leave */}
        <IconButton
          aria-label="مغادرة"
          size="lg"
          borderRadius="full"
          bg="red.600"
          _hover={{ bg: "red.700" }}
          onClick={leaveMeeting}
        >
          📞
        </IconButton>
      </Flex>
    </Box>
  );
}
