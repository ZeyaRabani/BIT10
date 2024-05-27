"use client"

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { Web3ModalProvider } from './Web3ModalContext'
import { WagmiConfig } from 'wagmi'
import { arbitrum, mainnet } from 'viem/chains'
import { getAccount } from '@wagmi/core'

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;

const metadata = {
    name: 'Bit10',
    description: 'Empowering Your Portfolio with the Future of Finance',
    url: 'https://bit10.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, arbitrum];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

createWeb3Modal({ wagmiConfig, projectId, chains });


export function Web3Modal({ children }: { children: React.ReactNode }) {
    const account = getAccount();

    return (
        // @ts-ignore
        <Web3ModalProvider account={account}>
            <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
        </Web3ModalProvider>
    )
}