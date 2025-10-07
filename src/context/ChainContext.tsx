"use client"

import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type ChainType = 'icp' | 'sol_dev' | 'eth_sepolia' | 'bsc_testnet' | 'privy' | undefined;

interface ChainContextType {
    chain: ChainType;
    setChain: (chain: ChainType) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const ChainProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const [chain, setChain] = useLocalStorage<ChainType>('chain');

    return (
        <ChainContext.Provider value={{ chain, setChain }}>
            {children}
        </ChainContext.Provider>
    );
};

export const useChain = () => {
    const context = useContext(ChainContext);
    if (!context) {
        throw new Error('useChain must be used within a ChainProvider');
    }
    return context;
};
