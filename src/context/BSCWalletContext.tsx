/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

const BSC_TESTNET_CONFIG = {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: {
        name: 'tBNB',
        symbol: 'tBNB',
        decimals: 18,
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    blockExplorerUrls: ['https://testnet.bscscan.com/'],
};

interface BSCWalletContextType {
    account: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    chainId: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    switchToBSCTestnet: () => Promise<void>;
}

const BSCWalletContext = createContext<BSCWalletContextType | undefined>(undefined);

export const useBSCWallet = () => {
    const context = useContext(BSCWalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a BSCWalletProvider');
    }
    return context;
};

interface WalletProviderProps {
    children: ReactNode;
}

export const BSCWalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);

    // const isMetaMaskInstalled = () => {
    //     return typeof window !== 'undefined' &&
    //         typeof window.ethereum !== 'undefined' &&
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //         window.ethereum.isMetaMask === true;
    // };

    const getMetaMaskProvider = () => {
        if (typeof window === 'undefined') return null;

        if (window.ethereum?.isMetaMask) {
            return window.ethereum;
        }

        if (window.ethereum?.providers) {
            return window.ethereum.providers.find((provider: any) => provider.isMetaMask);
        }

        return null;
    };

    const switchToBSCTestnet = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const metaMaskProvider = getMetaMaskProvider();
        if (!metaMaskProvider) {
            throw new Error('MetaMask is not installed or detected');
        }

        try {
            await metaMaskProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BSC_TESTNET_CONFIG.chainId }],
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                try {
                    await metaMaskProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [BSC_TESTNET_CONFIG],
                    });
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (addError) {
                    throw new Error('Failed to add BSC Testnet to MetaMask');
                }
            } else {
                throw new Error('Failed to switch to BSC Testnet');
            }
        }
    };

    const connectWallet = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const metaMaskProvider = getMetaMaskProvider();
        if (!metaMaskProvider) {
            setError('MetaMask is not installed or detected. Please install MetaMask extension.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const accounts = await metaMaskProvider.request({
                method: 'eth_requestAccounts',
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found in MetaMask');
            }

            const currentChainId = await metaMaskProvider.request({
                method: 'eth_chainId',
            });

            if (currentChainId !== BSC_TESTNET_CONFIG.chainId) {
                await switchToBSCTestnet();
            }

            const finalChainId = await metaMaskProvider.request({
                method: 'eth_chainId',
            });

            if (finalChainId === BSC_TESTNET_CONFIG.chainId) {
                setAccount(accounts[0]);
                setChainId(finalChainId);
                setIsConnected(true);
                localStorage.setItem('walletConnected', 'true');
                localStorage.setItem('walletAccount', accounts[0]);
                localStorage.setItem('walletChain', 'bsc_testnet');
            } else {
                throw new Error('Failed to switch to BSC Testnet');
            }

        } catch (err: any) {
            if (err.code === 4001) {
                setError('Connection rejected by user');
            } else {
                setError(err.message || 'Failed to connect to MetaMask');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setIsConnected(false);
        setChainId(null);
        setError(null);

        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAccount');
        localStorage.removeItem('walletChain');
        localStorage.removeItem('bscChainId');

        const metaMaskProvider = getMetaMaskProvider();
        if (metaMaskProvider && metaMaskProvider.removeAllListeners) {
            metaMaskProvider.removeAllListeners();
        }
    };

    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            // @ts-expect-error
            setAccount(accounts[0]);
            // @ts-expect-error
            localStorage.setItem('walletAccount', accounts[0]);
        }
    };

    const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
        localStorage.setItem('bscChainId', newChainId);
        if (newChainId === '0x61') {
            localStorage.setItem('walletChain', 'bsc_testnet');
        } else {
            localStorage.setItem('walletChain', 'eth_sepolia');
        }
        window.location.reload();
    };

    useEffect(() => {
        const checkConnection = async () => {
            const metaMaskProvider = getMetaMaskProvider();
            if (!metaMaskProvider) return;

            const wasConnected = localStorage.getItem('walletConnected');

            if (wasConnected === 'true') {
                try {
                    const accounts = await metaMaskProvider.request({
                        method: 'eth_accounts',
                    });

                    if (accounts.length > 0) {
                        const currentChainId = await metaMaskProvider.request({
                            method: 'eth_chainId',
                        });

                        setAccount(accounts[0]);
                        setChainId(currentChainId);
                        setIsConnected(true);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (err) {
                    localStorage.removeItem('walletConnected');
                    localStorage.removeItem('walletAccount');
                }
            }
        };

        checkConnection();
    }, []);

    useEffect(() => {
        const metaMaskProvider = getMetaMaskProvider();
        if (!metaMaskProvider) return;

        metaMaskProvider.on('accountsChanged', handleAccountsChanged);
        metaMaskProvider.on('chainChanged', handleChainChanged);

        return () => {
            if (metaMaskProvider.removeListener) {
                metaMaskProvider.removeListener('accountsChanged', handleAccountsChanged);
                metaMaskProvider.removeListener('chainChanged', handleChainChanged);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const contextValue: BSCWalletContextType = {
        account,
        isConnected,
        isConnecting,
        error,
        chainId,
        connectWallet,
        disconnectWallet,
        switchToBSCTestnet,
    };

    return (
        <BSCWalletContext.Provider value={contextValue}>
            {children}
        </BSCWalletContext.Provider>
    );
};
