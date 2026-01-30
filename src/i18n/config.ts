// Shared i18n configuration - can be imported by both server and client components

export const locales = ['ar', 'en', 'de', 'tr', 'fr', 'es', 'sv'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  de: 'Deutsch',
  tr: 'Türkçe',
  fr: 'Français',
  es: 'Español',
  sv: 'Svenska',
};

export const localeFlags: Record<Locale, string> = {
  ar: '🇸🇦',
  en: '🇬🇧',
  de: '🇩🇪',
  tr: '🇹🇷',
  fr: '🇫🇷',
  es: '🇪🇸',
  sv: '🇸🇪',
};

export const rtlLocales: readonly Locale[] = ['ar'] as const;

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
