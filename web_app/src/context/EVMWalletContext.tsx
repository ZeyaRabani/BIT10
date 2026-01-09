"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccount, useDisconnect, createConfig, http } from 'wagmi';
import { base, bsc } from 'wagmi/chains';
import { useChain } from '@/context/ChainContext';
import { injected } from 'wagmi/connectors';

const config = createConfig({
    chains: [base, bsc],
    connectors: [
        injected()
    ],
    transports: {
        [base.id]: http(),
        [bsc.id]: http(),
    },
    ssr: true,
});

interface EVMWalletContextType {
    isEVMConnected: boolean;
    evmAddress?: string;
    evmChain?: string;
    evmChainId?: number;
}

const EVMWalletContext = createContext<EVMWalletContextType | undefined>(undefined);

function EVMWalletProviderInner({ children }: { children: React.ReactNode }) {
    const { address, isConnected, chain } = useAccount(),
        { setChain } = useChain(),
        { disconnect } = useDisconnect();

    useEffect(() => {
        if (isConnected && address && chain) {
            if (chain.id === base.id) setChain('base');
            else if (chain.id === bsc.id) setChain('bsc');
        }
    }, [isConnected, address, chain, setChain]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'chain' && !e.newValue) disconnect();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [disconnect]);

    const contextValue: EVMWalletContextType = {
        isEVMConnected: isConnected,
        evmAddress: address?.toLowerCase(),
        evmChain: chain?.name?.toLowerCase(),
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

export const useEVMWallet = (): EVMWalletContextType => {
    const context = useContext(EVMWalletContext);
    if (!context) throw new Error('useEVMWallet must be used within a EVMWalletProvider');
    return context;
};
