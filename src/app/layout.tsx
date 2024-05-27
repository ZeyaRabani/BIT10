import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// import { ThemeProvider } from "@/components/theme-provider"
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { Web3Modal } from '@/context/Web3Modal'
import Navbar from '@/components/Navbar'
// import Footer from '@/components/Footer'
import { Toaster } from "@/components/ui/toaster"
import ScrollToTop from '@/components/ScrollToTop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BIT10',
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
        {/* <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange> */}
          <GoogleAnalytics trackingId={process.env.NEXT_PUBLIC_GOOGLE_ID as string} />
          <Web3Modal>
            <main className='relative flex flex-col min-h-screen'>
              <Navbar />
              <div className='flex-grow flex-1 pt-20 lg:pt-24'>
                {/* <div className='flex-grow flex-1'> */}
                {children}
              </div>
              <ScrollToTop />
              <Toaster />
              {/* <Footer /> */}
            </main>
          </Web3Modal>
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
