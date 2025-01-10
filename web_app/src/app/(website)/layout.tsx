import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Navbar />
            <main className='flex-grow flex-1 pt-[4.5rem]'>
                {children}
            </main>
            <Footer />
        </div>
    )
}
