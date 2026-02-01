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
  NativeSelect,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceRecorder from "@/components/ui/VoiceRecorder";
import PremiumCard from "@/components/ui/PremiumCard";

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
}

interface Message {
  id: string;
  content: string | null;
  type: "TEXT" | "VOICE" | "FILE" | "SYSTEM";
  voiceUrl: string | null;
  voiceDuration: number | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorRole: "ADMIN" | "INSTRUCTOR";
  replyToId: string | null;
  replyTo: {
    id: string;
    content: string | null;
    authorName: string;
    type: string;
  } | null;
  reactions: Reaction[];
  isEdited: boolean;
  isPinned: boolean;
  createdAt: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "VOICE";
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  privacy: "PUBLIC" | "PRIVATE";
  scheduledAt: string | null;
  hostId: string;
  hostName: string;
  hostAvatar: string | null;
  isHost?: boolean;
  userInvitationStatus?: string | null;
  participants: {
    id: string;
    userName: string;
    userAvatar: string | null;
  }[];
  _count: { participants: number; invitations?: number };
}

interface InvitableUser {
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
  avatar?: string;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "🤔", "🎉", "🙏", "💯"];

export default function TeacherRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "meetings">("chat");
  const [showNewMeetingForm, setShowNewMeetingForm] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingDescription, setNewMeetingDescription] = useState("");
  const [newMeetingType, setNewMeetingType] = useState<"VIDEO" | "VOICE">("VIDEO");
  const [newMeetingPrivacy, setNewMeetingPrivacy] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [requireApproval, setRequireApproval] = useState(false);
  const [allowChat, setAllowChat] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [allowHandRaise, setAllowHandRaise] = useState(true);
  const [notifyOnCreate, setNotifyOnCreate] = useState(true);
  const [sendEmailInvitations, setSendEmailInvitations] = useState(true);
  const [selectedInvitees, setSelectedInvitees] = useState<InvitableUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<InvitableUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication and role
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
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher-room/messages?limit=50");
      const json = await res.json();
      if (json.ok) {
        setMessages(json.data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher-room/meetings?limit=10");
      const json = await res.json();
      if (json.ok) {
        setMeetings(json.data);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchMeetings();
      // Poll for new messages every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchMessages();
        fetchMeetings();
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user, fetchMessages, fetchMeetings]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/teacher-room/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          type: "TEXT",
          replyToId: replyingTo?.id,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessages((prev) => [...prev, json.data]);
        setNewMessage("");
        setReplyingTo(null);
      } else {
        toaster.create({ title: json.error, type: "error" });
      }
    } catch {
      toaster.create({ title: "حدث خطأ في إرسال الرسالة", type: "error" });
    } finally {
      setSending(false);
    }
  };

  // Send voice message
  const sendVoiceMessage = async (blob: Blob, duration: number) => {
    // In production, upload to storage and get URL
    // For now, convert to base64 data URL
    const reader = new FileReader();
    reader.onloadend = async () => {
      const voiceUrl = reader.result as string;
      try {
        const res = await fetch("/api/teacher-room/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "VOICE",
            voiceUrl,
            voiceDuration: duration,
            replyToId: replyingTo?.id,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setMessages((prev) => [...prev, json.data]);
          setReplyingTo(null);
          toaster.create({ title: "تم إرسال الرسالة الصوتية", type: "success" });
        } else {
          toaster.create({ title: json.error, type: "error" });
        }
      } catch {
        toaster.create({ title: "حدث خطأ في إرسال الرسالة الصوتية", type: "error" });
      }
    };
    reader.readAsDataURL(blob);
  };

  // Add reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/teacher-room/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const json = await res.json();
      if (json.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
    setShowEmojiPicker(null);
  };

  // Fetch available users for inviting
  const fetchAvailableUsers = useCallback(async (search = "") => {
    setLoadingUsers(true);
    try {
      const excludeIds = selectedInvitees.map((u) => u.id).join(",");
      const res = await fetch(
        `/api/teacher-room/users?search=${encodeURIComponent(search)}&exclude=${excludeIds}`
      );
      const json = await res.json();
      if (json.ok) {
        setAvailableUsers(json.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedInvitees]);

  // Fetch users when privacy is PRIVATE and form is shown
  useEffect(() => {
    if (showNewMeetingForm && newMeetingPrivacy === "PRIVATE") {
      fetchAvailableUsers(userSearchQuery);
    }
  }, [showNewMeetingForm, newMeetingPrivacy, userSearchQuery, fetchAvailableUsers]);

  // Create meeting
  const createMeeting = async (instant: boolean) => {
    if (!instant && !newMeetingTitle.trim()) {
      toaster.create({ title: "يرجى إدخال عنوان الاجتماع", type: "error" });
      return;
    }

    if (newMeetingPrivacy === "PRIVATE" && selectedInvitees.length === 0 && !instant) {
      toaster.create({ title: "يرجى اختيار المدعوين للاجتماع الخاص", type: "error" });
      return;
    }

    setCreatingMeeting(true);
    try {
      const res = await fetch("/api/teacher-room/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: instant ? `اجتماع ${user?.name}` : newMeetingTitle,
          description: newMeetingDescription || undefined,
          type: newMeetingType,
          privacy: instant ? "PUBLIC" : newMeetingPrivacy,
          requireApproval,
          allowChat,
          allowScreenShare,
          allowHandRaise,
          notifyOnCreate,
          sendEmailInvitations,
          sendInAppNotifications: true,
          invitedUserIds: newMeetingPrivacy === "PRIVATE" ? selectedInvitees.map((u) => u.id) : undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toaster.create({ 
          title: "تم إنشاء الاجتماع بنجاح", 
          description: notifyOnCreate ? "تم إرسال الإشعارات للمدعوين" : undefined,
          type: "success" 
        });
        resetMeetingForm();
        fetchMeetings();
        if (instant || !showNewMeetingForm) {
          router.push(`/teacher-room/meeting/${json.data.id}`);
        }
      } else {
        toaster.create({ title: json.error, type: "error" });
      }
    } catch {
      toaster.create({ title: "حدث خطأ في إنشاء الاجتماع", type: "error" });
    } finally {
      setCreatingMeeting(false);
    }
  };

  // Reset meeting form
  const resetMeetingForm = () => {
    setShowNewMeetingForm(false);
    setNewMeetingTitle("");
    setNewMeetingDescription("");
    setNewMeetingType("VIDEO");
    setNewMeetingPrivacy("PUBLIC");
    setRequireApproval(false);
    setAllowChat(true);
    setAllowScreenShare(true);
    setAllowHandRaise(true);
    setNotifyOnCreate(true);
    setSendEmailInvitations(true);
    setSelectedInvitees([]);
    setUserSearchQuery("");
  };

  // Add user to invitees
  const addInvitee = (userToAdd: InvitableUser) => {
    setSelectedInvitees((prev) => [...prev, userToAdd]);
    setAvailableUsers((prev) => prev.filter((u) => u.id !== userToAdd.id));
  };

  // Remove user from invitees
  const removeInvitee = (userToRemove: InvitableUser) => {
    setSelectedInvitees((prev) => prev.filter((u) => u.id !== userToRemove.id));
    setAvailableUsers((prev) => [...prev, userToRemove]);
  };

  // Join meeting
  const joinMeeting = (meetingId: string) => {
    router.push(`/teacher-room/meeting/${meetingId}`);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "اليوم";
    if (date.toDateString() === yesterday.toDateString()) return "أمس";
    return date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="background">
        <Spinner size="xl" color="spinner" />
      </Flex>
    );
  }

  if (!user) return null;

  return (
    <Box minH="100vh" bg="background" pt={20} pb={8}>
      <Container maxW="6xl" h="calc(100vh - 120px)">
        <Flex direction="column" h="100%" gap={4}>
          {/* Header */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Stack gap={1}>
              <Heading size="xl" color="accent">
                🏫 غرفة المعلمين
              </Heading>
              <Text color="muted">تواصل مع زملائك المعلمين والإداريين</Text>
            </Stack>

            {/* Tabs */}
            <HStack gap={2}>
              <Button
                variant={activeTab === "chat" ? "solid" : "outline"}
                colorPalette="brand"
                onClick={() => setActiveTab("chat")}
              >
                💬 المحادثة
              </Button>
              <Button
                variant={activeTab === "meetings" ? "solid" : "outline"}
                colorPalette="brand"
                onClick={() => setActiveTab("meetings")}
              >
                📹 الاجتماعات
                {meetings.filter((m) => m.status === "LIVE").length > 0 && (
                  <Badge colorPalette="red" ml={2}>
                    {meetings.filter((m) => m.status === "LIVE").length} مباشر
                  </Badge>
                )}
              </Button>
            </HStack>
          </Flex>

          {/* Main Content */}
          {activeTab === "chat" ? (
            <PremiumCard flex={1} display="flex" flexDirection="column" overflow="hidden">
              {/* Messages Area */}
              <Box
                flex={1}
                overflowY="auto"
                px={4}
                py={3}
                css={{
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(200, 162, 74, 0.3)",
                    borderRadius: "3px",
                  },
                }}
              >
                <VStack gap={3} align="stretch">
                  {messages.length === 0 ? (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      py={20}
                      color="muted"
                    >
                      <Text fontSize="4xl">💬</Text>
                      <Text>لا توجد رسائل بعد</Text>
                      <Text fontSize="sm">كن أول من يبدأ المحادثة!</Text>
                    </Flex>
                  ) : (
                    messages.map((message, index) => {
                      const isOwn = message.authorId === user.id;
                      const showDate =
                        index === 0 ||
                        formatDate(messages[index - 1].createdAt) !==
                          formatDate(message.createdAt);

                      return (
                        <Box key={message.id}>
                          {/* Date separator */}
                          {showDate && (
                            <Flex justify="center" my={4}>
                              <Badge
                                bg="surface"
                                color="muted"
                                px={3}
                                py={1}
                                borderRadius="full"
                              >
                                {formatDate(message.createdAt)}
                              </Badge>
                            </Flex>
                          )}

                          {/* Message */}
                          <Flex
                            direction={isOwn ? "row-reverse" : "row"}
                            gap={2}
                            align="flex-start"
                          >
                            <Avatar.Root size="sm">
                              <Avatar.Fallback bg={message.authorRole === "ADMIN" ? "brand.600" : "green.600"}>
                                {message.authorName.charAt(0)}
                              </Avatar.Fallback>
                            </Avatar.Root>
                            <Box
                              maxW="70%"
                              bg={isOwn ? "brand.500/20" : "surface"}
                              borderRadius="xl"
                              px={4}
                              py={2}
                              position="relative"
                            >
                              {/* Author name & role */}
                              <Flex gap={2} align="center" mb={1}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="700"
                                  color={isOwn ? "brand.400" : "text"}
                                >
                                  {message.authorName}
                                </Text>
                                <Badge
                                  size="sm"
                                  colorPalette={
                                    message.authorRole === "ADMIN" ? "red" : "blue"
                                  }
                                >
                                  {message.authorRole === "ADMIN" ? "إدارة" : "معلم"}
                                </Badge>
                              </Flex>

                              {/* Reply reference */}
                              {message.replyTo && (
                                <Box
                                  bg="blackAlpha.200"
                                  borderRadius="md"
                                  px={2}
                                  py={1}
                                  mb={2}
                                  borderRight="3px solid"
                                  borderColor="borderAccent"
                                >
                                  <Text fontSize="xs" color="muted">
                                    رداً على {message.replyTo.authorName}
                                  </Text>
                                  <Text fontSize="sm" lineClamp={1}>
                                    {message.replyTo.content || "رسالة صوتية 🎤"}
                                  </Text>
                                </Box>
                              )}

                              {/* Content */}
                              {message.type === "TEXT" && (
                                <Text color="text" whiteSpace="pre-wrap">
                                  {message.content}
                                </Text>
                              )}

                              {message.type === "VOICE" && message.voiceUrl && (
                                <Flex align="center" gap={3}>
                                  <audio
                                    controls
                                    src={message.voiceUrl}
                                    style={{ height: "32px" }}
                                  />
                                  {message.voiceDuration && (
                                    <Text fontSize="xs" color="muted">
                                      {Math.floor(message.voiceDuration / 60)}:
                                      {(message.voiceDuration % 60)
                                        .toString()
                                        .padStart(2, "0")}
                                    </Text>
                                  )}
                                </Flex>
                              )}

                              {/* Timestamp & edited */}
                              <Flex justify="flex-end" gap={2} mt={1}>
                                {message.isEdited && (
                                  <Text fontSize="xs" color="muted">
                                    (معدل)
                                  </Text>
                                )}
                                <Text fontSize="xs" color="muted">
                                  {formatTime(message.createdAt)}
                                </Text>
                              </Flex>

                              {/* Reactions */}
                              {message.reactions.length > 0 && (
                                <Flex
                                  gap={1}
                                  flexWrap="wrap"
                                  mt={2}
                                  position="absolute"
                                  bottom="-12px"
                                  left={isOwn ? "auto" : "8px"}
                                  right={isOwn ? "8px" : "auto"}
                                >
                                  {Object.entries(
                                    message.reactions.reduce(
                                      (acc, r) => {
                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                        return acc;
                                      },
                                      {} as Record<string, number>
                                    )
                                  ).map(([emoji, count]) => (
                                    <Box
                                      key={emoji}
                                      bg="surface"
                                      borderRadius="full"
                                      px={1.5}
                                      py={0.5}
                                      fontSize="xs"
                                      boxShadow="sm"
                                      cursor="pointer"
                                      onClick={() => toggleReaction(message.id, emoji)}
                                    >
                                      {emoji} {count > 1 && count}
                                    </Box>
                                  ))}
                                </Flex>
                              )}
                            </Box>

                            {/* Message actions */}
                            <Flex
                              direction="column"
                              gap={1}
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              transition="opacity 0.2s"
                            >
                              <IconButton
                                aria-label="رد"
                                size="xs"
                                variant="ghost"
                                onClick={() => setReplyingTo(message)}
                              >
                                ↩️
                              </IconButton>
                              <Box position="relative">
                                <IconButton
                                  aria-label="تفاعل"
                                  size="xs"
                                  variant="ghost"
                                  onClick={() =>
                                    setShowEmojiPicker(
                                      showEmojiPicker === message.id ? null : message.id
                                    )
                                  }
                                >
                                  😊
                                </IconButton>
                                {showEmojiPicker === message.id && (
                                  <Box
                                    position="absolute"
                                    top="100%"
                                    right={0}
                                    zIndex={10}
                                    bg="surface"
                                    borderRadius="lg"
                                    p={2}
                                    boxShadow="lg"
                                  >
                                    <Flex gap={1} flexWrap="wrap" maxW="180px">
                                      {EMOJI_REACTIONS.map((emoji) => (
                                        <Box
                                          key={emoji}
                                          cursor="pointer"
                                          p={1}
                                          borderRadius="md"
                                          _hover={{ bg: "brand.500/20" }}
                                          onClick={() =>
                                            toggleReaction(message.id, emoji)
                                          }
                                        >
                                          {emoji}
                                        </Box>
                                      ))}
                                    </Flex>
                                  </Box>
                                )}
                              </Box>
                            </Flex>
                          </Flex>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </VStack>
              </Box>

              {/* Reply indicator */}
              {replyingTo && (
                <Flex
                  px={4}
                  py={2}
                  bg="accentSubtle"
                  align="center"
                  justify="space-between"
                  borderTop="1px solid"
                  borderColor="border"
                >
                  <Box>
                    <Text fontSize="xs" color="accent" fontWeight="600">
                      رداً على {replyingTo.authorName}
                    </Text>
                    <Text fontSize="sm" lineClamp={1}>
                      {replyingTo.content || "رسالة صوتية 🎤"}
                    </Text>
                  </Box>
                  <IconButton
                    aria-label="إلغاء"
                    size="xs"
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                  >
                    ✕
                  </IconButton>
                </Flex>
              )}

              {/* Input Area */}
              <Flex
                px={4}
                py={3}
                gap={3}
                align="center"
                borderTop="1px solid"
                borderColor="border"
              >
                <VoiceRecorder onRecordingComplete={sendVoiceMessage} />

                <Input
                  flex={1}
                  placeholder="اكتب رسالتك..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  bg="surface"
                  border="none"
                  _focus={{ ring: 1, ringColor: "brand.500" }}
                />

                <Button
                  colorPalette="brand"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  loading={sending}
                >
                  إرسال
                </Button>
              </Flex>
            </PremiumCard>
          ) : (
            /* Meetings Tab */
            <PremiumCard flex={1} overflow="auto" p={6}>
              {/* Create Meeting Button */}
              <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">📹 الاجتماعات</Heading>
                <HStack gap={2}>
                  <Button
                    colorPalette="green"
                    onClick={() => createMeeting(true)}
                    size="lg"
                  >
                    🎥 بدء اجتماع فوري
                  </Button>
                  <Button
                    variant="outline"
                    colorPalette="brand"
                    onClick={() => setShowNewMeetingForm(!showNewMeetingForm)}
                  >
                    + جدولة اجتماع
                  </Button>
                </HStack>
              </Flex>

              {/* New Meeting Form */}
              {showNewMeetingForm && (
                <Box bg="surface" borderRadius="xl" p={6} mb={6} border="1px solid" borderColor="border">
                  <Heading size="md" mb={4}>إنشاء اجتماع جديد</Heading>
                  <Stack gap={5}>
                    {/* Basic Info */}
                    <Box>
                      <Text fontWeight="600" mb={2}>المعلومات الأساسية</Text>
                      <Stack gap={3}>
                        <Input
                          placeholder="عنوان الاجتماع *"
                          value={newMeetingTitle}
                          onChange={(e) => setNewMeetingTitle(e.target.value)}
                          bg="background"
                        />
                        <Textarea
                          placeholder="وصف الاجتماع (اختياري)"
                          value={newMeetingDescription}
                          onChange={(e) => setNewMeetingDescription(e.target.value)}
                          bg="background"
                          rows={2}
                        />
                      </Stack>
                    </Box>

                    {/* Meeting Type */}
                    <Box>
                      <Text fontWeight="600" mb={2}>نوع الاجتماع</Text>
                      <Flex gap={3}>
                        <Button
                          variant={newMeetingType === "VIDEO" ? "solid" : "outline"}
                          colorPalette="brand"
                          onClick={() => setNewMeetingType("VIDEO")}
                          flex={1}
                        >
                          📹 فيديو
                        </Button>
                        <Button
                          variant={newMeetingType === "VOICE" ? "solid" : "outline"}
                          colorPalette="brand"
                          onClick={() => setNewMeetingType("VOICE")}
                          flex={1}
                        >
                          🎤 صوت فقط
                        </Button>
                      </Flex>
                    </Box>

                    {/* Privacy Settings */}
                    <Box>
                      <Text fontWeight="600" mb={2}>🔒 إعدادات الخصوصية</Text>
                      <Stack gap={3}>
                        <Flex gap={3}>
                          <Button
                            variant={newMeetingPrivacy === "PUBLIC" ? "solid" : "outline"}
                            colorPalette="green"
                            onClick={() => setNewMeetingPrivacy("PUBLIC")}
                            flex={1}
                          >
                            🌐 عام - جميع المعلمين والإداريين
                          </Button>
                          <Button
                            variant={newMeetingPrivacy === "PRIVATE" ? "solid" : "outline"}
                            colorPalette="purple"
                            onClick={() => setNewMeetingPrivacy("PRIVATE")}
                            flex={1}
                          >
                            🔐 خاص - مدعوون فقط
                          </Button>
                        </Flex>
                        
                        {newMeetingPrivacy === "PUBLIC" && (
                          <Box bg="green.900/20" p={3} borderRadius="lg" fontSize="sm">
                            <Text color="green.300">
                              ✅ سيتمكن جميع المعلمين والإداريين من رؤية هذا الاجتماع والانضمام إليه
                            </Text>
                          </Box>
                        )}

                        {newMeetingPrivacy === "PRIVATE" && (
                          <Box bg="purple.900/20" p={3} borderRadius="lg" fontSize="sm">
                            <Text color="purple.300">
                              🔐 فقط الأشخاص الذين تدعوهم يمكنهم رؤية هذا الاجتماع والانضمام إليه
                            </Text>
                          </Box>
                        )}
                      </Stack>
                    </Box>

                    {/* Invitees Selection (for private meetings) */}
                    {newMeetingPrivacy === "PRIVATE" && (
                      <Box>
                        <Text fontWeight="600" mb={2}>👥 اختر المدعوين</Text>
                        <Stack gap={3}>
                          {/* Selected Invitees */}
                          {selectedInvitees.length > 0 && (
                            <Flex gap={2} flexWrap="wrap">
                              {selectedInvitees.map((invitee) => (
                                <Badge
                                  key={invitee.id}
                                  colorPalette="brand"
                                  py={1}
                                  px={3}
                                  borderRadius="full"
                                  cursor="pointer"
                                  onClick={() => removeInvitee(invitee)}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  {invitee.name} ✕
                                </Badge>
                              ))}
                            </Flex>
                          )}

                          {/* Search Users */}
                          <Input
                            placeholder="ابحث عن معلم أو إداري لدعوته..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            bg="background"
                          />

                          {/* Available Users List */}
                          {loadingUsers ? (
                            <Flex justify="center" py={4}>
                              <Spinner size="sm" />
                            </Flex>
                          ) : availableUsers.length > 0 ? (
                            <Box maxH="200px" overflowY="auto" bg="background" borderRadius="lg" p={2}>
                              <Stack gap={1}>
                                {availableUsers.map((availableUser) => (
                                  <Flex
                                    key={availableUser.id}
                                    align="center"
                                    justify="space-between"
                                    p={2}
                                    borderRadius="md"
                                    cursor="pointer"
                                    _hover={{ bg: "brand.500/10" }}
                                    onClick={() => addInvitee(availableUser)}
                                  >
                                    <Flex align="center" gap={2}>
                                      <Avatar.Root size="sm">
                                        <Avatar.Fallback>
                                          {availableUser.name.charAt(0)}
                                        </Avatar.Fallback>
                                      </Avatar.Root>
                                      <Box>
                                        <Text fontSize="sm" fontWeight="500">{availableUser.name}</Text>
                                        <Text fontSize="xs" color="muted">{availableUser.email}</Text>
                                      </Box>
                                    </Flex>
                                    <Badge colorPalette={availableUser.role === "ADMIN" ? "red" : "blue"} size="sm">
                                      {availableUser.role === "ADMIN" ? "إداري" : "معلم"}
                                    </Badge>
                                  </Flex>
                                ))}
                              </Stack>
                            </Box>
                          ) : userSearchQuery ? (
                            <Text fontSize="sm" color="muted" textAlign="center" py={4}>
                              لم يتم العثور على نتائج
                            </Text>
                          ) : (
                            <Text fontSize="sm" color="muted" textAlign="center" py={4}>
                              ابحث لإضافة مدعوين
                            </Text>
                          )}
                        </Stack>
                      </Box>
                    )}

                    {/* Meeting Controls */}
                    <Box>
                      <Text fontWeight="600" mb={2}>⚙️ إعدادات الاجتماع</Text>
                      <Stack gap={2}>
                        <Flex align="center" gap={3}>
                          <Checkbox.Root
                            checked={allowChat}
                            onCheckedChange={(e) => setAllowChat(!!e.checked)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>💬 السماح بالدردشة</Checkbox.Label>
                          </Checkbox.Root>
                        </Flex>
                        <Flex align="center" gap={3}>
                          <Checkbox.Root
                            checked={allowScreenShare}
                            onCheckedChange={(e) => setAllowScreenShare(!!e.checked)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>🖥️ السماح بمشاركة الشاشة</Checkbox.Label>
                          </Checkbox.Root>
                        </Flex>
                        <Flex align="center" gap={3}>
                          <Checkbox.Root
                            checked={allowHandRaise}
                            onCheckedChange={(e) => setAllowHandRaise(!!e.checked)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>✋ السماح برفع اليد</Checkbox.Label>
                          </Checkbox.Root>
                        </Flex>
                        <Flex align="center" gap={3}>
                          <Checkbox.Root
                            checked={requireApproval}
                            onCheckedChange={(e) => setRequireApproval(!!e.checked)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>🚪 طلب موافقة قبل الانضمام</Checkbox.Label>
                          </Checkbox.Root>
                        </Flex>
                      </Stack>
                    </Box>

                    {/* Notification Settings */}
                    <Box>
                      <Text fontWeight="600" mb={2}>🔔 إعدادات الإشعارات</Text>
                      <Stack gap={2}>
                        <Flex align="center" gap={3}>
                          <Checkbox.Root
                            checked={notifyOnCreate}
                            onCheckedChange={(e) => setNotifyOnCreate(!!e.checked)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>
                              📲 إرسال إشعار داخل البوابة
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </Flex>
                        <Flex align="center" gap={3}>
                          <Checkbox.Root
                            checked={sendEmailInvitations}
                            onCheckedChange={(e) => setSendEmailInvitations(!!e.checked)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>
                              📧 إرسال دعوة عبر البريد الإلكتروني
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </Flex>
                      </Stack>
                      <Text fontSize="xs" color="muted" mt={2}>
                        {newMeetingPrivacy === "PUBLIC" 
                          ? "سيتم إشعار جميع المعلمين والإداريين"
                          : `سيتم إشعار ${selectedInvitees.length} شخص مدعو`}
                      </Text>
                    </Box>

                    {/* Action Buttons */}
                    <Flex gap={3} pt={2}>
                      <Button
                        colorPalette="brand"
                        flex={1}
                        onClick={() => createMeeting(false)}
                        loading={creatingMeeting}
                        disabled={!newMeetingTitle.trim() || (newMeetingPrivacy === "PRIVATE" && selectedInvitees.length === 0)}
                      >
                        إنشاء الاجتماع
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetMeetingForm}
                      >
                        إلغاء
                      </Button>
                    </Flex>
                  </Stack>
                </Box>
              )}

              {/* Live Meetings */}
              {meetings.filter((m) => m.status === "LIVE").length > 0 && (
                <Box mb={6}>
                  <Heading size="md" mb={4} color="green.400">
                    🔴 اجتماعات جارية الآن
                  </Heading>
                  <Stack gap={3}>
                    {meetings
                      .filter((m) => m.status === "LIVE")
                      .map((meeting) => (
                        <Box
                          key={meeting.id}
                          bg="green.900/20"
                          borderRadius="xl"
                          p={4}
                          border="1px solid"
                          borderColor="green.500/50"
                        >
                          <Flex justify="space-between" align="center">
                            <Stack gap={1}>
                              <Flex align="center" gap={2} flexWrap="wrap">
                                <Box
                                  w={3}
                                  h={3}
                                  borderRadius="full"
                                  bg="green.500"
                                  css={{
                                    animation: "pulse 2s infinite",
                                  }}
                                />
                                <Text fontWeight="700" fontSize="lg">
                                  {meeting.title}
                                </Text>
                                <Badge colorPalette="green">مباشر</Badge>
                                {meeting.privacy === "PRIVATE" && (
                                  <Badge colorPalette="purple">🔐 خاص</Badge>
                                )}
                                {meeting.isHost && (
                                  <Badge colorPalette="yellow">مضيف</Badge>
                                )}
                              </Flex>
                              <Flex align="center" gap={2}>
                                <Text fontSize="sm" color="muted">
                                  المضيف: {meeting.hostName}
                                </Text>
                                <Text fontSize="sm" color="muted">
                                  • {meeting._count.participants} مشارك
                                </Text>
                              </Flex>
                            </Stack>
                            <Button
                              colorPalette="green"
                              size="lg"
                              onClick={() => joinMeeting(meeting.id)}
                            >
                              انضم الآن
                            </Button>
                          </Flex>
                        </Box>
                      ))}
                  </Stack>
                </Box>
              )}

              {/* Scheduled Meetings */}
              {meetings.filter((m) => m.status === "SCHEDULED").length > 0 && (
                <Box mb={6}>
                  <Heading size="md" mb={4}>
                    📅 اجتماعات مجدولة
                  </Heading>
                  <Stack gap={3}>
                    {meetings
                      .filter((m) => m.status === "SCHEDULED")
                      .map((meeting) => (
                        <Box
                          key={meeting.id}
                          bg="surface"
                          borderRadius="xl"
                          p={4}
                        >
                          <Flex justify="space-between" align="center">
                            <Stack gap={1}>
                              <Flex align="center" gap={2} flexWrap="wrap">
                                <Text fontWeight="700">{meeting.title}</Text>
                                <Badge colorPalette="blue">مجدول</Badge>
                                {meeting.privacy === "PRIVATE" && (
                                  <Badge colorPalette="purple">🔐 خاص</Badge>
                                )}
                                {meeting.isHost && (
                                  <Badge colorPalette="yellow">مضيف</Badge>
                                )}
                              </Flex>
                              <Text fontSize="sm" color="muted">
                                المضيف: {meeting.hostName}
                                {meeting.scheduledAt &&
                                  ` • ${new Date(meeting.scheduledAt).toLocaleDateString("ar-EG")}`}
                              </Text>
                            </Stack>
                            {meeting.isHost && (
                              <Button
                                colorPalette="brand"
                                size="sm"
                                onClick={() => joinMeeting(meeting.id)}
                              >
                                بدء الاجتماع
                              </Button>
                            )}
                          </Flex>
                        </Box>
                      ))}
                  </Stack>
                </Box>
              )}

              {/* Past Meetings */}
              {meetings.filter((m) => m.status === "ENDED").length > 0 && (
                <Box>
                  <Heading size="md" mb={4} color="muted">
                    📜 اجتماعات سابقة
                  </Heading>
                  <Stack gap={3}>
                    {meetings
                      .filter((m) => m.status === "ENDED")
                      .map((meeting) => (
                        <Box
                          key={meeting.id}
                          bg="surface"
                          borderRadius="xl"
                          p={4}
                          opacity={0.7}
                        >
                          <Flex justify="space-between" align="center">
                            <Stack gap={1}>
                              <Text fontWeight="700">{meeting.title}</Text>
                              <Text fontSize="sm" color="muted">
                                المضيف: {meeting.hostName}
                              </Text>
                            </Stack>
                            <Badge>منتهي</Badge>
                          </Flex>
                        </Box>
                      ))}
                  </Stack>
                </Box>
              )}

              {meetings.length === 0 && (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py={20}
                  color="muted"
                >
                  <Text fontSize="4xl">📹</Text>
                  <Text>لا توجد اجتماعات</Text>
                  <Text fontSize="sm">ابدأ اجتماعاً جديداً للتواصل مع زملائك</Text>
                </Flex>
              )}
            </PremiumCard>
          )}
        </Flex>
      </Container>
    </Box>
  );
}
