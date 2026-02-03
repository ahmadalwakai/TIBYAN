/**
 * Chat Session Storage - localStorage v1
 * Abstracted interface to allow future migration to DB without UI changes
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO string for serialization
}

export interface ChatSession {
  id: string;
  title: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  messages: ChatMessage[];
}

// ============================================================================
// STORAGE INTERFACE (for future DB migration)
// ============================================================================

export interface IChatStorage {
  loadSessions(): ChatSession[];
  saveSessions(sessions: ChatSession[]): void;
  upsertSession(session: ChatSession): void;
  deleteSession(id: string): void;
  renameSession(id: string, title: string): void;
  pinSession(id: string, pinned: boolean): void;
  createNewSession(locale: string): ChatSession;
  getSession(id: string): ChatSession | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "tibyan_ai_sessions_v1";
const MAX_TITLE_LENGTH = 40;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get localized welcome message for new sessions
 */
export function getWelcomeMessage(locale: string): string {
  return locale === "ar"
    ? "مرحباً، أنا Zyphon مساعد تبيان. كيف أستطيع مساعدتك؟"
    : "Hi there, I am Zyphon, Tibyan assistant. How can I help?";
}

/**
 * Derive a title from the first user message (max 40 chars)
 */
export function deriveTitleFromFirstUserMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return "New Chat";
  }
  
  // Clean up the message
  const cleaned = message
    .replace(/\s+/g, " ")
    .trim();
  
  if (cleaned.length <= MAX_TITLE_LENGTH) {
    return cleaned;
  }
  
  // Truncate at word boundary if possible
  const truncated = cleaned.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > MAX_TITLE_LENGTH * 0.6) {
    return truncated.slice(0, lastSpace) + "...";
  }
  
  return truncated + "...";
}

/**
 * Safely parse JSON from localStorage
 */
function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch {
    console.warn("[chatStore] Failed to parse JSON, returning fallback");
    return fallback;
  }
}

/**
 * Check if localStorage is available and accessible
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const testKey = "__tibyan_storage_test__";
    window.localStorage.setItem(testKey, "test");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// LOCALSTORAGE IMPLEMENTATION
// ============================================================================

class LocalStorageChatStorage implements IChatStorage {
  private getStorageKey(): string {
    return STORAGE_KEY;
  }

  loadSessions(): ChatSession[] {
    if (!isLocalStorageAvailable()) return [];
    
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      const sessions = safeJsonParse<ChatSession[]>(raw, []);
      
      // Validate and clean sessions
      return sessions.filter(
        (s): s is ChatSession =>
          typeof s === "object" &&
          s !== null &&
          typeof s.id === "string" &&
          typeof s.title === "string" &&
          Array.isArray(s.messages)
      );
    } catch (error) {
      console.error("[chatStore] Error loading sessions:", error);
      return [];
    }
  }

  saveSessions(sessions: ChatSession[]): void {
    if (!isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(sessions));
    } catch (error) {
      console.error("[chatStore] Error saving sessions:", error);
    }
  }

  upsertSession(session: ChatSession): void {
    const sessions = this.loadSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session); // Add to beginning
    }
    
    this.saveSessions(sessions);
  }

  deleteSession(id: string): void {
    const sessions = this.loadSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    this.saveSessions(filtered);
  }

  renameSession(id: string, title: string): void {
    const sessions = this.loadSessions();
    const session = sessions.find((s) => s.id === id);
    
    if (session) {
      session.title = title.slice(0, MAX_TITLE_LENGTH);
      session.updatedAt = new Date().toISOString();
      this.saveSessions(sessions);
    }
  }

  pinSession(id: string, pinned: boolean): void {
    const sessions = this.loadSessions();
    const session = sessions.find((s) => s.id === id);
    
    if (session) {
      session.pinned = pinned;
      session.updatedAt = new Date().toISOString();
      this.saveSessions(sessions);
    }
  }

  createNewSession(locale: string): ChatSession {
    const now = new Date().toISOString();
    const isArabic = locale === "ar";
    
    // Create welcome message as first assistant message
    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      role: "assistant",
      content: getWelcomeMessage(locale),
      createdAt: now,
    };
    
    const session: ChatSession = {
      id: generateId(),
      title: isArabic ? "محادثة جديدة" : "New Chat",
      locale,
      createdAt: now,
      updatedAt: now,
      pinned: false,
      messages: [welcomeMessage],
    };
    
    this.upsertSession(session);
    return session;
  }

  getSession(id: string): ChatSession | null {
    const sessions = this.loadSessions();
    return sessions.find((s) => s.id === id) || null;
  }

  clearAllSessions(): void {
    if (!isLocalStorageAvailable()) return;
    
    try {
      localStorage.removeItem(this.getStorageKey());
    } catch (error) {
      console.error("[chatStore] Error clearing sessions:", error);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton instance for localStorage implementation
const storage = new LocalStorageChatStorage();

// Export functions that wrap the storage instance
export function loadSessions(): ChatSession[] {
  return storage.loadSessions();
}

export function saveSessions(sessions: ChatSession[]): void {
  storage.saveSessions(sessions);
}

export function upsertSession(session: ChatSession): void {
  storage.upsertSession(session);
}

export function deleteSession(id: string): void {
  storage.deleteSession(id);
}

export function renameSession(id: string, title: string): void {
  storage.renameSession(id, title);
}

export function pinSession(id: string, pinned: boolean): void {
  storage.pinSession(id, pinned);
}

export function createNewSession(locale: string): ChatSession {
  return storage.createNewSession(locale);
}

export function getSession(id: string): ChatSession | null {
  return storage.getSession(id);
}

export function clearAllSessions(): void {
  storage.clearAllSessions();
}

// Export message ID generator for use in components
export { generateMessageId };

// Export the storage class for testing or custom implementations
export { LocalStorageChatStorage };
