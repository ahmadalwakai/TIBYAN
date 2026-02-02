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
} from "react-icons/lu";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRTL = language === "ar";

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: isRTL
        ? "مرحباً! أنا مساعدك الذكي في تبيان. يمكنني مساعدتك في:\n\n• تلخيص الدروس\n• إنشاء اختبارات\n• إعداد خطط دراسية\n• الإجابة على أسئلتك\n• تحليل الصور والمستندات\n\nكيف يمكنني مساعدتك اليوم؟"
        : "Hello! I'm your AI assistant at Tibyan. I can help you with:\n\n• Summarizing lessons\n• Creating quizzes\n• Preparing study plans\n• Answering your questions\n• Analyzing images and documents\n\nHow can I help you today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [isRTL]);

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
          title: isRTL ? "نوع الملف غير مدعوم" : "File type not supported",
          type: "error",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toaster.create({
          title: isRTL ? "الملف كبير جداً (الحد الأقصى 10 ميجابايت)" : "File too large (max 10MB)",
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

  // Send message
  const sendMessage = useCallback(async (content: string, action?: string) => {
    if (!content.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: content.trim(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading_${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      // Build request based on action or general chat
      let endpoint = "/api/ai/agent";
      interface RequestBody {
        message: string;
        sessionId: string;
        history: Array<{ role: "user" | "assistant"; content: string }>;
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
        history: messages
          .filter((m) => !m.isLoading)
          .map((m) => ({ role: m.role, content: m.content })),
        context: {
          lessonId,
          courseId,
          attachments: userMessage.attachments,
        },
      };

      // Handle quick actions
      if (action === "summarize_lesson" && lessonId) {
        endpoint = "/api/ai/summarize";
        requestBody = { lessonId, type: "brief", language, message: "", sessionId, history: [] };
      } else if (action === "generate_quiz" && (lessonId || courseId)) {
        endpoint = "/api/ai/quiz";
        requestBody = { lessonId, courseId, questionCount: 5, difficulty: "medium", language, message: "", sessionId, history: [] };
      } else if (action === "create_study_plan" && courseId) {
        endpoint = "/api/ai/study-plan";
        requestBody = { courseId, goalType: "complete_course", availableHoursPerWeek: 10, language, message: "", sessionId, history: [] };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as { 
        ok: boolean; 
        data?: { 
          response?: string; 
          summary?: string;
          quiz?: { questions: Array<{ question: string; options?: string[]; correctAnswer: number | string }> };
          plan?: { title: string; weeklySchedule: Array<{ day: string; topic: string }> };
        }; 
        error?: string 
      };

      // Remove loading message and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        
        let responseContent = "";
        if (data.ok && data.data) {
          if (action === "summarize_lesson" && data.data.summary) {
            responseContent = `📝 **${isRTL ? "ملخص الدرس" : "Lesson Summary"}**\n\n${data.data.summary}`;
          } else if (action === "generate_quiz" && data.data.quiz) {
            responseContent = `📋 **${isRTL ? "اختبار" : "Quiz"}**\n\n`;
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
          responseContent = data.error || (isRTL ? "عذراً، حدث خطأ. حاول مرة أخرى." : "Sorry, an error occurred. Please try again.");
        }

        const assistantMessage: Message = {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
        };

        return [...filtered, assistantMessage];
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [
          ...filtered,
          {
            id: `msg_${Date.now()}`,
            role: "assistant",
            content: isRTL
              ? "عذراً، لا يمكن الاتصال بالخادم. تأكد من تشغيل خدمة الذكاء الاصطناعي."
              : "Sorry, cannot connect to the server. Make sure the AI service is running.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [attachments, messages, sessionId, lessonId, courseId, language, isRTL]);

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

  const containerStyles = isFloating
    ? {
        position: "fixed" as const,
        bottom: "20px",
        left: isRTL ? "20px" : "auto",
        right: isRTL ? "auto" : "20px",
        width: "400px",
        maxWidth: "calc(100vw - 40px)",
        height: "600px",
        maxHeight: "calc(100vh - 40px)",
        borderRadius: "2xl",
        boxShadow: "2xl",
        zIndex: 1000,
      }
    : {
        width: "100%",
        height: "100%",
        minHeight: "500px",
      };

  return (
    <Flex
      direction="column"
      bg="gray.900"
      color="white"
      dir={isRTL ? "rtl" : "ltr"}
      overflow="hidden"
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
            <Heading size="sm">{isRTL ? "مساعد تبيان الذكي" : "Tibyan AI Assistant"}</Heading>
            <Text fontSize="xs" color="gray.400">
              {isRTL ? "مدعوم بالذكاء الاصطناعي" : "Powered by AI"}
            </Text>
          </Box>
        </HStack>
        {isFloating && onClose && (
          <IconButton
            aria-label="Close"
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
          >
            <HStack
              align="start"
              gap={2}
              maxW="85%"
              flexDir={message.role === "user" ? "row-reverse" : "row"}
            >
              <Avatar.Root size="sm">
                {message.role === "assistant" ? (
                  <Box p={1} bg="accent" borderRadius="full">
                    <Icon asChild boxSize={4} color="white">
                      <LuBot />
                    </Icon>
                  </Box>
                ) : (
                  <Avatar.Fallback>
                    {message.role === "user" ? "أ" : "AI"}
                  </Avatar.Fallback>
                )}
              </Avatar.Root>
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
                      {isRTL ? "جاري التفكير..." : "Thinking..."}
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
            </HStack>
          </Flex>
        ))}
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
                aria-label="Remove"
                size="xs"
                variant="ghost"
                onClick={() => removeAttachment(att.id)}
              >
                <LuX />
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
        align="end"
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
          aria-label="Attach file"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          color="gray.400"
          _hover={{ color: "white", bg: "gray.700" }}
        >
          <LuPaperclip />
        </IconButton>
        <Textarea
          ref={textareaRef}
          flex={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isRTL ? "اكتب رسالتك..." : "Type your message..."}
          bg="gray.700"
          border="none"
          resize="none"
          minH="40px"
          maxH="120px"
          rows={1}
          _focus={{ outline: "none", ring: "1px", ringColor: "accent" }}
          _placeholder={{ color: "gray.500" }}
        />
        <IconButton
          aria-label="Send"
          colorPalette="accent"
          size="sm"
          onClick={() => sendMessage(input)}
          disabled={isLoading || (!input.trim() && attachments.length === 0)}
        >
          <LuSend />
        </IconButton>
      </Flex>
    </Flex>
  );
}
