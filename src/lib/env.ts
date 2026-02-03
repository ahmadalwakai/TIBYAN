/**
 * Environment Variable Validation
 * ================================
 * Runtime validation of required environment variables.
 * Provides clear error messages for missing configuration.
 */

// ============================================
// Required Variables
// ============================================

interface EnvRequirement {
  key: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
  errorHint?: string;
}

const ENV_REQUIREMENTS: EnvRequirement[] = [
  // Database
  {
    key: "DATABASE_URL",
    required: true,
    description: "PostgreSQL connection string",
    validate: (v) => v.startsWith("postgresql://") || v.startsWith("postgres://"),
    errorHint: "Must be a valid PostgreSQL connection URL",
  },
  
  // Auth (custom JWT, NOT NextAuth)
  {
    key: "JWT_SECRET",
    required: process.env.NODE_ENV === "production",
    description: "JWT signing secret (64-char hex recommended)",
    validate: (v) => v.length >= 32,
    errorHint: "Must be at least 32 characters. Generate with: openssl rand -hex 32",
  },
  
  // Email
  {
    key: "RESEND_API_KEY",
    required: false, // Optional but needed for auth emails
    description: "Resend API key for transactional emails",
    validate: (v) => v.startsWith("re_"),
    errorHint: "Must start with 're_'. Get from https://resend.com",
  },
  {
    key: "FROM_EMAIL",
    required: false,
    description: "Sender email address for notifications",
    validate: (v) => v.includes("@"),
    errorHint: "Must be a valid email address",
  },
  
  // App URL
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: false,
    description: "Public app URL for links in emails",
    validate: (v) => v.startsWith("http://") || v.startsWith("https://"),
    errorHint: "Must be a valid HTTP(S) URL",
  },
];

// ============================================
// LLM-specific validation
// ============================================

interface LLMEnvStatus {
  provider: string;
  isConfigured: boolean;
  missingVars: string[];
  warnings: string[];
}

export function validateLLMEnv(): LLMEnvStatus {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() || "auto";
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check remote provider configuration
  if (provider === "remote") {
    if (!process.env.REMOTE_LLM_BASE_URL) {
      missingVars.push("REMOTE_LLM_BASE_URL");
    }
    if (!process.env.REMOTE_LLM_API_KEY) {
      missingVars.push("REMOTE_LLM_API_KEY");
    }
  }

  // Check local provider configuration
  if (provider === "local" && !process.env.LLAMA_SERVER_URL) {
    warnings.push("LLAMA_SERVER_URL not set, defaulting to http://127.0.0.1:8080");
  }

  // Production warnings
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    if (provider === "local") {
      warnings.push("LLM_PROVIDER=local will NOT work on Vercel. Use 'remote' or 'mock'.");
    }
    if (provider === "auto" && !process.env.REMOTE_LLM_BASE_URL) {
      warnings.push("In production with auto mode but no remote LLM configured - will use mock fallback.");
    }
  }

  return {
    provider,
    isConfigured: missingVars.length === 0,
    missingVars,
    warnings,
  };
}

// ============================================
// Main Validation
// ============================================

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  llm: LLMEnvStatus;
}

export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const req of ENV_REQUIREMENTS) {
    const value = process.env[req.key];

    if (req.required && !value) {
      errors.push(`Missing required: ${req.key} - ${req.description}`);
      if (req.errorHint) {
        errors.push(`  Hint: ${req.errorHint}`);
      }
    } else if (value && req.validate && !req.validate(value)) {
      errors.push(`Invalid ${req.key}: ${req.errorHint || "validation failed"}`);
    }
  }

  // Validate LLM configuration
  const llm = validateLLMEnv();
  if (!llm.isConfigured && llm.missingVars.length > 0) {
    errors.push(`LLM provider '${llm.provider}' missing: ${llm.missingVars.join(", ")}`);
  }
  warnings.push(...llm.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    llm,
  };
}

// ============================================
// Startup Check (call in instrumentation.ts or app init)
// ============================================

export function checkEnvOnStartup(): void {
  const result = validateEnv();

  // Log warnings
  for (const warning of result.warnings) {
    console.warn(`[Env Warning] ${warning}`);
  }

  // Log errors (don't crash in dev, but log clearly)
  if (!result.valid) {
    console.error("================================");
    console.error("ENVIRONMENT CONFIGURATION ERRORS:");
    console.error("================================");
    for (const error of result.errors) {
      console.error(`  ❌ ${error}`);
    }
    console.error("================================");
    
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Environment validation failed: ${result.errors.join("; ")}`);
    }
  }
}

// ============================================
// Type-safe env getters
// ============================================

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
