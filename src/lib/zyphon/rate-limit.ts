/**
 * Zyphon AI Rate Limiter
 * 
 * Simple in-memory rate limiting for external API requests.
 * Uses a combination of key prefix + IP for rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configuration
const DEFAULT_RATE_LIMIT = {
  maxRequests: parseInt(process.env.ZYPHON_EXTERNAL_RATE_LIMIT || "60", 10),
  windowMs: 60 * 1000, // 1 minute window
};

// Clean up expired entries every minute
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Check if a request is rate limited
 * @param keyPrefix The API key prefix
 * @param ip The client IP address
 * @returns Object with limited status and remaining requests
 */
export function checkZyphonRateLimit(
  keyPrefix: string,
  ip: string
): { limited: boolean; remaining: number; resetTime: number } {
  const identifier = `zyphon:${keyPrefix}:${ip}`;
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + DEFAULT_RATE_LIMIT.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      limited: false,
      remaining: DEFAULT_RATE_LIMIT.maxRequests - 1,
      resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  // Check if limit exceeded
  if (entry.count > DEFAULT_RATE_LIMIT.maxRequests) {
    return { limited: true, remaining: 0, resetTime: entry.resetTime };
  }

  return {
    limited: false,
    remaining: DEFAULT_RATE_LIMIT.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get current rate limit config
 */
export function getZyphonRateLimitConfig() {
  return { ...DEFAULT_RATE_LIMIT };
}
