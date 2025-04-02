"use client"

import React, { createContext, useContext } from 'react'
import { connect, disconnect } from '@stacks/connect'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'
import { useChain } from '@/context/ChainContext'

interface BTCWalletContextType {
    BTCAddress?: string;
    isBTCConnected: boolean;
    connectBTCWallet: () => Promise<void>;
    disconnectBTCWallet: () => Promise<void>;
}

const BTCWalletContext = createContext<BTCWalletContextType | undefined>(undefined);

export const BTCWalletProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [BTCAddress, setBTCAddress] = useLocalStorage<string>('BTCAddress');

    const { setChain } = useChain();
    const isBTCConnected = !!BTCAddress;

    const connectBTCWallet = async () => {
        try {
            const response = await connect();
            const paymentAddressItem = response.addresses.find(
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                (address) => address.purpose === 'payment'
            );

            setBTCAddress(paymentAddressItem?.address);
            setChain('btc');
            toast.success('Wallet connected successfully!');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet connection failed!');
        }
    };

    const disconnectBTCWallet = async () => {
        try {
            disconnect();
            setBTCAddress(undefined);
            setChain(undefined);
            toast.success('Wallet disconnected successfully!');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet disconnection failed!');
        }
    };

    return (
        <BTCWalletContext.Provider value={{ isBTCConnected, BTCAddress, connectBTCWallet, disconnectBTCWallet }}>
            {children}
        </BTCWalletContext.Provider>
    );
};

export const useBTCWallet = () => {
    const context = useContext(BTCWalletContext);
    if (!context) {
        throw new Error('useBTCWallet must be used within a BTCWalletProvider');
    }
    return context;
};
