"use client"

import React, { createContext, useContext, useEffect } from 'react'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { env } from '@/env'
import { WagmiProvider, useAccount, useDisconnect, createConfig, http } from 'wagmi'
import { sepolia, bscTestnet } from 'wagmi/chains'
import { useChain } from '@/context/ChainContext'
import { injected, walletConnect } from 'wagmi/connectors'

const config = createConfig({
    chains: [sepolia, bscTestnet],
    connectors: [
        injected(),
        walletConnect({
            projectId: env.NEXT_PUBLIC_APP_ID,
            showQrModal: false,
        })
    ],
    transports: {
        [sepolia.id]: http(),
        [bscTestnet.id]: http(),
    },
    ssr: true,
})

interface EVMWalletContextType {
    isEVMConnected: boolean;
    evmAddress?: string;
    evmChain?: string;
    evmChainId?: number;
}

const EVMWalletContext = createContext<EVMWalletContextType | undefined>(undefined);

function EVMWalletProviderInner({ children }: { children: React.ReactNode }) {
    const { address, isConnected, chain } = useAccount();
    const { setChain } = useChain();
    const { disconnect } = useDisconnect();

    useEffect(() => {
        if (isConnected && address && chain) {
            if (chain.id === sepolia.id) {
                setChain('eth_sepolia');
            }
            else if (chain.id === bscTestnet.id) {
                setChain('bsc_testnet');
            }
        }
    }, [isConnected, address, chain, setChain]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'chain' && !e.newValue) {
                disconnect();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [disconnect]);

    const contextValue: EVMWalletContextType = {
        isEVMConnected: isConnected,
        evmAddress: address,
        evmChain: chain?.name,
        evmChainId: chain?.id,
    };

    return (
        <EVMWalletContext.Provider value={contextValue}>
            <RainbowKitProvider>
                {children}
            </RainbowKitProvider>
        </EVMWalletContext.Provider>
    );
}

export function EVMWalletProvider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider reconnectOnMount={false} config={config}>
            <EVMWalletProviderInner>
                {children}
            </EVMWalletProviderInner>
        </WagmiProvider>
    );
}

export const useEVMWallet = () => {
    const context = useContext(EVMWalletContext);
    if (!context) {
        throw new Error('useEVMWallet must be used within a EVMWalletProvider');
    }
    return context;
};
