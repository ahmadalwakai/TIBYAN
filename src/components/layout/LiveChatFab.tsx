"use client";

import { Box, Button, Stack, Text, Input, IconButton } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FaComments, FaTimes, FaPaperPlane } from "react-icons/fa";

export default function LiveChatFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "support" }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Create session when chat is opened for the first time
    if (isOpen && !sessionId) {
      createSession();
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    // Poll for new messages every 3 seconds when chat is open
    if (isOpen && sessionId) {
      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId]);

  const createSession = async () => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", userName: "زائر" }),
      });
      const result = await response.json();
      if (result.ok) {
        setSessionId(result.data.sessionId);
        setMessages(result.data.session.messages.map((m: any) => ({
          text: m.text,
          sender: m.sender,
        })));
      }
    } catch (error) {
      console.error("Failed to create chat session:", error);
    }
  };

  const fetchMessages = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`);
      const result = await response.json();
      if (result.ok) {
        setMessages(result.data.messages.map((m: any) => ({
          text: m.text,
          sender: m.sender,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() && sessionId) {
      const userMessage = inputValue;
      setInputValue("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            sessionId,
            message: userMessage,
            sender: "user",
          }),
        });
        const result = await response.json();
        if (result.ok) {
          setMessages(result.data.session.messages.map((m: any) => ({
            text: m.text,
            sender: m.sender,
          })));
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <Box
          position="fixed"
          bottom="92px"
          right="24px"
          w={{ base: "90vw", sm: "380px" }}
          h={{ base: "70vh", sm: "520px" }}
          bg="surface"
          borderRadius="20px"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.12)"
          border="1px solid"
          borderColor="border"
          zIndex={1500}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          {/* Header */}
          <Box
            bg="brand.900"
            color="white"
            p={4}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack gap={1} flex={1}>
              <Text fontWeight="700" fontSize="lg">الدردشة المباشرة</Text>
              <Text fontSize="xs" opacity={0.9}>فريق دعم تبيان</Text>
            </Stack>
            <IconButton
              aria-label="إغلاق الدردشة"
              onClick={() => setIsOpen(false)}
              variant="ghost"
              color="white"
              size="sm"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              <FaTimes />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box flex={1} overflowY="auto" p={4} bg="background">
            <Stack gap={3}>
              {messages.map((msg, idx) => (
                <Box
                  key={idx}
                  alignSelf={msg.sender === "user" ? "flex-end" : "flex-start"}
                  maxW="80%"
                >
                  <Box
                    bg={msg.sender === "user" ? "brand.500" : "surface"}
                    color={msg.sender === "user" ? "white" : "text"}
                    p={3}
                    borderRadius="12px"
                    boxShadow="sm"
                  >
                    <Text fontSize="sm">{msg.text}</Text>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Input */}
          <Box p={4} borderTop="1px solid" borderColor="border" bg="surface">
            <Stack direction="row" gap={2}>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="اكتب رسالتك..."
                size="md"
                flex={1}
              />
              <IconButton
                aria-label="إرسال"
                onClick={handleSend}
                bg="brand.900"
                color="white"
                _hover={{ bg: "brand.800" }}
                size="md"
              >
                <FaPaperPlane />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      )}

      {/* FAB Button */}
      <Box position="fixed" bottom="92px" right="24px" zIndex={1400}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="فتح الدردشة المباشرة"
          w={{ base: "56px", md: "52px" }}
          h={{ base: "56px", md: "52px" }}
          p={0}
          bg="brand.900"
          color="white"
          _hover={{ bg: "brand.800" }}
          borderRadius="full"
          boxShadow="lg"
        >
          <FaComments size={22} />
        </Button>
      </Box>
    </>
  );
}

