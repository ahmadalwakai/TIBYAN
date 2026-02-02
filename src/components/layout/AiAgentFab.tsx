"use client";

import {
  Box,
  Button,
  IconButton,
  Input,
  Stack,
  Text,
  Spinner,
  Drawer,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaRobot, FaPaperPlane, FaTrash } from "react-icons/fa";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "tibyan_ai_chat_v1";
const MAX_MESSAGES = 30;

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChatMessage[];
      return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // Ignore storage errors
  }
}

export default function AiAgentFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInputValue("");

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    setIsLoading(true);

    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.ok && result.data?.reply) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.data.reply,
        };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        saveMessages(finalMessages);
      } else {
        setError(result.error || "حدث خطأ أثناء الاتصال بالمساعد");
      }
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter allows newline (default behavior for textarea, but Input is single-line)
  };

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <>
      {/* FAB Button - positioned above LiveChatFab */}
      <Box position="fixed" bottom="160px" right="24px" zIndex={1400}>
        <Button
          onClick={() => setIsOpen(true)}
          aria-label="فتح مساعد تبيان الذكي"
          w={{ base: "56px", md: "52px" }}
          h={{ base: "56px", md: "52px" }}
          p={0}
          bg="#0B1F3A"
          color="#D4AF37"
          _hover={{ bg: "#142d4f" }}
          borderRadius="full"
          boxShadow="lg"
        >
          <FaRobot size={22} />
        </Button>
      </Box>

      {/* Drawer for Chat UI */}
      <Drawer.Root
        open={isOpen}
        onOpenChange={(details) => setIsOpen(details.open)}
        placement="end"
        size="sm"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              {/* Header */}
              <Drawer.Header
                bg="#0B1F3A"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                px={4}
                py={3}
              >
                <Stack gap={0} flex={1}>
                  <Drawer.Title fontWeight="700" fontSize="lg" color="#D4AF37">
                    مساعد تبيان
                  </Drawer.Title>
                  <Text fontSize="xs" color="whiteAlpha.800">
                    المساعد الذكي لأكاديمية تبيان
                  </Text>
                </Stack>
                <Stack direction="row" gap={1} alignItems="center">
                  <Button
                    onClick={clearConversation}
                    size="xs"
                    variant="ghost"
                    color="whiteAlpha.800"
                    _hover={{ bg: "whiteAlpha.200", color: "white" }}
                    fontSize="xs"
                    disabled={messages.length === 0 || isLoading}
                  >
                    <FaTrash size={10} />
                    <Text ms={1}>مسح المحادثة</Text>
                  </Button>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton color="white" size="sm" />
                  </Drawer.CloseTrigger>
                </Stack>
              </Drawer.Header>

              {/* Messages Body */}
              <Drawer.Body p={4} bg="gray.50" overflowY="auto">
                <Stack gap={3}>
                  {messages.length === 0 && (
                    <Box textAlign="center" py={8}>
                      <FaRobot size={48} color="#0B1F3A" style={{ margin: "0 auto 16px" }} />
                      <Text color="gray.600" fontSize="sm">
                        مرحباً! أنا مساعد تبيان الذكي.
                        <br />
                        كيف يمكنني مساعدتك اليوم؟
                      </Text>
                    </Box>
                  )}
                  {messages.map((msg, idx) => (
                    <Box
                      key={idx}
                      alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                      maxW="85%"
                    >
                      <Box
                        bg={msg.role === "user" ? "#0B1F3A" : "white"}
                        color={msg.role === "user" ? "white" : "gray.800"}
                        p={3}
                        borderRadius="12px"
                        boxShadow="sm"
                        border={msg.role === "assistant" ? "1px solid" : "none"}
                        borderColor="gray.200"
                      >
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {msg.content}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                  {isLoading && (
                    <Box alignSelf="flex-start" maxW="85%">
                      <Box
                        bg="white"
                        p={3}
                        borderRadius="12px"
                        boxShadow="sm"
                        border="1px solid"
                        borderColor="gray.200"
                      >
                        <Spinner size="sm" color="#0B1F3A" />
                      </Box>
                    </Box>
                  )}
                  {error && (
                    <Box
                      bg="red.50"
                      color="red.600"
                      p={3}
                      borderRadius="8px"
                      fontSize="sm"
                    >
                      {error}
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Stack>
              </Drawer.Body>

              {/* Input Footer */}
              <Drawer.Footer
                p={4}
                borderTop="1px solid"
                borderColor="gray.200"
                bg="white"
              >
                <Stack direction="row" gap={2} w="100%">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب سؤالك…"
                    size="md"
                    flex={1}
                    disabled={isLoading}
                    dir="rtl"
                  />
                  <IconButton
                    aria-label="إرسال"
                    onClick={handleSend}
                    bg="#0B1F3A"
                    color="#D4AF37"
                    _hover={{ bg: "#142d4f" }}
                    size="md"
                    disabled={isLoading || !inputValue.trim()}
                  >
                    <FaPaperPlane />
                  </IconButton>
                </Stack>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}
