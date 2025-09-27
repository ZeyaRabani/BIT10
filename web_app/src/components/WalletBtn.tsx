/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import ICPLogo from '@/assets/wallet/icp-logo.svg'
import BaseLogo from '@/assets/wallet/base-logo.svg'
import { useBaseWallet } from '@/context/BaseWalletContext'
import MetamaskLogo from '@/assets/wallet/metamsak.svg'
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

export default function WalletBtn() {
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedChain, setSelectedChain] = useState<'icp' | 'base' | null>(null);

    const { isICPConnected, icpAddress, connectICPWallet, disconnectICPWallet } = useICPWallet();

    const { chain, setChain } = useChain();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { account: baseAddress, isConnected: isBaseConnected, isConnecting: isBaseConnecting, connectWallet: connectBaseWallet, disconnectWallet: disconnectBaseWallet } = useBaseWallet();

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
                if (baseAddress && isBaseConnected) {
                    try {
                        const result = await addNewUser({
                            principalId: baseAddress,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [icpAddress, isICPConnected, baseAddress, isBaseConnected]);

    // Add this useEffect to properly detect EVM chains
    useEffect(() => {
        const checkBaseConnection = async () => {
            if (isBaseConnected && baseAddress) {
                // Check if we're actually on Base
                const baseChainId = localStorage.getItem('baseChainId');
                const walletChain = localStorage.getItem('walletChain');

                if (walletChain === 'base' || baseChainId === '0x2105' || isBaseConnected) {
                    setChain('base');
                }
                // else {
                //     setChain('eth');
                // }
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        checkBaseConnection();
    }, [isBaseConnected, baseAddress, setChain]);

    useEffect(() => {
        if (isICPConnected && icpAddress) {
            setChain('icp');
        } else if (isBaseConnected && baseAddress) {
            const walletChain = localStorage.getItem('walletChain');
            const bscChainId = localStorage.getItem('bscChainId');

            if (walletChain === 'base' || bscChainId === '0x2105') {
                setChain('base');
            }
            // else {
            //     setChain('eth');
            // }
        } else {
            setChain(undefined);
        }
    }, [isICPConnected, icpAddress, isBaseConnected, baseAddress, setChain]);

    // Add this useEffect to clean up chain state when all connections are lost
    useEffect(() => {
        // If no wallet is connected, ensure chain is undefined
        if (!isICPConnected && !isBaseConnected) {
            setChain(undefined);
        }

        // if (!isBaseConnected && ethIsConnected) {
        //     const walletChain = localStorage.getItem('walletChain');
        //     if (walletChain === 'base') {
        //         localStorage.removeItem('walletChain');
        //         localStorage.removeItem('bscChainId');
        //     }
        // }
    }, [isICPConnected, isBaseConnected, setChain]);

    useEffect(() => {
        if (chain === 'icp' && !isICPConnected) {
            setChain(undefined);
        } else if (chain === 'base' && !baseAddress) {
            setChain(undefined);
        }
    }, [chain, isICPConnected, baseAddress, setChain]);

    const handleDisconnect = async () => {
        switch (chain) {
            case 'icp':
                disconnectICPWallet();
                break;
            case 'base':
                disconnectBaseWallet();
                localStorage.removeItem('walletChain');
                localStorage.removeItem('bscChainId');
                break;
        }

        setChain(undefined);
        setSelectedChain(null);
    };

    const handleChainSelect = (chain: 'icp' | 'base') => {
        setSelectedChain(chain);
    };

    const handleBack = () => {
        setSelectedChain(null);
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
                const handleBaseWalletSelect = async () => {
                    setIsConnecting(true);
                    setOpen(false);
                    try {
                        await connectBaseWallet();
                        setChain('base');
                        localStorage.setItem('walletChain', 'base');
                        handleBack();
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('Failed to connect BSC wallet');
                    } finally {
                        setIsConnecting(false);
                    }
                };

                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                            <motion.div variants={cardVariantsRight}>
                                <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white' onClick={handleBaseWalletSelect} disabled={isBaseConnecting}>
                                    <Image height={30} width={30} src={MetamaskLogo} alt='Metamask' className='rounded' />
                                    <div className='text-lg md:text-xl overflow-hidden'>Metamask</div>
                                </Button>
                            </motion.div>
                        </motion.div>
                        <p className='text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
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
                    </motion.div>
                );
        }
    };

    return (
        <div>
            {isICPConnected || isBaseConnected ? (
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
