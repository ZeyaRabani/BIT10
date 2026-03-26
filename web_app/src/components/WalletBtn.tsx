"use client";

import { useState, useEffect, useMemo } from 'react';
import { useChain } from '@/context/ChainContext';
import { useICPWallet } from '@/context/ICPWalletContext';
import { useEVMWallet } from '@/context/EVMWalletContext';
import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { base, bsc } from 'wagmi/chains';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Image, { type StaticImageData } from 'next/image';
import ICPLogo from '@/assets/wallet/icp-logo.svg';
import BaseLogo from '@/assets/wallet/base-logo.svg';
import SolanaLogo from '@/assets/wallet/solana-logo.svg';
import BSCLogo from '@/assets/wallet/bsc-logo.svg';
import MetamaskLogo from '@/assets/wallet/metamsak.svg';
// import CoinbaseLogo from '@/assets/wallet/coinbase.svg'
// import LedgerLogo from '@/assets/wallet/ledger.svg'
// import PhantomLogo from '@/assets/wallet/phantom.svg'
// import TrustWalletLogo from '@/assets/wallet/trust-wallet.svg'
// import TalismanLogo from '@/assets/wallet/talisman.svg'
import PlugImg from '@/assets/wallet/plug.svg';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { CHAIN_REGISTRY } from '@/chains/chain.registry';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '@/lib/utils';
import { ArrowLeftIcon, Loader2Icon, WalletMinimalIcon, CopyIcon } from 'lucide-react';

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
    { name: 'Plug', img: PlugImg as StaticImageData }
];

const evmWalletConfig = [
    { name: 'MetaMask', icon: MetamaskLogo as StaticImageData, id: 'metaMask' },
    // { name: 'Coinbase Wallet', icon: CoinbaseLogo as StaticImageData, id: 'coinbaseWallet' },
    // { name: 'Ledger', icon: LedgerLogo as StaticImageData, id: 'ledger' },
    // { name: 'Phantom', icon: PhantomLogo as StaticImageData, id: 'phantom' },
    // { name: 'Trust Wallet', icon: TrustWalletLogo as StaticImageData, id: 'trust' },
    // { name: 'Talisman', icon: TalismanLogo as StaticImageData, id: 'talisman' }
];

export default function WalletBtn() {
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedChain, setSelectedChain] = useState<'icp' | 'base' | 'solana' | 'bsc' | null>(null);
    const [, setCopied] = useState(false);

    const { isICPConnected, icpAddress, connectICPWallet, disconnectICPWallet } = useICPWallet();

    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { chain, setChain } = useChain();
    const { connectors, connect } = useConnect();
    const { isConnected: wagmiConnected, chain: wagmiChain } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();

    const solanaWallet = useWallet();
    const { wallets: solanaWallets, connected: isSolanaConnected } = solanaWallet;
    const { publicKey } = useWallet();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boundSolanaSelect = (walletName: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return solanaWallet.select?.(walletName);
    };

    const boundDisconnectSolana = () => {
        return solanaWallet.disconnect?.();
    };

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
        } else if (isSolanaConnected && solanaWallet.publicKey) {
            setChain('solana');
        } else {
            setChain(undefined);
        }
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

    const balanceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        if (chain === 'icp' && icpAddress) {
            queries.push(
                {
                    queryKey: ['tokenBalanceICPCkUSDC', icpAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.icp.fetchTokenBalance({ canisterId: 'xevnm-gaaaa-aaaar-qafnq-cai', address: icpAddress }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['tokenBalanceICPBIT10TOP', icpAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.icp.fetchTokenBalance({ canisterId: 'g37b3-lqaaa-aaaap-qp4hq-cai', address: icpAddress }),
                    refetchInterval: 30000,
                }
            );
        }

        if (chain === 'base' && evmAddress) {
            queries.push(
                {
                    queryKey: ['tokenBalanceBaseUSDC', evmAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.base.fetchTokenBalance({ tokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', address: evmAddress }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['tokenBalanceBaseBIT10TOP', evmAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.base.fetchTokenBalance({ tokenAddress: '0xcb9696f280e93764c73d7b83f432de8dadf4b2fa', address: evmAddress }),
                    refetchInterval: 30000,
                }
            );
        }

        if (chain === 'solana' && publicKey) {
            queries.push(
                {
                    queryKey: ['tokenBalanceSolanaUSDC', publicKey, chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', publicKey: publicKey }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['tokenBalanceSolanaBIT10TOP', publicKey, chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'bitPZfP3vC9YKH1F2wfqD6kckPE95hq8QQEAKpACVw9', publicKey: publicKey }),
                    refetchInterval: 30000,
                }
            );
        }

        if (chain === 'bsc' && evmAddress) {
            queries.push(
                {
                    queryKey: ['tokenBalanceBSCUSDC', evmAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.bsc.fetchTokenBalance({ tokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', address: evmAddress }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['tokenBalanceBSCBIT10TOP', evmAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.bsc.fetchTokenBalance({ tokenAddress: '0x9782d2af62cd502ce2c823d58276e17dc23ebc21', address: evmAddress }),
                    refetchInterval: 30000,
                }
            );
        }

        return queries;
    }, [chain, evmAddress, icpAddress, publicKey]);

    const allBalanceQueries = useQueries({ queries: balanceQueries });

    const balanceIndices = useMemo(() => {
        const indices: Record<string, number> = {};
        let idx = 0;

        if (chain === 'icp') {
            indices.icpCkUSDC = idx++;
            indices.icpBIT10TOP = idx++;
        } else if (chain === 'base') {
            indices.baseUSDC = idx++;
            indices.baseBIT10TOP = idx++;
        } else if (chain === 'solana') {
            indices.solanaUSDC = idx++;
            indices.solanaBIT10TOP = idx++;
        } else if (chain === 'bsc') {
            indices.bscUSDC = idx++;
            indices.bscBIT10TOP = idx++;
        }

        return indices;
    }, [chain]);

    const tokenBalanceUSDC = useMemo<number>(() => {
        const idx =
            chain === 'icp' ? balanceIndices.icpCkUSDC :
                chain === 'base' ? balanceIndices.baseUSDC :
                    chain === 'solana' ? balanceIndices.solanaUSDC :
                        chain === 'bsc' ? balanceIndices.bscUSDC :
                            undefined;

        if (idx == null) return 0;

        const q = allBalanceQueries[idx];
        return Number(q?.data ?? 0);
    }, [allBalanceQueries, balanceIndices, chain]);

    const tokenBalanceBIT10TOP = useMemo<number>(() => {
        const idx =
            chain === 'icp' ? balanceIndices.icpBIT10TOP :
                chain === 'base' ? balanceIndices.baseBIT10TOP :
                    chain === 'solana' ? balanceIndices.solanaBIT10TOP :
                        chain === 'bsc' ? balanceIndices.bscBIT10TOP :
                            undefined;

        if (idx == null) return 0;

        const q = allBalanceQueries[idx];
        return Number(q?.data ?? 0);
    }, [allBalanceQueries, balanceIndices, chain]);

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
                    <div className='flex flex-col justify-between space-y-2 h-88 md:h-72'>
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
                    <div className='flex flex-col justify-between space-y-2 h-88 md:h-72'>
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
                    <div className='flex flex-col justify-between space-y-2 h-88 md:h-72'>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {!solanaWallets.some((wallet) => wallet.readyState === 'Installed' as any) ? (
                            <motion.div initial='hidden' whileInView='visible' variants={containerVariants}>
                                <div className='flex flex-col space-y-2 items-center justify-center'>
                                    <motion.h1 variants={cardVariantsRight} className='text-xl md:text-2xl tracking-wide text-center'>You&apos;ll need a wallet on Solana to continue</motion.h1>
                                    <motion.div variants={cardVariantsRight} className='p-4 rounded-full border-2'>
                                        <WalletMinimalIcon strokeWidth={1} className='h-16 w-16 font-light' />
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
                                {/* @typescript-eslint/no-unsafe-member-access */}
                                {solanaWallets.map((wallet) => (
                                    <motion.div variants={cardVariantsRight} key={wallet.adapter.name}>
                                        <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center' onClick={() => handleSolanaWalletSelect(wallet.adapter.name)}>
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

            case 'bsc':
                return (
                    <div className='flex flex-col justify-between space-y-2 h-88 md:h-72'>
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
                        <motion.div variants={cardVariantsLeft} className='border-2 hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer' onClick={() => handleChainSelect('icp')}>
                            <Image src={ICPLogo as StaticImageData} alt='ICP' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Internet Computer</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft} className='border-2 hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer' onClick={() => handleChainSelect('base')}>
                            <Image src={BaseLogo as StaticImageData} alt='Base' className='rounded' height='30' width='30' />
                            <div className='text-lg'>Base</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft} className='border-2 hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer' onClick={() => handleChainSelect('solana')}>
                            <Image src={SolanaLogo as StaticImageData} alt='Solana' className='rounded' height='26' width='26' />
                            <div className='text-lg'>Solana</div>
                        </motion.div>

                        <motion.div variants={cardVariantsLeft} className='border-2 hover:bg-muted rounded-full px-4 py-2.5 flex flex-row items-center space-x-2 cursor-pointer' onClick={() => handleChainSelect('bsc')}>
                            <Image src={BSCLogo as StaticImageData} alt='BSC' className='rounded' height='30' width='30' />
                            <div className='text-lg'>Binance Smart Chain</div>
                        </motion.div>
                    </motion.div>
                );
        }
    };

    const activeAddress = isICPConnected ? icpAddress : isEVMConnected ? evmAddress : isSolanaConnected ? solanaWallet.publicKey?.toBase58() : null;

    const handleCopyAddress = async () => {
        if (!activeAddress) return;
        await navigator.clipboard.writeText(activeAddress);
        setCopied(true);
        toast.info('Address copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    function truncateAddress(address: string) {
        if (!address) return '';
        return `${address.slice(0, 5)}.....${address.slice(-5)}`;
    }

    return (
        <div>
            {isICPConnected || isEVMConnected || isSolanaConnected && activeAddress ? (
                <div>
                    <div className='hidden md:block'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='outline'>{truncateAddress(activeAddress ?? '')}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className='flex flex-row items-center justify-between space-x-4 cursor-pointer' onClick={handleCopyAddress}>
                                        {truncateAddress(activeAddress ?? '')}
                                        <CopyIcon size={15} />
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Balance</DropdownMenuLabel>
                                    <DropdownMenuItem className='flex flex-row items-center justify-between space-x-4 cursor-pointer'>
                                        <div>USDC</div>
                                        <div>{formatCompactNumber(tokenBalanceUSDC)}</div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='flex flex-row items-center justify-between space-x-4 cursor-pointer'>
                                        <div>BIT10.TOP</div>
                                        <div>{formatCompactNumber(tokenBalanceBIT10TOP)}</div>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={handleDisconnect} className='bg-destructive text-white data-highlighted:bg-destructive/90 data-highlighted:text-white focus-visible:ring-destructive/20 px-4 cursor-pointer'>Disconnect wallet</DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className='block md:hidden'>
                        <Button variant='destructive' onClick={handleDisconnect} className='w-full'>Disconnect wallet</Button>
                    </div>
                </div>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isConnecting} className='w-full'>
                            {isConnecting && <Loader2Icon className='animate-spin' size={15} />}
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-[90vw] md:max-w-150 border-none'>
                        <DialogHeader>
                            <DialogTitle className='tracking-wide pt-2 md:pt-0'>
                                {selectedChain ? (
                                    <div className='flex flex-col items-start space-y-2'>
                                        <div>Connect your wallet to get started</div>
                                        <Button variant='ghost' size='sm' onClick={handleBack}>
                                            <ArrowLeftIcon /> Select different chain
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
