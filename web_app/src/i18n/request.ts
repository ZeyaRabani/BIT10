import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from '@/services/locale';

export default getRequestConfig(async () => {
    const locale = await getUserLocale();
    const messages = (await import(`../locales/${locale}.json`) as { default: Record<string, string> }).default;

    return { locale, messages };
});
