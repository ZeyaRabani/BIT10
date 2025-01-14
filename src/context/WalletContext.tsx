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
            // const bit10BTCCanisterId = 'eegan-kqaaa-aaaap-qhmgq-cai'
            const ckBTCLegerCanisterId = 'mxzaz-hqaaa-aaaar-qaada-cai';
            const ckETHLegerCanisterId = 'ss2fx-dyaaa-aaaar-qacoq-cai';
            const ICPLegerCanisterId = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
            const bit10DEFICanisterId = 'bin4j-cyaaa-aaaap-qh7tq-cai';
            const bit10BRC20CanisterId = '7bi3r-piaaa-aaaap-qpnrq-cai';

            const whitelist = [ckBTCLegerCanisterId, ckETHLegerCanisterId, ICPLegerCanisterId, bit10DEFICanisterId, bit10BRC20CanisterId];

            await window.ic.plug.requestConnect({
                whitelist,
            });

            const getPrincipalId = await window.ic.plug.agent.getPrincipal();
            setPrincipalId(getPrincipalId.toString());
            toast.success('Wallet connected successfully!')
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
