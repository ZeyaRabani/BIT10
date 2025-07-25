"use client"

import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

const config = createConfig({
    chains: [sepolia],
    connectors: [
        metaMask(),
        injected(),
    ],
    transports: {
        [sepolia.id]: http(),
    },
});

export function ETHWalletProvider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config} reconnectOnMount={true}>
            {children}
        </WagmiProvider>
    );
}
