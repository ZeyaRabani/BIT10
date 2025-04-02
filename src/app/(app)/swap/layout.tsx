import React from 'react'
import { SOLSwapProgramContextProvider } from '@/context/SOLSwapProgramContextProvider'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SOLSwapProgramContextProvider>
            {children}
        </SOLSwapProgramContextProvider>
    )
}
