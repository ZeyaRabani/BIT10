import React, { useState, useMemo, useCallback, useEffect } from 'react'
import * as z from 'zod'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueries } from '@tanstack/react-query'
import { whitelistedAddress } from '@/actions/dbActions'
import { toast } from 'sonner'
import { formatAddress, formatAmount } from '@/lib/utils'
import { ChevronsUpDown, Loader2, Info, Wallet, ArrowUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buyPayTokensICP, buyReceiveTokensICP, fetchICPTokenBalance, buyICPBIT10Token } from './icp/ICPBuyModule'
import { buyPayTokensBase, buyReceiveTokensBase, fetchBaseTokenBalance, buyBaseBIT10Token } from './base/BaseBuyModule'
import { buyPayTokensSolana, buyReceiveTokensSolana, fetchSolanaTokenBalance, buySolanaBIT10Token } from './solana/SolanaBuyModule'
import { buyPayTokensBSC, buyReceiveTokensBSC, fetchBSCTokenBalance, buyBSCBIT10Token } from './bsc/BSCBuyModule'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface BuyModuleProps {
    onSwitchToSell: () => void;
}

interface WhitelistedPrincipal {
    userPrincipalId: string;
}

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
};

const bit10Amount = ['1', '2'];

const FormSchema = z.object({
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

export default function BuyModule({ onSwitchToSell }: BuyModuleProps) {
    const [buying, setBuying] = useState<boolean>(false);
    const [paymentTokenDialogOpen, setPaymentTokenDialogOpen] = useState(false);
    const [paymentTokenSearch, setPaymentTokenSearch] = useState('');
    const [payingTokenAddress, setPayingTokenAddress] = useState<string>('');
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState(false);
    const [receiveTokenSearch, setReceiveTokenSearch] = useState('');

    const { chain } = useChain();
    const { icpAddress } = useICPWallet();
    const { evmAddress } = useEVMWallet();

    const { publicKey } = useWallet();
    const wallet = useWallet();

    const fetchwhitelistedAddress = async () => {
        try {
            const result = await whitelistedAddress();
            return result;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while fetching whitelisted users. Please try again!');
            return [];
        }
    };

    const gatedMainnetAccess = useQueries({
        queries: [
            {
                queryKey: ['whitelistedUserPrincipalIds'],
                queryFn: () => fetchwhitelistedAddress(),
            }
        ],
    });

    const isLoading = gatedMainnetAccess.some(query => query.isLoading);
    const whitelistedPrincipal = gatedMainnetAccess[0]?.data ?? [];

    const userAddress = useMemo(() => {
        if (chain == 'icp') {
            return icpAddress;
        } else if (chain == 'base' || chain == 'bsc') {
            return evmAddress;
        } else if (chain == 'solana') {
            return wallet.publicKey?.toBase58();
        }
        return undefined;
    }, [icpAddress, evmAddress, wallet, chain]);

    const isApproved = (whitelistedPrincipal as WhitelistedPrincipal[]).some(
        (item) => item.userPrincipalId.toLocaleLowerCase() === userAddress?.toLocaleLowerCase()
    );

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
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-top'),
                refetchInterval: 1800000,
            }
        ],
    });

    const bit10TOPPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);

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
                queryKey: ['icpPrice'],
                queryFn: () => fetchPayWithPrice('ICP'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['btcPrice'],
                queryFn: () => fetchPayWithPrice('BTC'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['ethPrice'],
                queryFn: () => fetchPayWithPrice('ETH'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['solPrice'],
                queryFn: () => fetchPayWithPrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['bnbPrice'],
                queryFn: () => fetchPayWithPrice('BNB'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['usdcPrice'],
                queryFn: () => fetchPayWithPrice('USDC'),
                refetchInterval: 30000, // 30 sec.
            }
        ],
    });

    const icpAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
    const btcAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);
    const ethAmount = useMemo(() => payWithPriceQueries[2].data, [payWithPriceQueries]);
    const solAmount = useMemo(() => payWithPriceQueries[3].data, [payWithPriceQueries]);
    const bnbAmount = useMemo(() => payWithPriceQueries[4].data, [payWithPriceQueries]);
    const usdcAmount = useMemo(() => payWithPriceQueries[5].data, [payWithPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            payment_token: 'Ethereum',
            receive_amount: '1',
            receive_token: 'BIT10.TOP'
        },
    });

    const selectedBIT10TokenPrice = useMemo(() => {
        const receiveToken = form.watch('receive_token');
        if (receiveToken === 'BIT10.TOP') {
            return Number(bit10TOPPrice) || 0;
        }
        return 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('receive_token'), bit10TOPPrice]);

    const payingTokenPrice = useMemo(() => {
        // ICP
        if (chain === 'icp') {
            if (payingTokenAddress === 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
                return icpAmount ?? 0;
            } else if (payingTokenAddress === 'mxzaz-hqaaa-aaaar-qaada-cai') {
                return btcAmount ?? 0;
            } else if (payingTokenAddress === 'ss2fx-dyaaa-aaaar-qacoq-cai') {
                return ethAmount ?? 0;
            }
        }

        // Base
        if (chain === 'base' || chain === undefined) {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000b') {
                return ethAmount ?? 0;
            }
        }

        // Solana
        if (chain === 'solana' || chain === undefined) {
            if (payingTokenAddress === 'So11111111111111111111111111111111111111111') {
                return solAmount ?? 0;
            }
        }

        // BSC
        if (chain === 'bsc') {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000bnb') {
                return bnbAmount ?? 0;
            } else if (payingTokenAddress === '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d') {
                return usdcAmount ?? 0;
            }
        }

        return 0;
    }, [chain, payingTokenAddress, icpAmount, btcAmount, ethAmount, solAmount, bnbAmount, usdcAmount]);

    const fromBalanceQueries = useQueries({
        queries: [
            // For ICP
            {
                queryKey: ['paymentTokenBalanceICP', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceckBTC', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'mxzaz-hqaaa-aaaar-qaada-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceckETH', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'ss2fx-dyaaa-aaaar-qacoq-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },

            // For Base
            {
                queryKey: ['paymentTokenBalanceBaseETH', evmAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'base' || !payingTokenAddress) return '0';
                    return fetchBaseTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000b', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'base' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },

            // For Solana
            {
                queryKey: ['paymentTokenBalanceSolanaSOL', publicKey, payingTokenAddress, chain],
                queryFn: () => {
                    if (!publicKey || chain !== 'solana' || !payingTokenAddress) return '0';
                    return fetchSolanaTokenBalance({ tokenAddress: 'So11111111111111111111111111111111111111111', publicKey: publicKey });
                },
                enabled: !!publicKey && chain === 'solana' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },

            // For BSC
            {
                queryKey: ['paymentTokenBalanceBSCBNB', evmAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'bsc' || !payingTokenAddress) return '0';
                    return fetchBSCTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000bnb', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'bsc' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceBSCUSDC', evmAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'bsc' || !payingTokenAddress) return '0';
                    return fetchBSCTokenBalance({ tokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'bsc' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            }
        ],
    });

    const payingTokenBalance = useMemo(() => {
        if (payingTokenAddress == 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
            return fromBalanceQueries[0].data;
        } else if (payingTokenAddress == 'mxzaz-hqaaa-aaaar-qaada-cai') {
            return fromBalanceQueries[1].data;
        } else if (payingTokenAddress == 'ss2fx-dyaaa-aaaar-qacoq-cai') {
            return fromBalanceQueries[2].data;
        } else if (payingTokenAddress == '0x0000000000000000000000000000000000000000b') {
            return fromBalanceQueries[3].data;
        } else if (payingTokenAddress == 'So11111111111111111111111111111111111111111') {
            return fromBalanceQueries[4].data;
        } else if (payingTokenAddress == '0x0000000000000000000000000000000000000000bnb') {
            return fromBalanceQueries[5].data;
        } else if (payingTokenAddress == '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d') {
            return fromBalanceQueries[6].data;
        }
        return '0';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromBalanceQueries, payingTokenAddress, chain]);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const fromAmount = Number((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01);
    const balance = Number(payingTokenBalance);

    const buyDisabledConditions = !chain || !isApproved || buying || fromAmount >= balance || fromAmount >= balance * 1.01 || fromAmount <= 0 || Number(form.watch('receive_amount')) <= 0;

    const getBuyMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        if (!isApproved) return 'Access Restricted';
        if (buying) return 'Buying...';
        if (fromAmount >= balance || fromAmount >= balance * 1.01 && !buying) return 'Your balance is too low for this transaction';
        if (fromAmount <= 0 || Number(form.watch('receive_amount')) <= 0) return 'Amount too low';
        return 'Buy';
    };

    const currentPaymentTokens = useMemo(() => {
        if (chain === 'icp') {
            return buyPayTokensICP;
        } else if (chain === 'base') {
            return buyPayTokensBase;
        } else if (chain === 'solana') {
            return buyPayTokensSolana;
        } else if (chain === 'bsc') {
            return buyPayTokensBSC;
        } else {
            return buyPayTokensBase;
        }
    }, [chain]);

    const currentBIT10Tokens = useMemo(() => {
        if (chain === 'icp') {
            return buyReceiveTokensICP;
        } else if (chain === 'base') {
            return buyReceiveTokensBase;
        } else if (chain === 'solana') {
            return buyReceiveTokensSolana;
        } else if (chain === 'bsc') {
            return buyReceiveTokensBSC;
        } else {
            return buyReceiveTokensBase;
        }
    }, [chain]);

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setBuying(true);

            const selectedPaymentToken = currentPaymentTokens.find(
                (token) => token.value === values.payment_token
            );

            const selectedReceiveToken = currentBIT10Tokens.find(
                (token) => token.value === values.receive_token
            );

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (!selectedBIT10TokenPrice || !payingTokenPrice || isNaN(selectedBIT10TokenPrice) || isNaN(payingTokenPrice) || payingTokenPrice <= 0) {
                toast.error('Price data unavailable.');
                return;
            }

            const rawTokenInAmount = ((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01); // 1% Management fee
            const tokenInAmount = isNaN(rawTokenInAmount) ? 0 : Number(rawTokenInAmount);

            if (chain === 'icp') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyICPBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount, icpAddress: icpAddress! });
            } else if (chain === 'base') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyBaseBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount.toString(), baseAddress: evmAddress! });
            } else if (chain === 'solana') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                await buySolanaBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount.toString(), solanaAddress: wallet.publicKey?.toBase58(), wallet: wallet });
            } else if (chain === 'bsc') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyBSCBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount.toString(), bscAddress: evmAddress! });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setBuying(false);
        }
    }

    const filteredPaymentTokens = useMemo(() => {
        const query = paymentTokenSearch.toLowerCase();
        return currentPaymentTokens.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query) ||
            token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentTokenSearch, chain]);

    const filteredReceiveTokens = useMemo(() => {
        const query = receiveTokenSearch.toLowerCase();
        return currentBIT10Tokens.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveTokenSearch, chain]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payingTokenImg = useMemo(() => {
        const currentToken = form.watch('payment_token');
        const token = currentPaymentTokens.find(t => t.value === currentToken);
        return token?.img ?? BIT10Img as StaticImageData;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('payment_token'), currentPaymentTokens]);

    useEffect(() => {
        if (currentPaymentTokens.length > 0) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            form.setValue('payment_token', currentPaymentTokens[0].value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, currentPaymentTokens]);

    useEffect(() => {
        const currentToken = form.watch('payment_token');
        const token = currentPaymentTokens.find(t => t.value === currentToken);
        if (token) {
            setPayingTokenAddress(token.address);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('payment_token'), currentPaymentTokens]);

    return (
        <>
            {isLoading ? (
                <div className='flex flex-col space-y-4'>
                    <div className='bg-muted rounded-md w-full h-44'></div>
                    <div className='bg-muted rounded-md w-full h-44'></div>
                    <div className='bg-muted rounded-md w-full h-12'></div>
                    <div className='bg-muted rounded-md w-full h-12'></div>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                        <div className='flex flex-col space-y-2'>
                            <div className='bg-muted rounded-lg p-4'>
                                <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:justify-between md:items-center'>
                                    <div>You Pay</div>
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
                                                                    ? currentPaymentTokens.find((t) => t.value === field.value)?.label
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
                                                                                    className='flex flex-row items-center justify-between py-6 px-2'
                                                                                    onClick={() => {
                                                                                        field.onChange(token.value);
                                                                                        setPaymentTokenDialogOpen(false);
                                                                                        setPaymentTokenSearch('');
                                                                                    }}
                                                                                >
                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
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

                            <div className='grid place-items-center z-[2] my-6'>
                                <Button type='button' variant='ghost' size='sm' className='rounded-full p-2 h-8 w-8 border-2 border-gray-300 hover:border-gray-400 group bg-background' onClick={onSwitchToSell}>
                                    <ArrowUpDown className='h-4 w-4 transition-transform duration-700 group-hover:rotate-[180deg]' />
                                </Button>
                            </div>

                            <div className='bg-muted rounded-lg p-4'>
                                <p>You Receive</p>
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
                                                                    ? currentBIT10Tokens.find((t) => t.value === field.value)?.label
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
                                                                                    className='flex flex-row items-center justify-between py-6 px-2'
                                                                                    onClick={() => {
                                                                                        field.onChange(token.value);
                                                                                        setReceiveTokenDialogOpen(false);
                                                                                        setReceiveTokenSearch('');
                                                                                    }}
                                                                                >
                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
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
                            <AccordionItem value='item-1' className='rounded-lg border-2 my-2 border-none'>
                                <AccordionTrigger className='hover:no-underline'><p>Summary</p></AccordionTrigger>
                                <AccordionContent className='flex flex-col space-y-1 border-t-2 pt-4 tracking-wide'>
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
                                    <div className='flex flex-row items-center justify-between space-x-2'>
                                        <div>Expected Time</div>
                                        <div>1-2 min.</div>
                                    </div>
                                    <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                        <div>Expected Output</div>
                                        <div>{formatAmount(parseFloat(form.watch('receive_amount')))} {form.watch('receive_token')}</div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {chain && !isApproved &&
                            <div className='border-muted border flex flex-col items-center space-y-2 px-2 py-4 my-2 text-center'>
                                <div>The Buy BIT10 page is gated for mainnet access. Your Wallet Address needs to be approved first to use the Buy BIT10 feature.</div>
                                <div>For access, please contact <a href='https://x.com/bit10startup' className='text-primary underline'>@bit10startup</a> on Twitter/X.</div>
                            </div>
                        }

                        <div className='flex flex-row space-x-2 w-full items-center pt-3'>
                            <Button className='w-full rounded-lg' disabled={buyDisabledConditions}>
                                {buying && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getBuyMessage()}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </>
    )
}
