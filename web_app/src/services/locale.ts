"use server"

import { cookies } from 'next/headers'
import type { Locale } from '@/config'
import { defaultLocale } from '@/config'

const COOKIE_NAME = 'en';

export async function getUserLocale() {
    // return cookies().get(COOKIE_NAME)?.value || defaultLocale;
    return (await cookies()).get(COOKIE_NAME)?.value ?? defaultLocale;
}

export async function setUserLocale(locale: Locale) {
    // cookies().set(COOKIE_NAME, locale);
    (await cookies()).set(COOKIE_NAME, locale);
}
