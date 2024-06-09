import type { Metadata } from 'next'
import './globals.css'
import { cn } from '@/lib/utils'
import { WalletProvider } from '@/context/WalletContext'
import { Toaster } from '@/components/ui/sonner'
import ScrollToTopBtn from '@/components/ScrollToTopBtn'

export const metadata: Metadata = {
  title: 'BIT10',
  description: 'Empowering Your Portfolio with the Future of Finance',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body className={cn('min-h-screen bg-background antialiased font-sansSerif')}>
        <WalletProvider>
          <main>
            {children}
          </main>
          <ScrollToTopBtn />
          <Toaster richColors closeButton />
        </WalletProvider>
      </body>
    </html>
  );
}
