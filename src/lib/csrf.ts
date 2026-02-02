/**
 * CSRF Token Management
 * 
 * Double-submit cookie pattern for CSRF protection.
 * Cookie name: "csrf-token" (readable by JS)
 * Header name: "x-csrf-token"
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// ============================================================================
// Constants
// ============================================================================

export const CSRF_COOKIE_NAME = "csrf-token";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_MAX_AGE = 7200; // 2 hours in seconds

// ============================================================================
// In-memory store with TTL (for storeCsrfToken/retrieveCsrfToken compatibility)
// ============================================================================

interface StoredToken {
  token: string;
  expiresAt: number;
}

const csrfStore = new Map<string, StoredToken>();

// Cleanup expired tokens every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of csrfStore.entries()) {
      if (value.expiresAt < now) {
        csrfStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ============================================================================
// Core CSRF Functions
// ============================================================================

/**
 * Generate a cryptographically secure CSRF token
 */
export function createCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Get consistent cookie options based on environment
 */
function getCookieOptions(): {
  secure: boolean;
  sameSite: "lax" | "none";
} {
  const isDev = process.env.NODE_ENV !== "production";
  return {
    secure: !isDev,
    sameSite: isDev ? "lax" : "none",
  };
}

/**
 * Set CSRF cookie on response
 */
export function setCsrfCookie(res: NextResponse, token: string): void {
  const { secure, sameSite } = getCookieOptions();
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure,
    sameSite,
    path: "/",
    maxAge: CSRF_MAX_AGE,
  });
}

/**
 * Ensure CSRF cookie exists, create if missing
 * Returns the token (existing or new)
 */
export function ensureCsrfCookie(res: NextResponse, existing?: string): string {
  const token = existing || createCsrfToken();
  setCsrfCookie(res, token);
  return token;
}

/**
 * Validate CSRF token for non-GET requests
 * Returns null if valid, or an error response if invalid
 * 
 * @param req - The incoming request
 * @param opts - Options for validation
 * @param opts.onlyIfAuthenticated - If true, only enforce when auth-token cookie exists
 */
export function requireCsrf(
  req: NextRequest,
  opts?: { onlyIfAuthenticated?: boolean }
): NextResponse | null {
  const method = req.method.toUpperCase();
  
  // Skip CSRF check for safe methods
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  // If onlyIfAuthenticated is true, skip check when not logged in
  if (opts?.onlyIfAuthenticated) {
    const authToken = req.cookies.get("auth-token")?.value;
    if (!authToken) {
      return null; // Not authenticated, no CSRF check needed
    }
  }

  // Get CSRF token from cookie and header
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = req.headers.get(CSRF_HEADER_NAME);

  // Both must exist and match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CSRF_INVALID",
          message: "Invalid or missing CSRF token",
        },
      },
      { status: 403 }
    );
  }

  return null; // Valid
}

// ============================================================================
// Legacy compatibility functions (now functional with in-memory store)
// ============================================================================

/**
 * Generate a random CSRF token (legacy export)
 */
export function generateCsrfToken(): string {
  return createCsrfToken();
}

/**
 * Verify CSRF token matches expected value
 * Uses constant-time comparison to prevent timing attacks
 */
export function verifyCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false;
  }
  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Store CSRF token with TTL
 */
export async function storeCsrfToken(
  sessionId: string,
  token: string
): Promise<void> {
  csrfStore.set(sessionId, {
    token,
    expiresAt: Date.now() + CSRF_MAX_AGE * 1000,
  });
}

/**
 * Retrieve CSRF token from store
 */
export async function retrieveCsrfToken(sessionId: string): Promise<string | null> {
  const stored = csrfStore.get(sessionId);
  if (!stored) return null;
  if (stored.expiresAt < Date.now()) {
    csrfStore.delete(sessionId);
    return null;
  }
  return stored.token;
}

/**
 * Middleware helper to validate CSRF token in requests (legacy)
 */
export async function validateCsrfMiddleware(
  request: Request,
  sessionToken: string
): Promise<boolean> {
  const method = request.method;

  // Skip CSRF check for GET/HEAD requests
  if (method === "GET" || method === "HEAD") {
    return true;
  }

  // First check header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken && verifyCsrfToken(headerToken, sessionToken)) {
    return true;
  }

  // Get CSRF token from request body
  const contentType = request.headers.get("content-type") || "";
  let csrfToken: string | null = null;

  if (contentType.includes("application/json")) {
    try {
      const body = await request.clone().json();
      csrfToken = body._csrf || body.csrfToken;
    } catch {
      // Continue
    }
  } else if (contentType.includes("form-data")) {
    try {
      const form = await request.formData();
      csrfToken = form.get("_csrf") as string | null;
    } catch {
      // Continue
    }
  }

  // Also check X-CSRF-Token header
  if (!csrfToken) {
    csrfToken = request.headers.get("X-CSRF-Token");
  }

  if (!csrfToken) {
    return false;
  }

  // Retrieve expected token from session
  const expectedToken = await retrieveCsrfToken(sessionToken);
  if (!expectedToken) {
    return false;
  }

  // Verify tokens match
  return verifyCsrfToken(csrfToken, expectedToken);
}
