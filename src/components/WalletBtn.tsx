/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image, { type StaticImageData } from 'next/image'
import ICPLogo from '@/assets/wallet/icp-logo.svg'
import SOLLogo from '@/assets/wallet/solana-logo.svg'
import PlugImg from '@/assets/wallet/plug.svg'
import ETHLogo from '@/assets/wallet/ethereum-logo.svg'
import EmailImg from '@/assets/wallet/email.svg'
import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi'
// import { sepolia } from 'wagmi/chains'
import MetamaskLogo from '@/assets/wallet/metamsak.svg'
import PhantomLogo from '@/assets/wallet/phantom.svg'
import CoinbaseLogo from '@/assets/wallet/coinbase.svg'
import WalletConnectLogo from '@/assets/wallet/walletconnect.png'
import TrustLogo from '@/assets/wallet/trust-wallet.svg'
import RainbowLogo from '@/assets/wallet/rainbow.png'
import ExodusLogo from '@/assets/wallet/exodus.svg'
import TalismanLogo from '@/assets/wallet/talisman.jpg'
import DefaultWallet from '@/assets/wallet/wallet.svg'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { ArrowLeft, WalletMinimal, Loader2 } from 'lucide-react'

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

export function ETHWalletIcon({ walletName, size = 24 }: { walletName: string; size?: number }) {
    const getETHWalletIconPath = (name: string) => {
        const lowerName = name.toLowerCase();

        if (lowerName.includes('metamask')) return MetamaskLogo as StaticImageData;
        if (lowerName.includes('coinbase')) return CoinbaseLogo as StaticImageData;
        if (lowerName.includes('walletconnect')) return WalletConnectLogo;
        if (lowerName.includes('trust')) return TrustLogo as StaticImageData;
        if (lowerName.includes('rainbow')) return RainbowLogo;
        if (lowerName.includes('exodus')) return ExodusLogo as StaticImageData;
        if (lowerName.includes('phantom')) return PhantomLogo as StaticImageData;
        if (lowerName.includes('talisman')) return TalismanLogo;

        return DefaultWallet as StaticImageData;
    };

    const iconPath = getETHWalletIconPath(walletName);

    return (
        <Image src={iconPath} alt={`${walletName} logo`} width={size} height={size} className="rounded-sm" />
    );
}

export default function WalletBtn() {
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedChain, setSelectedChain] = useState<'icp' | 'sol_dev' | 'privy' | 'eth_sepolia' | null>(null);

    const { isICPConnected, ICPAddress, connectICPWallet, disconnectICPWallet } = useICPWallet();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { select: SOLSelect, wallets: SOLWallets, publicKey, disconnect: disconnectSOLWallet, connected: isSOLConnected } = useWallet();
    const SOLWallet = useWallet();
    const { chain, setChain } = useChain();

    const { authenticated, user: privyUser, logout: privyLogout } = usePrivy();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { connectors: ethConnectors, connect: ethConnect, error: ethError, isPending: ethIsPending } = useConnect();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { address: ethAddress, isConnected: ethIsConnected, chain: ethChain } = useAccount();
    const { disconnect: ethDisconnect } = useDisconnect();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { switchChain: ethSwitchChain, isPending: isSwitching } = useSwitchChain();

    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { login } = useLogin({
        onComplete: ({ isNewUser }) => {
            if (isNewUser) {
                router.push('/newbie');
            }
        },
    });

    useEffect(() => {
        const addUserToDB = async () => {
            if (chain === 'icp') {
                if (isICPConnected && ICPAddress) {
                    try {
                        const result = await addNewUser({
                            principalId: ICPAddress.toString(),
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!');
                    }
                }
            } else if (chain === 'sol_dev') {
                if (isSOLConnected && SOLWallet.publicKey) {
                    try {
                        const result = await addNewUser({
                            principalId: SOLWallet.publicKey.toString(),
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!');
                    }
                }
            } else if (chain === 'privy') {
                if (authenticated && privyUser?.wallet?.address) {
                    try {
                        const result = await addNewUser({
                            principalId: privyUser?.wallet?.address,
                        });
                        if (result === 'Error adding new user') {
                            toast.error('An error occurred while setting up your account. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while setting up your account. Please try again!');
                    }
                }
            } else if (chain === 'eth_sepolia') {
                if (ethAddress && ethIsConnected) {
                    try {
                        const result = await addNewUser({
                            principalId: ethAddress,
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
    }, [authenticated, privyUser?.wallet?.address, ICPAddress, SOLWallet.publicKey, publicKey, isICPConnected, isSOLConnected, ethAddress]);

    useEffect(() => {
        if (isSOLConnected) {
            setChain('sol_dev');
        } else if (isICPConnected) {
            setChain('icp');
        } else if (authenticated) {
            setChain('privy');
        } else if (ethIsConnected) {
            setChain('eth_sepolia');
        } else {
            setChain(undefined);
        }
    }, [isICPConnected, isSOLConnected, authenticated, ethIsConnected, setChain]);

    const handleDisconnect = async () => {
        switch (chain) {
            case 'icp':
                disconnectICPWallet();
            case 'sol_dev':
                await disconnectSOLWallet();
                setChain(undefined);
            case 'privy':
                await privyLogout();
                setChain(undefined);
            case 'eth_sepolia':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                ethDisconnect();
                setChain(undefined);
        }
    };

    const handleChainSelect = (chain: 'icp' | 'sol_dev' | 'eth_sepolia') => {
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
            case 'sol_dev':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const handleSOLWalletSelect = async (walletName: any) => {
                    if (walletName) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            SOLSelect(walletName);
                            setIsConnecting(true);
                            setOpen(false);
                            handleBack();
                            if (isSOLConnected) {
                                setChain('sol_dev');
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
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */}
                        {!SOLWallets.some((wallet) => wallet.readyState === 'Installed') ? (
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
                            <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                                {SOLWallets.map((wallet) => (
                                    <motion.div variants={cardVariantsRight} key={wallet.adapter.name}>
                                        <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white' onClick={() => handleSOLWalletSelect(wallet.adapter.name)}>
                                            <Image height={30} width={30} src={wallet.adapter.icon} alt={wallet.adapter.name} className='rounded' />
                                            <div className='text-lg md:text-xl overflow-hidden'>{wallet.adapter.name}</div>
                                        </Button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        <p className='text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                    </div>
                );
            case 'eth_sepolia':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const filteredConnectors = ethConnectors.filter(connector =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    connector.id !== 'injected'
                );

                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                        {filteredConnectors.length === 0 ? (
                            <motion.div initial='hidden' whileInView='visible' variants={containerVariants}>
                                <div className='flex flex-col space-y-2 items-center justify-center'>
                                    <motion.h1 variants={cardVariantsRight} className='text-xl md:text-2xl tracking-wide text-center'>You&apos;ll need a wallet on Ethereum to continue</motion.h1>
                                    <motion.div variants={cardVariantsRight} className='p-4 rounded-full border-2'>
                                        <WalletMinimal strokeWidth={1} className='h-16 w-16 font-light' />
                                    </motion.div>
                                    <motion.div variants={cardVariantsRight} className='flex flex-row justify-center py-2'>
                                        <a href='https://metamask.io' target='_blank'>
                                            <Button className='w-full px-20'>Get a Wallet</Button>
                                        </a>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */}
                                {filteredConnectors.map((connector) => {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                    let displayName = connector.name;
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                    if (connector.id === 'metaMask') {
                                        displayName = 'MetaMask';
                                    }

                                    return (
                                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                        <motion.div variants={cardVariantsRight} key={connector.id}>
                                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */}
                                            <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white' onClick={() => ethConnect({ connector })}>
                                                <ETHWalletIcon walletName={displayName} />
                                                <div className='text-lg md:text-xl overflow-hidden'>{displayName}</div>
                                            </Button>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}

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
                            onClick={() => handleChainSelect('sol_dev')}
                        >
                            <Image src={SOLLogo} alt='Solana' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Solana Devnet</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('eth_sepolia')}
                        >
                            <Image src={ETHLogo} alt='Ethereum' className='rounded' height='20' width='20' />
                            <div className='text-lg'>Ethereum Sepolia</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={login}
                        >
                            <Image src={EmailImg} alt='Email' className='rounded' height='30' width='30' />
                            <div className='text-lg'>Connect with Email</div>
                        </motion.div>
                    </motion.div>
                );
        }
    };

    return (
        <div>
            {isICPConnected || isSOLConnected || authenticated || ethIsConnected ? (
                <Button variant='destructive' onClick={handleDisconnect} className='w-full'>Disconnect wallet</Button>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isConnecting} className='w-full'>
                            {isConnecting && <Loader2 className='animate-spin mr-2' size={15} />}
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
                                    'Select a Network or Use Email (Recommended for Beginners)'
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
