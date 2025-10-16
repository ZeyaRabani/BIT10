"use client"

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChainProvider } from '@/context/ChainContext'
import { ICPWalletProvider } from '@/context/ICPWalletContext'
import { EVMWalletProvider } from '@/context/EVMWalletContext'
import { SolanaWalletProvider } from '@/context/SolanaWalletContext'
import { ThemeProvider } from '@/components/theme-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ChainProvider>
                <ICPWalletProvider>
                    <EVMWalletProvider>
                        <SolanaWalletProvider>
                            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                                {children}
                            </ThemeProvider>
                        </SolanaWalletProvider>
                    </EVMWalletProvider>
                </ICPWalletProvider>
            </ChainProvider>
        </QueryClientProvider>
    );
}
