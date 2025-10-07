/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi'
import { sepolia, bscTestnet } from 'wagmi/chains'
import { useWallet } from '@solana/wallet-adapter-react'
import { useLoginWithEmail, usePrivy, useSolanaWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import ICPLogo from '@/assets/wallet/icp-logo.svg'
import SOLLogo from '@/assets/wallet/solana-logo.svg'
import ETHLogo from '@/assets/wallet/ethereum-logo.svg'
import BSCLogo from '@/assets/wallet/bsc-logo.svg'
import EmailImg from '@/assets/wallet/email.svg'
import PlugImg from '@/assets/wallet/plug.svg'
import MetamaskLogo from '@/assets/wallet/metamsak.svg'
import CoinbaseLogo from '@/assets/wallet/coinbase.svg'
import LedgerLogo from '@/assets/wallet/ledger.svg'
import PhantomLogo from '@/assets/wallet/phantom.svg'
import TrustWalletLogo from '@/assets/wallet/trust-wallet.svg'
import TalismanLogo from '@/assets/wallet/talisman.svg'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { ArrowLeft, WalletMinimal, Loader2, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'

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

const fadeInLeftSlow = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
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
    const [selectedChain, setSelectedChain] = useState<'icp' | 'sol_dev' | 'eth_sepolia' | 'bsc_testnet' | 'privy' | null>(null);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [showCodeInput, setShowCodeInput] = useState(false);


    const { isICPConnected, icpAddress, connectICPWallet, disconnectICPWallet } = useICPWallet();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { select: SOLSelect, wallets: solWallets, publicKey, disconnect: disconnectsolWallet, connected: isSOLConnected } = useWallet();
    const solWallet = useWallet();

    const { authenticated: isPrivyConnected, user: privyUser, logout: privyLogout } = usePrivy();

    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { chain, setChain } = useChain();
    const { connectors, connect } = useConnect();
    const { isConnected: wagmiConnected, chain: wagmiChain } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();

    const router = useRouter();

    const { createWallet } = useSolanaWallets();

    const { sendCode, loginWithCode } = useLoginWithEmail({
        onComplete: (params) => {
            if (params.isNewUser) {
                void createWallet();
                router.push('/newbie');
            }
        },
        onError: (error) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            toast.error('Login failed. Try again!', error);
        },
    });

    const handleSendCode = async () => {
        try {
            await sendCode({ email });
            setShowCodeInput(true);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Failed to send confirmation code. Please try again!');
        }
    };

    useEffect(() => {
        const addUserToDB = async () => {
            if (chain === 'icp') {
                if (isICPConnected && icpAddress) {
                    try {
                        const result = await addNewUser({
                            principalId: icpAddress,
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
                if (isSOLConnected && solWallet.publicKey) {
                    try {
                        const result = await addNewUser({
                            principalId: solWallet.publicKey.toString(),
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
            } else if (chain === 'bsc_testnet') {
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
            } else if (chain === 'privy') {
                if (isPrivyConnected && privyUser?.wallet?.address) {
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
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addUserToDB();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPrivyConnected, privyUser?.wallet?.address, icpAddress, solWallet.publicKey, publicKey, isICPConnected, isSOLConnected, evmAddress, evmAddress, isEVMConnected]);

    useEffect(() => {
        if (isICPConnected && icpAddress) {
            setChain('icp');
        } else if (isSOLConnected && solWallet.publicKey) {
            setChain('sol_dev');
        } else if (wagmiConnected && wagmiChain) {
            if (wagmiChain.id === sepolia.id) {
                setChain('eth_sepolia');
            }
            else if (wagmiChain.id === bscTestnet.id) {
                setChain('bsc_testnet');
            }
        } else if (isPrivyConnected && privyUser?.wallet?.address) {
            setChain('privy');
        } else {
            setChain(undefined);
        }
    }, [isICPConnected, icpAddress, isSOLConnected, solWallet.publicKey, wagmiConnected, wagmiChain, isPrivyConnected, isEVMConnected, evmAddress, privyUser?.wallet?.address, setChain]);

    useEffect(() => {
        if (!isICPConnected && !isSOLConnected && !wagmiConnected && !isPrivyConnected) {
            setChain(undefined);
        }
    }, [isICPConnected, isSOLConnected, wagmiConnected, isPrivyConnected, setChain]);

    useEffect(() => {
        if (chain === 'icp' && !isICPConnected) {
            setChain(undefined);
        } else if (chain === 'sol_dev' && !isSOLConnected) {
            setChain(undefined);
        } else if (chain === 'eth_sepolia' && !isEVMConnected) {
            setChain(undefined);
        } else if (chain === 'bsc_testnet' && !isEVMConnected) {
            setChain(undefined);
        } else if (chain === 'privy' && !isPrivyConnected) {
            setChain(undefined);
        }
    }, [chain, isICPConnected, isSOLConnected, isEVMConnected, isPrivyConnected, setChain]);

    const handleDisconnect = async () => {
        switch (chain) {
            case 'icp':
                disconnectICPWallet();
                break;
            case 'sol_dev':
                await disconnectsolWallet();
                break;
            case 'eth_sepolia':
            case 'bsc_testnet':
                wagmiDisconnect();
                toast.success('Wallet disconnected successfully!');
                break;
            case 'privy':
                await privyLogout();
                break;
        }

        setChain(undefined);
        setSelectedChain(null);
    };

    const handleChainSelect = (chain: 'icp' | 'sol_dev' | 'eth_sepolia' | 'bsc_testnet' | 'privy') => {
        setSelectedChain(chain);
    };

    const handleBack = () => {
        setSelectedChain(null);
        setShowCodeInput(false);
        setEmail('');
        setCode('');
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
            case 'sol_dev':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const handlesolWalletSelect = async (walletName: any) => {
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
                        {!solWallets.some((wallet) => wallet.readyState === 'Installed') ? (
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
                                {solWallets.map((wallet) => (
                                    <motion.div variants={cardVariantsRight} key={wallet.adapter.name}>
                                        <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white' onClick={() => handlesolWalletSelect(wallet.adapter.name)}>
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
                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                            {evmWalletConfig.map(({ name, icon, id }) => (
                                <motion.div variants={cardVariantsRight} key={id}>
                                    <Button
                                        variant='outline'
                                        className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white'
                                        onClick={() => handleEVMWalletConnect(id, sepolia.id)}
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
            case 'bsc_testnet':
                return (
                    <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                        <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden'>
                            {evmWalletConfig.map(({ name, icon, id }) => (
                                <motion.div variants={cardVariantsRight} key={id}>
                                    <Button
                                        variant='outline'
                                        className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white'
                                        onClick={() => handleEVMWalletConnect(id, bscTestnet.id)}
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
            case 'privy':
                return (
                    <div>
                        {!showCodeInput ? (
                            <div className='flex flex-col space-y-4 items-center justify-center px-2 md:px-8 animate-fade-right-slow'>
                                <div className='flex flex-col space-y-1 w-full'>
                                    <div className='text-lg'>You email</div>
                                    <Input onChange={(e) => setEmail(e.currentTarget.value)} value={email} placeholder='Enter you email' type='email' className='dark:border-white' />
                                </div>

                                <div className='w-full'>
                                    <Button onClick={handleSendCode} className='w-full'>Send confirmation code</Button>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial='hidden' animate='visible' variants={fadeInLeftSlow} className='flex flex-col space-y-4 items-center justify-center px-2 md:px-8'>
                                <Mail size={56} />
                                <div>
                                    Enter confirmation code
                                </div>
                                <div>
                                    Please check <b className='tracking-wider'>{email}</b> for an email from privy.io and enter your code below.
                                </div>

                                <div className='flex flex-col space-y-1 w-full'>
                                    <Input onChange={(e) => setCode(e.currentTarget.value)} value={code} placeholder='Enter code' type='number' className='dark:border-white' />
                                </div>

                                <div className='w-full'>
                                    <Button onClick={() => loginWithCode({ code })} className='w-full'>Verify code</Button>
                                </div>

                                <p className='text-center'>By Logining In or Signing Up, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                            </motion.div>
                        )}
                    </div>
                )

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
                            onClick={() => handleChainSelect('bsc_testnet')}
                        >
                            <Image src={BSCLogo} alt='BSC' className='rounded' height='30' width='30' />
                            <div className='text-lg'>Binance Smart Chain Testnet</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft}
                            className='rounded-md border hover:border-primary hover:text-primary p-4 flex flex-row items-center space-x-2 cursor-pointer'
                            onClick={() => handleChainSelect('privy')}
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
            {isICPConnected || isSOLConnected || isEVMConnected || isPrivyConnected ? (
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
                                    'Select a Network or Use Email (Email is recommended for beginners)'
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
