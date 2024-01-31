"use client"

import { createContext, useContext } from 'react'

interface Web3ModalContextType {
    account: any;
    children?: React.ReactNode;
}

const Web3ModalContext = createContext<Web3ModalContextType | undefined>(undefined);

export const useWeb3Modal = () => {
    const context = useContext(Web3ModalContext);
    if (!context) {
        throw new Error('useWeb3Modal must be used within a Web3ModalProvider');
    }
    return context;
};

export const Web3ModalProvider: React.FC<{ account: Web3ModalContextType }> = ({ account, children }: any) => {
    return (
        <Web3ModalContext.Provider value={{ account }}>
            {children}
        </Web3ModalContext.Provider>
    )
}