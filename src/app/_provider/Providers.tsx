"use client"

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChainProvider } from '@/context/ChainContext'
import { ICPWalletProvider } from '@/context/ICPWalletContext'
import { SOLWalletProvider } from '@/context/SOLWalletContext'
import { EVMWalletProvider } from '@/context/EVMWalletContext'
import { ThemeProvider } from '@/components/theme-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ChainProvider>
                <ICPWalletProvider>
                    <SOLWalletProvider>
                        <EVMWalletProvider>
                            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                                {children}
                            </ThemeProvider>
                        </EVMWalletProvider>
                    </SOLWalletProvider>
                </ICPWalletProvider>
            </ChainProvider>
        </QueryClientProvider>
    );
}
