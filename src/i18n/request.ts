import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // Get locale from cookie, default to 'ar'
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'ar') as Locale;
  
  // Validate locale
  const validLocale = locales.includes(locale) ? locale : 'ar';

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default,
  };
});
