"use client"

import { PrivyProvider } from '@privy-io/react-auth'
import { env } from '@/env'

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
            clientId={process.env.PRIVY_APP_SECRET}
            config={{
                loginMethods: ['email'],
                embeddedWallets: {
                    solana: {
                        createOnLogin: 'all-users'
                    }
                },
                solanaClusters: [
                    {
                        name: 'devnet',
                        rpcUrl: 'https://api.devnet.solana.com'
                    }
                ]
            }}
        >
            {children}
        </PrivyProvider>
    );
}
