import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Toaster } from "@/components/ui/toaster"
import ScrollToTop from '@/components/ScrollToTop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'C10',
  description: 'Empowering Your Portfolio with the Future of Finance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
          <main className='relative flex flex-col min-h-screen'>
            <Navbar />
            <div className='flex-grow flex-1 pt-20 lg:pt-24'>
              {children}
            </div>
            <ScrollToTop />
            <Toaster />
            <Footer />
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
