export type Locale = (typeof locales)[number];

export const locales = ['en', 'ja', 'zh', 'es', 'hi'] as const;
export const defaultLocale: Locale = 'en';