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

const BASE_MAINNET_CONFIG = {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org/'],
};

interface BaseWalletContextType {
    account: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    chainId: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    switchToBaseMainnet: () => Promise<void>;
}

const BaseWalletContext = createContext<BaseWalletContextType | undefined>(undefined);

export const useBaseWallet = () => {
    const context = useContext(BaseWalletContext);
    if (context === undefined) {
        throw new Error('useBaseWallet must be used within a BaseWalletProvider');
    }
    return context;
};

interface WalletProviderProps {
    children: ReactNode;
}

export const BaseWalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);

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

    const switchToBaseMainnet = async () => {
        const metaMaskProvider = getMetaMaskProvider();
        if (!metaMaskProvider) {
            throw new Error('MetaMask is not installed or detected');
        }

        try {
            await metaMaskProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BASE_MAINNET_CONFIG.chainId }],
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                try {
                    await metaMaskProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [BASE_MAINNET_CONFIG],
                    });
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (addError) {
                    throw new Error('Failed to add Base Mainnet to MetaMask');
                }
            } else {
                throw new Error('Failed to switch to Base Mainnet');
            }
        }
    };

    const connectWallet = async () => {
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

            if (currentChainId !== BASE_MAINNET_CONFIG.chainId) {
                await switchToBaseMainnet();
            }

            const finalChainId = await metaMaskProvider.request({
                method: 'eth_chainId',
            });

            if (finalChainId === BASE_MAINNET_CONFIG.chainId) {
                setAccount(accounts[0]);
                setChainId(finalChainId);
                setIsConnected(true);
                localStorage.setItem('baseWalletConnected', 'true');
                localStorage.setItem('baseWalletAccount', accounts[0]);
                localStorage.setItem('baseWalletChain', 'base_mainnet');
            } else {
                throw new Error('Failed to switch to Base Mainnet');
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

        localStorage.removeItem('baseWalletConnected');
        localStorage.removeItem('baseWalletAccount');
        localStorage.removeItem('baseWalletChain');
        localStorage.removeItem('baseChainId');

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
            localStorage.setItem('baseWalletAccount', accounts[0]);
        }
    };

    const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
        localStorage.setItem('baseChainId', newChainId);
        if (newChainId === '0x2105') {
            localStorage.setItem('baseWalletChain', 'base_mainnet');
        } else {
            localStorage.setItem('baseWalletChain', 'other');
        }
        window.location.reload();
    };

    useEffect(() => {
        const checkConnection = async () => {
            const metaMaskProvider = getMetaMaskProvider();
            if (!metaMaskProvider) return;

            const wasConnected = localStorage.getItem('baseWalletConnected');

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
                    localStorage.removeItem('baseWalletConnected');
                    localStorage.removeItem('baseWalletAccount');
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

    const contextValue: BaseWalletContextType = {
        account,
        isConnected,
        isConnecting,
        error,
        chainId,
        connectWallet,
        disconnectWallet,
        switchToBaseMainnet,
    };

    return (
        <BaseWalletContext.Provider value={contextValue}>
            {children}
        </BaseWalletContext.Provider>
    );
};
