import '@/styles/globals.css'
import { cn, constructMetadata } from '@/lib/utils'
import { CSPostHogProvider } from '@/app/_analytics/provider'
import { TRPCReactProvider } from '@/trpc/react'
import Providers from '@/app/_provider/Providers'
import { WalletProvider } from '@/context/WalletContext'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import ScrollToTopBtn from '@/components/ScrollToTopBtn'

export const metadata = constructMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background antialiased font-sansSerif')}>
        <CSPostHogProvider>
          <TRPCReactProvider>
            <Providers>
              <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                <WalletProvider>
                  <main>
                    {children}
                  </main>
                  <ScrollToTopBtn />
                  <Toaster richColors closeButton />
                </WalletProvider>
              </ThemeProvider>
            </Providers>
          </TRPCReactProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}