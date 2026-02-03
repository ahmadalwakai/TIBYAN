"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuPlus,
  LuSearch,
  LuX,
  LuPencil,
  LuTrash2,
  LuPin,
  LuPinOff,
  LuMessageSquare,
  LuTrash,
  LuMenu,
  LuSettings,
} from "react-icons/lu";
import type { ChatSession } from "./chatStore";

// ============================================================================
// TYPES
// ============================================================================

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  locale: "ar" | "en";
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onPinSession: (sessionId: string, pinned: boolean) => void;
  onClearAllSessions: () => void;
  onOpenSettings?: () => void;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
  ar: {
    chats: "المحادثات",
    newChat: "محادثة جديدة",
    search: "بحث...",
    noChats: "لا توجد محادثات",
    clearAll: "حذف الكل",
    confirmClear: "هل أنت متأكد من حذف جميع المحادثات؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    rename: "إعادة تسمية",
    delete: "حذف",
    pin: "تثبيت",
    unpin: "إلغاء التثبيت",
    pinned: "مثبتة",
    today: "اليوم",
    yesterday: "أمس",
    thisWeek: "هذا الأسبوع",
    older: "أقدم",
    settings: "الإعدادات",
  },
  en: {
    chats: "Chats",
    newChat: "New Chat",
    search: "Search...",
    noChats: "No chats yet",
    clearAll: "Clear All",
    confirmClear: "Are you sure you want to delete all chats?",
    cancel: "Cancel",
    confirm: "Confirm",
    rename: "Rename",
    delete: "Delete",
    pin: "Pin",
    unpin: "Unpin",
    pinned: "Pinned",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    older: "Older",
    settings: "Settings",
  },
};

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

const TEXT_PRIMARY = "whiteAlpha.900";
const TEXT_MUTED = "whiteAlpha.700";
const ICON_COLOR = "whiteAlpha.800";
const PLACEHOLDER_COLOR = "whiteAlpha.600";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatRelativeTime(dateStr: string, locale: "ar" | "en"): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === "ar") {
    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString("ar-SA");
  }

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US");
}

function getPreviewText(session: ChatSession): string {
  const lastMessage = session.messages[session.messages.length - 1];
  if (!lastMessage) return "";
  
  const preview = lastMessage.content.slice(0, 50);
  return lastMessage.content.length > 50 ? preview + "..." : preview;
}

// ============================================================================
// MOTION COMPONENTS
// ============================================================================

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

// ============================================================================
// SESSION ITEM COMPONENT
// ============================================================================

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  locale: "ar" | "en";
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onPin: (pinned: boolean) => void;
}

function SessionItem({
  session,
  isActive,
  locale,
  onSelect,
  onRename,
  onDelete,
  onPin,
}: SessionItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title);
  const t = translations[locale];
  const isRTL = locale === "ar";

  const handleRename = useCallback(() => {
    if (editValue.trim() && editValue !== session.title) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, session.title, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRename();
      } else if (e.key === "Escape") {
        setEditValue(session.title);
        setIsEditing(false);
      }
    },
    [handleRename, session.title]
  );

  return (
    <MotionBox
      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex
        align="center"
        px={3}
        py={2.5}
        cursor="pointer"
        borderRadius="lg"
        bg={isActive ? "whiteAlpha.150" : "transparent"}
        _hover={{ bg: isActive ? "whiteAlpha.150" : "whiteAlpha.50" }}
        onClick={onSelect}
        position="relative"
        transition="background 0.15s ease"
      >
        {/* Active indicator */}
        {isActive && (
          <Box
            position="absolute"
            top="50%"
            transform="translateY(-50%)"
            {...(isRTL ? { right: 0 } : { left: 0 })}
            w="3px"
            h="60%"
            bg="#00FF2A"
            borderRadius="full"
            boxShadow="0 0 10px rgba(0, 255, 42, 0.5)"
          />
        )}

        {/* Pin indicator */}
        {session.pinned && (
          <Box
            position="absolute"
            top={1}
            {...(isRTL ? { left: 1 } : { right: 1 })}
          >
            <LuPin size={10} color="#00FF2A" />
          </Box>
        )}

        <Box flex={1} minW={0}>
          {isEditing ? (
            <Input
              size="sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              bg="#0A0A0A"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              color="white"
              _placeholder={{ color: PLACEHOLDER_COLOR }}
              _focus={{ borderColor: "#00FF2A", boxShadow: "0 0 10px rgba(0, 255, 42, 0.3)" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <Text
                fontSize="sm"
                fontWeight={isActive ? 600 : 400}
                color={TEXT_PRIMARY}
                lineClamp={1}
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {session.title}
              </Text>
              <HStack gap={2} mt={0.5}>
                <Text
                  fontSize="xs"
                  color={TEXT_PRIMARY}
                  opacity={0.72}
                  lineClamp={1}
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {getPreviewText(session) || formatRelativeTime(session.updatedAt, locale)}
                </Text>
              </HStack>
            </>
          )}
        </Box>

        {/* Action buttons */}
        <AnimatePresence>
          {isHovered && !isEditing && (
            <MotionFlex
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              gap={0.5}
              {...(isRTL ? { mr: 2 } : { ml: 2 })}
            >
              <IconButton
                aria-label={t.rename}
                size="xs"
                variant="ghost"
                color={ICON_COLOR}
                _hover={{ bg: "whiteAlpha.200", color: TEXT_PRIMARY }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <LuPencil size={14} />
              </IconButton>
              <IconButton
                aria-label={session.pinned ? t.unpin : t.pin}
                size="xs"
                variant="ghost"
                color={session.pinned ? "#00FF2A" : ICON_COLOR}
                _hover={{ bg: "rgba(0, 255, 42, 0.1)", color: session.pinned ? "#4DFF6A" : TEXT_PRIMARY }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(!session.pinned);
                }}
              >
                {session.pinned ? <LuPinOff size={14} /> : <LuPin size={14} />}
              </IconButton>
              <IconButton
                aria-label={t.delete}
                size="xs"
                variant="ghost"
                color={ICON_COLOR}
                _hover={{ bg: "red.900/40", color: TEXT_PRIMARY }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <LuTrash2 size={14} />
              </IconButton>
            </MotionFlex>
          )}
        </AnimatePresence>
      </Flex>
    </MotionBox>
  );
}

// ============================================================================
// CONFIRM MODAL COMPONENT
// ============================================================================

interface ConfirmModalProps {
  isOpen: boolean;
  locale: "ar" | "en";
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ isOpen, locale, onClose, onConfirm }: ConfirmModalProps) {
  const t = translations[locale];

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="blackAlpha.700"
      onClick={onClose}
    >
      <MotionBox
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        bg="#050505"
        p={6}
        borderRadius="xl"
        maxW="400px"
        mx={4}
        border="1px solid"
        borderColor="rgba(0, 255, 42, 0.3)"
        boxShadow="0 0 30px rgba(0, 255, 42, 0.2)"
        onClick={(e) => e.stopPropagation()}
      >
        <Text fontSize="md" fontWeight={600} color={TEXT_PRIMARY} mb={2}>
          {t.confirmClear}
        </Text>
        <HStack gap={3} mt={4} justify="flex-end">
          <Button
            size="sm"
            variant="ghost"
            color={TEXT_PRIMARY}
            onClick={onClose}
          >
            {t.cancel}
          </Button>
          <Button
            size="sm"
            bg="red.600"
            color="white"
            _hover={{ bg: "red.500" }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t.confirm}
          </Button>
        </HStack>
      </MotionBox>
    </Box>
  );
}

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export default function ChatSidebar({
  sessions,
  activeSessionId,
  locale,
  isOpen,
  onToggle,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onPinSession,
  onClearAllSessions,
  onOpenSettings,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const t = translations[locale];
  const isRTL = locale === "ar";

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.messages.some((m) => m.content.toLowerCase().includes(query))
      );
    }

    // Sort: pinned first, then by updatedAt desc
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sessions, searchQuery]);

  // Separate pinned and unpinned
  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s.pinned);

  // Sidebar content
  const sidebarContent = (
    <VStack h="100%" align="stretch" gap={0}>
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        p={4}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        <HStack gap={2}>
          <LuMessageSquare size={20} color="#00FF2A" />
          <Text fontSize="lg" fontWeight={600} color={TEXT_PRIMARY}>
            {t.chats}
          </Text>
        </HStack>
        <HStack gap={1}>
          <IconButton
            aria-label={t.newChat}
            size="sm"
            variant="ghost"
            color={ICON_COLOR}
            _hover={{ bg: "rgba(0, 255, 42, 0.1)", color: "#00FF2A" }}
            onClick={onNewChat}
          >
            <LuPlus size={18} />
          </IconButton>
          {onOpenSettings && (
            <IconButton
              aria-label={t.settings}
              size="sm"
              variant="ghost"
              color={ICON_COLOR}
              _hover={{ bg: "rgba(0, 255, 42, 0.1)", color: "#00FF2A" }}
              onClick={onOpenSettings}
            >
              <LuSettings size={18} />
            </IconButton>
          )}
          <IconButton
            aria-label="Close"
            size="sm"
            variant="ghost"
            color={ICON_COLOR}
            _hover={{ bg: "whiteAlpha.100", color: TEXT_PRIMARY }}
            onClick={onToggle}
            display={{ base: "flex", lg: "none" }}
          >
            <LuX size={18} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Search */}
      <Box px={4} py={3}>
        <Box position="relative">
          <Box
            position="absolute"
            top="50%"
            transform="translateY(-50%)"
            {...(isRTL ? { right: 3 } : { left: 3 })}
            color={ICON_COLOR}
            pointerEvents="none"
          >
            <LuSearch size={16} />
          </Box>
          <Input
            placeholder={t.search}
            size="sm"
            bg="#0A0A0A"
            border="1px solid"
            borderColor="rgba(0, 255, 42, 0.2)"
            _hover={{ borderColor: "rgba(0, 255, 42, 0.4)" }}
            _focus={{ borderColor: "#00FF2A", boxShadow: "0 0 10px rgba(0, 255, 42, 0.3)" }}
            _placeholder={{ color: PLACEHOLDER_COLOR }}
            color={TEXT_PRIMARY}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            {...(isRTL ? { pr: 10, pl: 3 } : { pl: 10, pr: 3 })}
          />
          {searchQuery && (
            <IconButton
              aria-label="Clear search"
              size="xs"
              variant="ghost"
              position="absolute"
              top="50%"
              transform="translateY(-50%)"
              {...(isRTL ? { left: 1 } : { right: 1 })}
              color={ICON_COLOR}
              _hover={{ color: TEXT_PRIMARY }}
              onClick={() => setSearchQuery("")}
            >
              <LuX size={14} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Sessions list */}
      <VStack
        flex={1}
        align="stretch"
        gap={0}
        overflowY="auto"
        px={2}
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
          },
        }}
      >
        {/* Pinned section */}
        {pinnedSessions.length > 0 && (
          <Box mb={2}>
            <Text
              fontSize="xs"
              fontWeight={600}
              color={TEXT_PRIMARY}
              opacity={0.72}
              textTransform="uppercase"
              px={3}
              py={2}
            >
              {t.pinned}
            </Text>
            <AnimatePresence mode="popLayout">
              {pinnedSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  locale={locale}
                  onSelect={() => onSelectSession(session.id)}
                  onRename={(title) => onRenameSession(session.id, title)}
                  onDelete={() => onDeleteSession(session.id)}
                  onPin={(pinned) => onPinSession(session.id, pinned)}
                />
              ))}
            </AnimatePresence>
          </Box>
        )}

        {/* Unpinned sessions */}
        <AnimatePresence mode="popLayout">
          {unpinnedSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              locale={locale}
              onSelect={() => onSelectSession(session.id)}
              onRename={(title) => onRenameSession(session.id, title)}
              onDelete={() => onDeleteSession(session.id)}
              onPin={(pinned) => onPinSession(session.id, pinned)}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {filteredSessions.length === 0 && (
          <VStack py={8} gap={3}>
            <Box color={ICON_COLOR}>
              <LuMessageSquare size={32} />
            </Box>
            <Text fontSize="sm" color={TEXT_PRIMARY} opacity={0.72} textAlign="center">
              {t.noChats}
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Footer */}
      {sessions.length > 0 && (
        <Box p={3} borderTop="1px solid" borderColor="whiteAlpha.100">
          <Button
            size="sm"
            variant="ghost"
            w="100%"
            color={TEXT_PRIMARY}
            _hover={{ bg: "red.900/30", color: TEXT_PRIMARY }}
            onClick={() => setShowConfirmClear(true)}
          >
            <LuTrash size={14} style={{ marginInlineEnd: "8px" }} />
            {t.clearAll}
          </Button>
        </Box>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={showConfirmClear}
        locale={locale}
        onClose={() => setShowConfirmClear(false)}
        onConfirm={onClearAllSessions}
      />
    </VStack>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <IconButton
        aria-label="Toggle sidebar"
        position="fixed"
        top={4}
        {...(isRTL ? { right: 4 } : { left: 4 })}
        zIndex={100}
        display={{ base: "flex", lg: "none" }}
        size="sm"
        variant="solid"
        bg="#0A0A0A"
        color={TEXT_PRIMARY}
        border="1px solid"
        borderColor="rgba(0, 255, 42, 0.3)"
        _hover={{ bg: "#050505", borderColor: "#00FF2A" }}
        onClick={onToggle}
      >
        <LuMenu size={18} />
      </IconButton>

      {/* Desktop sidebar */}
      <Box
        display={{ base: "none", lg: "block" }}
        w="320px"
        h="100%"
        bg="#050505"
        borderColor="rgba(0, 255, 42, 0.3)"
        boxShadow="0 0 30px rgba(0, 255, 42, 0.1)"
        {...(isRTL
          ? { borderLeft: "1px solid" }
          : { borderRight: "1px solid" })}
        flexShrink={0}
      >
        {sidebarContent}
      </Box>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              position="fixed"
              inset={0}
              bg="blackAlpha.700"
              zIndex={200}
              display={{ base: "block", lg: "none" }}
              onClick={onToggle}
            />

            {/* Mobile sidebar */}
            <MotionBox
              initial={{ x: isRTL ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              position="fixed"
              top={0}
              bottom={0}
              {...(isRTL ? { right: 0 } : { left: 0 })}
              w="320px"
              maxW="85vw"
              bg="#050505"
              zIndex={201}
              display={{ base: "block", lg: "none" }}
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.4)"
              boxShadow="0 0 40px rgba(0, 255, 42, 0.3)"
            >
              {sidebarContent}
            </MotionBox>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Export hamburger toggle button for use in header
export function SidebarToggleButton({
  onClick,
  isRTL,
}: {
  onClick: () => void;
  isRTL: boolean;
}) {
  return (
    <IconButton
      aria-label="Toggle sidebar"
      size="sm"
      variant="ghost"
      color="whiteAlpha.800"
      _hover={{ bg: "whiteAlpha.100", color: "whiteAlpha.900" }}
      onClick={onClick}
      display={{ base: "flex", lg: "none" }}
    >
      <LuMenu size={18} />
    </IconButton>
  );
}
