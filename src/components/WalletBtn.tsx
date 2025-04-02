/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import ICPLogo from '@/assets/wallet/icp-logo.svg'
import SOLLogo from '@/assets/wallet/solana-logo.svg'
import PlugImg from '@/assets/wallet/plug.svg'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, WalletMinimal, Triangle, Loader2 } from 'lucide-react'

const icpWallets = [
    { name: 'Plug', img: PlugImg }
];

export default function WalletBtn() {
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedChain, setSelectedChain] = useState<'ICP' | 'Solana' | null>(null);
    const [isSOLMoreOption, setIsSOLMoreOption] = useState<boolean>(false);

    const { isICPConnected, ICPAddress, connectICPWallet, disconnectICPWallet } = useICPWallet();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { select: SOLSelect, wallets: SOLWallets, publicKey, disconnect: disconnectSOLWallet, connected: isSOLConnected } = useWallet();
    const SOLWallet = useWallet();
    const { chain, setChain } = useChain();

    useEffect(() => {
        const addUserToDB = async () => {
            if (chain === 'icp') {
                if (isICPConnected && ICPAddress) {
                    try {
                        const result = await addNewUser({
                            principalId: ICPAddress.toString(),
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!.');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!.');
                    }
                }
            } else if (chain === 'sol_dev') {
                if (isSOLConnected && SOLWallet.publicKey) {
                    try {
                        const result = await addNewUser({
                            principalId: SOLWallet.publicKey.toString(),
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!.');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!.');
                    }
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addUserToDB();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ICPAddress, publicKey]);

    const handleDisconnect = async () => {
        switch (chain) {
            case 'icp':
                disconnectICPWallet();
            case 'sol_dev':
                await disconnectSOLWallet();
                setChain(undefined);
        }
    };

    const handleChainSelect = (chain: 'ICP' | 'Solana') => {
        setSelectedChain(chain);
    };

    const handleBack = () => {
        setSelectedChain(null);
    };

    const renderChainContent = () => {
        switch (selectedChain) {
            case 'ICP':
                const handleICPWalletSelect = async () => {
                    setIsConnecting(true);
                    setOpen(false);
                    await connectICPWallet();
                    handleBack();
                    setIsConnecting(false);
                };

                return (
                    <div className='flex flex-col space-y-2'>
                        {icpWallets.map(({ name, img }) => (
                            <Button key={name} variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent' onClick={handleICPWalletSelect}>
                                <div className='flex flex-row space-x-1 md:space-x-2 items-center'>
                                    <Image height={30} width={30} src={img} alt={name} className='rounded' />
                                    <span className='text-lg md:text-xl'>{name}</span>
                                </div>
                            </Button>
                        ))}
                        <p className='py-2 text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                    </div>
                );
            case 'Solana':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const handleSOLWalletSelect = async (walletName: any) => {
                    if (walletName) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            SOLSelect(walletName);
                            handleBack();
                            setChain('sol_dev');
                            setOpen(false);
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (error) {
                            toast.error('An error occurred while connecting your wallet. Please try again!');
                        }
                    }
                };

                const toggleSOLMoreOption = () => {
                    setIsSOLMoreOption(!isSOLMoreOption);
                };

                return (
                    <div className='flex flex-col space-y-2'>
                        {SOLWallets
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                            .filter((wallet) => wallet.readyState === 'Installed')
                            .map((wallet) => (
                                <Button key={wallet.adapter.name} variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent' onClick={() => handleSOLWalletSelect(wallet.adapter.name)}>
                                    <div className='flex flex-row space-x-2 items-center'>
                                        <Image height='20' width='20' src={wallet.adapter.icon} alt={wallet.adapter.name} />
                                        <div className='text-lg md:text-xl'>
                                            {wallet.adapter.name}
                                        </div>
                                    </div>
                                    <div className='text-sm text-accent-foreground/80'>
                                        Detected
                                    </div>
                                </Button>
                            ))}

                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */}
                        {!SOLWallets.some((wallet) => wallet.readyState === 'Installed') && (
                            <div className='flex flex-col space-y-2 items-center justify-center'>
                                <h1 className='text-xl md:text-2xl tracking-wide text-center'>You&apos;ll need a wallet on Solana to continue</h1>
                                <div className='p-4 rounded-full border-2'>
                                    <WalletMinimal strokeWidth={1} className='h-16 w-16 font-light' />
                                </div>
                                <div className='flex flex-row justify-center py-2'>
                                    <a href='https://phantom.app' target='_blank'>
                                        <Button className='w-full px-20'>Get a Wallet</Button>
                                    </a>
                                </div>
                            </div>
                        )}
                        <div className={`flex flex-col space-y-2 transition-all overflow-hidden ${isSOLMoreOption ? 'max-h-screen duration-200' : 'max-h-0 duration-200'}`}>
                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */}
                            {SOLWallets.filter((wallet) => wallet.readyState !== 'Installed')
                                .map((wallet) => (
                                    <Button key={wallet.adapter.name} variant='ghost' className='flex flex-row space-x-2 w-full justify-start items-center hover:bg-accent' onClick={() => handleSOLWalletSelect(wallet.adapter.name)}>
                                        <Image height='20' width='20' src={wallet.adapter.icon} alt={wallet.adapter.name} />
                                        <div className='text-lg md:text-xl'>
                                            {wallet.adapter.name}
                                        </div>
                                    </Button>
                                ))}
                        </div>
                        <div className='flex justify-end px-2'>
                            <div className='flex flex-row space-x-2 items-center cursor-pointer px-2' onClick={toggleSOLMoreOption}>
                                <h1>{isSOLMoreOption ? 'More' : 'Less'} options</h1>
                                <Triangle fill={`text-foreground`} className={`dark:hidden h-3 w-3 transform transition-transform duration-200 ${isSOLMoreOption ? '' : 'rotate-180'}`} />
                                <Triangle fill={`white`} className={`hidden dark:block h-3 w-3 transform transition-transform duration-200 ${isSOLMoreOption ? '' : 'rotate-180'}`} />
                            </div>
                        </div>

                        <p className='py-2 text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                    </div>
                );
            default:
                return (
                    <div className='flex flex-col space-y-2'>
                        <div
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('ICP')}
                        >
                            <Image src={ICPLogo} alt='ICP' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Internet Computer</div>
                        </div>

                        <div
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('Solana')}
                        >
                            <Image src={SOLLogo} alt='Solana' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Solana Devnet</div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div>
            {isICPConnected || isSOLConnected ? (
                <Button variant='destructive' onClick={handleDisconnect} className='w-full'>Disconnect wallet</Button>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isConnecting} className='w-full'>
                            {isConnecting && <Loader2 className='animate-spin mr-2' size={15} />}
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-[90vw] md:max-w-[400px]'>
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
                                    'Select Chain'
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
