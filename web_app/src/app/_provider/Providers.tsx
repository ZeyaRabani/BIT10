"use client"

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChainProvider } from '@/context/ChainContext'
import { ICPWalletProvider } from '@/context/ICPWalletContext'
import { BaseWalletProvider } from '@/context/BaseWalletContext'
import { ThemeProvider } from '@/components/theme-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    const [queryClient] = useState(() => new QueryClient());

    return (
        <BaseWalletProvider>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
            <QueryClientProvider client={queryClient}>
                <ChainProvider>
                    <ICPWalletProvider>
                        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                            {children}
                        </ThemeProvider>
                    </ICPWalletProvider>
                </ChainProvider>
            </QueryClientProvider>
        </BaseWalletProvider>
    );
}
