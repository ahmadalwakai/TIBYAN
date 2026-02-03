"use client";

import {
  Flex,
  VStack,
  HStack,
  Box,
  Button,
  Heading,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuSend, LuPaperclip, LuCircleStop, LuMenu } from "react-icons/lu";
import { toaster } from "@/components/ui/toaster";

// Chat components
import ChatSidebar from "./ChatSidebar";
import ChatTemplates from "./ChatTemplates";
import { LiveAgentBadge } from "./LiveAgentBadge";
import { ChatSettingsDrawer } from "./ChatSettingsDrawer";
import {
  loadSessions,
  upsertSession,
  deleteSession as deleteSessionFromStore,
  renameSession as renameSessionInStore,
  pinSession as pinSessionInStore,
  createNewSession,
  clearAllSessions,
  deriveTitleFromFirstUserMessage,
  generateMessageId,
  type ChatSession,
  type ChatMessage,
} from "./chatStore";
import {
  loadSettings,
  saveSettings,
  type ChatSettings,
  DEFAULT_SETTINGS,
} from "./chatSettingsStore";

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatPageProps {
  locale: "ar" | "en";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIChatPage({ locale }: AIChatPageProps) {
  const isRTL = locale === "ar";
  
  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSetTitleRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);
  
  // Initialize on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
  }, []);

  // Load sessions on mount (respecting saveChats setting)
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    
    if (loaded.length > 0) {
      // Select most recent session
      const sorted = [...loaded].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const mostRecent = sorted[0];
      currentSessionIdRef.current = mostRecent.id;
      setActiveSessionId(mostRecent.id);
      
      // Load messages from session
      setMessages(
        mostRecent.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt),
        }))
      );
    } else {
      // No sessions exist - create first session with welcome message
      const newSession = createNewSession(locale);
      setSessions([newSession]);
      currentSessionIdRef.current = newSession.id;
      setActiveSessionId(newSession.id);
      setMessages(
        newSession.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt),
        }))
      );
    }
  }, [locale]);

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Persist session helper
  const persistCurrentSession = useCallback(
    (updatedMessages: Message[]) => {
      if (!activeSessionId) return;
      
      const session = sessions.find((s) => s.id === activeSessionId);
      if (!session) return;
      
      const updatedSession: ChatSession = {
        ...session,
        updatedAt: new Date().toISOString(),
        messages: updatedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.timestamp.toISOString(),
        })),
      };
      
      // Update local state
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? updatedSession : s))
      );
      
      // Persist to storage (only if saveChats is enabled)
      if (settings.privacy.saveChats) {
        upsertSession(updatedSession);
      }
    },
    [activeSessionId, sessions, settings.privacy.saveChats]
  );

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: ChatSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // Send message handler
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Ensure we have an active session
      let streamSessionId = activeSessionId;
      if (!streamSessionId) {
        const newSession = createNewSession(locale);
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        streamSessionId = newSession.id;
      }
      
      // Track this session for token leakage prevention
      currentSessionIdRef.current = streamSessionId;

      // Reset title flag for new sessions (only count user messages, not welcome message)
      const currentSession = sessions.find((s) => s.id === streamSessionId);
      const hasUserMessages = currentSession?.messages.some((m) => m.role === "user") ?? false;
      if (!hasUserMessages) {
        hasSetTitleRef.current = false;
      }

      // Add user message
      const userMsg: Message = {
        id: generateMessageId(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      
      const messagesWithUser = [...messages, userMsg];
      setMessages(messagesWithUser);
      setInput("");

      // Set title from first user message
      if (!hasSetTitleRef.current && streamSessionId) {
        const title = deriveTitleFromFirstUserMessage(text);
        renameSessionInStore(streamSessionId, title);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === streamSessionId ? { ...s, title } : s
          )
        );
        hasSetTitleRef.current = true;
      }

      // Add assistant placeholder
      const assistantMsg: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      const messagesWithAssistant = [...messagesWithUser, assistantMsg];
      setMessages(messagesWithAssistant);

      // Persist before sending
      persistCurrentSession(messagesWithAssistant);

      setIsThinking(true);
      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      try {
        // Build system prompt
        const systemPrompt = locale === "ar" 
          ? `أنت "زيفون" (Zyphon)، مساعد ذكي من معهد تبيان للتعليم الإسلامي والعربي. أجب بالعربية فقط. كن ودوداً ومفيداً.`
          : `You are "Zyphon", an AI assistant from Tibyan Institute for Islamic and Arabic education. Respond only in English. Be friendly and helpful.`;
        
        // Build messages array for API
        const apiMessages = [
          { role: "system" as const, content: systemPrompt },
          ...messages.slice(-10).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: text },
        ];
        
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortControllerRef.current.signal,
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        // Update assistant message with reply
        const replyContent = data.reply || "";
        setMessages((prev) => {
          const updated = prev.map((m, i) =>
            i === prev.length - 1 && m.role === "assistant"
              ? { ...m, content: replyContent }
              : m
          );
          return updated;
        });

      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          toaster.create({
            title: isRTL ? "خطأ" : "Error",
            description: err.message,
            type: "error",
          });
          // Remove the empty assistant message on error
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        // Final persist
        setMessages((finalMessages) => {
          persistCurrentSession(finalMessages);
          return finalMessages;
        });
        setIsThinking(false);
        setIsStreaming(false);
      }
    },
    [activeSessionId, locale, messages, isRTL, persistCurrentSession]
  );

  // Stop generation handler
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages((finalMessages) => {
      persistCurrentSession(finalMessages);
      return finalMessages;
    });
    setIsThinking(false);
    setIsStreaming(false);
  }, [persistCurrentSession]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  // Session management handlers
  const handleNewChat = useCallback(() => {
    // Stop any current request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsThinking(false);
    setIsStreaming(false);
    
    const newSession = createNewSession(locale);
    setSessions((prev) => [newSession, ...prev]);
    currentSessionIdRef.current = newSession.id;
    setActiveSessionId(newSession.id);
    // Load messages from the new session (includes welcome message)
    setMessages(
      newSession.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.createdAt),
      }))
    );
    setInput("");
    hasSetTitleRef.current = false;
    setSidebarOpen(false); // Close mobile sidebar
  }, [locale]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      // Stop any current request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      setIsThinking(false);
      setIsStreaming(false);
      
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        // Update session tracking ref
        currentSessionIdRef.current = sessionId;
        setActiveSessionId(sessionId);
        setMessages(
          session.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt),
          }))
        );
        // Set title flag based on user messages (not welcome message)
        hasSetTitleRef.current = session.messages.some((m) => m.role === "user");
        setSidebarOpen(false); // Close mobile sidebar
      }
    },
    [sessions]
  );

  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    renameSessionInStore(sessionId, newTitle);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, title: newTitle, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteSessionFromStore(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      
      // If deleting active session, select another or create new
      if (sessionId === activeSessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          handleSelectSession(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    },
    [activeSessionId, sessions, handleSelectSession, handleNewChat]
  );

  const handlePinSession = useCallback((sessionId: string, pinned: boolean) => {
    pinSessionInStore(sessionId, pinned);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, pinned, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const handleClearAllSessions = useCallback(() => {
    clearAllSessions();
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
    hasSetTitleRef.current = false;
  }, []);

  const handleTemplateSelect = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  // Show templates when no messages
  const showTemplates = messages.length === 0;
  
  // Compute font scale style
  const fontScaleStyle = settings.accessibility.fontScale !== 1
    ? { fontSize: `${settings.accessibility.fontScale * 100}%` }
    : undefined;

  return (
    <Flex
      h="100vh"
      bg="gray.900"
      color="whiteAlpha.900"
      dir={isRTL ? "rtl" : "ltr"}
      flexDirection={isRTL ? "row-reverse" : "row"}
      overflow="hidden"
      style={fontScaleStyle}
    >
      {/* Settings Drawer */}
      <ChatSettingsDrawer
        isOpen={settingsOpen}
        locale={locale}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={handleSettingsChange}
      />
      
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        locale={locale}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onPinSession={handlePinSession}
        onClearAllSessions={handleClearAllSessions}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main chat area */}
      <Flex
        direction="column"
        flex={1}
        minW={0}
        overflow="hidden"
        borderRadius="lg"
        m={2}
        border="1px solid"
        borderColor="yellow.500"
        boxShadow="0 0 15px rgba(236, 201, 75, 0.3), 0 0 30px rgba(236, 201, 75, 0.15), inset 0 0 10px rgba(236, 201, 75, 0.05)"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={6}
          py={4}
          bg="gray.800"
          borderBottom="1px solid"
          borderColor="gray.700"
        >
          <HStack gap={3}>
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              color="white"
              _hover={{ bg: "whiteAlpha.100" }}
              onClick={() => setSidebarOpen(true)}
              display={{ base: "flex", lg: "none" }}
              p={2}
            >
              <LuMenu size={20} />
            </Button>
            <Heading 
              size="md" 
              fontWeight={600} 
              color="gray.900"
              bg="linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)"
              px={3}
              py={1}
              borderRadius="md"
              boxShadow="0 2px 8px rgba(255, 215, 0, 0.4)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(ellipse 80% 50% at 50% 120%, rgba(255,255,255,0.4) 0%, transparent 50%),
                  radial-gradient(ellipse 60% 40% at 30% 110%, rgba(255,255,255,0.3) 0%, transparent 50%),
                  radial-gradient(ellipse 70% 45% at 70% 115%, rgba(255,255,255,0.35) 0%, transparent 50%)
                `,
                pointerEvents: "none",
              }}
              _after={{
                content: '""',
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "100%",
                background: `
                  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20'%3E%3Cpath fill='rgba(255,255,255,0.2)' d='M0 10 Q25 0 50 10 T100 10 V20 H0Z'/%3E%3C/svg%3E")
                `,
                backgroundRepeat: "repeat-x",
                backgroundSize: "100px 20px",
                pointerEvents: "none",
              }}
            >
              {activeSession?.title || (isRTL ? "Zyphon مساعد تبيان" : "Zyphon Tibyan AI")}
            </Heading>
          </HStack>
        </Flex>

        {/* Messages or Templates */}
        {showTemplates ? (
          <ChatTemplates locale={locale} onSelectTemplate={handleTemplateSelect} />
        ) : (
          <VStack
            ref={messagesContainerRef}
            flex={1}
            gap={4}
            p={6}
            pb={24}
            overflowY="auto"
            align="stretch"
            w="100%"
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: "#4A5568", borderRadius: "4px" },
            }}
          >
            {messages.map((msg) => (
              <Flex
                key={msg.id}
                justify={msg.role === "user" ? "flex-end" : "flex-start"}
                w="100%"
              >
                <Box
                  maxW="70%"
                  bg={msg.role === "user" ? "yellow.600" : "gray.700"}
                  px={4}
                  py={3}
                  borderRadius="lg"
                >
                  <Text
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    color="white"
                  >
                    {msg.content}
                  </Text>
                </Box>
              </Flex>
            ))}
            {/* Live Agent Badge - shows while thinking or streaming */}
            {(isThinking || isStreaming) && (
              <Flex justify="flex-start" w="100%" mt={2}>
                <LiveAgentBadge 
                  isStreaming={isStreaming && !isThinking} 
                  isThinking={isThinking} 
                  language={locale}
                  reduceMotion={settings.accessibility.reduceMotion}
                />
              </Flex>
            )}
            <div ref={messagesEndRef} />
          </VStack>
        )}

        {/* Composer */}
        <Flex
          gap={3}
          p={4}
          bg="gray.800"
          borderTop="1px solid"
          borderColor="gray.700"
          align="flex-end"
          w="100%"
          flexShrink={0}
        >
          <Button
            variant="ghost"
            size="sm"
            color="white"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
            disabled={isStreaming}
            p={2}
          >
            <LuPaperclip size={20} />
          </Button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRTL ? "اكتب رسالتك..." : "Type your message..."}
            style={{
              flex: 1,
              minHeight: "40px",
              maxHeight: "100px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              background: "rgb(55, 65, 81)",
              color: "rgba(255, 255, 255, 0.92)",
              fontFamily: "inherit",
              fontSize: "14px",
              resize: "none",
              outline: "none",
              direction: isRTL ? "rtl" : "ltr",
            }}
            disabled={isStreaming}
          />
          <style>{`
            textarea::placeholder {
              color: rgba(255, 255, 255, 0.6);
            }
          `}</style>

          <Button
            variant="ghost"
            size="sm"
            color={isStreaming ? "red.400" : "white"}
            _hover={{ bg: isStreaming ? "red.900/20" : "whiteAlpha.200" }}
            onClick={() => (isStreaming ? stopGeneration() : sendMessage(input))}
            p={2}
          >
            {isStreaming ? <LuCircleStop size={20} /> : <LuSend size={20} />}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
