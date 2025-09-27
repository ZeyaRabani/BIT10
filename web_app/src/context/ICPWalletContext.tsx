"use client"

import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'
import { useChain } from '@/context/ChainContext'

interface ICPWalletContextType {
    isICPConnected: boolean;
    icpAddress?: string;
    connectICPWallet: () => Promise<void>;
    disconnectICPWallet: () => void;
}

const ICPWalletContext = createContext<ICPWalletContextType | undefined>(undefined);

export const ICPWalletProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [icpAddress, seticpAddress] = useLocalStorage<string>('icpAddress');

    const { setChain } = useChain();
    const isICPConnected = !!icpAddress;

    const connectICPWallet = async () => {
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

            const geticpAddress = await window.ic.plug.agent.getPrincipal();
            seticpAddress(geticpAddress.toString());
            setChain('icp');
            toast.success('Wallet connected successfully!');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet connect request cancelled!')
        }
    };

    const disconnectICPWallet = () => {
        seticpAddress(undefined);
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
    if (!context) {
        throw new Error('useWallet must be used within a ICPWalletProvider');
    }
    return context;
};