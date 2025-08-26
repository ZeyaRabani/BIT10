import React from 'react'
import Navbar from '@/components/Navbar'
import Header from '@/components/Header'
import Chatbot from '@/components/chatbot/Chatbot'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Navbar />
            <div className='pt-[5rem]'>
                <Header message='You are on testnet. Tokens have no value.' />
            </div>
            <main className='flex-grow flex-1'>
                {children}
            </main>
            <Chatbot />
        </div>
    )
}
