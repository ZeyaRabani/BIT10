"use client"

import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'
import { useChain } from '@/context/ChainContext'

interface ICPWalletContextType {
    isICPConnected: boolean;
    ICPAddress?: string;
    connectICPWallet: () => Promise<void>;
    disconnectICPWallet: () => void;
}

const ICPWalletContext = createContext<ICPWalletContextType | undefined>(undefined);

export const ICPWalletProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [ICPAddress, setICPAddress] = useLocalStorage<string>('ICPAddress');

    const { setChain } = useChain();
    const isICPConnected = !!ICPAddress;

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

            const getICPAddress = await window.ic.plug.agent.getPrincipal();
            setICPAddress(getICPAddress.toString());
            setChain('icp');
            toast.success('Wallet connected successfully!');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Wallet connect request cancelled!')
        }
    };

    const disconnectICPWallet = () => {
        setICPAddress(undefined);
        setChain(undefined);
        toast.success('Wallet disConnected successfully!');
    };

    return (
        <ICPWalletContext.Provider value={{ isICPConnected, ICPAddress, connectICPWallet, disconnectICPWallet }}>
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
