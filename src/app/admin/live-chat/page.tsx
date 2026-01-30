"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import { useState, useEffect } from "react";

type Message = {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: string;
};

type ChatSession = {
  id: string;
  userName: string;
  userEmail?: string;
  status: "active" | "waiting" | "resolved";
  messages: Message[];
  createdAt: string;
  lastActivity: string;
};

export default function AdminLiveChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/chat");
      const result = await response.json();
      if (result.ok) {
        setSessions(result.data);
        // Update active session if it exists
        if (activeSession) {
          const updated = result.data.find((s: ChatSession) => s.id === activeSession.id);
          if (updated) setActiveSession(updated);
        }
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeSession) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          sessionId: activeSession.id,
          message: replyText,
          sender: "support",
        }),
      });
      const result = await response.json();
      if (result.ok) {
        setActiveSession(result.data.session);
        setReplyText("");
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!activeSession) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          sessionId: activeSession.id,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        setActiveSession(result.data);
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to resolve session:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") return { color: "success", text: "نشط" };
    if (status === "waiting") return { color: "warning", text: "بانتظار رد" };
    return { color: "brand.500", text: "تم الحل" };
  };

  return (
    <Stack gap={8}>
      <Flex direction={{ base: "column", md: "row" }} gap={4} justify="space-between">
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
            💬 الدردشة المباشرة
          </Badge>
          <Heading size="xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            الدردشة المباشرة
          </Heading>
          <Text color="muted" fontSize="lg">
            {sessions.length} محادثة نشطة - {sessions.filter(s => s.status === "waiting").length} في انتظار الرد
          </Text>
        </Stack>
        {activeSession && (
          <Button
            onClick={handleResolve}
            bgGradient="linear(135deg, success 0%, success 100%)"
            color="white"
            h="fit-content"
            _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
            transition="all 0.3s ease"
          >
            ✓ وضع علامة تم الحل
          </Button>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
        <PremiumCard variant="bordered" p={6}>
          <Stack gap={4}>
            <Flex align="center" gap={2}>
              <Text fontSize="xl">📋</Text>
              <Heading size="md">قائمة المحادثات ({sessions.length})</Heading>
            </Flex>
            {sessions.length === 0 ? (
              <Text color="muted" fontSize="sm" textAlign="center" py={8}>
                لا توجد محادثات نشطة حالياً
              </Text>
            ) : (
              sessions.map((session) => {
                const statusInfo = getStatusBadge(session.status);
                const lastMessage = session.messages[session.messages.length - 1];
                return (
                  <Box
                    key={session.id}
                    bg={activeSession?.id === session.id ? "brand.50" : "backgroundAlt"}
                    border="2px solid"
                    borderColor={activeSession?.id === session.id ? "brand.400" : "border"}
                    borderRadius="button"
                    p={3}
                    transition="all 0.3s ease"
                    _hover={{
                      bg: "brand.50",
                      borderColor: "brand.400",
                      transform: "translateX(-4px)",
                      boxShadow: "subtle",
                    }}
                    cursor="pointer"
                    onClick={() => setActiveSession(session)}
                  >
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap={2}>
                        <Text fontSize="xl">👤</Text>
                        <Text fontWeight="700">{session.userName}</Text>
                      </Flex>
                      <Badge
                        bg={statusInfo.color}
                        color="white"
                        px={2}
                        py={1}
                        borderRadius="badge"
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {statusInfo.text}
                      </Badge>
                    </Flex>
                    <Text color="muted" fontSize="sm" mt={2} lineClamp={1}>
                      💭 {lastMessage?.text}
                    </Text>
                  </Box>
                );
              })
            )}
          </Stack>
        </PremiumCard>

        <PremiumCard
          variant="elevated"
          p={6}
          gridColumn={{ base: "auto", lg: "span 2" }}
        >
          {activeSession ? (
            <Stack gap={4}>
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={2}>
                  <Text fontSize="xl">💬</Text>
                  <Stack gap={0}>
                    <Heading size="md">{activeSession.userName}</Heading>
                    <Text fontSize="xs" color="muted">
                      بدأت {new Date(activeSession.createdAt).toLocaleString("ar-EG")}
                    </Text>
                  </Stack>
                </Flex>
                <Badge
                  bgGradient={`linear(135deg, ${getStatusBadge(activeSession.status).color} 0%, ${getStatusBadge(activeSession.status).color} 100%)`}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="badge"
                  fontWeight="600"
                >
                  {activeSession.status === "active" ? "🟢" : activeSession.status === "waiting" ? "🟡" : "✓"} {getStatusBadge(activeSession.status).text}
                </Badge>
              </Flex>
              <Stack gap={3} maxH="400px" overflowY="auto" pr={2}>
                {activeSession.messages.map((message) => (
                  <Box
                    key={message.id}
                    bg={message.sender === "support" ? "brand.50" : "backgroundAlt"}
                    borderRadius="button"
                    border="1px solid"
                    borderColor={message.sender === "support" ? "brand.400" : "border"}
                    p={3}
                    transition="all 0.2s ease"
                    _hover={{ boxShadow: "subtle" }}
                  >
                    <Flex align="center" gap={2} mb={1}>
                      <Text fontSize="sm">{message.sender === "support" ? "🎧" : "👤"}</Text>
                      <Text fontWeight="700" fontSize="sm">
                        {message.sender === "support" ? "الدعم" : "الطالب"}
                      </Text>
                      <Text fontSize="xs" color="muted">
                        {new Date(message.timestamp).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Flex>
                    <Text color="text" fontSize="sm">
                      {message.text}
                    </Text>
                  </Box>
                ))}
              </Stack>
              <Flex gap={3}>
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder="اكتب ردًا سريعًا... ✍️"
                  bg="backgroundAlt"
                  border="2px solid"
                  borderColor="border"
                  borderRadius="button"
                  px={4}
                  py={3}
                  w="100%"
                  transition="all 0.2s ease"
                  _hover={{ borderColor: "brand.400" }}
                  _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "glow" }}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendReply}
                  bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
                  color="white"
                  px={6}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
                  transition="all 0.3s ease"
                  disabled={isLoading || !replyText.trim()}
                >
                  📤 إرسال
                </Button>
              </Flex>
            </Stack>
          ) : (
            <Stack gap={4} align="center" justify="center" minH="400px">
              <Text fontSize="4xl">💬</Text>
              <Text color="muted" fontSize="lg" textAlign="center">
                اختر محادثة من القائمة لبدء الرد
              </Text>
            </Stack>
          )}
        </PremiumCard>
      </SimpleGrid>
    </Stack>
  );
}
