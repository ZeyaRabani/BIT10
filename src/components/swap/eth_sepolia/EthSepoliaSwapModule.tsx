import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import * as z from 'zod'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronsUpDown, Loader2, Info, Settings, MoveLeft, Wallet, ArrowUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { ERC20_ABI } from '@/lib/erc20Abi'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import Image, { type StaticImageData } from 'next/image'
import ETHImg from '@/assets/swap/eth.svg'
import USDCImg from '@/assets/swap/usdc.svg'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/dex.did'
import { newDEXSwap } from '@/actions/dbActions'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

interface TokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

const supportedToken = [
    {
        label: 'ETH',
        value: 'Ethereum',
        img: ETHImg as StaticImageData,
        address: '0x0000000000000000000000000000000000000000',
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
        slug: ['usdc']
    }
]

const supportedPools = [
    {
        pool_id: 'y0a4pk',
        token_a_symbol: 'ETH',
        token_a_chain: 'Ethereum',
        token_a_token_id: '1027',
        token_b_symbol: 'USDC',
        token_b_chain: 'Ethereum',
        token_b_token_id: '3408_1027',
        pair_type: 'Same-Chain',
    }
]

const FormSchema = z.object({
    slippage: z.preprocess(
        (val) => (val === '' ? undefined : Number(val)),
        z
            .number()
            .min(1, { message: 'Slippage must be greater than or equal to 1' })
            .max(12, { message: 'Slippage must be less than or equal to 12' })
    ),
    from_token: z.string({
        required_error: 'Please select a token',
    }),
    from_amount: z
        .preprocess((val) => (val === '' ? undefined : Number(val)), z.number())
        .refine((val) => /^\d+(\.\d{1,6})?$/.test(val.toString()), {
            message: 'Amount must be a number with up to 6 decimal places',
        }),
    to_token: z.string({
        required_error: 'Please select the token',
    }),
    to_amount: z
        .preprocess((val) => (val === '' ? undefined : Number(val)), z.number())
        .refine((val) => /^\d+(\.\d{1,6})?$/.test(val.toString()), {
            message: 'Amount must be a number with up to 6 decimal places',
        }),
});

export default function EthSepoliaSwapModule() {
    const [swaping, setSwaping] = useState<boolean>(false);
    const [slippageDialogOpen, setSlippageDialogOpen] = useState(false);
    const [fromTokenDialogOpen, setFromTokenDialogOpen] = useState(false);
    const [fromTokenSearch, setFromTokenSearch] = useState('');
    const [toTokenDialogOpen, setToTokenDialogOpen] = useState(false);
    const [toTokenSearch, setToTokenSearch] = useState('');
    const [lastUpdatedField, setLastUpdatedField] = useState<'from_amount' | 'to_amount'>('from_amount');

    const isUpdatingAmount = useRef(false);
    const lastFromAmount = useRef<number | undefined>(undefined);
    const lastToAmount = useRef<number | undefined>(undefined);

    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const fetchSepoliaTokenBalance = useCallback(async (tokenAddress: string) => {
        try {
            if (!address || !isConnected || !publicClient) {
                toast.error('Wallet not connected or public client not available');
                return '0';
            }

            if (tokenAddress === '0x0000000000000000000000000000000000000000') {
                const balance = await publicClient.getBalance({
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                    address: address as `0x${string}`,
                });

                const formattedBalance = formatUnits(balance, 18);
                return formattedBalance;
            }

            else if (tokenAddress === '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') {
                const decimals = await publicClient.readContract({
                    address: tokenAddress as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: 'decimals',
                });

                const balance = await publicClient.readContract({
                    address: tokenAddress as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [address],
                });

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                const formattedBalance = formatUnits(balance as bigint, decimals as number);
                return formattedBalance;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while fetching user wallet balance. Please try again!');
            return '0';
        }
    }, [address, isConnected, publicClient]);

    const fetchTokenPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as TokenPriceResponse;
        return data.data.amount;
    }, []);

    const payWithPriceQueries = useQueries({
        queries: [
            {
                queryKey: ['ethPrice'],
                queryFn: () => fetchTokenPrice('ETH'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['usdcPrice'],
                queryFn: () => fetchTokenPrice('USDC'),
                refetchInterval: 30000, // 30 sec.
            },
        ],
    });

    const ethAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
    const usdcAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);

    const fromBalanceQueries = useQueries({
        queries: [
            {
                queryKey: ['ethBalance'],
                queryFn: () => fetchSepoliaTokenBalance('0x0000000000000000000000000000000000000000'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['usdcBalance'],
                queryFn: () => fetchSepoliaTokenBalance('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
                refetchInterval: 30000, // 30 sec.
            },
        ],
    });

    const userETHBalance = useMemo(() => fromBalanceQueries[0].data, [fromBalanceQueries]);
    const userUSDCBalance = useMemo(() => fromBalanceQueries[1].data, [fromBalanceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            slippage: 3,
            from_token: 'Ethereum',
            from_amount: 0.0001,
            to_token: 'USD Coin',
            to_amount: 1
        },
    });

    const fromTokenUserBalance = (): string => {
        const bit10Token = form.watch('from_token');
        if (bit10Token === 'Ethereum') {
            return userETHBalance ?? '0';
        } else if (bit10Token === 'USD Coin') {
            return userUSDCBalance ?? '0';
        } else {
            return '0';
        }
    };

    const fromTokenBalance = fromTokenUserBalance();

    const getTokenPrice = useCallback((tokenValue: string) => {
        const token = supportedToken.find(t => t.value === tokenValue);
        if (!token) return 0;

        if (token.label === 'ETH') {
            return parseFloat(ethAmount ?? '0');
        } else if (token.label === 'USDC') {
            return parseFloat(usdcAmount ?? '0');
        }
        return 0;
    }, [ethAmount, usdcAmount]);

    const calculateAmount = useCallback((
        sourceField: 'from_amount' | 'to_amount',
        sourceValue: number,
        fromToken: string,
        toToken: string
    ) => {
        if (!sourceValue || !fromToken || !toToken || !ethAmount || !usdcAmount) return 0;

        const fromPrice = getTokenPrice(fromToken);
        const toPrice = getTokenPrice(toToken);

        if (fromPrice === 0 || toPrice === 0) return 0;

        if (sourceField === 'from_amount') {
            const toAmount = (sourceValue * fromPrice) / toPrice;
            return parseFloat(toAmount.toFixed(6));
        } else {
            const fromAmount = (sourceValue * toPrice) / fromPrice;
            return parseFloat(fromAmount.toFixed(6));
        }
    }, [getTokenPrice, ethAmount, usdcAmount]);

    const watchedValues = form.watch();

    useEffect(() => {
        const { from_amount, to_amount, from_token, to_token } = watchedValues;

        if (isUpdatingAmount.current) {
            isUpdatingAmount.current = false;
            return;
        }

        if (lastFromAmount.current !== from_amount || lastToAmount.current !== to_amount) {
            if (lastUpdatedField === 'from_amount' && from_amount && from_amount > 0) {
                const newToAmount = calculateAmount('from_amount', from_amount, from_token, to_token);
                if (newToAmount !== to_amount) {
                    isUpdatingAmount.current = true;
                    form.setValue('to_amount', newToAmount, { shouldValidate: false });
                }
            } else if (lastUpdatedField === 'to_amount' && to_amount && to_amount > 0) {
                const newFromAmount = calculateAmount('to_amount', to_amount, from_token, to_token);
                if (newFromAmount !== from_amount) {
                    isUpdatingAmount.current = true;
                    form.setValue('from_amount', newFromAmount, { shouldValidate: false });
                }
            }

            lastFromAmount.current = from_amount;
            lastToAmount.current = to_amount;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedValues.from_amount, watchedValues.to_amount, watchedValues.from_token, watchedValues.to_token,
        calculateAmount, lastUpdatedField, form]);

    useEffect(() => {
        if (ethAmount && usdcAmount && watchedValues.from_amount && watchedValues.from_amount > 0) {
            const newToAmount = calculateAmount('from_amount', watchedValues.from_amount, watchedValues.from_token, watchedValues.to_token);
            if (newToAmount !== watchedValues.to_amount) {
                isUpdatingAmount.current = true;
                form.setValue('to_amount', newToAmount, { shouldValidate: false });
            }
        }
    }, [ethAmount, usdcAmount, watchedValues.from_amount, watchedValues.from_token, watchedValues.to_token,
        watchedValues.to_amount, calculateAmount, form]);

    const formatTokenAmount = (value: number | null | undefined): string => {
        if (value === null || value === undefined || isNaN(value)) return '0';
        if (value === 0) return '0';
        const strValue = value.toFixed(10).replace(/\.?0+$/, '');
        const [integerPart, decimalPart = ''] = strValue.split('.');
        const formattedInteger = Number(integerPart).toLocaleString();

        if (!decimalPart) return formattedInteger || '0';

        const firstNonZeroIndex = decimalPart.search(/[1-9]/);

        if (firstNonZeroIndex === -1) return formattedInteger || '0';

        const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);

        return `${formattedInteger}.${trimmedDecimal}`;
    };

    const filteredFromTokens = useMemo(() => {
        const query = fromTokenSearch.toLowerCase();
        return supportedToken.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query) ||
            token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
        );
    }, [fromTokenSearch]);

    const filteredToTokens = useMemo(() => {
        const query = toTokenSearch.toLowerCase();
        return supportedToken.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
    }, [toTokenSearch]);

    const formatAddress = (id: string) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 9)}.....${id.slice(-9)}`;
    };

    const selectedFromToken = useMemo(() => {
        const fromTokenValue = form.watch('from_token');
        return supportedToken.find(token => token.value === fromTokenValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_token')]);

    const selectedToToken = useMemo(() => {
        const toTokenValue = form.watch('to_token');
        return supportedToken.find(token => token.value === toTokenValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('to_token')]);

    const getTokenAmount = (tokenLabel?: string): string => {
        switch (tokenLabel) {
            case 'ETH':
                return ethAmount ?? '0';
            case 'USDC':
                return usdcAmount ?? '0';
            default:
                return '0';
        }
    };

    const selectedFromTokenPrice = getTokenAmount(selectedFromToken?.label);
    const selectedToTokenPrice = getTokenAmount(selectedToToken?.label);

    const getTokenImg = (tokenLabel?: string): StaticImageData => {
        switch (tokenLabel) {
            case 'ETH':
                return ETHImg as StaticImageData;
            case 'USDC':
                return USDCImg as StaticImageData;
            default:
                return ETHImg as StaticImageData;
        }
    };

    const selectedFromTokenImg = getTokenImg(selectedFromToken?.label);
    const selectedToTokenImg = getTokenImg(selectedToToken?.label);

    const getTokenChainImg = (tokenChain?: string): StaticImageData => {
        switch (tokenChain) {
            case 'Ethereum':
                return ETHImg as StaticImageData;
            default:
                return ETHImg as StaticImageData;
        }
    };

    const selectedFromTokenChainImg = getTokenChainImg(selectedFromToken?.chain);
    const selectedToTokenChainImg = getTokenChainImg(selectedToToken?.chain);

    const matchingPool = useMemo(() => {
        if (!selectedFromToken || !selectedToToken) return null;

        return supportedPools.find(pool =>
            (pool.token_a_token_id === selectedFromToken.token_id &&
                pool.token_b_token_id === selectedToToken.token_id) ||
            (pool.token_a_token_id === selectedToToken.token_id &&
                pool.token_b_token_id === selectedFromToken.token_id)
        ) ?? null;
    }, [selectedFromToken, selectedToToken]);

    const swapDisabledConditions = !isConnected || swaping || selectedFromToken?.token_id === selectedToToken?.token_id || !matchingPool || form.watch('from_amount') > Number(fromTokenBalance) || form.watch('from_amount') >= (Number(fromTokenBalance) * 1.01);

    const getSwapMessage = (): string => {
        const fromAmount = Number(form.watch('from_amount') || 0);
        const balance = Number(fromTokenBalance || 0);

        if (fromAmount >= balance || fromAmount >= balance * 1.01 && !swaping) {
            return 'Your balance is too low for this transaction';
        }
        if (selectedFromToken?.token_id === selectedToToken?.token_id) {
            return 'Same pair cannot be swapped';
        }
        if (!matchingPool) {
            return 'Pool not found for selected pair';
        }
        if (swaping) {
            return 'Swapping...';
        }
        return 'Swap';
    };

    const handleReverseTokens = () => {
        const currentFromToken = form.getValues('from_token');
        const currentToToken = form.getValues('to_token');
        const currentFromAmount = form.getValues('from_amount');
        const currentToAmount = form.getValues('to_amount');

        form.setValue('from_token', currentToToken);
        form.setValue('to_token', currentFromToken);

        form.setValue('from_amount', currentToAmount);
        form.setValue('to_amount', currentFromAmount);

        setLastUpdatedField('from_amount');
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSwaping(true);

            if (isConnected && matchingPool) {
                const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
                const canisterId = 't2vfi-5aaaa-aaaap-qqbfa-cai';

                const agent = new HttpAgent({ host });
                const actor = Actor.createActor(idlFactory, {
                    agent,
                    canisterId,
                });

                const fromToken = supportedToken.find(t => t.value === values.from_token);
                const toToken = supportedToken.find(t => t.value === values.to_token);

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                const create_transaction = await actor.create_transaction({
                    pool_id: matchingPool.pool_id,
                    tick_in_wallet_address: address,
                    tick_out_wallet_address: address,
                    swap_type: matchingPool.pair_type,
                    source_chain: fromToken?.chain,
                    destination_chain: toToken?.chain,
                    token_in_address: fromToken?.address,
                    token_out_address: toToken?.address,
                    amount_in: (values.from_amount).toString(),
                    expected_amount_out: (values.to_amount).toString(),
                    slippage: (values.slippage).toString(),
                });

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                const txData = create_transaction.Ok.transaction_data;

                const transaction = {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    from: txData.from,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    to: txData.to,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    data: txData.data,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    value: txData.value,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    gasLimit: txData.gas_limit,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    maxPriorityFeePerGas: txData.max_priority_fee_per_gas,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    maxFeePerGas: txData.max_fee_per_gas,
                };

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                const txHash = await walletClient.sendTransaction(transaction);

                toast.info('Transaction sent! Waiting for confirmation...');

                // Wait for 10 sec.
                await new Promise(resolve => setTimeout(resolve, 10000));

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                const verifyAndSwap = await actor.verify_and_swap({
                    pool_id: matchingPool.pool_id,
                    transaction_hash: txHash
                });

                const result = await newDEXSwap({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    poolId: verifyAndSwap.Ok.Success.pool_id,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    amountIn: verifyAndSwap.Ok.Success.amount_in,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    amountOut: verifyAndSwap.Ok.Success.amount_out,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    sourceChain: verifyAndSwap.Ok.Success.source_chain,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    destinationChain: verifyAndSwap.Ok.Success.destination_chain,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    swapType: verifyAndSwap.Ok.Success.swap_type,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    tickInWalletAddress: verifyAndSwap.Ok.Success.tick_in_wallet_address,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    tickOutWalletAddress: verifyAndSwap.Ok.Success.tick_out_wallet_address,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    tokenInAddress: verifyAndSwap.Ok.Success.token_in_address,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    tokenOutAddress: verifyAndSwap.Ok.Success.token_out_address,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    slippage: verifyAndSwap.Ok.Success.slippage,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    status: verifyAndSwap.Ok.Success.status,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    txHashIn: verifyAndSwap.Ok.Success.tx_hash_in,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    txHashOut: verifyAndSwap.Ok.Success.tx_hash_out,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    timestamp: Number(verifyAndSwap.Ok.Success.timestamp),
                })

                if (result === 'DEX Swap was successful') {
                    toast.success('Token swap was successful!');
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }
            }
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            if (error.message.includes('insufficient')) {
                toast.error('Insufficient funds');
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            } else if (error.message.includes('user rejected')) {
                toast.error('User rejected the transaction');
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            } else if (error.message.includes('No consensus could be reached')) {
                toast.error('Network consensus issue. Please try again in a few moments.');
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            } else if (error.message.includes('Transaction receipt not found')) {
                toast.error('Transaction confirmation failed. Please check your transaction status manually.');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
        } finally {
            setSwaping(false);
        }
    }

    return (
        <div className='flex flex-col items-center justify-center py-4'>
            <Card className='w-[300px] md:w-[580px] animate-fade-bottom-up rounded-lg'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                                <div>
                                    <Dialog open={slippageDialogOpen} onOpenChange={async (open) => {
                                        if (!open) {
                                            const valid = await form.trigger('slippage');
                                            if (!valid) {
                                                setSlippageDialogOpen(true);
                                            } else {
                                                setSlippageDialogOpen(false);
                                            }
                                        } else {
                                            setSlippageDialogOpen(true);
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Settings size={24} className='cursor-pointer' />
                                        </DialogTrigger>
                                        <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                            <DialogHeader>
                                                <DialogTitle className='tracking-wide flex flex-row items-center'>
                                                    <button
                                                        type='button'
                                                        onClick={async () => {
                                                            const valid = await form.trigger('slippage');
                                                            if (valid) {
                                                                setSlippageDialogOpen(false);
                                                            }
                                                        }}
                                                        className='mr-2'
                                                    >
                                                        <MoveLeft size={24} className='cursor-pointer' />
                                                    </button>
                                                    Slippage
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Allowed price difference during a swap. Higher slippage = higher success, but worse rates.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className='flex items-center gap-2 border-t-2 pt-2'>
                                                <div className='grid flex-1 gap-2'>
                                                    Slippage tolerance
                                                    <FormField
                                                        control={form.control}
                                                        name='slippage'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-2'>
                                                                        <div className='w-full'>
                                                                            <div className='w-full relative'>
                                                                                <Input
                                                                                    type='number'
                                                                                    className='dark:border-white pr-8'
                                                                                    placeholder='Set slippage'
                                                                                    {...field}
                                                                                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                                                />
                                                                                <span className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>%</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className='flex flex-row space-x-2 mt-2'>
                                                                            {[1, 2, 3].map((suggestion) => (
                                                                                <Button
                                                                                    key={suggestion}
                                                                                    variant={Number(field.value) === suggestion ? 'default' : 'outline'}
                                                                                    className='dark:border-white'
                                                                                    onClick={async () => {
                                                                                        field.onChange(suggestion);
                                                                                        await form.trigger('slippage');
                                                                                    }}
                                                                                >
                                                                                    {suggestion}%
                                                                                </Button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='flex flex-col space-y-2'>
                            <div className='rounded-lg border-2'>
                                <div className='py-2 px-6 bg-muted rounded-lg'>
                                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:justify-between md:items-center'>
                                        <div>From</div>
                                        <div className='flex flex-row space-x-1 items-center'>
                                            <Wallet size={16} />
                                            <p>{formatTokenAmount(Number(fromTokenBalance))}</p>
                                        </div>
                                    </div>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <FormField
                                            control={form.control}
                                            name='from_amount'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            type='number'
                                                            className='dark:border-white pr-8'
                                                            placeholder='From Amount'
                                                            {...field}
                                                            onChange={(e) => {
                                                                setLastUpdatedField('from_amount');
                                                                field.onChange(e.target.value === '' ? '' : Number(e.target.value));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className='grid grid-cols-5 items-center'>
                                            <FormField
                                                control={form.control}
                                                name='from_token'
                                                render={({ field }) => (
                                                    <FormItem className='w-full px-2 col-span-4'>
                                                        <FormControl>
                                                            <div>
                                                                <Button
                                                                    type='button'
                                                                    variant='outline'
                                                                    className={cn('py-5 pl-4 pr-6 mr-8 border-2 dark:border-[#B4B3B3] rounded-l-full z-10 w-full flex justify-between', !field.value && 'text-muted-foreground')}
                                                                    onClick={() => setFromTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? supportedToken.find((t) => t.value === field.value)?.label
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={fromTokenDialogOpen} onOpenChange={setFromTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select From Token</DialogTitle>
                                                                        </DialogHeader>
                                                                        <Input
                                                                            placeholder='Search tokens'
                                                                            value={fromTokenSearch}
                                                                            onChange={(e) => setFromTokenSearch(e.target.value)}
                                                                            className='dark:border-white'
                                                                        />
                                                                        <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                            {filteredFromTokens.length === 0 ? (
                                                                                <div className='text-center text-gray-500 py-4'>No token found.</div>
                                                                            ) : (
                                                                                filteredFromTokens.map((token) => (
                                                                                    <Button
                                                                                        key={token.value}
                                                                                        variant='ghost'
                                                                                        className='flex flex-row items-center justify-between py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setFromTokenDialogOpen(false);
                                                                                            setFromTokenSearch('');
                                                                                        }}
                                                                                    >
                                                                                        <div className='flex flex-row items-center justify-start space-x-0.5'>
                                                                                            <div>
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
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className='col-span-1 -ml-6 z-20 grid place-items-center relative border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                <Image src={selectedFromTokenImg} alt='From' height={75} />
                                                <Image src={selectedFromTokenChainImg} alt='From Chain' height={25} className='absolute -bottom-2 right-0 border-2 border-[#B4B3B3] rounded-full bg-white' />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <div className='flex flex-row space-x-1'>
                                                        $ {selectedFromTokenPrice ? formatTokenAmount((Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice)) * 1.01) : '0'}
                                                        <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                    Price in {selectedFromToken?.label} + 1% Liquidity Provider fee <br />
                                                    $ {formatTokenAmount(Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice))} + $ {formatTokenAmount(0.01 * (Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice)))} = $ {formatTokenAmount((Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice)) + (0.01 * (Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice))))}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div>
                                            1 {selectedFromToken?.label} = $ {formatTokenAmount(Number(selectedFromTokenPrice))}
                                        </div>
                                    </div>
                                </div>

                                <div className='grid place-items-center z-[2]'>
                                    <Button type='button' variant='ghost' size='sm' className='rounded-full -mt-4 p-2 h-8 w-8 border-2 border-gray-300 hover:border-gray-400 group bg-background' onClick={handleReverseTokens} disabled={swaping}>
                                        <ArrowUpDown className='h-4 w-4 transition-transform duration-700 group-hover:rotate-[180deg]' />
                                    </Button>
                                </div>

                                <div className='py-2 px-6 -mt-4'>
                                    <p>To</p>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <FormField
                                            control={form.control}
                                            name='to_amount'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            type='number'
                                                            className='dark:border-white pr-8'
                                                            placeholder='To Amount'
                                                            {...field}
                                                            onChange={(e) => {
                                                                setLastUpdatedField('to_amount');
                                                                field.onChange(e.target.value === '' ? '' : Number(e.target.value));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className='grid grid-cols-5 items-center'>
                                            <FormField
                                                control={form.control}
                                                name='to_token'
                                                render={({ field }) => (
                                                    <FormItem className='w-full px-2 col-span-4'>
                                                        <FormControl>
                                                            <div>
                                                                <Button
                                                                    type='button'
                                                                    variant='outline'
                                                                    className={cn('py-5 pl-4 pr-6 mr-8 border-2 dark:border-[#B4B3B3] rounded-l-full z-10 w-full flex justify-between', !field.value && 'text-muted-foreground')}
                                                                    onClick={() => setToTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? supportedToken.find((t) => t.value === field.value)?.label
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={toTokenDialogOpen} onOpenChange={setToTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select To Token</DialogTitle>
                                                                        </DialogHeader>
                                                                        <Input
                                                                            placeholder='Search tokens'
                                                                            value={toTokenSearch}
                                                                            onChange={(e) => setToTokenSearch(e.target.value)}
                                                                            className='dark:border-white'
                                                                        />
                                                                        <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                            {filteredToTokens.length === 0 ? (
                                                                                <div className='text-center text-gray-500 py-4'>No token found.</div>
                                                                            ) : (
                                                                                filteredToTokens.map((token) => (
                                                                                    <Button
                                                                                        key={token.value}
                                                                                        variant='ghost'
                                                                                        className='flex flex-row items-center justify-between py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setToTokenDialogOpen(false);
                                                                                            setToTokenSearch('');
                                                                                        }}
                                                                                    >
                                                                                        <div className='flex flex-row items-center justify-start space-x-0.5'>
                                                                                            <div>
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
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className='col-span-1 -ml-6 z-20 grid place-items-center relative border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                <Image src={selectedToTokenImg} alt='To' height={75} />
                                                <Image src={selectedToTokenChainImg} alt='To Chain' height={25} className='absolute -bottom-2 right-0 border-2 border-[#B4B3B3] rounded-full bg-white' />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <div>$ {formatTokenAmount(Number(selectedToTokenPrice))}</div>
                                        <div>
                                            1 {selectedToToken?.label} = $ {formatTokenAmount(Number(selectedToTokenPrice))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Accordion type='single' collapsible>
                                <AccordionItem value='item-1' className='rounded-lg border-2 px-6'>
                                    <AccordionTrigger className='hover:no-underline'><p>Summary</p></AccordionTrigger>
                                    <AccordionContent className='flex flex-col space-y-1 border-t-2 pt-4 tracking-wide'>
                                        <div className='flex flex-row items-center justify-between space-x-2 text-sm'>
                                            <div>Slippage</div>
                                            <div className='flex flex-row space-x-1 items-center'>
                                                <div>{form.watch('slippage')}%</div>
                                                <div>
                                                    <Settings className='size-3 align-middle relative bottom-[1px]' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Minimum receive</div>
                                            <div>{formatTokenAmount((form.watch('to_amount') || 0) * (1 - Number(form.watch('slippage') || 0) / 100))} {form.watch('to_token')}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Liquidity Provider fee</div>
                                            <TooltipProvider>
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <div className='flex flex-row space-x-1 items-center'>
                                                            <div>1%</div>
                                                            <div>
                                                                <Info className='size-3 align-middle relative bottom-[1px]' />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                        A small fee paid to liquidity providers for facilitating token swaps
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Exchange Rate</div>
                                            <div>1 {form.watch('from_token')} = {Number(selectedToTokenPrice) > 0 ? formatTokenAmount(Number(selectedFromTokenPrice) / Number(selectedToTokenPrice)) : '0'} {form.watch('to_token')}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Expected Time</div>
                                            <div>2-3 min.</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                            <div>Expected Output</div>
                                            <div>{formatTokenAmount(Number(form.watch('to_amount')))} {form.watch('to_token')}</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                        </CardContent>
                        <CardFooter className='flex flex-col space-y-2 w-full items-center'>
                            {swaping && (
                                <motion.div
                                    className='text-center'
                                    initial={{ y: 5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                >
                                    Please keep this tab open until the swap is complete.
                                </motion.div>
                            )}

                            <Button className='w-full rounded-lg' disabled={swapDisabledConditions}>
                                {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getSwapMessage()}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}
