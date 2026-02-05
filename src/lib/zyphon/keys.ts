/**
 * Zyphon API Key Management Utilities
 * 
 * Security-focused utilities for generating, hashing, and verifying API keys.
 * Keys are stored as hashes only - raw keys are shown exactly once at creation.
 * 
 * Format: zy_<32-48 chars base64url>
 * Storage: prefix (first 8 chars) + SHA-256 hash with server pepper
 */

import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

import { Prisma } from "@prisma/client";

// Environment variable for key pepper (must be set in production)
const KEY_PEPPER = process.env.ZYPHON_KEY_PEPPER || "dev-pepper-change-in-production";

// Key prefix for identification
const KEY_FORMAT_PREFIX = "zy_";

// Prefix length stored in DB for identification
const STORED_PREFIX_LENGTH = 8;

// Raw key length (excluding format prefix)
const RAW_KEY_LENGTH = 40; // Results in ~53 chars base64url

/**
 * Generate a new API key
 * @returns Object with rawKey (show once), prefix (for identification), and keyHash (for storage)
 */
export function generateApiKey(): { rawKey: string; prefix: string; keyHash: string } {
  // Generate cryptographically secure random bytes
  const randomPart = randomBytes(RAW_KEY_LENGTH).toString("base64url");
  
  // Create the full raw key
  const rawKey = `${KEY_FORMAT_PREFIX}${randomPart}`;
  
  // Extract prefix for identification (stored in DB)
  const prefix = rawKey.slice(0, STORED_PREFIX_LENGTH);
  
  // Hash the raw key with pepper for secure storage
  const keyHash = hashKey(rawKey);
  
  return { rawKey, prefix, keyHash };
}

/**
 * Hash a raw API key using SHA-256 with server-side pepper
 * @param rawKey The raw API key to hash
 * @returns SHA-256 hash of the key with pepper
 */
export function hashKey(rawKey: string): string {
  return createHash("sha256")
    .update(`${rawKey}${KEY_PEPPER}`)
    .digest("hex");
}

/**
 * Verify a raw API key against stored hash
 * @param rawKey The raw API key to verify
 * @returns The key record if valid and active, null otherwise
 */
export async function verifyKey(rawKey: string): Promise<{
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  createdById: string | null;
} | null> {
  // Validate key format
  if (!rawKey || !rawKey.startsWith(KEY_FORMAT_PREFIX)) {
    return null;
  }

  // Hash the provided key
  const providedHash = hashKey(rawKey);
  
  try {
    // Look up by hash (unique index)
    const keyRecord = await db.zyphonApiKey.findUnique({
      where: { keyHash: providedHash },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        isActive: true,
        revokedAt: true,
        createdById: true,
      },
    });

    // Return null if not found, not active, or revoked
    if (!keyRecord || !keyRecord.isActive || keyRecord.revokedAt) {
      return null;
    }

    return {
      id: keyRecord.id,
      name: keyRecord.name,
      prefix: keyRecord.prefix,
      scopes: keyRecord.scopes,
      isActive: keyRecord.isActive,
      createdById: keyRecord.createdById,
    };
  } catch (error) {
    console.error("[Zyphon] Failed to verify key:", error);
    return null;
  }
}

/**
 * Check if a key has a specific scope
 * @param scopes Array of scopes the key has
 * @param requiredScope The scope to check for
 * @returns True if the key has the required scope
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes(requiredScope);
}

/**
 * Mask a key prefix for display
 * @param prefix The key prefix
 * @returns Masked display string (e.g., "zy_abc12••••••••")
 */
export function maskKey(prefix: string): string {
  return `${prefix}••••••••`;
}

/**
 * Update last used timestamp for a key
 * @param keyId The key ID to update
 */
export async function updateKeyLastUsed(keyId: string): Promise<void> {
  try {
    await db.zyphonApiKey.update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() },
    });
  } catch (error) {
    // Non-critical - don't throw
    console.error("[Zyphon] Failed to update lastUsedAt:", error);
  }
}

/**
 * Log an audit event for Zyphon API using existing AuditLog model
 * Actions use "zyphon." prefix: "zyphon.key.created", "zyphon.key.revoked", etc.
 * @param params Audit log parameters
 */
export async function logZyphonAudit(params: {
  action: string;
  keyPrefix?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  actorUserId?: string;
}): Promise<void> {
  try {
    // Build metadata including all zyphon-specific fields
    const metadata: Record<string, unknown> = {
      ...(params.meta || {}),
    };
    if (params.keyPrefix) metadata.keyPrefix = params.keyPrefix;
    if (params.ip) metadata.ip = params.ip;
    if (params.userAgent) metadata.userAgent = params.userAgent;

    // Convert to Prisma-compatible JSON
    const metadataJson: Prisma.InputJsonValue | undefined = 
      Object.keys(metadata).length > 0 
        ? JSON.parse(JSON.stringify(metadata)) 
        : undefined;

    await db.auditLog.create({
      data: {
        action: `zyphon.${params.action}`,
        entityType: "ZyphonApiKey",
        entityId: params.keyPrefix || undefined,
        metadata: metadataJson,
        actorUserId: params.actorUserId || undefined,
      },
    });
  } catch (error) {
    // Non-critical - don't throw
    console.error("[Zyphon] Failed to log audit:", error);
  }
}

/**
 * Available scopes for Zyphon API keys
 */
export const ZYPHON_SCOPES = {
  CHAT_READ: "chat:read",
  CHAT_WRITE: "chat:write",
  KNOWLEDGE_READ: "knowledge:read",
  IMAGE_GENERATE: "image:generate",
  PDF_GENERATE: "pdf:generate",
} as const;

/**
 * Validate scopes array
 * @param scopes Array of scope strings to validate
 * @returns True if all scopes are valid
 */
export function validateScopes(scopes: string[]): boolean {
  const validScopes = Object.values(ZYPHON_SCOPES);
  return scopes.every((scope) => validScopes.includes(scope as typeof validScopes[number]));
}

/**
 * Get default Zyphon settings
 */
export function getDefaultSettings() {
  return {
    defaultLanguageMode: "auto" as const,
    strictNoThirdLanguage: true,
    defaultMaxTokens: 2048,
    externalEndpointEnabled: true,
  };
}

/**
 * Extract Bearer token from Authorization header
 * @param authHeader The Authorization header value
 * @returns The token or null if invalid
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
}
