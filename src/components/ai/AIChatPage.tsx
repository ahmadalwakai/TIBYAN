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
  getWelcomeMessage,
  type ChatSession,
  type ChatMessage,
} from "./chatStore";
import {
  loadSettings,
  saveSettings,
  buildPreferences,
  getStreamingParams,
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
// THROTTLE UTILITY
// ============================================================================

function createThrottle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number
): { throttled: (...args: TArgs) => void; flush: () => void } {
  let lastCall = 0;
  let pendingArgs: TArgs | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  const throttled = (...args: TArgs) => {
    const now = Date.now();
    pendingArgs = args;

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
      pendingArgs = null;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (pendingArgs) {
          lastCall = Date.now();
          fn(...pendingArgs);
          pendingArgs = null;
        }
        timeoutId = null;
      }, delay - (now - lastCall));
    }
  };

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs) {
      fn(...pendingArgs);
      pendingArgs = null;
    }
  };

  return { throttled, flush };
}

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

const TEXT_PRIMARY = "whiteAlpha.900";
const TEXT_MUTED = "whiteAlpha.700";

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
  const streamBufferRef = useRef<string>("");
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);
  const batchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSetTitleRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null); // Track session during streaming to prevent token leakage
  
  // Typewriter effect refs
  const incomingBufferRef = useRef<string>(""); // Collects SSE deltas immediately
  const renderBufferRef = useRef<string>(""); // What is gradually shown in UI
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const uiFlushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingDelayRef = useRef<number>(0); // Random delay for this request
  const firstChunkReceivedRef = useRef<boolean>(false);
  const thinkingStartTimeRef = useRef<number>(0);
  
  // Throttled persist function
  const throttledPersistRef = useRef<{
    throttled: (session: ChatSession) => void;
    flush: () => void;
  } | null>(null);
  
  // Streaming params ref (updated when settings change)
  const streamingParamsRef = useRef(getStreamingParams(DEFAULT_SETTINGS));
  
  // Initialize throttled persist on mount
  useEffect(() => {
    throttledPersistRef.current = createThrottle((session: ChatSession) => {
      // Only persist if saveChats is enabled
      if (settings.privacy.saveChats) {
        upsertSession(session);
      }
    }, 1500); // Persist at most every 1.5 seconds during streaming
  }, [settings.privacy.saveChats]);

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    streamingParamsRef.current = getStreamingParams(loaded);
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
    (updatedMessages: Message[], throttle = false) => {
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
      if (!settings.privacy.saveChats) return;
      
      if (throttle && throttledPersistRef.current) {
        throttledPersistRef.current.throttled(updatedSession);
      } else {
        upsertSession(updatedSession);
      }
    },
    [activeSessionId, sessions, settings.privacy.saveChats]
  );

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: ChatSettings) => {
    setSettings(newSettings);
    streamingParamsRef.current = getStreamingParams(newSettings);
    saveSettings(newSettings);
  }, []);

  // ============================================================================
  // TYPEWRITER EFFECT FUNCTIONS
  // ============================================================================
  
  // Flush render buffer to UI (batched for performance)
  const flushRenderBufferToUI = useCallback(() => {
    if (renderBufferRef.current) {
      const textToAdd = renderBufferRef.current;
      renderBufferRef.current = "";
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role !== "assistant") return prev;
        
        return prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: m.content + textToAdd }
            : m
        );
      });
    }
  }, []);
  
  // Move characters from incoming buffer to render buffer (typewriter pacing)
  const typewriterTick = useCallback(() => {
    if (!incomingBufferRef.current) return;
    
    // Get params from settings (uses ref for real-time access)
    const params = streamingParamsRef.current;
    
    // Calculate slice size based on settings
    const bufferLen = incomingBufferRef.current.length;
    let sliceSize = Math.floor(Math.random() * (params.sliceMax - params.sliceMin + 1)) + params.sliceMin;
    
    // If buffer is getting large (slow render), increase slice size
    if (bufferLen > 100) sliceSize = Math.min(bufferLen, 20);
    else if (bufferLen > 50) sliceSize = Math.min(bufferLen, 12);
    
    // Check for punctuation/newline to allow burst
    const nextChunk = incomingBufferRef.current.slice(0, sliceSize);
    if (/[.!?،؟\n]/.test(nextChunk)) {
      sliceSize = Math.min(sliceSize + 3, incomingBufferRef.current.length);
    }
    
    // Move slice from incoming to render buffer
    const slice = incomingBufferRef.current.slice(0, sliceSize);
    incomingBufferRef.current = incomingBufferRef.current.slice(sliceSize);
    renderBufferRef.current += slice;
  }, []);
  
  // Start typewriter animation
  const startTypewriter = useCallback(() => {
    // Clear any existing timer
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
    }
    
    // Get interval from settings
    const params = streamingParamsRef.current;
    
    // Typewriter tick at configured interval
    typewriterTimerRef.current = setInterval(() => {
      typewriterTick();
    }, params.typewriterInterval);
    
    // UI flush every 100ms (batched renders)
    if (uiFlushTimerRef.current) {
      clearInterval(uiFlushTimerRef.current);
    }
    uiFlushTimerRef.current = setInterval(() => {
      flushRenderBufferToUI();
    }, 100);
  }, [typewriterTick, flushRenderBufferToUI]);
  
  // Stop typewriter and flush all remaining content immediately
  const stopTypewriter = useCallback((keepPartial: boolean = true) => {
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    if (uiFlushTimerRef.current) {
      clearInterval(uiFlushTimerRef.current);
      uiFlushTimerRef.current = null;
    }
    
    if (keepPartial) {
      // Move all remaining incoming to render, then flush to UI
      renderBufferRef.current += incomingBufferRef.current;
      incomingBufferRef.current = "";
      flushRenderBufferToUI();
    } else {
      incomingBufferRef.current = "";
      renderBufferRef.current = "";
    }
  }, [flushRenderBufferToUI]);
  
  // Legacy flush for compatibility with persist logic
  const flushStreamBuffer = useCallback(() => {
    // Move all content through the typewriter pipeline
    renderBufferRef.current += incomingBufferRef.current;
    incomingBufferRef.current = "";
    flushRenderBufferToUI();
  }, [flushRenderBufferToUI]);

  // Schedule flush (legacy compatibility)
  const scheduleFlush = useCallback(() => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    streamTimerRef.current = setTimeout(flushStreamBuffer, 80);
  }, [flushStreamBuffer]);

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

      // Persist at stream start
      persistCurrentSession(messagesWithAssistant, false);

      // Initialize typewriter state
      incomingBufferRef.current = "";
      renderBufferRef.current = "";
      firstChunkReceivedRef.current = false;
      thinkingDelayRef.current = Math.floor(Math.random() * 450) + 450; // 450-900ms
      thinkingStartTimeRef.current = Date.now();
      
      setIsThinking(true);
      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      try {
        // Build preferences for API
        const preferences = buildPreferences(settings);
        
        const response = await fetch("/api/ai/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: streamSessionId,
            stream: true,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            preferences,
          }),
          signal: abortControllerRef.current.signal,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let lastPersistTime = Date.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Guard: stop processing if session changed (prevents token leakage)
          if (currentSessionIdRef.current !== streamSessionId) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === "[DONE]") continue;

            try {
              const msg = JSON.parse(dataStr);
              // API sends {delta:"..."} not {type:"delta",delta:"..."}
              if (msg.delta) {
                // Guard: only buffer if still on same session
                if (currentSessionIdRef.current === streamSessionId) {
                  // Add to incoming buffer for typewriter
                  incomingBufferRef.current += msg.delta;
                  
                  // Handle first chunk - start typewriter after thinking delay
                  if (!firstChunkReceivedRef.current) {
                    firstChunkReceivedRef.current = true;
                    const elapsed = Date.now() - thinkingStartTimeRef.current;
                    const remainingDelay = Math.max(0, thinkingDelayRef.current - elapsed);
                    
                    setTimeout(() => {
                      // Only proceed if still streaming same session
                      if (currentSessionIdRef.current === streamSessionId) {
                        setIsThinking(false);
                        startTypewriter();
                      }
                    }, remainingDelay);
                  }
                }
                
                // Throttled persist during streaming
                const now = Date.now();
                if (now - lastPersistTime >= 1500) {
                  setMessages((currentMessages) => {
                    persistCurrentSession(currentMessages, true);
                    return currentMessages;
                  });
                  lastPersistTime = now;
                }
              } else if (msg.done === true) {
                // API sends {done:true} not {type:"stop"}
                stopTypewriter(true);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          toaster.create({
            title: isRTL ? "خطأ" : "Error",
            description: err.message,
            type: "error",
          });
        }
      } finally {
        // Stop typewriter and flush all remaining content
        stopTypewriter(true);
        // Clear batch interval
        if (batchIntervalRef.current) {
          clearInterval(batchIntervalRef.current);
          batchIntervalRef.current = null;
        }
        // Clear any pending flush timeout
        if (streamTimerRef.current) {
          clearTimeout(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        // Flush any pending throttled persist
        throttledPersistRef.current?.flush();
        // Final persist
        setMessages((finalMessages) => {
          persistCurrentSession(finalMessages, false);
          return finalMessages;
        });
        setIsThinking(false);
        setIsStreaming(false);
      }
    },
    [activeSessionId, locale, messages, sessions, isRTL, stopTypewriter, persistCurrentSession, startTypewriter, settings]
  );

  // Stop generation handler
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Stop typewriter immediately and keep partial text
    stopTypewriter(true);
    // Clear batch interval
    if (batchIntervalRef.current) {
      clearInterval(batchIntervalRef.current);
      batchIntervalRef.current = null;
    }
    // Clear any pending flush timeout
    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    throttledPersistRef.current?.flush();
    setMessages((finalMessages) => {
      persistCurrentSession(finalMessages, false);
      return finalMessages;
    });
    setIsThinking(false);
    setIsStreaming(false);
  }, [stopTypewriter, persistCurrentSession]);

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
    // Stop any current streaming and clear all resources
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop typewriter
    stopTypewriter(false);
    
    // Clear all timers
    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    if (batchIntervalRef.current) {
      clearInterval(batchIntervalRef.current);
      batchIntervalRef.current = null;
    }
    
    // Reset stream state
    streamBufferRef.current = "";
    incomingBufferRef.current = "";
    renderBufferRef.current = "";
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
  }, [locale, stopTypewriter]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      // Stop any current streaming and clear all resources
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Stop typewriter
      stopTypewriter(false);
      
      // Clear all timers
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current);
        batchIntervalRef.current = null;
      }
      
      // Persist current session if was streaming
      if (isStreaming) {
        throttledPersistRef.current?.flush();
      }
      
      // Reset stream state
      streamBufferRef.current = "";
      incomingBufferRef.current = "";
      renderBufferRef.current = "";
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
    [isStreaming, sessions, stopTypewriter]
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
      color={TEXT_PRIMARY}
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
