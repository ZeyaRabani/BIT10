/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi'
import { base, bsc } from 'wagmi/chains'
import { useWallet } from '@solana/wallet-adapter-react'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import ICPLogo from '@/assets/wallet/icp-logo.svg'
import BaseLogo from '@/assets/wallet/base-logo.svg'
import SolanaLogo from '@/assets/wallet/solana-logo.svg'
import BSCLogo from '@/assets/wallet/bsc-logo.svg'
import MetamaskLogo from '@/assets/wallet/metamsak.svg'
import CoinbaseLogo from '@/assets/wallet/coinbase.svg'
import LedgerLogo from '@/assets/wallet/ledger.svg'
import PhantomLogo from '@/assets/wallet/phantom.svg'
import TrustWalletLogo from '@/assets/wallet/trust-wallet.svg'
import TalismanLogo from '@/assets/wallet/talisman.svg'
import PlugImg from '@/assets/wallet/plug.svg'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, WalletMinimal } from 'lucide-react'

const containerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariantsLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
};

const cardVariantsRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
};

const icpWallets = [
    { name: 'Plug', img: PlugImg }
];

const evmWalletConfig = [
    { name: 'MetaMask', icon: MetamaskLogo, id: 'metaMask' },
    { name: 'Coinbase Wallet', icon: CoinbaseLogo, id: 'coinbaseWallet' },
    { name: 'Ledger', icon: LedgerLogo, id: 'ledger' },
    { name: 'Phantom', icon: PhantomLogo, id: 'phantom' },
    { name: 'Trust Wallet', icon: TrustWalletLogo, id: 'trust' },
    { name: 'Talisman', icon: TalismanLogo, id: 'talisman' }
];

export default function WalletBtn() {
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedChain, setSelectedChain] = useState<'icp' | 'base' | 'solana' | 'bsc' | null>(null);

    const { isICPConnected, icpAddress, connectICPWallet, disconnectICPWallet } = useICPWallet();

    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { chain, setChain } = useChain();
    const { connectors, connect } = useConnect();
    const { isConnected: wagmiConnected, chain: wagmiChain } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const solanaWallet = useWallet();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { wallets: solanaWallets, publicKey, connected: isSolanaConnected } = solanaWallet;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boundSolanaSelect = (walletName: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
        return solanaWallet.select?.(walletName);
    };

    const boundDisconnectSolana = () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        return solanaWallet.disconnect?.();
    };

    useEffect(() => {
        const addUserToDB = async () => {
            if (chain === 'icp') {
                if (isICPConnected && icpAddress) {
                    try {
                        const result = await addNewUser({
                            principalId: icpAddress.toString(),
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!');
                    }
                }
            } else if (chain === 'base') {
                if (isEVMConnected && evmAddress) {
                    try {
                        const result = await addNewUser({
                            principalId: evmAddress,
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!');
                    }
                }
            } else if (chain === 'solana') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (isSolanaConnected && solanaWallet.publicKey) {
                    try {
                        const result = await addNewUser({
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                            principalId: solanaWallet.publicKey.toString(),
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!');
                    }
                }
            } else if (chain === 'bsc') {
                if (isEVMConnected && evmAddress) {
                    try {
                        const result = await addNewUser({
                            principalId: evmAddress,
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!');
                    }
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addUserToDB();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    }, [isICPConnected, icpAddress, isEVMConnected, evmAddress, isSolanaConnected, solanaWallet.publicKey, publicKey, chain]);

    useEffect(() => {
        if (isICPConnected && icpAddress) {
            setChain('icp');
        } else if (wagmiConnected && wagmiChain) {
            if (wagmiChain.id === base.id) {
                setChain('base');
            }
            else if (wagmiChain.id === bsc.id) {
                setChain('bsc');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        } else if (isSolanaConnected && solanaWallet.publicKey) {
            setChain('solana');
        } else {
            setChain(undefined);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    }, [isICPConnected, icpAddress, wagmiConnected, wagmiChain, isEVMConnected, evmAddress, isSolanaConnected, solanaWallet.publicKey, setChain]);

    useEffect(() => {
        if (!isICPConnected && !wagmiConnected && !isSolanaConnected) {
            setChain(undefined);
        }
    }, [isICPConnected, wagmiConnected, isSolanaConnected, setChain]);

    useEffect(() => {
        if (chain === 'icp' && !isICPConnected) {
            setChain(undefined);
        } else if (chain === 'base' && !evmAddress) {
            setChain(undefined);
        } else if (chain === 'bsc' && !evmAddress) {
            setChain(undefined);
        } else if (chain === 'solana' && !isSolanaConnected) {
            setChain(undefined);
        }
    }, [chain, isICPConnected, evmAddress, isSolanaConnected, setChain]);

    const handleDisconnect = async () => {
        switch (chain) {
            case 'icp':
                disconnectICPWallet();
                break;
            case 'base':
            case 'bsc':
                wagmiDisconnect();
                toast.success('Wallet disconnected successfully!');
                break;
            case 'solana':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                await boundDisconnectSolana?.();
                break;
        }

        setChain(undefined);
        setSelectedChain(null);
    };

    const handleChainSelect = (chain: 'icp' | 'base' | 'solana' | 'bsc') => {
        setSelectedChain(chain);
    };

    const handleBack = () => {
        setSelectedChain(null);
    };

    const handleEVMWalletConnect = async (walletId: string, targetChainId: number) => {
        setIsConnecting(true);
        try {
            const connector = connectors.find(c =>
                c.id.toLowerCase().includes(walletId.toLowerCase()) ||
                c.name.toLowerCase().includes(walletId.toLowerCase())
            );

            if (connector) {
                connect({ connector, chainId: targetChainId });

                if (wagmiChain?.id !== targetChainId) {
                    switchChain({ chainId: targetChainId });
                }

                setOpen(false);
                handleBack();
            } else {
                toast.error(`${walletId} wallet not found. Please install the extension.`);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            if (error?.message?.includes('User rejected')) {
                toast.error('Connection request cancelled!');
            } else {
                toast.error('Failed to connect wallet. Please try again.');
            }
            toast.error('Wallet connection error',);
        } finally {
            setIsConnecting(false);
        }
    };

    const renderChainContent = () => {
        switch (selectedChain) {
            case 'icp':
                const handleICPWalletSelect = async () => {
                    setIsConnecting(true);
                    setOpen(false);
                    await connectICPWallet();
                    handleBack();
                    setIsConnecting(false);
                };

                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                            {icpWallets.map(({ name, img }) => (
                                <motion.div variants={cardVariantsRight} key={name}>
                                    <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center' onClick={handleICPWalletSelect}>
                                        <Image height={30} width={30} src={img} alt={name} className='rounded' />
                                        <div className='text-lg md:text-xl overflow-hidden'>{name}</div>
                                    </Button>
                                </motion.div>
                            ))}
                        </motion.div>
                        <p className='text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                    </div>
                );

            case 'base':
                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                            {evmWalletConfig.map(({ name, icon, id }) => (
                                <motion.div variants={cardVariantsRight} key={id}>
                                    <Button
                                        variant='outline'
                                        className='flex flex-row w-full md:py-6 justify-center items-center'
                                        onClick={() => handleEVMWalletConnect(id, base.id)}
                                        disabled={isConnecting}
                                    >
                                        <Image height={30} width={30} src={icon} alt={name} className='rounded' />
                                        <div className='text-lg md:text-xl overflow-hidden'>{name}</div>
                                    </Button>
                                </motion.div>
                            ))}
                        </motion.div>
                        <p className='text-center text-xs md:text-sm'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                    </div>
                );

            case 'solana':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const handleSolanaWalletSelect = async (walletName: any) => {
                    if (walletName) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
                            boundSolanaSelect?.(walletName);
                            setIsConnecting(true);
                            setOpen(false);
                            handleBack();
                            if (isSolanaConnected) {
                                setChain('solana');
                                setOpen(false);
                            }

                            setIsConnecting(false);
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (error) {
                            toast.error('An error occurred while connecting your wallet. Please try again!');
                        }
                    }
                };

                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */}
                        {!solanaWallets.some((wallet) => wallet.readyState === 'Installed' as any) ? (
                            <motion.div initial='hidden' whileInView='visible' variants={containerVariants}>
                                <div className='flex flex-col space-y-2 items-center justify-center'>
                                    <motion.h1 variants={cardVariantsRight} className='text-xl md:text-2xl tracking-wide text-center'>You&apos;ll need a wallet on Solana to continue</motion.h1>
                                    <motion.div variants={cardVariantsRight} className='p-4 rounded-full border-2'>
                                        <WalletMinimal strokeWidth={1} className='h-16 w-16 font-light' />
                                    </motion.div>
                                    <motion.div variants={cardVariantsRight} className='flex flex-row justify-center py-2'>
                                        <a href='https://phantom.app' target='_blank'>
                                            <Button className='w-full px-20'>Get a Wallet</Button>
                                        </a>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden pr-2'>
                                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */}
                                {solanaWallets.map((wallet) => (
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                    <motion.div variants={cardVariantsRight} key={wallet.adapter.name}>
                                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                                        <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center' onClick={() => handleSolanaWalletSelect(wallet.adapter.name)}>
                                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                                            <Image height={30} width={30} src={wallet.adapter.icon} alt={wallet.adapter.name} className='rounded' />
                                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                                            <div className='text-lg md:text-xl overflow-hidden'>{wallet.adapter.name}</div>
                                        </Button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        <p className='text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                    </div>
                );

            case 'bsc':
                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                            {evmWalletConfig.map(({ name, icon, id }) => (
                                <motion.div variants={cardVariantsRight} key={id}>
                                    <Button
                                        variant='outline'
                                        className='flex flex-row w-full md:py-6 justify-center items-center'
                                        onClick={() => handleEVMWalletConnect(id, bsc.id)}
                                        disabled={isConnecting}
                                    >
                                        <Image height={30} width={30} src={icon} alt={name} className='rounded' />
                                        <div className='text-lg md:text-xl overflow-hidden'>{name}</div>
                                    </Button>
                                </motion.div>
                            ))}
                        </motion.div>
                        <p className='text-center text-xs md:text-sm'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                    </div>
                );

            default:
                return (
                    <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='flex flex-col space-y-2'>
                        <motion.div variants={cardVariantsLeft}
                            className='border-2 border-muted hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('icp')}
                        >
                            <Image src={ICPLogo} alt='ICP' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Internet Computer</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='border-2 border-muted hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('base')}
                        >
                            <Image src={BaseLogo} alt='Base' className='rounded' height='30' width='30' />
                            <div className='text-lg'>Base</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='border-2 border-muted hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('solana')}
                        >
                            <Image src={SolanaLogo} alt='Solana' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Solana</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='border-2 border-muted hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('bsc')}
                        >
                            <Image src={BSCLogo} alt='BSC' className='rounded' height='30' width='30' />
                            <div className='text-lg'>Binance Smart Chain</div>
                        </motion.div>
                    </motion.div>
                );
        }
    };

    return (
        <div>
            {isICPConnected || isEVMConnected || isSolanaConnected ? (
                <Button variant='destructive' onClick={handleDisconnect} className='w-full rounded-full'>Disconnect wallet</Button>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isConnecting} className='w-full rounded-full'>
                            {isConnecting && <Loader2 className='animate-spin' size={15} />}
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-[90vw] md:max-w-[600px] border-none'>
                        <DialogHeader>
                            <DialogTitle className='tracking-wide pt-2 md:pt-0'>
                                {selectedChain ? (
                                    <div className='flex flex-col items-start space-y-2'>
                                        <div>Connect your wallet to get started</div>
                                        <Button variant='ghost' size='sm' onClick={handleBack}>
                                            <ArrowLeft /> Select different chain
                                        </Button>
                                    </div>
                                ) : (
                                    'Select a Network'
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        {renderChainContent()}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
