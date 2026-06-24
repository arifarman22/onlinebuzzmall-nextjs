import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import de from '@/messages/de.json';

export const locales = ['en', 'ar', 'fr', 'es', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const messagesMap: Record<Locale, typeof en> = { en, ar, fr, es, de };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('locale')?.value || '';
  const locale: Locale = locales.includes(rawLocale as Locale) ? (rawLocale as Locale) : defaultLocale;

  return { locale, messages: messagesMap[locale] };
});
