"use client"

import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface ChainContextType {
    chain: string | undefined;
    setChain: (chain: string | undefined) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const ChainProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [chain, setChain] = useLocalStorage<string>('chain');

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
