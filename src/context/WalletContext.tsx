"use client"

import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'

interface WalletContextType {
    principalId?: string;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [principalId, setPrincipalId] = useLocalStorage<string>('principalId');

    const isConnected = !!principalId;

    const connectWallet = async () => {
        try {
            const bit10BTCCanisterId = 'eegan-kqaaa-aaaap-qhmgq-cai'
            const testBit10DEFICanisterId = 'hbs3g-xyaaa-aaaap-qhmna-cai';
            const testBit10BRC20CanisterId = 'uv4pt-4qaaa-aaaap-qpuxa-cai';
            const testBit10TOPCanisterId = 'wbckh-zqaaa-aaaap-qpuza-cai';
            const testBit10MEMECanisterId = 'yeoei-eiaaa-aaaap-qpvzq-cai';

            const whitelist = [bit10BTCCanisterId, testBit10DEFICanisterId, testBit10BRC20CanisterId, testBit10TOPCanisterId, testBit10MEMECanisterId];

            await window.ic.plug.requestConnect({
                whitelist,
            });

            const getPrincipalId = await window.ic.plug.agent.getPrincipal();
            setPrincipalId(getPrincipalId.toString());
            toast.success('Wallet connected successfully!')
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet connect request cancelled!')
        }
    };

    const disconnectWallet = () => {
        setPrincipalId(undefined);
        toast.success('Wallet disconnected successfully!')
    };

    return (
        <WalletContext.Provider value={{ principalId, isConnected, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
