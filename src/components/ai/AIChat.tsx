/**
 * @deprecated Replaced by AIChatPage at /[locale]/ai
 * This component is kept for backward compatibility but should not be used.
 * All new AI chat implementations must use AIChatPage instead.
 * To remove: delete this file and the export in index.ts
 */
"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Pulsing animation for streaming avatar
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
`;
import { 
  LuBot, 
  LuImage, 
  LuFileText, 
  LuSend, 
  LuPaperclip, 
  LuX, 
  LuSparkles,
  LuBookOpen,
  LuBrain,
  LuFileQuestion,
  LuCalendar,
  LuCircleStop,
  LuRefreshCw,
} from "react-icons/lu";
import { TypingIndicator } from "./TypingIndicator";
import { ChatStatusBar } from "./ChatStatusBar";
import { MessageActions } from "./MessageActions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  isLoading?: boolean;
}

interface Attachment {
  id: string;
  type: "image" | "pdf" | "document";
  name: string;
  size: number;
  url?: string;
  base64?: string;
}

interface QuickAction {
  id: string;
  label: string;
  labelAr: string;
  icon: typeof LuBot;
  action: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "summarize",
    label: "Summarize Lesson",
    labelAr: "تلخيص الدرس",
    icon: LuBookOpen,
    action: "summarize_lesson",
    color: "blue",
  },
  {
    id: "quiz",
    label: "Generate Quiz",
    labelAr: "إنشاء اختبار",
    icon: LuFileQuestion,
    action: "generate_quiz",
    color: "green",
  },
  {
    id: "study_plan",
    label: "Study Plan",
    labelAr: "خطة دراسية",
    icon: LuCalendar,
    action: "create_study_plan",
    color: "purple",
  },
  {
    id: "explain",
    label: "Explain Concept",
    labelAr: "شرح مفهوم",
    icon: LuBrain,
    action: "explain_concept",
    color: "orange",
  },
];

interface AIChatProps {
  lessonId?: string;
  courseId?: string;
  language?: "ar" | "en";
  onClose?: () => void;
  isFloating?: boolean;
}

export default function AIChat({
  lessonId,
  courseId,
  language = "ar",
  onClose,
  isFloating = false,
}: AIChatProps) {
  const t = useTranslations("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const batchBufferRef = useRef<string>("");
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollCheckRef = useRef<number>(0);

  const isRTL = language === "ar";

  // Smart scroll: stick to bottom if user is near bottom
  const scrollToBottom = useCallback((force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const now = Date.now();
    // Throttle scroll checks to every 100ms
    if (!force && now - lastScrollCheckRef.current < 100) return;
    lastScrollCheckRef.current = now;

    const { scrollHeight, scrollTop, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 100;
    
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup batch timer on unmount
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  // Welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: t("welcomeMessage"),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [t]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      const isDocument = file.type.includes("document") || file.name.endsWith(".doc") || file.name.endsWith(".docx");

      if (!isImage && !isPDF && !isDocument) {
        toaster.create({
          title: t("fileTypeNotSupported"),
          type: "error",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toaster.create({
          title: t("fileTooLarge"),
          type: "error",
        });
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const attachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: isImage ? "image" : isPDF ? "pdf" : "document",
          name: file.name,
          size: file.size,
          base64: base64.split(",")[1], // Remove data URL prefix
        };
        setAttachments((prev) => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [isRTL]);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Flush batch buffer to state (throttled updates)
  const flushBatch = useCallback((messageId: string, force = false) => {
    if (!batchBufferRef.current && !force) return;

    const content = batchBufferRef.current;
    batchBufferRef.current = "";

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content } : m
      )
    );

    scrollToBottom();
  }, [scrollToBottom]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AIChat] Stopping stream via AbortController");
      }
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear batch timer and flush any pending content
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    setIsStreaming(false);
    setIsLoading(false);
    
    toaster.create({
      title: t("generationStopped"),
      type: "info",
    });
  }, [t]);

  // Regenerate last response
  const regenerateLastResponse = useCallback(() => {
    if (!lastUserMessage) return;
    
    // Remove last assistant message
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.role === "user" || m.id !== prev[prev.length - 1]?.id);
      return filtered;
    });

    // Resend last user message
    sendMessage(lastUserMessage);
  }, [lastUserMessage]);

  // Send message with streaming support
  const sendMessage = useCallback(async (content: string, action?: string) => {
    if (!content.trim() && attachments.length === 0) return;

    setLastUserMessage(content.trim());

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: content.trim(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    };

    const assistantMessageId = `msg_${Date.now() + 1}`;
    const streamingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: false,
    };

    setMessages((prev) => [...prev, userMessage, streamingMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      // Build request
      let endpoint = "/api/ai/agent";
      interface RequestBody {
        message: string;
        sessionId: string;
        history: Array<{ role: "user" | "assistant"; content: string }>;
        stream?: boolean;
        context?: {
          lessonId?: string;
          courseId?: string;
          attachments?: Attachment[];
        };
        lessonId?: string;
        type?: string;
        language?: "ar" | "en";
        courseId?: string;
        questionCount?: number;
        difficulty?: string;
        goalType?: string;
        availableHoursPerWeek?: number;
      }
      let requestBody: RequestBody = {
        message: content,
        sessionId,
        stream: true, // Enable streaming
        history: messages
          .filter((m) => !m.isLoading)
          .map((m) => ({ role: m.role, content: m.content })),
        context: {
          lessonId,
          courseId,
          attachments: userMessage.attachments,
        },
      };

      // Handle quick actions (non-streaming endpoints)
      if (action === "summarize_lesson" && lessonId) {
        endpoint = "/api/ai/summarize";
        requestBody = { lessonId, type: "brief", language, message: "", sessionId, history: [], stream: false };
      } else if (action === "generate_quiz" && (lessonId || courseId)) {
        endpoint = "/api/ai/quiz";
        requestBody = { lessonId, courseId, questionCount: 5, difficulty: "medium", language, message: "", sessionId, history: [], stream: false };
      } else if (action === "create_study_plan" && courseId) {
        endpoint = "/api/ai/study-plan";
        requestBody = { courseId, goalType: "complete_course", availableHoursPerWeek: 10, language, message: "", sessionId, history: [], stream: false };
      }

      // Create AbortController for stop functionality
      abortControllerRef.current = new AbortController();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      // Check if streaming response
      const contentType = response.headers.get("content-type");
      const isStreamResponse = contentType?.includes("text/event-stream");

      if (isStreamResponse && requestBody.stream) {
        // STREAMING MODE
        setIsStreaming(true);
        setIsLoading(false);

        if (process.env.NODE_ENV === "development") {
          console.log("[AIChat] Starting SSE stream");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        batchBufferRef.current = "";
        let deltaCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (process.env.NODE_ENV === "development") {
              console.log(`[AIChat] Stream done: ${deltaCount} deltas received`);
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const jsonStr = trimmed.slice(6).trim();
                if (!jsonStr || jsonStr === "[DONE]") continue;

                const data = JSON.parse(jsonStr);

                if (data.delta) {
                  deltaCount++;
                  accumulatedContent += data.delta;
                  batchBufferRef.current = accumulatedContent;
                  
                  // Throttled batch update: flush every 50ms
                  if (!batchTimerRef.current) {
                    batchTimerRef.current = setTimeout(() => {
                      batchTimerRef.current = null;
                      flushBatch(assistantMessageId);
                    }, 50);
                  }
                }
              } catch (err) {
                if (process.env.NODE_ENV === "development") {
                  console.error("[AIChat] Failed to parse SSE:", err);
                }
              }
            } else if (trimmed.startsWith("event: error")) {
              const errorLine = lines.find(l => l.trim().startsWith("data: "));
              if (errorLine) {
                const errorData = JSON.parse(errorLine.trim().slice(6));
                throw new Error(errorData.message || errorData.error || "Streaming error");
              }
            }
          }
        }

        // Final flush
        if (batchTimerRef.current) {
          clearTimeout(batchTimerRef.current);
          batchTimerRef.current = null;
        }
        flushBatch(assistantMessageId, true);

        setIsStreaming(false);
        abortControllerRef.current = null;

      } else {
        // NON-STREAMING MODE (fallback for quick actions)
        const data = await response.json() as {
          ok: boolean;
          data?: {
            response?: string;
            summary?: string;
            quiz?: { questions: Array<{ question: string; options?: string[]; correctAnswer: number | string }> };
            plan?: { title: string; weeklySchedule: Array<{ day: string; topic: string }> };
          };
          error?: string;
        };

        let responseContent = "";
        if (data.ok && data.data) {
          if (action === "summarize_lesson" && data.data.summary) {
            responseContent = `📝 **${t("lessonSummary")}**\n\n${data.data.summary}`;
          } else if (action === "generate_quiz" && data.data.quiz) {
            responseContent = `📋 **${t("quiz")}**\n\n`;
            data.data.quiz.questions.forEach((q, i) => {
              responseContent += `**${i + 1}.** ${q.question}\n`;
              if (q.options) {
                q.options.forEach((opt, j) => {
                  responseContent += `   ${String.fromCharCode(65 + j)}) ${opt}\n`;
                });
              }
              responseContent += "\n";
            });
          } else if (action === "create_study_plan" && data.data.plan) {
            responseContent = `📅 **${data.data.plan.title}**\n\n`;
            data.data.plan.weeklySchedule.forEach((session) => {
              responseContent += `• **${session.day}**: ${session.topic}\n`;
            });
          } else {
            responseContent = data.data.response || JSON.stringify(data.data, null, 2);
          }
        } else {
          responseContent = data.error || t("genericError");
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: responseContent }
              : m
          )
        );
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("[AIChat] Error:", error);
      }
      
      let errorMessage = t("connectionError");

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          // Don't show error for user-initiated stop
          if (process.env.NODE_ENV === "development") {
            console.log("[AIChat] Request aborted by user");
          }
          return;
        }
        errorMessage = error.message;
      }

      // Clear batch timer
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: `❌ ${errorMessage}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;

      // Clear batch timer
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    }
  }, [attachments, messages, sessionId, lessonId, courseId, language, scrollToBottom, flushBatch, t]);

  // Handle quick action
  const handleQuickAction = useCallback((action: QuickAction) => {
    const prompt = isRTL ? action.labelAr : action.label;
    sendMessage(prompt, action.action);
  }, [isRTL, sendMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const containerStyles = {
    width: "100%",
    height: "100%",
    minHeight: isFloating ? "500px" : "100vh",
  };

  return (
    <>
      <style>{pulseAnimation}</style>
      <Flex
        direction="column"
        bg="gray.900"
        color="white"
        dir={isRTL ? "rtl" : "ltr"}
        overflow="hidden"
        position="relative"
        zIndex={50}
        {...containerStyles}
      >
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        bg="gray.800"
        borderBottom="1px"
        borderColor="gray.700"
      >
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg="accent"
            color="white"
          >
            <Icon asChild boxSize={5}>
              <LuSparkles />
            </Icon>
          </Box>
          <Box>
            <Heading size="sm">{t("title")}</Heading>
            <HStack gap={2}>
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg={isStreaming ? "yellow.400" : "green.400"}
              />
              <Text fontSize="xs" color="gray.400">
                {isStreaming ? t("typing") : t("online")}
              </Text>
            </HStack>
          </Box>
        </HStack>
        {isFloating && onClose && (
          <IconButton
            aria-label={t("close")}
            variant="ghost"
            size="sm"
            onClick={onClose}
            color="gray.400"
            _hover={{ color: "white", bg: "gray.700" }}
          >
            <LuX />
          </IconButton>
        )}
      </Flex>

      {/* Status Bar - Debug Only */}
      {process.env.NEXT_PUBLIC_AI_DEBUG_UI === "true" && (
        <ChatStatusBar language={language} />
      )}

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <Flex gap={2} p={3} flexWrap="wrap" borderBottom="1px" borderColor="gray.700">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant="outline"
              borderColor={`${action.color}.500`}
              color={`${action.color}.300`}
              _hover={{ bg: `${action.color}.900` }}
              onClick={() => handleQuickAction(action)}
              disabled={
                (action.action === "summarize_lesson" && !lessonId) ||
                (action.action === "create_study_plan" && !courseId)
              }
            >
              <Icon asChild boxSize={4}>
                <action.icon />
              </Icon>
              <Text mr={isRTL ? 0 : 2} ml={isRTL ? 2 : 0}>
                {isRTL ? action.labelAr : action.label}
              </Text>
            </Button>
          ))}
        </Flex>
      )}

      {/* Messages */}
      <VStack
        ref={messagesContainerRef}
        flex={1}
        gap={4}
        p={4}
        overflowY="auto"
        align="stretch"
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "#4A5568", borderRadius: "4px" },
        }}
      >
        {messages.map((message) => (
          <Flex
            key={message.id}
            justify={message.role === "user" ? "flex-end" : "flex-start"}
            w="100%"
            direction="column"
            align={message.role === "user" ? "flex-end" : "flex-start"}
          >
            <HStack
              align="start"
              gap={2}
              maxW="85%"
              flexDir={message.role === "user" ? "row-reverse" : "row"}
            >
              {message.role === "assistant" ? (
                <Box
                  w={10}
                  h={10}
                  borderRadius="full"
                  bg="green.700"
                  animation={isStreaming ? "pulse 1.5s ease-in-out infinite" : "none"}
                />
              ) : (
                <Avatar.Root size="sm">
                  <Avatar.Fallback>
                    {message.role === "user" ? "أ" : "AI"}
                  </Avatar.Fallback>
                </Avatar.Root>
              )}
              <VStack align="stretch" gap={1}>
                <Box
                  bg={message.role === "user" ? "accent" : "gray.700"}
                  px={4}
                  py={3}
                  borderRadius="xl"
                  borderTopLeftRadius={message.role === "assistant" && !isRTL ? "sm" : undefined}
                  borderTopRightRadius={message.role === "assistant" && isRTL ? "sm" : undefined}
                >
                  {message.isLoading ? (
                    <HStack gap={2}>
                      <Spinner size="sm" />
                      <Text fontSize="sm" color="gray.400">
                        {t("thinking")}
                      </Text>
                    </HStack>
                  ) : (
                    <>
                      {message.attachments && message.attachments.length > 0 && (
                        <Stack gap={2} mb={2}>
                          {message.attachments.map((att) => (
                            <HStack
                              key={att.id}
                              bg="gray.600"
                              px={2}
                              py={1}
                              borderRadius="md"
                              fontSize="xs"
                            >
                              <Icon asChild boxSize={4}>
                                {att.type === "image" ? <LuImage /> : <LuFileText />}
                              </Icon>
                              <Text truncate maxW="150px">{att.name}</Text>
                              <Badge size="sm">{formatFileSize(att.size)}</Badge>
                            </HStack>
                          ))}
                        </Stack>
                      )}
                      <Text
                        fontSize="sm"
                        whiteSpace="pre-wrap"
                        css={{
                          "& strong": { fontWeight: "bold" },
                          "& code": { bg: "gray.800", px: 1, borderRadius: "sm" },
                        }}
                      >
                        {message.content}
                      </Text>
                    </>
                  )}
                </Box>
                {/* Message Actions for assistant messages */}
                {message.role === "assistant" && !message.isLoading && message.content && (
                  <MessageActions
                    messageId={message.id}
                    content={message.content}
                    onRegenerate={regenerateLastResponse}
                    language={language}
                  />
                )}
              </VStack>
            </HStack>
          </Flex>
        ))}
        
        {/* Typing Indicator */}
        {isStreaming && (
          <Flex justify="flex-start" w="100%">
            <HStack align="start" gap={2} maxW="85%">
              <Box
                w={10}
                h={10}
                borderRadius="full"
                bg="green.700"
                animation="pulse 1.5s ease-in-out infinite"
              />
              <TypingIndicator />
            </HStack>
          </Flex>
        )}
        
        <div ref={messagesEndRef} />
      </VStack>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Flex gap={2} px={4} py={2} bg="gray.800" flexWrap="wrap">
          {attachments.map((att) => (
            <HStack
              key={att.id}
              bg="gray.700"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="xs"
            >
              <Icon asChild boxSize={4}>
                {att.type === "image" ? <LuImage /> : <LuFileText />}
              </Icon>
              <Text truncate maxW="100px">{att.name}</Text>
              <IconButton
                aria-label={t("remove")}
                size="xs"
                variant="ghost"
                _hover={{ bg: "whiteAlpha.100" }}
                _active={{ bg: "whiteAlpha.200" }}
                onClick={() => removeAttachment(att.id)}
              >
                <Icon boxSize={4} color="whiteAlpha.800" _groupHover={{ color: "whiteAlpha.900" }} asChild>
                  <LuX />
                </Icon>
              </IconButton>
            </HStack>
          ))}
        </Flex>
      )}

      {/* Input */}
      <Flex
        gap={2}
        p={3}
        bg="gray.800"
        borderTop="1px"
        borderColor="gray.700"
        align="flex-end"
        w="100%"
        flexShrink={0}
      >
        <Input
          type="file"
          ref={fileInputRef}
          display="none"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          onChange={handleFileSelect}
        />
        <IconButton
          aria-label={t("attachFile")}
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          _hover={{ bg: "whiteAlpha.100" }}
          _active={{ bg: "whiteAlpha.200" }}
          _disabled={{ cursor: "not-allowed" }}
          disabled={isStreaming}
        >
          <Icon boxSize={5} color="whiteAlpha.800" _groupHover={{ color: "whiteAlpha.900" }} _disabled={{ color: "whiteAlpha.400" }} asChild>
            <LuPaperclip />
          </Icon>
        </IconButton>
        <Textarea
          ref={textareaRef}
          flex={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={t("placeholder")}
          bg="gray.700"
          border="none"
          resize="none"
          minH="40px"
          maxH="100px"
          rows={1}
          disabled={isStreaming}
          _focus={{ outline: "none", ring: "1px", ringColor: "accent" }}
          _placeholder={{ color: "gray.500" }}
        />
        
        {/* Stop or Send button */}
        {isStreaming ? (
          <IconButton
            aria-label={t("stopGeneration")}
            variant="ghost"
            size="sm"
            _hover={{ bg: "red.900/20" }}
            _active={{ bg: "red.900/40" }}
            onClick={stopStreaming}
          >
            <Icon boxSize={5} color="red.400" _groupHover={{ color: "red.300" }} asChild>
              <LuCircleStop />
            </Icon>
          </IconButton>
        ) : (
          <IconButton
            aria-label={t("send")}
            variant="ghost"
            size="sm"
            _hover={{ bg: "accent/20" }}
            _active={{ bg: "accent/40" }}
            _disabled={{ cursor: "not-allowed" }}
            onClick={() => sendMessage(input)}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
          >
            <Icon
              boxSize={5}
              color="accent"
              _groupHover={{ color: "accent" }}
              _disabled={{ color: "whiteAlpha.400" }}
              asChild
            >
              <LuSend />
            </Icon>
          </IconButton>
        )}
      </Flex>
      </Flex>
    </>
  );
}
