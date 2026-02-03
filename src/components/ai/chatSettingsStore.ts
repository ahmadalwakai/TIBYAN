/**
 * AI Chat Settings Store - localStorage v1
 * Manages user preferences for the AI chat experience
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ChatSettings {
  version: 1;
  personalization: {
    displayName?: string;
    role?: "student" | "parent" | "teacher" | "admin" | "other";
    goals?: string;
    level?: "beginner" | "intermediate" | "advanced";
    customInstructions?: string;
  };
  response: {
    tone: "professional" | "friendly" | "strict";
    verbosity: "short" | "balanced" | "detailed";
    format: "paragraphs" | "bullets" | "step_by_step";
  };
  language: {
    mode: "auto" | "locked_ar" | "locked_en";
    strictNoThirdLanguage: boolean;
  };
  privacy: {
    saveChats: boolean;
  };
  accessibility: {
    fontScale: 0.9 | 1 | 1.1 | 1.2;
    reduceMotion: boolean;
  };
  streaming: {
    humanize: boolean;
    speed: "realistic" | "fast";
  };
}

// Subset of settings sent to the API
export interface ChatPreferences {
  customInstructions?: string;
  displayName?: string;
  role?: string;
  level?: string;
  goals?: string;
  tone: string;
  verbosity: string;
  format: string;
  languageMode: string;
  strictNoThirdLanguage: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "tibyan_ai_settings_v1";

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_SETTINGS: ChatSettings = {
  version: 1,
  personalization: {
    displayName: undefined,
    role: undefined,
    goals: undefined,
    level: undefined,
    customInstructions: undefined,
  },
  response: {
    tone: "professional",
    verbosity: "balanced",
    format: "paragraphs",
  },
  language: {
    mode: "auto",
    strictNoThirdLanguage: true,
  },
  privacy: {
    saveChats: true,
  },
  accessibility: {
    fontScale: 1,
    reduceMotion: false,
  },
  streaming: {
    humanize: true,
    speed: "realistic",
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const testKey = "__tibyan_settings_test__";
    window.localStorage.setItem(testKey, "test");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON
 */
function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    console.warn("[chatSettingsStore] Failed to parse settings JSON");
    return fallback;
  }
}

/**
 * Validate and migrate settings if needed
 */
function validateSettings(settings: Partial<ChatSettings>): ChatSettings {
  // Start with defaults
  const validated: ChatSettings = {
    ...DEFAULT_SETTINGS,
    personalization: {
      ...DEFAULT_SETTINGS.personalization,
      ...settings.personalization,
    },
    response: {
      ...DEFAULT_SETTINGS.response,
      ...settings.response,
    },
    language: {
      ...DEFAULT_SETTINGS.language,
      ...settings.language,
    },
    privacy: {
      ...DEFAULT_SETTINGS.privacy,
      ...settings.privacy,
    },
    accessibility: {
      ...DEFAULT_SETTINGS.accessibility,
      ...settings.accessibility,
    },
    streaming: {
      ...DEFAULT_SETTINGS.streaming,
      ...settings.streaming,
    },
  };

  // Validate font scale
  const validFontScales: Array<0.9 | 1 | 1.1 | 1.2> = [0.9, 1, 1.1, 1.2];
  if (!validFontScales.includes(validated.accessibility.fontScale)) {
    validated.accessibility.fontScale = 1;
  }

  // Validate tone
  const validTones: Array<"professional" | "friendly" | "strict"> = [
    "professional",
    "friendly",
    "strict",
  ];
  if (!validTones.includes(validated.response.tone)) {
    validated.response.tone = "professional";
  }

  // Validate verbosity
  const validVerbosities: Array<"short" | "balanced" | "detailed"> = [
    "short",
    "balanced",
    "detailed",
  ];
  if (!validVerbosities.includes(validated.response.verbosity)) {
    validated.response.verbosity = "balanced";
  }

  // Validate format
  const validFormats: Array<"paragraphs" | "bullets" | "step_by_step"> = [
    "paragraphs",
    "bullets",
    "step_by_step",
  ];
  if (!validFormats.includes(validated.response.format)) {
    validated.response.format = "paragraphs";
  }

  // Validate language mode
  const validLanguageModes: Array<"auto" | "locked_ar" | "locked_en"> = [
    "auto",
    "locked_ar",
    "locked_en",
  ];
  if (!validLanguageModes.includes(validated.language.mode)) {
    validated.language.mode = "auto";
  }

  // Validate role
  const validRoles: Array<"student" | "parent" | "teacher" | "admin" | "other" | undefined> = [
    "student",
    "parent",
    "teacher",
    "admin",
    "other",
    undefined,
  ];
  if (!validRoles.includes(validated.personalization.role)) {
    validated.personalization.role = undefined;
  }

  // Validate level
  const validLevels: Array<"beginner" | "intermediate" | "advanced" | undefined> = [
    "beginner",
    "intermediate",
    "advanced",
    undefined,
  ];
  if (!validLevels.includes(validated.personalization.level)) {
    validated.personalization.level = undefined;
  }

  // Validate speed
  const validSpeeds: Array<"realistic" | "fast"> = ["realistic", "fast"];
  if (!validSpeeds.includes(validated.streaming.speed)) {
    validated.streaming.speed = "realistic";
  }

  // Enforce string length limits
  if (validated.personalization.customInstructions) {
    validated.personalization.customInstructions =
      validated.personalization.customInstructions.slice(0, 800);
  }
  if (validated.personalization.goals) {
    validated.personalization.goals = validated.personalization.goals.slice(0, 300);
  }
  if (validated.personalization.displayName) {
    validated.personalization.displayName =
      validated.personalization.displayName.slice(0, 50);
  }

  return validated;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Load settings from localStorage
 */
export function loadSettings(): ChatSettings {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeJsonParse<Partial<ChatSettings>>(raw, {});
    return validateSettings(parsed);
  } catch (error) {
    console.error("[chatSettingsStore] Error loading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: ChatSettings): void {
  if (!isLocalStorageAvailable()) {
    console.warn("[chatSettingsStore] localStorage not available");
    return;
  }

  try {
    const validated = validateSettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch (error) {
    console.error("[chatSettingsStore] Error saving settings:", error);
  }
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): ChatSettings {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_SETTINGS;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[chatSettingsStore] Error resetting settings:", error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Build preferences object for API requests
 */
export function buildPreferences(settings: ChatSettings): ChatPreferences {
  return {
    customInstructions: settings.personalization.customInstructions,
    displayName: settings.personalization.displayName,
    role: settings.personalization.role,
    level: settings.personalization.level,
    goals: settings.personalization.goals,
    tone: settings.response.tone,
    verbosity: settings.response.verbosity,
    format: settings.response.format,
    languageMode: settings.language.mode,
    strictNoThirdLanguage: settings.language.strictNoThirdLanguage,
  };
}

/**
 * Get streaming parameters based on settings
 */
export function getStreamingParams(settings: ChatSettings): {
  typewriterInterval: number;
  sliceMin: number;
  sliceMax: number;
} {
  if (!settings.streaming.humanize) {
    // Fast, no humanization - large chunks, fast interval
    return {
      typewriterInterval: 10,
      sliceMin: 15,
      sliceMax: 30,
    };
  }

  if (settings.streaming.speed === "fast") {
    // Humanized but faster
    return {
      typewriterInterval: 25,
      sliceMin: 4,
      sliceMax: 12,
    };
  }

  // Realistic humanized typing
  return {
    typewriterInterval: 40,
    sliceMin: 2,
    sliceMax: 8,
  };
}
