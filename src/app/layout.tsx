import '@/styles/globals.css'
import { cn, constructMetadata } from '@/lib/utils'
import { CSPostHogProvider } from '@/app/_analytics/provider'
import { TRPCReactProvider } from '@/trpc/react'
import { WalletProvider } from '@/context/WalletContext'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import ScrollToTopBtn from '@/components/ScrollToTopBtn'

export const metadata = constructMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body className={cn('min-h-screen bg-background antialiased font-sansSerif')}>
        <CSPostHogProvider>
          <TRPCReactProvider>
            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
              <WalletProvider>
                <main>
                  {children}
                </main>
                <ScrollToTopBtn />
                <Toaster richColors closeButton />
              </WalletProvider>
            </ThemeProvider>
          </TRPCReactProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
