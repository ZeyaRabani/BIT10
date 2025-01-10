import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function Layout({ children }: { children: React.ReactNode }) {
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages}>
            <div>
                <main className='flex-grow flex-1 py-4'>
                    {children}
                </main>
            </div>
        </NextIntlClientProvider>
    )
}
