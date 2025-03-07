import React from 'react'
import { BTCWalletProvider } from '@/context/BTCWalletContext'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <BTCWalletProvider>
            {children}
        </BTCWalletProvider>
    )
}
