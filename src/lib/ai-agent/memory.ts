/**
 * AI Agent - Session Memory
 * Prisma-backed session memory and user preference storage
 */

import { db } from "@/lib/db";
import type { MemoryEntry, UserPreference, PreferenceCategory } from "./types";
import { sessionCache } from "./cache";

// ============================================
// Memory Configuration
// ============================================

interface MemoryConfig {
  sessionTtlMs: number; // How long to keep session data
  maxEntriesPerSession: number; // Max entries per session
  cacheEnabled: boolean;
}

const DEFAULT_CONFIG: MemoryConfig = {
  sessionTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  maxEntriesPerSession: 100,
  cacheEnabled: true,
};

// ============================================
// Session Memory Class
// ============================================

class AgentMemory {
  private config: MemoryConfig;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================
  // Session Memory Operations
  // ==========================================

  /**
   * Get value from session memory
   */
  async get<T>(sessionId: string, key: string): Promise<T | null> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = sessionCache.get<T>(sessionId, key);
      if (cached !== null) return cached;
    }

    // Query from database
    // Using SystemSetting as a generic KV store for now
    // In production, add dedicated AgentSession model
    const setting = await db.systemSetting.findFirst({
      where: {
        key: `agent_session:${sessionId}:${key}`,
        category: "agent_memory",
      },
    });

    if (!setting) return null;

    const value = setting.value as { data: T; expiresAt?: string };

    // Check expiration
    if (value.expiresAt && new Date(value.expiresAt) < new Date()) {
      await this.delete(sessionId, key);
      return null;
    }

    // Cache for future reads
    if (this.config.cacheEnabled) {
      sessionCache.set(sessionId, key, value.data);
    }

    return value.data;
  }

  /**
   * Set value in session memory
   */
  async set<T>(
    sessionId: string,
    key: string,
    value: T,
    ttlMs?: number
  ): Promise<void> {
    const expiresAt = ttlMs
      ? new Date(Date.now() + ttlMs)
      : new Date(Date.now() + this.config.sessionTtlMs);

    const dbKey = `agent_session:${sessionId}:${key}`;

    // Upsert to database - serialize for Prisma JSON compatibility
    const jsonValue = JSON.parse(JSON.stringify({ data: value, expiresAt: expiresAt.toISOString() }));
    await db.systemSetting.upsert({
      where: { key: dbKey },
      create: {
        key: dbKey,
        value: jsonValue,
        category: "agent_memory",
        description: `Agent session memory: ${sessionId}/${key}`,
      },
      update: {
        value: jsonValue,
      },
    });

    // Update cache
    if (this.config.cacheEnabled) {
      sessionCache.set(sessionId, key, value, ttlMs);
    }
  }

  /**
   * Delete value from session memory
   */
  async delete(sessionId: string, key: string): Promise<boolean> {
    const dbKey = `agent_session:${sessionId}:${key}`;

    try {
      await db.systemSetting.delete({
        where: { key: dbKey },
      });

      // Clear from cache
      if (this.config.cacheEnabled) {
        sessionCache.clear(sessionId);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all entries for a session
   */
  async getAll(sessionId: string): Promise<MemoryEntry[]> {
    const settings = await db.systemSetting.findMany({
      where: {
        key: { startsWith: `agent_session:${sessionId}:` },
        category: "agent_memory",
      },
    });

    const entries: MemoryEntry[] = [];
    const now = new Date();

    for (const setting of settings) {
      const value = setting.value as { data: unknown; expiresAt?: string };
      const expiresAt = value.expiresAt ? new Date(value.expiresAt) : undefined;

      // Skip expired entries
      if (expiresAt && expiresAt < now) continue;

      // Extract key from full database key
      const key = setting.key.replace(`agent_session:${sessionId}:`, "");

      entries.push({
        id: setting.id,
        sessionId,
        key,
        value: value.data,
        expiresAt,
        createdAt: setting.updatedAt, // Using updatedAt as createdAt
      });
    }

    return entries;
  }

  /**
   * Clear all entries for a session
   */
  async clearSession(sessionId: string): Promise<number> {
    const result = await db.systemSetting.deleteMany({
      where: {
        key: { startsWith: `agent_session:${sessionId}:` },
        category: "agent_memory",
      },
    });

    // Clear cache
    if (this.config.cacheEnabled) {
      sessionCache.clear(sessionId);
    }

    return result.count;
  }

  // ==========================================
  // Conversation History
  // ==========================================

  /**
   * Get conversation history for session
   */
  async getConversationHistory(
    sessionId: string
  ): Promise<Array<{ role: string; content: string }>> {
    const history = await this.get<Array<{ role: string; content: string }>>(
      sessionId,
      "conversation_history"
    );
    return history ?? [];
  }

  /**
   * Add message to conversation history
   */
  async addToConversationHistory(
    sessionId: string,
    message: { role: string; content: string }
  ): Promise<void> {
    const history = await this.getConversationHistory(sessionId);

    // Add new message
    history.push(message);

    // Limit history size
    const maxHistory = this.config.maxEntriesPerSession;
    const trimmedHistory =
      history.length > maxHistory ? history.slice(-maxHistory) : history;

    await this.set(sessionId, "conversation_history", trimmedHistory);
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(sessionId: string): Promise<void> {
    await this.delete(sessionId, "conversation_history");
  }

  // ==========================================
  // User Preferences
  // ==========================================

  /**
   * Get user preference
   */
  async getPreference<T>(
    userId: string,
    category: PreferenceCategory,
    key: string
  ): Promise<T | null> {
    const cacheKey = `pref:${userId}:${category}:${key}`;

    // Check cache
    if (this.config.cacheEnabled) {
      const cached = sessionCache.get<T>(userId, cacheKey);
      if (cached !== null) return cached;
    }

    // Query user's notification prefs from User model
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    if (!user?.notificationPrefs) return null;

    const prefs = user.notificationPrefs as Record<
      string,
      Record<string, unknown>
    >;
    const value = prefs[category]?.[key] as T | undefined;

    if (value !== undefined && this.config.cacheEnabled) {
      sessionCache.set(userId, cacheKey, value);
    }

    return value ?? null;
  }

  /**
   * Set user preference
   */
  async setPreference<T>(
    userId: string,
    category: PreferenceCategory,
    key: string,
    value: T
  ): Promise<void> {
    // Get current preferences
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    const currentPrefs = (user?.notificationPrefs as Record<
      string,
      Record<string, unknown>
    >) ?? {};

    // Update nested preference
    if (!currentPrefs[category]) {
      currentPrefs[category] = {};
    }
    currentPrefs[category][key] = value;

    // Save to database - serialize for Prisma JSON compatibility
    await db.user.update({
      where: { id: userId },
      data: { notificationPrefs: JSON.parse(JSON.stringify(currentPrefs)) },
    });

    // Update cache
    if (this.config.cacheEnabled) {
      const cacheKey = `pref:${userId}:${category}:${key}`;
      sessionCache.set(userId, cacheKey, value);
    }
  }

  /**
   * Get all preferences for a category
   */
  async getPreferencesCategory(
    userId: string,
    category: PreferenceCategory
  ): Promise<Record<string, unknown>> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    const prefs = (user?.notificationPrefs as Record<
      string,
      Record<string, unknown>
    >) ?? {};

    return prefs[category] ?? {};
  }

  /**
   * Set multiple preferences at once
   */
  async setPreferences(
    userId: string,
    preferences: UserPreference[]
  ): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    const currentPrefs = (user?.notificationPrefs as Record<
      string,
      Record<string, unknown>
    >) ?? {};

    // Merge new preferences
    for (const pref of preferences) {
      if (!currentPrefs[pref.category]) {
        currentPrefs[pref.category] = {};
      }
      currentPrefs[pref.category][pref.key] = pref.value;
    }

    // Save to database - serialize for Prisma JSON compatibility
    await db.user.update({
      where: { id: userId },
      data: { notificationPrefs: JSON.parse(JSON.stringify(currentPrefs)) },
    });

    // Clear cache for user
    if (this.config.cacheEnabled) {
      sessionCache.clear(userId);
    }
  }

  // ==========================================
  // Agent-specific Preferences
  // ==========================================

  /**
   * Get agent preferences for user
   */
  async getAgentPreferences(userId: string): Promise<{
    preferredLanguage: string;
    verbosity: "brief" | "detailed";
    enableSuggestions: boolean;
    enableHistory: boolean;
  }> {
    const defaults = {
      preferredLanguage: "ar",
      verbosity: "brief" as const,
      enableSuggestions: true,
      enableHistory: true,
    };

    const prefs = await this.getPreferencesCategory(userId, "agent");

    return {
      preferredLanguage:
        (prefs.preferredLanguage as string) ?? defaults.preferredLanguage,
      verbosity:
        (prefs.verbosity as "brief" | "detailed") ?? defaults.verbosity,
      enableSuggestions:
        (prefs.enableSuggestions as boolean) ?? defaults.enableSuggestions,
      enableHistory:
        (prefs.enableHistory as boolean) ?? defaults.enableHistory,
    };
  }

  /**
   * Set agent preference
   */
  async setAgentPreference<K extends keyof AgentPreferences>(
    userId: string,
    key: K,
    value: AgentPreferences[K]
  ): Promise<void> {
    await this.setPreference(userId, "agent", key, value);
  }

  // ==========================================
  // Context Memory
  // ==========================================

  /**
   * Store context for a session (e.g., current course, current lesson)
   */
  async setContext(
    sessionId: string,
    context: Record<string, unknown>
  ): Promise<void> {
    await this.set(sessionId, "context", context);
  }

  /**
   * Get context for a session
   */
  async getContext(sessionId: string): Promise<Record<string, unknown> | null> {
    return this.get(sessionId, "context");
  }

  /**
   * Update specific context field
   */
  async updateContext(
    sessionId: string,
    key: string,
    value: unknown
  ): Promise<void> {
    const context = (await this.getContext(sessionId)) ?? {};
    context[key] = value;
    await this.setContext(sessionId, context);
  }

  // ==========================================
  // Cleanup
  // ==========================================

  /**
   * Clean up expired session data
   */
  async cleanupExpired(): Promise<number> {
    const settings = await db.systemSetting.findMany({
      where: { category: "agent_memory" },
      select: { id: true, key: true, value: true },
    });

    const now = new Date();
    const expiredIds: string[] = [];

    for (const setting of settings) {
      const value = setting.value as { expiresAt?: string };
      if (value.expiresAt && new Date(value.expiresAt) < now) {
        expiredIds.push(setting.id);
      }
    }

    if (expiredIds.length > 0) {
      await db.systemSetting.deleteMany({
        where: { id: { in: expiredIds } },
      });
    }

    return expiredIds.length;
  }
}

// Agent preferences type
interface AgentPreferences {
  preferredLanguage: string;
  verbosity: "brief" | "detailed";
  enableSuggestions: boolean;
  enableHistory: boolean;
}

// ============================================
// Global Memory Instance
// ============================================

export const memory = new AgentMemory();

// ============================================
// Exports
// ============================================

export { AgentMemory };
export type { MemoryConfig, AgentPreferences };
