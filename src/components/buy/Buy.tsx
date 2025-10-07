import React, { useState, useMemo, useCallback, useEffect } from 'react'
import * as z from 'zod'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useProgram } from '@/context/SOLSwapProgramContextProvider'
import { useProgram as privyUseProgram } from '@/context/PrivySwapProgramContextProvider'
import { usePrivy } from '@privy-io/react-auth'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatAddress, formatAmount } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronsUpDown, Loader2, Info, Settings, Wallet, MoveLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentTokenbuyICP, bit10TokenbuyICP, fetchICPTokenBalance, buyICPBIT10Token } from './icp/ICPBuyModule'
import { paymentTokenSOLDevnet, bit10TokenbuySOLDevnet, fetchSOLDevnetTokenBalance, buySOLDevnetBIT10Token } from './sol_dev/SolDevBuyModule'
import { paymentTokenETHSepolia, bit10TokenbuyETHSepolia, fetchSepoliaTokenBalance, buySepoliaBIT10Token } from './eth_sepolia/ETHSepoliaBuyModule'
import { paymentTokenPrivy, bit10TokenbuyPrivy, fetchPrivyTokenBalance, buyPrivyBIT10Token } from './privy/PrivyBuyModule'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
};

const bit10Amount = [
    '1',
    '2',
    '3',
    '4',
    '5'
]

const FormSchema = z.object({
    slippage: z
        .preprocess(
            (val) => (val === '' ? undefined : Number(val)),
            z
                .number()
                .min(1, { message: 'Slippage must be greater than or equal to 1' })
                .max(12, { message: 'Slippage must be less than or equal to 12' })
        ),
    payment_token: z.string({
        required_error: 'Please select a payment token',
    }),
    receive_amount: z.string({
        required_error: 'Please select the number of BIT10 tokens to receive',
    }),
    receive_token: z.string({
        required_error: 'Please select the BIT10 token to receive',
    })
});

export default function Buy() {
    const [buying, setBuying] = useState<boolean>(false);
    const [slippageDialogOpen, setSlippageDialogOpen] = useState(false);
    const [paymentTokenDialogOpen, setPaymentTokenDialogOpen] = useState(false);
    const [paymentTokenSearch, setPaymentTokenSearch] = useState('');
    const [payingTokenAddress, setPayingTokenAddress] = useState<string>('');
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState(false);
    const [receiveTokenSearch, setReceiveTokenSearch] = useState('');

    const { chain } = useChain();
    const { icpAddress } = useICPWallet();
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { publicKey } = useWallet();
    const wallet = useWallet();
    const { program, tokenMint } = useProgram();
    const { program: privyProgram, tokenMint: privyTokenMint } = privyUseProgram();
    const { connection } = useConnection();
    const { user } = usePrivy();

    const fetchBIT10Price = useCallback(async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        const data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> };
        return data.tokenPrice ?? 0;
    }, []);

    const bit10PriceQueries = useQueries({
        queries: [
            // ToDo: Remove this later
            {
                queryKey: ['bit10DEFITokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-defi'),
                refetchInterval: 1800000,
            },
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-top'),
                refetchInterval: 1800000,
            },
            {
                queryKey: ['bit10MEMETokenPrice'],
                queryFn: () => fetchBIT10Price('test-bit10-latest-price-meme'),
                refetchInterval: 1800000,
            }
        ],
    });

    const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);
    const bit10TOPPrice = useMemo(() => bit10PriceQueries[1].data, [bit10PriceQueries]);
    const bit10MEMEPrice = useMemo(() => bit10PriceQueries[2].data, [bit10PriceQueries]);

    const fetchPayWithPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as BuyingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const payWithPriceQueries = useQueries({
        queries: [
            {
                queryKey: ['btcPrice'],
                queryFn: () => fetchPayWithPrice('BTC'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['solPrice'],
                queryFn: () => fetchPayWithPrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['ethPrice'],
                queryFn: () => fetchPayWithPrice('ETH'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['usdcPrice'],
                queryFn: () => fetchPayWithPrice('USDC'),
                refetchInterval: 30000, // 30 sec.
            },
        ],
    });

    const bit10BTCAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
    const solAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);
    const ethAmount = useMemo(() => payWithPriceQueries[2].data, [payWithPriceQueries]);
    const usdcAmount = useMemo(() => payWithPriceQueries[3].data, [payWithPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            slippage: 3,
            payment_token: 'BIT10.BTC',
            receive_amount: '1',
            receive_token: 'Test BIT10.TOP'
        },
    });

    const selectedBIT10TokenPrice = useMemo(() => {
        const receiveToken = form.watch('receive_token');
        if (receiveToken === 'Test BIT10.TOP') {
            return Number(bit10TOPPrice) || 0;
        } else if (receiveToken === 'Test BIT10.MEME') {
            return Number(bit10MEMEPrice) || 0;
        } else if (receiveToken === 'Test BIT10.DEFI') {
            return Number(bit10DEFIPrice) || 0;
        }
        return 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('receive_token'), bit10TOPPrice, bit10MEMEPrice, bit10DEFIPrice]);

    const payingTokenPrice = useMemo(() => {
        if (!chain) return bit10BTCAmount;

        // ICP
        if (chain === 'icp') {
            if (payingTokenAddress === 'eegan-kqaaa-aaaap-qhmgq-cai') {
                return bit10BTCAmount ?? '0';
            }
        }

        // Ethereum Sepolia
        if (chain === 'eth_sepolia') {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000e') {
                return ethAmount ?? '0';
            } else if (payingTokenAddress === '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') {
                return usdcAmount ?? '0';
            }
        }

        // BSC Testnet
        if (chain === 'bsc_testnet') {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000e') {
                return ethAmount ?? '0';
            } else if (payingTokenAddress === '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') {
                return usdcAmount ?? '0';
            }
        }

        // Solana Devent
        if (chain === 'sol_dev' || chain === 'privy') {
            if (payingTokenAddress === 'So11111111111111111111111111111111111111111') {
                return solAmount ?? '0';
            }
        }

        return '0';
    }, [chain, payingTokenAddress, bit10BTCAmount, ethAmount, usdcAmount, solAmount]);

    const fromBalanceQueries = useQueries({
        queries: [
            // For ICP
            {
                queryKey: ['paymentTokenBalanceBIT10BTC', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance(payingTokenAddress, icpAddress);
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 10000, // 10 seconds
            },
            // For Solana Devent
            {
                queryKey: ['paymentTokenBalanceSOL', address, payingTokenAddress, chain],
                queryFn: () => {
                    if (!publicKey || chain !== 'sol_dev' || !payingTokenAddress) return '0';
                    return fetchSOLDevnetTokenBalance('So11111111111111111111111111111111111111111', publicKey, connection);
                },
                enabled: !!publicKey && chain === 'sol_dev' && !!payingTokenAddress,
                refetchInterval: 10000, // 10 seconds
            },
            // For Ethereum Sepolia
            {
                queryKey: ['paymentTokenBalanceETH', address, payingTokenAddress, chain],
                queryFn: () => {
                    if (!address || chain !== 'eth_sepolia' || !payingTokenAddress) return '0';
                    return fetchSepoliaTokenBalance('0x0000000000000000000000000000000000000000e', address, publicClient);
                },
                enabled: !!address && chain === 'eth_sepolia' && !!payingTokenAddress,
                refetchInterval: 10000, // 10 seconds
            },
            {
                queryKey: ['paymentTokenBalanceUSDC', address, payingTokenAddress, chain],
                queryFn: () => {
                    if (!address || chain !== 'eth_sepolia' || !payingTokenAddress) return '0';
                    return fetchSepoliaTokenBalance('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', address, publicClient);
                },
                enabled: !!address && chain === 'eth_sepolia' && !!payingTokenAddress,
                refetchInterval: 10000, // 10 seconds
            },
            // For Privy
            {
                queryKey: ['paymentTokenBalanceSOLPrivy', address, payingTokenAddress, chain],
                queryFn: () => {
                    if (!user || chain !== 'privy' || !payingTokenAddress) return '0';
                    return fetchPrivyTokenBalance('So11111111111111111111111111111111111111111', user, connection);
                },
                enabled: !!user && chain === 'privy' && !!payingTokenAddress,
                refetchInterval: 10000, // 10 seconds
            },
        ],
    });

    const payingTokenBalance = useMemo(() => {
        if (payingTokenAddress == 'eegan-kqaaa-aaaap-qhmgq-cai') {
            return fromBalanceQueries[0].data;
        } else if (payingTokenAddress == 'So11111111111111111111111111111111111111111' && chain == 'sol_dev') {
            return fromBalanceQueries[1].data;
        } else if (payingTokenAddress == '0x0000000000000000000000000000000000000000e') {
            return fromBalanceQueries[2].data;
        } else if (payingTokenAddress == '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') {
            return fromBalanceQueries[3].data;
        } else if (payingTokenAddress == 'So11111111111111111111111111111111111111111' && chain == 'privy') {
            return fromBalanceQueries[4].data;
        }
        return '0';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromBalanceQueries, payingTokenAddress, chain]);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const fromAmount = Number((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.03);
    const balance = Number(payingTokenBalance);

    const buyDisabledConditions = !chain || buying || fromAmount >= balance || fromAmount >= balance * 1.01 || fromAmount <= 0 || Number(form.watch('receive_amount')) <= 0 || chain == 'bsc_testnet';

    const getBuyMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        if (fromAmount >= balance || fromAmount >= balance * 1.01 && !buying) return 'Your balance is too low for this transaction';
        // ToDo: Temp, remove this when supported
        if (chain == 'bsc_testnet') return 'Buying BIT10 is coming soon on BSC Testnet';
        if (fromAmount <= 0 || Number(form.watch('receive_amount')) <= 0) return 'Amount too low';
        if (buying) return 'Buying...';
        return 'Buy';
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setBuying(true);
            if (chain == 'icp') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyICPBIT10Token(values.payment_token, values.receive_token, Number(values.receive_amount), Number((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice)), icpAddress);
            } else if (chain == 'sol_dev') {
                await buySOLDevnetBIT10Token(values.payment_token, values.receive_token, Number(values.receive_amount), program, tokenMint, wallet);
            }
            else if (chain == 'eth_sepolia') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buySepoliaBIT10Token(values.payment_token, Number((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice)), values.receive_token, Number(values.receive_amount), address, walletClient);
            } else if (chain == 'privy') {
                await buyPrivyBIT10Token(values.payment_token, values.receive_token, Number(values.receive_amount), privyProgram, privyTokenMint, user);
            }
            setBuying(false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setBuying(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setBuying(false);
        }
    };

    const paymentToken = useMemo(() => {
        if (chain === 'icp') {
            return paymentTokenbuyICP;
        } else if (chain === 'sol_dev') {
            return paymentTokenSOLDevnet;
        } else if (chain === 'eth_sepolia') {
            return paymentTokenETHSepolia;
        } else if (chain === 'bsc_testnet') {
            return paymentTokenETHSepolia;
        } else if (chain === 'privy') {
            return paymentTokenPrivy;
        } else {
            return paymentTokenbuyICP;
        }
    }, [chain]);

    const bit10Token = useMemo(() => {
        if (chain === 'icp') {
            return bit10TokenbuyICP;
        } else if (chain === 'sol_dev') {
            return bit10TokenbuySOLDevnet;
        } else if (chain === 'eth_sepolia') {
            return bit10TokenbuyETHSepolia;
        } else if (chain === 'bsc_testnet') {
            return bit10TokenbuyETHSepolia;
        } else if (chain === 'privy') {
            return bit10TokenbuyPrivy;
        } else {
            return bit10TokenbuyICP;
        }
    }, [chain]);

    const filteredPaymentTokens = useMemo(() => {
        const query = paymentTokenSearch.toLowerCase();
        return paymentToken.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query) ||
            token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentTokenSearch, chain]);

    const filteredReceiveTokens = useMemo(() => {
        const query = receiveTokenSearch.toLowerCase();
        return bit10Token.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveTokenSearch, chain]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payingTokenImg = useMemo(() => {
        const currentToken = form.watch('payment_token');
        const token = paymentToken.find(t => t.value === currentToken);
        return token?.img ?? BIT10Img as StaticImageData;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('payment_token'), paymentToken]);

    useEffect(() => {
        if (paymentToken.length > 0) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            form.setValue('payment_token', paymentToken[0].value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, paymentToken]);

    useEffect(() => {
        const currentToken = form.watch('payment_token');
        const token = paymentToken.find(t => t.value === currentToken);
        if (token) {
            setPayingTokenAddress(token.address);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('payment_token'), paymentToken]);

    return (
        <div className='flex flex-col items-center justify-center py-4'>
            <Card className='w-[300px] md:w-[580px] animate-fade-bottom-up rounded-lg bg-transparent'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Buy BIT10</div>
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
                                <div className='py-2 px-6 rounded-lg'>
                                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:justify-between md:items-center'>
                                        <div>Pay with</div>
                                        <div className='flex flex-row space-x-1 items-center'>
                                            <Wallet size={16} />
                                            <p>{formatAmount(Number(payingTokenBalance))}</p>
                                        </div>
                                    </div>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <div className='text-4xl text-center md:text-start'>
                                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                            {/* @ts-expect-error */}
                                            {selectedBIT10TokenPrice ? formatAmount((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01) : '0'}
                                        </div>

                                        <div className='grid grid-cols-5 items-center'>
                                            <FormField
                                                control={form.control}
                                                name='payment_token'
                                                render={({ field }) => (
                                                    <FormItem className='w-full px-2 col-span-4'>
                                                        <FormControl>
                                                            <div>
                                                                <Button
                                                                    type='button'
                                                                    variant='outline'
                                                                    className={cn('py-5 pl-4 pr-6 mr-8 border-2 dark:border-[#B4B3B3] rounded-l-full z-10 w-full flex justify-between', !field.value && 'text-muted-foreground')}
                                                                    onClick={() => setPaymentTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? paymentToken.find((t) => t.value === field.value)?.label
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={paymentTokenDialogOpen} onOpenChange={setPaymentTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select Payment Token</DialogTitle>
                                                                        </DialogHeader>
                                                                        <Input
                                                                            placeholder='Search tokens'
                                                                            value={paymentTokenSearch}
                                                                            onChange={(e) => setPaymentTokenSearch(e.target.value)}
                                                                            className='dark:border-white'
                                                                        />
                                                                        <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                            {filteredPaymentTokens.length === 0 ? (
                                                                                <div className='text-center text-gray-500 py-4'>No token found.</div>
                                                                            ) : (
                                                                                filteredPaymentTokens.map((token) => (
                                                                                    <Button
                                                                                        key={token.value}
                                                                                        variant='ghost'
                                                                                        className='flex flex-row items-center justify-between py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setPaymentTokenDialogOpen(false);
                                                                                            setPaymentTokenSearch('');
                                                                                        }}
                                                                                    >
                                                                                        <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                            <div className='hidden md:block'>
                                                                                                <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                            </div>
                                                                                            <div className='flex flex-col items-start tracking-wide'>
                                                                                                <div>{token.label}</div>
                                                                                                <div>{formatAddress(token.address)}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Badge variant='outline'>{token.tokenType}</Badge>
                                                                                        </div>
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

                                            <div className='col-span-1 -ml-6 z-20 border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                <Image src={payingTokenImg} alt={form.watch('payment_token')} width={75} height={75} className='z-20' />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <div className='flex flex-row space-x-1'>
                                                        $ {selectedBIT10TokenPrice ? formatAmount((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(4))) * 1.01) : '0'}
                                                        <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                    Price in {form.watch('payment_token')} + 1% Management fee <br />
                                                    $ {formatAmount(parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? 'N/A'))} + $ {formatAmount(0.01 * (parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0')))} = $ {formatAmount((parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0')) + (0.01 * (parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0'))))}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div>
                                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                            {/* @ts-expect-error */}
                                            1 {form.watch('payment_token')} = $ {formatAmount(parseFloat(payingTokenPrice))}
                                        </div>
                                    </div>
                                </div>

                                <div className='py-2 px-6'>
                                    <p>Receive</p>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <div className='w-full md:w-3/4'>
                                            <FormField
                                                control={form.control}
                                                name='receive_amount'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className='dark:border-white'>
                                                                    <SelectValue placeholder='Select number of tokens' />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {bit10Amount.map((number) => (
                                                                    <SelectItem key={number} value={number}>
                                                                        {number}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className='grid grid-cols-5 items-center'>
                                            <FormField
                                                control={form.control}
                                                name='receive_token'
                                                render={({ field }) => (
                                                    <FormItem className='w-full px-2 col-span-4'>
                                                        <FormControl>
                                                            <div>
                                                                <Button
                                                                    type='button'
                                                                    variant='outline'
                                                                    className={cn('py-5 pl-4 pr-6 mr-8 border-2 dark:border-[#B4B3B3] rounded-l-full z-10 w-full flex justify-between', !field.value && 'text-muted-foreground')}
                                                                    onClick={() => setReceiveTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? bit10Token.find((t) => t.value === field.value)?.label
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={receiveTokenDialogOpen} onOpenChange={setReceiveTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select Receive Token</DialogTitle>
                                                                        </DialogHeader>
                                                                        <Input
                                                                            placeholder='Search tokens'
                                                                            value={receiveTokenSearch}
                                                                            onChange={(e) => setReceiveTokenSearch(e.target.value)}
                                                                            className='dark:border-white'
                                                                        />
                                                                        <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                            {filteredReceiveTokens.length === 0 ? (
                                                                                <div className='text-center text-gray-500 py-4'>No token found.</div>
                                                                            ) : (
                                                                                filteredReceiveTokens.map((token) => (
                                                                                    <Button
                                                                                        key={token.value}
                                                                                        variant='ghost'
                                                                                        className='flex flex-row items-center justify-between py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setReceiveTokenDialogOpen(false);
                                                                                            setReceiveTokenSearch('');
                                                                                        }}
                                                                                    >
                                                                                        <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                            <div className='hidden md:block'>
                                                                                                <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                            </div>
                                                                                            <div className='flex flex-col items-start tracking-wide'>
                                                                                                <div>{token.label}</div>
                                                                                                <div>{formatAddress(token.address)}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Badge variant='outline'>{token.tokenType}</Badge>
                                                                                        </div>
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

                                            <div className='col-span-1 -ml-6 z-20 border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                                                <Image src={BIT10Img} alt='BIT10' width={75} height={75} className='z-20' />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <div>$ {formatAmount((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(4))))}</div>
                                        <div>
                                            1 {form.watch('receive_token')} = $ {formatAmount(selectedBIT10TokenPrice)}
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
                                            <div>{formatAmount(parseFloat(form.watch('receive_amount') || '0') * (1 - Number(form.watch('slippage') || 0) / 100))}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Management Fee</div>
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
                                                        The Management Fee covers the cost of managing and rebalancing the token
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Exchange Rate</div>
                                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                            {/* @ts-expect-error */}
                                            <div>1 {form.watch('payment_token')} = {selectedBIT10TokenPrice > 0 ? formatAmount(parseFloat(payingTokenPrice) / selectedBIT10TokenPrice) : '0'} {form.watch('receive_token')}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                            <div>Expected Output</div>
                                            <div>{formatAmount(parseFloat(form.watch('receive_amount')))} {form.watch('receive_token')}</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className='flex flex-row space-x-2 w-full items-center'>
                            <Button className='w-full rounded-lg' disabled={buyDisabledConditions}>
                                {buying && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getBuyMessage()}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}
