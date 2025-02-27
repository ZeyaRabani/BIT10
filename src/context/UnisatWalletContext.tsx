"use client"

import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'

interface UnisatWalletContextType {
    unisatBTCAddress?: string;
    isUnisatConnected: boolean;
    connectUnisatWallet: () => Promise<void>;
    disconnectUnisatWallet: () => Promise<void>;
}

const UnisatWalletContext = createContext<UnisatWalletContextType | undefined>(undefined);

export const UnisatWalletProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [unisatBTCAddress, setUnisatBTCAddress] = useLocalStorage<string>('unisatBTCAddress');

    const isUnisatConnected = !!unisatBTCAddress;

    const connectUnisatWallet = async () => {
        try {
            if (typeof window.unisat == 'undefined') {
                toast.error('UniSat Wallet is not installed!');
            }

            const result = await window.unisat.requestAccounts();
            await window.unisat.switchNetwork('testnet');
            setUnisatBTCAddress(result[0]);
            toast.success('Wallet connected successfully!')
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet connection failed!');
        }
    };

    const disconnectUnisatWallet = async () => {
        if (typeof window.unisat == 'undefined') {
            toast.error('UniSat Wallet is not installed!');
        }

        try {
            setUnisatBTCAddress(undefined);
            toast.success('Wallet disconnected successfully!');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet disconnection failed!');
        }
    };

    return (
        <UnisatWalletContext.Provider value={{
            unisatBTCAddress,
            isUnisatConnected,
            connectUnisatWallet: async () => {
                await connectUnisatWallet();
            },
            disconnectUnisatWallet: async () => {
                await disconnectUnisatWallet();
            },
        }}>
            {children}
        </UnisatWalletContext.Provider>
    );
};

export const useUnisatWallet = () => {
    const context = useContext(UnisatWalletContext);
    if (!context) {
        throw new Error('useUnisatWallet must be used within a UnisatWalletProvider');
    }
    return context;
};
