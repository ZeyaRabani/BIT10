"use client";

import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { useChain } from '@/context/ChainContext';

interface ICPWalletContextType {
    isICPConnected: boolean;
    icpAddress?: string;
    connectICPWallet: () => Promise<void>;
    disconnectICPWallet: () => void;
};

const ICPWalletContext = createContext<ICPWalletContextType | undefined>(undefined);

export const ICPWalletProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [icpAddress, setICPAddress] = useLocalStorage<string>('icpAddress');
    const { setChain } = useChain();
    const isICPConnected = !!icpAddress;

    const connectICPWallet = async () => {
        try {
            const bit10ExchangeCanisterID = '6phs7-6yaaa-aaaap-qpvoq-cai';

            const whitelist = [bit10ExchangeCanisterID];

            await window.ic.plug.requestConnect({ whitelist });
            const principal = await window.ic.plug.agent.getPrincipal();
            setICPAddress(principal.toString());
            setChain('icp');
            toast.success('Wallet connected successfully!');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet connect request cancelled!');
        }
    };

    const disconnectICPWallet = () => {
        setICPAddress(undefined);
        setChain(undefined);
        toast.success('Wallet disconnected successfully!');
    };

    return (
        <ICPWalletContext.Provider value={{ isICPConnected, icpAddress, connectICPWallet, disconnectICPWallet }}>
            {children}
        </ICPWalletContext.Provider>
    );
};

export const useICPWallet = () => {
    const context = useContext(ICPWalletContext);
    if (!context) throw new Error('useICPWallet must be used within a ICPWalletProvider');
    return context;
};
