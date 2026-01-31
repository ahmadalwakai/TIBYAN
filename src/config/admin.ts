/**
 * Admin Configuration
 * Whitelisted admin emails and settings
 */

// Static admin emails (always authorized)
export const ADMIN_EMAILS = [
  "ahmadalwakai76@gmail.com",
  "kalmoh@gmail.com",
];

// Runtime cache for dynamic admin emails from database
let dynamicAdminEmails: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Set dynamic admin emails (called from API routes)
 */
export function setDynamicAdminEmails(emails: string[]): void {
  dynamicAdminEmails = emails.map(e => e.toLowerCase());
  lastFetchTime = Date.now();
}

/**
 * Get all admin emails (static + dynamic)
 */
export function getAllAdminEmails(): string[] {
  const all = new Set([
    ...ADMIN_EMAILS.map(e => e.toLowerCase()),
    ...dynamicAdminEmails,
  ]);
  return Array.from(all);
}

/**
 * Check if cache needs refresh
 */
export function needsCacheRefresh(): boolean {
  return Date.now() - lastFetchTime > CACHE_TTL;
}

/**
 * Check if email is authorized admin (static list only - for sync checks)
 */
export function isAuthorizedAdmin(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail) ||
         dynamicAdminEmails.includes(normalizedEmail);
}

/**
 * Verification code settings
 */
export const VERIFICATION_CODE_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
};
