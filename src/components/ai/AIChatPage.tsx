"use client";

import {
  Flex,
  VStack,
  HStack,
  Box,
  Button,
  Heading,
  Text,
  Spinner,
  Input,
} from "@chakra-ui/react";

// Mode type for Chat vs Create (local SVG generation)
type ChatMode = "chat" | "create";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuSend, LuPaperclip, LuCircleStop, LuMenu, LuMessageSquare, LuSparkles, LuDownload } from "react-icons/lu";
import type { DesignSpec, DesignRequest } from "@/lib/zyphon/svg-gen/types";
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
  
  // Mode state
  const [mode, setMode] = useState<ChatMode>("chat");
  
  // Create Mode State (local SVG generation)
  const [isCreatingImage, setIsCreatingImage] = useState(false);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [currentDesignSpec, setCurrentDesignSpec] = useState<DesignSpec | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSettings, setCreateSettings] = useState<DesignRequest>({
    brandTextAr: "تِبيان",
    style: "modern-kufic",
    mood: "minimal-premium",
    accent: "emerald",
    background: "black",
  });
  
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

  // Local SVG Logo Mark Generator handler (uses new design engine with symbolic-mark)
  const generateLocalSvg = useCallback(async () => {
    setIsCreatingImage(true);
    setCreateError(null);
    setGeneratedSvg(null);
    setCurrentDesignSpec(null);

    try {
      // Use the new design engine API with symbolic-mark renderer
      const response = await fetch("/api/ai/design-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: "logo",
          themeId: createSettings.accent === "gold" ? "gold" : 
                   createSettings.accent === "sapphire" ? "sapphire" : "emerald",
          text: createSettings.brandTextAr, // Semantic input only, NOT rendered as text
          seed: Math.floor(Math.random() * 1000000),
          // Pattern and circuit are disabled by default for logo preset
          patternIntensity: 0,
          circuitIntensity: 0,
          accentIntensity: 0.5,
          // Use symbolic-mark renderer (abstract shapes, NOT text)
          markRenderer: "symbolic-mark",
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // The new design engine returns SVG directly
      const svgString = data.data.svg;
      setGeneratedSvg(svgString);
      
      // Store spec for potential PNG export
      if (data.data.spec) {
        setCurrentDesignSpec({
          canvas: { 
            w: data.data.spec.canvas?.width ?? 1024, 
            h: data.data.spec.canvas?.height ?? 1024, 
            bg: data.data.spec.canvas?.background ?? "#000000" 
          },
          text: { 
            value: createSettings.brandTextAr, 
            strokeWidth: 10, 
            geometryStyle: "geometric", 
            centered: true, 
            scale: 1 
          },
          seed: data.data.spec.seed ?? 0,
        });
      }

      toaster.create({
        title: isRTL ? "تم الإنشاء" : "Created",
        description: isRTL ? "تم إنشاء الشعار بنجاح" : "Logo mark generated successfully",
        type: "success",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : (isRTL ? "فشل إنشاء الشعار" : "Logo mark creation failed");
      setCreateError(errorMsg);
      toaster.create({
        title: isRTL ? "خطأ" : "Error",
        description: errorMsg,
        type: "error",
      });
    } finally {
      setIsCreatingImage(false);
    }
  }, [createSettings, isRTL]);

  // Download SVG handler
  const downloadSvg = useCallback(() => {
    if (!generatedSvg) return;
    const blob = new Blob([generatedSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tibyan-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generatedSvg]);

  // Download PNG handler (convert SVG to PNG using canvas)
  const downloadPng = useCallback(async () => {
    if (!generatedSvg || !currentDesignSpec) return;
    
    const { canvas: canvasSpec } = currentDesignSpec;
    const canvas = document.createElement("canvas");
    canvas.width = canvasSpec.w;
    canvas.height = canvasSpec.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    const svgBlob = new Blob([generatedSvg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `tibyan-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    
    img.src = svgUrl;
  }, [generatedSvg, currentDesignSpec]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Disable Enter-to-submit in create mode (require button click)
      if (mode === "create") return;
      
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage, mode]
  );

  // Handle submit based on mode
  const handleSubmit = useCallback(() => {
    if (mode === "create") {
      generateLocalSvg();
    } else {
      sendMessage(input);
    }
  }, [mode, input, generateLocalSvg, sendMessage]);

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
      bg="#000000"
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
        borderColor="rgba(0, 255, 42, 0.4)"
        boxShadow="0 0 30px rgba(0, 255, 42, 0.2), 0 0 60px rgba(0, 255, 42, 0.1), inset 0 0 20px rgba(0, 255, 42, 0.03)"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={6}
          py={4}
          bg="#050505"
          borderBottom="1px solid"
          borderColor="rgba(0, 255, 42, 0.2)"
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
              color="#000000"
              bg="#00FF2A"
              px={3}
              py={1}
              borderRadius="md"
              boxShadow="0 0 20px rgba(0, 255, 42, 0.5)"
            >
              {activeSession?.title || (isRTL ? "Zyphon مساعد تبيان" : "Zyphon Tibyan AI")}
            </Heading>
          </HStack>
          
          {/* Mode Toggle */}
          <HStack gap={1} bg="#0A0A0A" p={1} borderRadius="md" border="1px solid rgba(0, 255, 42, 0.2)">
            <Button
              size="sm"
              variant={mode === "chat" ? "solid" : "ghost"}
              bg={mode === "chat" ? "#00FF2A" : "transparent"}
              color={mode === "chat" ? "#000000" : "whiteAlpha.700"}
              _hover={{ bg: mode === "chat" ? "#00FF2A" : "whiteAlpha.100" }}
              onClick={() => setMode("chat")}
              px={3}
              py={1}
            >
              <LuMessageSquare size={16} />
              <Text ml={1} fontSize="sm">{isRTL ? "محادثة" : "Chat"}</Text>
            </Button>
            <Button
              size="sm"
              variant={mode === "create" ? "solid" : "ghost"}
              bg={mode === "create" ? "#00FF2A" : "transparent"}
              color={mode === "create" ? "#000000" : "whiteAlpha.700"}
              _hover={{ bg: mode === "create" ? "#00FF2A" : "whiteAlpha.100" }}
              onClick={() => setMode("create")}
              px={3}
              py={1}
            >
              <LuSparkles size={16} />
              <Text ml={1} fontSize="sm">{isRTL ? "شعار" : "Logo Mark"}</Text>
            </Button>
          </HStack>
        </Flex>

        {/* Messages, Templates, Image Mode, or Create Mode */}
        {mode === "create" ? (
          /* Create Mode Content - Local SVG Generation */
          <VStack
            flex={1}
            gap={4}
            p={6}
            pb={24}
            overflowY="auto"
            align="center"
            justify="flex-start"
            w="100%"
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: "rgba(0, 255, 42, 0.3)", borderRadius: "4px" },
            }}
          >
            {/* Settings Panel */}
            <Box
              w="100%"
              maxW="600px"
              bg="#0A0A0A"
              border="1px solid rgba(0, 255, 42, 0.3)"
              borderRadius="lg"
              p={4}
            >
              <VStack gap={4} align="stretch">
                <Heading size="sm" color="#00FF2A">
                  {isRTL ? "إنشاء شعار" : "Generate Logo Mark"}
                </Heading>
                <Text color="whiteAlpha.500" fontSize="xs" mt={-2}>
                  {isRTL ? "رمز علامة تجارية مجرد (ليس نصًا حرفيًا)" : "Abstract brand symbol (not literal text)"}
                </Text>
                
                {/* Brand Name Input - Semantic only, not rendered as text */}
                <Box>
                  <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                    {isRTL ? "اسم العلامة" : "Brand Name"}
                  </Text>
                  <Input
                    value={createSettings.brandTextAr}
                    onChange={(e) => setCreateSettings(prev => ({ ...prev, brandTextAr: e.target.value }))}
                    placeholder={isRTL ? "أدخل النص..." : "Enter text..."}
                    bg="#050505"
                    border="1px solid rgba(0, 255, 42, 0.3)"
                    color="white"
                    _focus={{ borderColor: "#00FF2A", boxShadow: "0 0 0 1px #00FF2A" }}
                    dir="rtl"
                    disabled={isCreatingImage}
                  />
                </Box>
                
                {/* Style Selector */}
                <HStack gap={4} flexWrap="wrap">
                  <Box flex={1} minW="140px">
                    <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                      {isRTL ? "النمط" : "Style"}
                    </Text>
                    <HStack gap={1} flexWrap="wrap">
                      {(["modern-kufic", "classic-kufic", "geometric", "angular"] as const).map((style) => (
                        <Button
                          key={style}
                          size="xs"
                          variant={createSettings.style === style ? "solid" : "outline"}
                          bg={createSettings.style === style ? "#00FF2A" : "transparent"}
                          color={createSettings.style === style ? "#000" : "whiteAlpha.700"}
                          borderColor="rgba(0, 255, 42, 0.3)"
                          _hover={{ bg: createSettings.style === style ? "#00FF2A" : "whiteAlpha.100" }}
                          onClick={() => setCreateSettings(prev => ({ ...prev, style }))}
                          disabled={isCreatingImage}
                        >
                          {style.replace("-", " ")}
                        </Button>
                      ))}
                    </HStack>
                  </Box>
                </HStack>
                
                {/* Mood Selector */}
                <Box>
                  <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                    {isRTL ? "المزاج" : "Mood"}
                  </Text>
                  <HStack gap={1} flexWrap="wrap">
                    {(["minimal-premium", "vibrant", "traditional", "tech"] as const).map((mood) => (
                      <Button
                        key={mood}
                        size="xs"
                        variant={createSettings.mood === mood ? "solid" : "outline"}
                        bg={createSettings.mood === mood ? "#00FF2A" : "transparent"}
                        color={createSettings.mood === mood ? "#000" : "whiteAlpha.700"}
                        borderColor="rgba(0, 255, 42, 0.3)"
                        _hover={{ bg: createSettings.mood === mood ? "#00FF2A" : "whiteAlpha.100" }}
                        onClick={() => setCreateSettings(prev => ({ ...prev, mood }))}
                        disabled={isCreatingImage}
                      >
                        {mood.replace("-", " ")}
                      </Button>
                    ))}
                  </HStack>
                </Box>
                
                {/* Accent Color Selector */}
                <Box>
                  <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                    {isRTL ? "اللون المميز" : "Accent Color"}
                  </Text>
                  <HStack gap={2}>
                    {(["emerald", "gold", "sapphire", "ruby", "purple"] as const).map((color) => {
                      const colorMap: Record<string, string> = {
                        emerald: "#00A86B",
                        gold: "#FFD700",
                        sapphire: "#0F52BA",
                        ruby: "#E0115F",
                        purple: "#9B30FF",
                      };
                      return (
                        <Box
                          key={color}
                          w="28px"
                          h="28px"
                          borderRadius="md"
                          bg={colorMap[color]}
                          border={createSettings.accent === color ? "2px solid white" : "2px solid transparent"}
                          cursor={isCreatingImage ? "not-allowed" : "pointer"}
                          onClick={() => !isCreatingImage && setCreateSettings(prev => ({ ...prev, accent: color }))}
                          _hover={{ transform: isCreatingImage ? "none" : "scale(1.1)" }}
                          transition="transform 0.1s"
                        />
                      );
                    })}
                  </HStack>
                </Box>
                
                {/* Background Selector */}
                <Box>
                  <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                    {isRTL ? "الخلفية" : "Background"}
                  </Text>
                  <HStack gap={2}>
                    {(["black", "dark-gray", "navy", "dark-green"] as const).map((bg) => {
                      const bgMap: Record<string, string> = {
                        black: "#000000",
                        "dark-gray": "#1A1A1A",
                        navy: "#0A0A2E",
                        "dark-green": "#0A1F0A",
                      };
                      return (
                        <Box
                          key={bg}
                          w="28px"
                          h="28px"
                          borderRadius="md"
                          bg={bgMap[bg]}
                          border={createSettings.background === bg ? "2px solid #00FF2A" : "2px solid rgba(255,255,255,0.2)"}
                          cursor={isCreatingImage ? "not-allowed" : "pointer"}
                          onClick={() => !isCreatingImage && setCreateSettings(prev => ({ ...prev, background: bg }))}
                          _hover={{ transform: isCreatingImage ? "none" : "scale(1.1)" }}
                          transition="transform 0.1s"
                        />
                      );
                    })}
                  </HStack>
                </Box>
                
                {/* Generate Button */}
                <Button
                  size="lg"
                  bg="#00FF2A"
                  color="#000"
                  _hover={{ bg: "#00CC22" }}
                  onClick={generateLocalSvg}
                  disabled={isCreatingImage || !createSettings.brandTextAr.trim()}
                  w="100%"
                >
                  {isCreatingImage ? (
                    <HStack gap={2}>
                      <Spinner size="sm" />
                      <Text>{isRTL ? "جاري الإنشاء..." : "Generating..."}</Text>
                    </HStack>
                  ) : (
                    <HStack gap={2}>
                      <LuSparkles size={18} />
                      <Text>{isRTL ? "إنشاء شعار" : "Generate Logo Mark"}</Text>
                    </HStack>
                  )}
                </Button>
              </VStack>
            </Box>
            
            {/* Error State */}
            {createError && !isCreatingImage && (
              <Box
                bg="red.900/20"
                border="1px solid"
                borderColor="red.500/50"
                borderRadius="lg"
                px={4}
                py={3}
                maxW="400px"
              >
                <Text color="red.300" fontSize="sm">{createError}</Text>
              </Box>
            )}
            
            {/* Generated SVG Preview */}
            {generatedSvg && !isCreatingImage && (
              <VStack gap={4} w="100%" maxW="600px">
                <Box
                  w="100%"
                  borderRadius="lg"
                  overflow="hidden"
                  border="1px solid rgba(0, 255, 42, 0.3)"
                  bg="#0A0A0A"
                >
                  <Box
                    dangerouslySetInnerHTML={{ __html: generatedSvg }}
                    css={{
                      "& svg": {
                        width: "100%",
                        height: "auto",
                        display: "block",
                      },
                    }}
                  />
                </Box>
                
                {/* Download Buttons */}
                <HStack gap={3}>
                  <Button
                    size="md"
                    variant="outline"
                    borderColor="#00FF2A"
                    color="#00FF2A"
                    _hover={{ bg: "rgba(0, 255, 42, 0.1)" }}
                    onClick={downloadSvg}
                  >
                    <LuDownload size={16} />
                    <Text ml={2}>{isRTL ? "تحميل SVG" : "Download SVG"}</Text>
                  </Button>
                  <Button
                    size="md"
                    bg="#00FF2A"
                    color="#000"
                    _hover={{ bg: "#00CC22" }}
                    onClick={downloadPng}
                  >
                    <LuDownload size={16} />
                    <Text ml={2}>{isRTL ? "تحميل PNG" : "Download PNG"}</Text>
                  </Button>
                </HStack>
                
                {/* Design Spec Info */}
                {currentDesignSpec && (
                  <Box
                    w="100%"
                    bg="#050505"
                    border="1px solid rgba(0, 255, 42, 0.2)"
                    borderRadius="md"
                    p={3}
                  >
                    <Text color="whiteAlpha.500" fontSize="xs" fontFamily="mono">
                      {isRTL ? "معرف البذرة" : "Seed"}: {currentDesignSpec.seed} | 
                      {isRTL ? " الأبعاد" : " Size"}: {currentDesignSpec.canvas.w}×{currentDesignSpec.canvas.h}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
            
            {/* Empty State */}
            {!generatedSvg && !isCreatingImage && !createError && (
              <VStack gap={3} py={4} textAlign="center">
                <Box
                  p={4}
                  borderRadius="full"
                  bg="rgba(0, 255, 42, 0.1)"
                  border="1px solid rgba(0, 255, 42, 0.3)"
                >
                  <LuSparkles size={32} color="#00FF2A" />
                </Box>
                <Text color="whiteAlpha.800" fontSize="md" fontWeight={500}>
                  {isRTL ? "مُنشئ الصور المحلي" : "Local Image Creator"}
                </Text>
                <Text color="whiteAlpha.500" fontSize="sm" maxW="300px">
                  {isRTL 
                    ? "اضبط الإعدادات أعلاه ثم اضغط على إنشاء صورة" 
                    : "Adjust settings above and click Generate Image"}
                </Text>
              </VStack>
            )}
          </VStack>
        ) : showTemplates ? (
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
              "&::-webkit-scrollbar-thumb": { background: "rgba(0, 255, 42, 0.3)", borderRadius: "4px" },
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
                  bg={msg.role === "user" ? "#00FF2A" : "#0A0A0A"}
                  px={4}
                  py={3}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={msg.role === "user" ? "transparent" : "rgba(0, 255, 42, 0.3)"}
                >
                  <Text
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    color={msg.role === "user" ? "#000000" : "white"}
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
          direction="column"
          gap={2}
          p={4}
          bg="#050505"
          borderTop="1px solid"
          borderColor="rgba(0, 255, 42, 0.2)"
          w="100%"
          flexShrink={0}
        >
          <Flex gap={3} align="flex-end" w="100%">
            {mode === "chat" && (
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
            )}

            <Box flex={1} position="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRTL ? "اكتب رسالتك..." : "Type your message..."}
                style={{
                  width: "100%",
                  minHeight: "40px",
                  maxHeight: "100px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 255, 42, 0.3)",
                  background: "#0A0A0A",
                  color: "rgba(255, 255, 255, 0.92)",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  resize: "none",
                  outline: "none",
                  direction: isRTL ? "rtl" : "ltr",
                }}
                disabled={isStreaming}
              />
            </Box>
            <style>{`
              textarea::placeholder {
                color: rgba(255, 255, 255, 0.6);
              }
            `}</style>

            <Button
              variant="ghost"
              size="sm"
              bg="transparent"
              color={isStreaming ? "red.400" : "#00FF2A"}
              _hover={{ 
                bg: isStreaming 
                  ? "red.900/20" 
                  : "rgba(0, 255, 42, 0.1)" 
              }}
              onClick={() => {
                if (isStreaming) {
                  stopGeneration();
                } else {
                  handleSubmit();
                }
              }}
              disabled={!input.trim()}
              px={2}
              py={2}
            >
              {isStreaming ? (
                <LuCircleStop size={20} />
              ) : (
                <LuSend size={20} />
              )}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
