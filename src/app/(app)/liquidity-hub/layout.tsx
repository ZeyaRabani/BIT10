import React from 'react'
import { UnisatWalletProvider } from '@/context/UnisatWalletContext'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <UnisatWalletProvider>
            {children}
        </UnisatWalletProvider>
    )
}
