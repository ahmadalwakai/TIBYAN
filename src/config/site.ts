/**
 * Site configuration constants
 * Provides fallback values for deployment URLs and metadata
 */

/**
 * Get the base URL for the site with smart fallbacks
 * Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL (with https) > localhost
 */
function getBaseUrl(): string {
  // 1. Check for explicit NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // 2. Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 3. Fallback to production domain
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // 4. Final fallback
  return "https://www.ti-by-an.com";
}

export const SITE_CONFIG = {
  // Base URL - with smart fallbacks for all environments
  baseUrl: getBaseUrl(),
  
  // Supported locales
  locales: ["ar", "en", "de", "fr", "es", "sv", "tr"] as const,
  
  // Default locale
  defaultLocale: "ar" as const,
  
  // Contact information
  supportEmail: "support@ti-by-an.com",
  
  // Business information
  name: "Tibyan Academy",
  nameAr: "معهد تبيان",
  description: "Islamic Learning for Arab Children in Germany",
} as const;

export type Locale = typeof SITE_CONFIG.locales[number];
