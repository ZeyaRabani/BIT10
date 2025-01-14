import './globals.css'
import { cn, constructMetadata } from '@/lib/utils'
import { WalletProvider } from '@/context/WalletContext'
import { CSPostHogProvider } from '@/app/_analytics/provider'
import Providers from '@/app/_provider/Providers'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import ScrollToTopBtn from '@/components/ScrollToTopBtn'

export const metadata = constructMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body className={cn('min-h-screen bg-background antialiased font-sansSerif')}>
        <WalletProvider>
          <CSPostHogProvider>
            <Providers>
              <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                <main>
                  {children}
                </main>
                <ScrollToTopBtn />
                <Toaster richColors closeButton />
              </ThemeProvider>
            </Providers>
          </CSPostHogProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
