import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatAddress } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import * as z from 'zod'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/dex.did'
import { newDEXSwap } from '@/actions/dbActions'
import Image, { type StaticImageData } from 'next/image'
import ETHImg from '@/assets/swap/eth.svg'
import USDCImg from '@/assets/swap/usdc.svg'
import BTCImg from '@/assets/swap/bitcoin.svg'
import BNBImg from '@/assets/swap/bnb.svg'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

const supportedToken = [
    // Ethereum tokens (ERC20)
    {
        label: 'ETH',
        value: 'Ethereum',
        img: ETHImg as StaticImageData,
        address: '0x0000000000000000000000000000000000000000e',
        token_id: '1027',
        chain: 'Ethereum',
        token_type: 'ERC20',
        slug: ['ethereum']
    },
    {
        label: 'USDC',
        value: 'USD Coin',
        img: USDCImg as StaticImageData,
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        token_id: '3408_1027',
        chain: 'Ethereum',
        token_type: 'ERC20',
        slug: ['usdc', 'stable coin']
    },
    // BSC Tokens (BEP20)
    {
        label: 'tBNB',
        value: 'tBNB',
        img: BNBImg as StaticImageData,
        address: '0x0000000000000000000000000000000000000000b',
        token_id: '1839',
        chain: 'Binance Smart Chain',
        token_type: 'BEP20',
        slug: ['bnb', 'binance', 'bsc']
    },
    {
        label: 'USDC',
        value: 'USD Coin',
        img: USDCImg as StaticImageData,
        address: '0x64544969ed7EBf5f083679233325356EbE738930',
        token_id: '3408_1839',
        chain: 'Binance Smart Chain',
        token_type: 'BEP20',
        slug: ['usdc', 'bsc', 'stable coin']
    },
    {
        label: 'BTCB',
        value: 'Bitcoin BEP2',
        img: BTCImg as StaticImageData,
        address: '0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8',
        token_id: '4023_1839',
        chain: 'Binance Smart Chain',
        token_type: 'BEP20',
        slug: ['btc', 'bitcoin', 'binance bitcoin']
    }
]

const supportedPools = [
    // ETH <-> ETH
    {
        pool_id: 'y0a4pk',
        token_a_symbol: 'ETH',
        token_a_chain: 'Ethereum',
        token_a_token_id: '1027',
        token_b_symbol: 'USDC',
        token_b_chain: 'Ethereum',
        token_b_token_id: '3408_1027',
        pair_type: 'Same-Chain',
    },
    // BSC <-> BSC
    {
        pool_id: '39ef62',
        token_a_symbol: 'tBNB',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '1839',
        token_b_symbol: 'USDC',
        token_b_chain: 'Binance Smart Chain',
        token_b_token_id: '3408_1839',
        pair_type: 'Same-Chain',
    },
    {
        pool_id: 'cg15vp',
        token_a_symbol: 'tBNB',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '1839',
        token_b_symbol: 'BTCB',
        token_b_chain: 'Binance Smart Chain',
        token_b_token_id: '4023_1839',
        pair_type: 'Same-Chain',
    },
    {
        pool_id: 'dat49f',
        token_a_symbol: 'BTCB',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '4023_1839',
        token_b_symbol: 'USDC',
        token_b_chain: 'Binance Smart Chain',
        token_b_token_id: '3408_1839',
        pair_type: 'Same-Chain',
    },
    // BSC <-> ETH
    {
        pool_id: 'a9f2k3',
        token_a_symbol: 'tBNB',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '1839',
        token_b_symbol: 'ETH',
        token_b_chain: 'Ethereum',
        token_b_token_id: '1027',
        pair_type: 'Cross-Chain',
    },
    {
        pool_id: 'm3n8x1',
        token_a_symbol: 'tBNB',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '1839',
        token_b_symbol: 'USDC',
        token_b_chain: 'Ethereum',
        token_b_token_id: '3408_1027',
        pair_type: 'Cross-Chain',
    },
    {
        pool_id: 'z6y4b8',
        token_a_symbol: 'USDC',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '3408_1839',
        token_b_symbol: 'ETH',
        token_b_chain: 'Ethereum',
        token_b_token_id: '1027',
        pair_type: 'Cross-Chain',
    },
    {
        pool_id: 'q7p5d2',
        token_a_symbol: 'USDC',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '3408_1839',
        token_b_symbol: 'USDC',
        token_b_chain: 'Ethereum',
        token_b_token_id: '3408_1027',
        pair_type: 'Cross-Chain',
    },
    {
        pool_id: 'h4c9v7',
        token_a_symbol: 'BTCB',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '4023_1839',
        token_b_symbol: 'ETH',
        token_b_chain: 'Ethereum',
        token_b_token_id: '1027',
        pair_type: 'Cross-Chain',
    },
    {
        pool_id: 't8k1w5',
        token_a_symbol: 'BTCB',
        token_a_chain: 'Binance Smart Chain',
        token_a_token_id: '4023_1839',
        token_b_symbol: 'USDC',
        token_b_chain: 'Ethereum',
        token_b_token_id: '3408_1027',
        pair_type: 'Cross-Chain',
    }
]

const supportedChains = [
    { id: 'all', name: 'All', logo: null },
    { id: 'ethereum', name: 'Ethereum', logo: ETHImg as StaticImageData },
    { id: 'bsc', name: 'Binance Smart Chain', logo: BNBImg as StaticImageData },
]

const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.02 },
    },
};

const listItemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const FormSchema = z.object({
    from_token: z.string({ required_error: 'Please select a token' }),
    to_token: z.string({ required_error: 'Please select the token' }),
    trx_hash: z.string({ required_error: 'Please enter the inbound transaction hash' })
        .min(8, { message: 'Please enter a valid transaction hash' })
});

export default function VerifyTransaction() {
    const [verifying, setVerifying] = useState<boolean>(false);
    const [fromTokenChainFilter, setFromTokenChainFilter] = useState('all');
    const [toTokenChainFilter, setToTokenChainFilter] = useState('all');
    const [fromTokenDialogOpen, setFromTokenDialogOpen] = useState(false);
    const [fromTokenSearch, setFromTokenSearch] = useState('');
    const [toTokenDialogOpen, setToTokenDialogOpen] = useState(false);
    const [toTokenSearch, setToTokenSearch] = useState('');

    const filteredFromTokens = useMemo(() => {
        if (!fromTokenSearch && fromTokenChainFilter === 'all') return supportedToken

        const query = fromTokenSearch.toLowerCase().trim()
        let result = supportedToken

        if (fromTokenChainFilter !== 'all') {
            const chainName = supportedChains.find(c => c.id === fromTokenChainFilter)?.name
            if (chainName) {
                result = result.filter(token => token.chain === chainName)
            }
        }

        if (query) {
            result = result.filter(token =>
                token.label.toLowerCase().includes(query) ||
                token.value.toLowerCase().includes(query) ||
                token.address.toLowerCase().includes(query) ||
                token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
            )
        }

        return result
    }, [fromTokenSearch, fromTokenChainFilter])

    const filteredToTokens = useMemo(() => {
        if (!toTokenSearch && toTokenChainFilter === 'all') return supportedToken

        const query = toTokenSearch.toLowerCase().trim()
        let result = supportedToken

        if (toTokenChainFilter !== 'all') {
            const chainName = supportedChains.find(c => c.id === toTokenChainFilter)?.name
            if (chainName) {
                result = result.filter(token => token.chain === chainName)
            }
        }

        if (query) {
            result = result.filter(token =>
                token.label.toLowerCase().includes(query) ||
                token.value.toLowerCase().includes(query) ||
                token.address.toLowerCase().includes(query) ||
                token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
            )
        }

        return result
    }, [toTokenSearch, toTokenChainFilter]);

    const handleFromTokenDialogOpen = (open: boolean) => {
        setFromTokenDialogOpen(open)
        if (open) {
            setFromTokenChainFilter('all')
            setFromTokenSearch('')
        }
    }

    const handleToTokenDialogOpen = (open: boolean) => {
        setToTokenDialogOpen(open)
        if (open) {
            setToTokenChainFilter('all')
            setToTokenSearch('')
        }
    }

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            from_token: '1027',
            to_token: '1839'
        },
    });

    const selectedFromToken = useMemo(() => {
        const fromTokenId = form.watch('from_token');
        return supportedToken.find((token) => token.token_id === fromTokenId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_token')]);

    const selectedToToken = useMemo(() => {
        const toTokenId = form.watch('to_token');
        return supportedToken.find((token) => token.token_id === toTokenId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('to_token')]);

    const getTokenImg = (tokenLabel?: string): StaticImageData => {
        switch (tokenLabel) {
            case 'ETH':
                return ETHImg as StaticImageData;
            case 'USDC':
                return USDCImg as StaticImageData;
            case 'tBNB':
                return BNBImg as StaticImageData;
            case 'BTCB':
                return BTCImg as StaticImageData;
            default:
                return ETHImg as StaticImageData;
        }
    };

    const selectedFromTokenImg = getTokenImg(selectedFromToken?.label);
    const selectedToTokenImg = getTokenImg(selectedToToken?.label);

    const matchingPool = useMemo(() => {
        if (!selectedFromToken || !selectedToToken) return null;

        return (
            supportedPools.find(
                (pool) =>
                    (pool.token_a_token_id === selectedFromToken.token_id &&
                        pool.token_b_token_id === selectedToToken.token_id) ||
                    (pool.token_a_token_id === selectedToToken.token_id &&
                        pool.token_b_token_id === selectedFromToken.token_id)
            ) ?? null
        );
    }, [selectedFromToken, selectedToToken]);

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setVerifying(true);

            const fromToken = selectedFromToken;

            const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
            const canisterId = 't2vfi-5aaaa-aaaap-qqbfa-cai';

            const agent = new HttpAgent({ host });
            const actor = Actor.createActor(idlFactory, {
                agent,
                canisterId,
            });

            let verifyAndSwap;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (matchingPool.pair_type == 'Same-Chain') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                verifyAndSwap = await actor.verify_and_swap({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    pool_id: matchingPool.pool_id,
                    transaction_hash: values.trx_hash,
                });
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                verifyAndSwap = await actor.cross_chain_verify_and_swap({
                    source_chain: fromToken?.chain == 'Ethereum' ? 'ethereum' : 'bsc',
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    pool_id: matchingPool.pool_id,
                    transaction_hash: values.trx_hash,
                });
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (verifyAndSwap?.Ok?.Error === 'No valid ETH or ERC20 transfer to the canister was found.' || verifyAndSwap?.Ok?.Error === 'Transaction not sent to canister address') {
                toast.error('This transaction was not sent to the swap contract!')
                return;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            else if (verifyAndSwap?.Ok?.Error == 'Transaction already processed') {
                toast.error('This transaction has already been completed!')
                return;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            else if (verifyAndSwap?.Ok?.Error == 'Failed to get transaction data: Transaction not found (null result)') {
                toast.error('Unable to retrieve transaction details. Please check the transaction hash and try again!')
                return;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            else if (!verifyAndSwap?.Ok?.Success) {
                toast.error('Swap verification failed');
                return;
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const swapData = verifyAndSwap.Ok.Success;

            const result = await newDEXSwap({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                poolId: swapData.pool_id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                amountIn: swapData.amount_in,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                amountOut: swapData.amount_out,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                sourceChain: swapData.source_chain,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                destinationChain: swapData.destination_chain,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                swapType: swapData.swap_type,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tickInWalletAddress: swapData.tick_in_wallet_address,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tickOutWalletAddress: swapData.tick_out_wallet_address,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tokenInAddress: swapData.token_in_address,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tokenOutAddress: swapData.token_out_address,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                slippage: swapData.slippage,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                status: swapData.status,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                txHashIn: swapData.tx_hash_in,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                txHashOut: swapData.tx_hash_out,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                timestamp: Number(swapData.timestamp),
            });

            if (result === 'DEX Swap was successful') {
                toast.success('Token swap was successful!');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }

            setVerifying(false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred during verification. Please try again!');
        } finally {
            setVerifying(false);
        }
    };

    const verifyDisabledConditions = verifying || selectedFromToken?.token_id === selectedToToken?.token_id || !matchingPool;

    const getVerifyMessage = (): string => {
        if (selectedFromToken?.token_id === selectedToToken?.token_id) return 'Same pair cannot be verify';
        if (!matchingPool) return 'Pool not found for selected pair';
        if (verifying) return 'Verifying...';
        return 'Verify';
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant='link'>Swap Didn&apos;t Go Through? Verify Now</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                <DialogHeader>
                    <DialogTitle>Transaction Recovery</DialogTitle>
                    <DialogDescription>
                        Check and retry a missing or failed swap transaction by verifying the details below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                        <div className='flex flex-col space-y-2'>
                            <FormField
                                control={form.control}
                                name='from_token'
                                render={({ field }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel>From Token</FormLabel>
                                        <FormControl>
                                            <div>
                                                <Button
                                                    type='button'
                                                    variant='outline'
                                                    className={cn('border-2 dark:border-[#B4B3B3] rounded z-10 w-full flex justify-between', !field.value && 'text-muted-foreground')}
                                                    onClick={() => setFromTokenDialogOpen(true)}
                                                >
                                                    {field.value
                                                        ? (() => {
                                                            const token = supportedToken.find((t) => t.token_id === field.value);
                                                            return token ?
                                                                <div className='flex flex-row space-x-2 items-center'>
                                                                    <Image src={selectedFromTokenImg} alt='From' height={25} className='pr-1' />
                                                                    {token.label} (on {token.chain})
                                                                </div>
                                                                : 'Select token';
                                                        })()
                                                        : 'Select token'}
                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                </Button>
                                                <Dialog open={fromTokenDialogOpen} onOpenChange={handleFromTokenDialogOpen}>
                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                        <DialogHeader>
                                                            <DialogTitle>Select From Token</DialogTitle>
                                                        </DialogHeader>
                                                        <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-wrap gap-2'>
                                                            {supportedChains.map((chain) => (
                                                                <TooltipProvider key={chain.id}>
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <motion.div
                                                                                className={cn(
                                                                                    'h-12 w-12 p-2 flex items-center justify-center dark:border-white border-2 rounded-lg cursor-pointer',
                                                                                    fromTokenChainFilter === chain.id
                                                                                        ? 'bg-primary text-primary-foreground'
                                                                                        : 'bg-background'
                                                                                )}
                                                                                onClick={() => setFromTokenChainFilter(chain.id)}
                                                                                variants={listItemVariants}>
                                                                                {chain.logo != null ?
                                                                                    <Image src={chain.logo} alt={chain.name} width={30} height={30} /> : <>{chain.name}</>
                                                                                }
                                                                            </motion.div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className='text-center'>
                                                                            {chain.name}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ))}
                                                        </motion.div>
                                                        <Input
                                                            placeholder='Search tokens by address or token name'
                                                            value={fromTokenSearch}
                                                            onChange={(e) => setFromTokenSearch(e.target.value)}
                                                            className='dark:border-white'
                                                        />
                                                        <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-col space-y-2 max-h-60 overflow-y-auto'>
                                                            {filteredFromTokens.length === 0 ? (
                                                                <motion.div variants={listItemVariants} className='text-center text-gray-500 py-4'>No token found.</motion.div>
                                                            ) : (
                                                                filteredFromTokens.map((token) => (
                                                                    <motion.div key={token.token_id} variants={listItemVariants}>
                                                                        <Button
                                                                            variant='ghost'
                                                                            className='flex flex-row items-center justify-between py-6 w-full'
                                                                            onClick={() => {
                                                                                field.onChange(token.token_id);
                                                                                setFromTokenDialogOpen(false);
                                                                                setFromTokenSearch('');
                                                                            }}
                                                                        >
                                                                            <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                <div className='hidden md:block'>
                                                                                    <Image src={token.img} alt={token.label} height={35} />
                                                                                </div>
                                                                                <div className='flex flex-col items-start tracking-wide'>
                                                                                    <div>{token.label} (on {token.chain})</div>
                                                                                    <div>{formatAddress(token.address)}</div>
                                                                                </div>
                                                                            </div>

                                                                            <Badge variant='outline' className='hidden md:block'>
                                                                                {token.token_type}
                                                                            </Badge>
                                                                        </Button>
                                                                    </motion.div>
                                                                ))
                                                            )}
                                                        </motion.div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </FormControl>
                                        <FormDescription>Select the token you originally sent for the swap</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='to_token'
                                render={({ field }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel>To Token</FormLabel>
                                        <FormControl>
                                            <div>
                                                <Button
                                                    type='button'
                                                    variant='outline'
                                                    className={cn('border-2 dark:border-[#B4B3B3] rounded z-10 w-full flex justify-between', !field.value && 'text-muted-foreground')}
                                                    onClick={() => setToTokenDialogOpen(true)}
                                                >
                                                    {field.value
                                                        ? (() => {
                                                            const token = supportedToken.find((t) => t.token_id === field.value);
                                                            return token ?
                                                                <div className='flex flex-row space-x-2 items-center'>
                                                                    <Image src={selectedToTokenImg} alt='To' height={25} className='pr-1' />
                                                                    {token.label} (on {token.chain})
                                                                </div>
                                                                : 'Select token';
                                                        })()
                                                        : 'Select token'}
                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                </Button>
                                                <Dialog open={toTokenDialogOpen} onOpenChange={handleToTokenDialogOpen}>
                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                        <DialogHeader>
                                                            <DialogTitle>Select To Token</DialogTitle>
                                                        </DialogHeader>
                                                        <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-wrap gap-2'>
                                                            {supportedChains.map((chain) => (
                                                                <TooltipProvider key={chain.id}>
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <motion.div
                                                                                className={cn(
                                                                                    'h-12 w-12 p-2 flex items-center justify-center dark:border-white border-2 rounded-lg cursor-pointer',
                                                                                    toTokenChainFilter === chain.id
                                                                                        ? 'bg-primary text-primary-foreground'
                                                                                        : 'bg-background'
                                                                                )}
                                                                                onClick={() => setToTokenChainFilter(chain.id)}
                                                                                variants={listItemVariants}>
                                                                                {chain.logo != null ?
                                                                                    <Image src={chain.logo} alt={chain.name} width={30} height={30} /> : <>{chain.name}</>
                                                                                }
                                                                            </motion.div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className='text-center'>
                                                                            {chain.name}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ))}
                                                        </motion.div>
                                                        <Input
                                                            placeholder='Search tokens by address or token name'
                                                            value={toTokenSearch}
                                                            onChange={(e) => setToTokenSearch(e.target.value)}
                                                            className='dark:border-white'
                                                        />
                                                        <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-col space-y-2 max-h-60 overflow-y-auto'>
                                                            {filteredToTokens.length === 0 ? (
                                                                <motion.div variants={listItemVariants} className='text-center text-gray-500 py-4'>No token found.</motion.div>
                                                            ) : (
                                                                filteredToTokens.map((token) => (
                                                                    <motion.div key={token.token_id} variants={listItemVariants}>
                                                                        <Button
                                                                            variant='ghost'
                                                                            className='flex flex-row items-center justify-between py-6 w-full'
                                                                            onClick={() => {
                                                                                field.onChange(token.token_id);
                                                                                setToTokenDialogOpen(false);
                                                                                setToTokenSearch('');
                                                                            }}
                                                                        >
                                                                            <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                <div className='hidden md:block'>
                                                                                    <Image src={token.img} alt={token.label} height={35} />
                                                                                </div>
                                                                                <div className='flex flex-col items-start tracking-wide'>
                                                                                    <div>{token.label} (on {token.chain})</div>
                                                                                    <div>{formatAddress(token.address)}</div>
                                                                                </div>
                                                                            </div>

                                                                            <Badge variant='outline' className='hidden md:block'>
                                                                                {token.token_type}
                                                                            </Badge>
                                                                        </Button>
                                                                    </motion.div>
                                                                ))
                                                            )}
                                                        </motion.div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </FormControl>
                                        <FormDescription>Choose the token you intended to receive in the swap</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='trx_hash'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transaction Hash</FormLabel>
                                        <FormControl>
                                            <Input className='dark:border-white' placeholder='Enter transaction hash' {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Enter the transaction hash (Tx ID) of your inbound transfer
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className='pt-4'>
                            <Button className='w-full' disabled={verifyDisabledConditions}>
                                {verifying && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getVerifyMessage()}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
