"use client"

import React, { createContext, useContext } from 'react'
import Wallet, { AddressPurpose, BitcoinNetworkType, getAddress } from 'sats-connect'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'

interface WalletContextType {
    paymentAddress?: string;
    ordinalsAddress?: string;
    stacksAddress?: string;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [paymentAddress, setPaymentAddress] = useLocalStorage<string>('paymentAddress');
    const [ordinalsAddress, setOrdinalsAddress] = useLocalStorage<string>('ordinalsAddress');
    const [stacksAddress, setStacksAddress] = useLocalStorage<string>('stacksAddress');
    const [network, setNetwork] = useLocalStorage<BitcoinNetworkType>('network', BitcoinNetworkType.Testnet);

    const isConnected = !!paymentAddress && !!ordinalsAddress && !!stacksAddress;

    const connectWallet = async () => {
        await getAddress({
            payload: {
                purposes: [
                    AddressPurpose.Ordinals,
                    AddressPurpose.Payment,
                    AddressPurpose.Stacks,
                ],
                message: 'Address for sending and receiving payments',
                network: {
                    type: network,
                },
            },
            onFinish: (response) => {
                const paymentAddressItem = response.addresses.find(
                    (address) => address.purpose === AddressPurpose.Payment
                );
                setPaymentAddress(paymentAddressItem?.address);

                const ordinalsAddressItem = response.addresses.find(
                    (address) => address.purpose === AddressPurpose.Ordinals
                );
                setOrdinalsAddress(ordinalsAddressItem?.address);

                const stacksAddressItem = response.addresses.find(
                    (address) => address.purpose === AddressPurpose.Stacks
                );
                setStacksAddress(stacksAddressItem?.address);
                toast.success('Wallet connected successfully!')
            },
            onCancel: () => (
                toast.error('Wallet connect request cancelled!')
            )
        });
    };

    const disconnectWallet = () => {
        Wallet.disconnect();
        setPaymentAddress(undefined);
        setOrdinalsAddress(undefined);
        setStacksAddress(undefined);
        toast.success('Wallet disconnected successfully!')
    };

    return (
        <WalletContext.Provider value={{ paymentAddress, ordinalsAddress, stacksAddress, isConnected, connectWallet, disconnectWallet }}>
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
