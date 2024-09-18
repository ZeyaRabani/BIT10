/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getRequestConfig } from 'next-intl/server'
import { getUserLocale } from '@/services/locale'

export default getRequestConfig(async () => {
    const locale = await getUserLocale();

    return {
        locale,
        messages: (await import(`./locales/${locale}.json`)).default
    };
});