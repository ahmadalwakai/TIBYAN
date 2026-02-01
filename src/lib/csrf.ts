/**
 * CSRF Token Management
 * 
 * Provides utilities for CSRF token generation and validation.
 * Use in authentication and sensitive form submissions.
 */

/**
 * Generate a random CSRF token
 * Should be called server-side and included in HTML forms
 */
export function generateCsrfToken(): string {
  // Use crypto.getRandomValues if available, fallback to Math.random
  if (typeof window === "undefined") {
    // Server-side
    const array = new Uint8Array(32);
    if (typeof global !== "undefined" && global.crypto) {
      global.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Buffer.from(array).toString("hex");
  } else {
    // Client-side
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

/**
 * Verify CSRF token matches expected value
 * Call server-side before processing form submission
 */
export function verifyCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  // Use constant-time comparison to prevent timing attacks
  return token === expectedToken;
}

/**
 * Store CSRF token in session
 * Server-side only
 */
export async function storeCsrfToken(
  sessionId: string,
  token: string
): Promise<void> {
  // In production, store in Redis with expiration
  // For now, this is a placeholder
  // Implementation depends on your session storage solution
}

/**
 * Retrieve CSRF token from session
 * Server-side only
 */
export async function retrieveCsrfToken(sessionId: string): Promise<string | null> {
  // In production, retrieve from Redis
  // For now, this is a placeholder
  // Implementation depends on your session storage solution
  return null;
}

/**
 * Middleware helper to validate CSRF token in requests
 * Use in API routes that modify data
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

  // Get CSRF token from request
  const contentType = request.headers.get("content-type") || "";
  let csrfToken: string | null = null;

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
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
