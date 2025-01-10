/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/consistent-type-imports */
"use server"

import { cookies } from 'next/headers'
import { Locale, defaultLocale } from '@/config'

const COOKIE_NAME = 'en';

export async function getUserLocale() {
    // return cookies().get(COOKIE_NAME)?.value || defaultLocale;
    return (await cookies()).get(COOKIE_NAME)?.value ?? defaultLocale;
}

export async function setUserLocale(locale: Locale) {
    // cookies().set(COOKIE_NAME, locale);
    (await cookies()).set(COOKIE_NAME, locale);
}
