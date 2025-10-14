/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi'
import { base, bsc } from 'wagmi/chains'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import ICPLogo from '@/assets/wallet/icp-logo.svg'
import BaseLogo from '@/assets/wallet/base-logo.svg'
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
import { ArrowLeft, Loader2 } from 'lucide-react'

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
    const [selectedChain, setSelectedChain] = useState<'icp' | 'base' | 'bsc' | null>(null);

    const { isICPConnected, icpAddress, connectICPWallet, disconnectICPWallet } = useICPWallet();

    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { chain, setChain } = useChain();
    const { connectors, connect } = useConnect();
    const { isConnected: wagmiConnected, chain: wagmiChain } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();

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
    }, [isICPConnected, icpAddress, isEVMConnected, evmAddress, chain]);

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
        } else {
            setChain(undefined);
        }
    }, [isICPConnected, icpAddress, wagmiConnected, wagmiChain, isEVMConnected, evmAddress, setChain]);

    useEffect(() => {
        if (!isICPConnected && !wagmiConnected) {
            setChain(undefined);
        }
    }, [isICPConnected, wagmiConnected, setChain]);

    useEffect(() => {
        if (chain === 'icp' && !isICPConnected) {
            setChain(undefined);
        } else if (chain === 'base' && !evmAddress) {
            setChain(undefined);
        } else if (chain === 'bsc' && !evmAddress) {
            setChain(undefined);
        }
    }, [chain, isICPConnected, evmAddress, setChain]);

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
        }

        setChain(undefined);
        setSelectedChain(null);
    };

    const handleChainSelect = (chain: 'icp' | 'base' | 'bsc') => {
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
                // eslint-disable-next-line @typescript-eslint/await-thenable
                await connect({ connector, chainId: targetChainId });

                if (wagmiChain?.id !== targetChainId) {
                    // eslint-disable-next-line @typescript-eslint/await-thenable
                    await switchChain({ chainId: targetChainId });
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
                                    <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white' onClick={handleICPWalletSelect}>
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
                                        className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white'
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

            case 'bsc':
                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                            {evmWalletConfig.map(({ name, icon, id }) => (
                                <motion.div variants={cardVariantsRight} key={id}>
                                    <Button
                                        variant='outline'
                                        className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white'
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
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('icp')}
                        >
                            <Image src={ICPLogo} alt='ICP' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Internet Computer</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('base')}
                        >
                            <Image src={BaseLogo} alt='Base' className='rounded' height='30' width='30' />
                            <div className='text-lg'>Base</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
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
            {isICPConnected || isEVMConnected ? (
                <Button variant='destructive' onClick={handleDisconnect} className='w-full'>Disconnect wallet</Button>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isConnecting} className='w-full'>
                            {isConnecting && <Loader2 className='animate-spin' size={15} />}
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-[90vw] md:max-w-[600px]'>
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
