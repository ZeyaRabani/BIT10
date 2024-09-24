import React from 'react'
import Navbar from '@/components/Navbar'
import Header from '@/components/Header'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Navbar />
            <div className='mt-20'>
                <Header message='You are on testnet. Tokens have no value.' />
            </div>
            <main className='flex-grow flex-1'>
                {children}
            </main>
        </div>
    )
}
