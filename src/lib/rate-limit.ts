/**
 * Rate Limiter Utility
 * 
 * Simple in-memory rate limiting for authentication endpoints.
 * In production, consider using Redis (Upstash) for distributed rate limiting.
 * 
 * Configuration:
 * - Login/Register: 5 requests per 15 minutes per IP
 * - Password reset: 3 requests per hour per IP
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  auth: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // Increased for dev testing
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  payment: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 min
  application: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 min
} as const;

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier (IP address, email, etc.)
 * @param config - Rate limit configuration
 * @returns { limited: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { limited: false, remaining: config.maxRequests - 1, resetTime };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return { limited: true, remaining: 0, resetTime: entry.resetTime };
  }

  return {
    limited: false,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to 'unknown' (in local dev)
  return 'unknown';
}

/**
 * Helper to apply rate limiting to a route handler
 */
export async function withRateLimit(
  request: Request,
  config: RateLimitConfig,
  handler: () => Promise<Response>
): Promise<Response> {
  const ip = getClientIp(request);
  const { limited, remaining, resetTime } = checkRateLimit(ip, config);

  if (limited) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'عدد المحاولات كثير جداً. يرجى المحاولة لاحقاً.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful response
  const response = await handler();
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());

  return response;
}
