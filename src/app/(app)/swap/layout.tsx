import React from 'react'
import { SOLSwapProgramContextProvider } from '@/context/SOLSwapProgramContextProvider'
import { PrivySwapProgramContextProvider } from '@/context/PrivySwapProgramContextProvider'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <PrivySwapProgramContextProvider>
            <SOLSwapProgramContextProvider>
                {children}
            </SOLSwapProgramContextProvider>
        </PrivySwapProgramContextProvider>
    )
}
