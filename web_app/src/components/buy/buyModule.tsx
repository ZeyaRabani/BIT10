import React, { useState, useMemo, useCallback, useEffect } from 'react'
import * as z from 'zod'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueries } from '@tanstack/react-query'
import { whitelistedAddress } from '@/actions/dbActions'
import { toast } from 'sonner'
import { formatAddress, formatCompactNumber, formatCompactPercentNumber } from '@/lib/utils'
import { ChevronsUpDown, Loader2, Info, ArrowUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buyPayTokensICP, buyReceiveTokensICP, fetchICPTokenBalance, buyICPBIT10Token } from './icp/ICPBuyModule'
import { buyPayTokensBase, buyReceiveTokensBase, fetchBaseTokenBalance, buyBaseBIT10Token } from './base/BaseBuyModule'
import { buyPayTokensSolana, buyReceiveTokensSolana, fetchSolanaTokenBalance, buySolanaBIT10Token } from './solana/SolanaBuyModule'
import { buyPayTokensBSC, buyReceiveTokensBSC, fetchBSCTokenBalance, buyBSCBIT10Token } from './bsc/BSCBuyModule'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import TokenDetails from './tokenDetails'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image, { type StaticImageData } from 'next/image'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion } from 'framer-motion'

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

const FormSchema = z.object({
    payment_token: z.string({
        required_error: 'Please select a payment token',
    }),
    receive_amount: z.number({
        required_error: 'A number is required.'
    }).min(1, {
        message: 'Minimum of 1 BIT10 token is required.'
    }).max(8, {
        message: 'The maximum number of BIT10 tokens you can buy is 8.'
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

    const fetchWhitelistedAddress = async () => {
        try {
            const result = await whitelistedAddress();
            return result;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while fetching whitelisted users. Please try again!');
            return [];
        }
    };

    const gatedMainnetQueries = useQueries({
        queries: [
            {
                queryKey: ['whitelistedUserPrincipalIds'],
                queryFn: () => fetchWhitelistedAddress(),
            }
        ],
    });

    const isLoading = gatedMainnetQueries.some(query => query.isLoading);
    const whitelistedPrincipal = gatedMainnetQueries[0]?.data ?? [];

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

        const data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: string, name: string, symbol: string, price: number }> };
        return data ?? [];
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

    const bit10TOPPrice = useMemo(() => bit10PriceQueries[0]?.data?.tokenPrice, [bit10PriceQueries]);
    const bit10TOPTokens = useMemo(() => bit10PriceQueries[0]?.data?.data as { id: string, name: string, symbol: string, marketCap: number, price: number }[] | undefined, [bit10PriceQueries]);

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
            receive_amount: 1,
            receive_token: 'BIT10.TOP'
        },
    });

    const selectedBIT10Tokens = useMemo(() => {
        const receiveToken = form.watch('receive_token');
        if (receiveToken === 'BIT10.TOP') {
            return bit10TOPTokens ?? [];
        }
        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('receive_token'), bit10TOPTokens]);

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
    const fromAmount = Number((form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01);
    const balance = Number(payingTokenBalance);

    const buyDisabledConditions = !chain || !isApproved || buying || fromAmount >= balance || fromAmount >= balance * 1.01 || balance <= 0 || fromAmount <= 0 || Number(form.watch('receive_amount')) <= 0;

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

            const rawTokenInAmount = ((values.receive_amount * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01); // 1% Management fee
            const tokenInAmount = isNaN(rawTokenInAmount) ? 0 : Number(rawTokenInAmount);

            if (chain === 'icp') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyICPBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount.toString(), tokenInAmount: tokenInAmount.toString(), icpAddress: icpAddress! });
            } else if (chain === 'base') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyBaseBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount.toString(), tokenInAmount: tokenInAmount.toString(), baseAddress: evmAddress! });
            } else if (chain === 'solana') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                await buySolanaBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount.toString(), tokenInAmount: tokenInAmount.toString(), solanaAddress: wallet.publicKey?.toBase58(), wallet: wallet });
            } else if (chain === 'bsc') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyBSCBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount.toString(), tokenInAmount: tokenInAmount.toString(), bscAddress: evmAddress! });
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

    const formatWalletAddress = (id: string) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 6)}....${id.slice(-4)}`;
    };

    const handleCopyAddress = () => {
        if (!userAddress) return;

        navigator.clipboard.writeText(userAddress)
            .then(() => {
                toast.info('Wallet address copied to clipboard.');
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch(err => {
                toast.error('Failed to copy wallet address.')
            });
    };

    return (
        <>
            {isLoading ? (
                <div className='flex flex-col-reverse space-y-2 md:space-y-0 lg:grid lg:grid-cols-5 gap-4'>
                    <div className='flex flex-col space-y-2 lg:space-y-4 lg:col-span-3'>
                        <Card className='border-none animate-fade-left'>
                            <CardHeader>
                                <CardTitle className='flex flex-row space-x-2 items-center justify-between'>
                                    <Skeleton className='bg-muted rounded-md w-16 h-12' />
                                    <Skeleton className='bg-muted rounded-md w-36 h-8' />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='bg-muted rounded-md w-full h-52' />
                            </CardContent>
                        </Card>

                        <Card className='border-none animate-fade-left'>
                            <CardHeader>
                                <CardTitle>
                                    <Skeleton className='bg-muted rounded-md w-16 h-8' />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='bg-muted rounded-md w-full h-52' />
                            </CardContent>
                        </Card>
                    </div>

                    <div className='md:col-span-2'>
                        <Card className='border-none animate-fade-right flex flex-col space-y-2'>
                            <CardHeader>
                                <CardTitle>Buy</CardTitle>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-2'>
                                <Skeleton className='bg-muted rounded-md w-full h-32' />
                                <Skeleton className='bg-muted rounded-md w-full h-32' />
                                <Skeleton className='bg-muted rounded-md w-full h-14' />
                                <Skeleton className='bg-muted rounded-md w-full h-12' />
                                <Skeleton className='bg-muted rounded-md w-full h-12' />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className='flex flex-col-reverse space-y-2 md:space-y-0 lg:grid lg:grid-cols-5 gap-4'>
                    <div className='lg:col-span-3'>
                        <TokenDetails token_price={selectedBIT10TokenPrice} token_name={form.watch('receive_token')} token_list={selectedBIT10Tokens} />
                    </div>

                    <div className='md:col-span-2'>
                        <Card className='border-none animate-fade-right'>
                            <CardHeader>
                                <CardTitle>Buy</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off' className='flex flex-col space-y-2'>
                                        <div className='relative flex flex-col items-center'>
                                            <div className='bg-muted rounded-t-lg w-full px-4 py-2 flex flex-col space-y-2'>
                                                <div className='flex flex-row space-x-2 justify-between items-center'>
                                                    <div>You Pay</div>
                                                    {
                                                        chain &&
                                                        <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row space-x-1 items-center justify-center border-muted-foreground'>
                                                            <div className='font-light'>From</div>
                                                            <div className='font-semibold'>{formatWalletAddress(userAddress ?? '')}</div>
                                                        </Badge>
                                                    }
                                                </div>
                                                {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                                <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        {/* <div className='text-4xl text-center md:text-start text-wrap pt-[3px] bg-blue-500'> */}
                                                        <div className='text-4xl text-center md:text-start text-wrap pt-[3px]'>
                                                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                                            {/* @ts-expect-error */}
                                                            {selectedBIT10TokenPrice ? formatCompactNumber((form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01) : '0'}
                                                        </div>
                                                        {/* <div className='pt-[0.5px] text-center md:text-start bg-green-500'> */}
                                                        <div className='pt-[0.5px] text-center md:text-start'>
                                                            <div className='flex flex-row space-x-1 text-sm items-center justify-center md:justify-start pt-0.5'>
                                                                &asymp; ${selectedBIT10TokenPrice ? formatCompactPercentNumber((form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice.toFixed(4))) * 1.01) : '0'}
                                                                <TooltipProvider>
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Info className='w-4 h-4 cursor-pointer ml-1 -mt-0.5' />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                                            Price of {form.watch('payment_token')} (in USD) + 1% Management fee <br />
                                                                            $ {formatCompactPercentNumber(form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? 'N/A'))} + $ {formatCompactPercentNumber(0.01 * (form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0')))} = $ {formatCompactPercentNumber((form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0')) + (0.01 * (form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0'))))}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='payment_token'
                                                            render={({ field }) => (
                                                                // <FormItem className='flex flex-row items-center justify-end bg-blue-500'>
                                                                <FormItem className='flex flex-row items-center justify-end'>
                                                                    <FormControl>
                                                                        <div className='w-full md:w-3/4 md:ml-auto'>
                                                                            <Button
                                                                                type='button'
                                                                                variant='outline'
                                                                                className={cn('border-2 border-[#B4B3B3] rounded-full z-10 w-full flex justify-between py-5 pl-1 pr-1.5', !field.value && 'text-muted-foreground')}
                                                                                onClick={() => setPaymentTokenDialogOpen(true)}
                                                                            >
                                                                                {field.value
                                                                                    ?
                                                                                    <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                        <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                            <Image src={payingTokenImg} alt={form.watch('payment_token')} width={35} height={35} className='z-20' />
                                                                                        </div>
                                                                                        <div>
                                                                                            {currentPaymentTokens.find((t) => t.value === field.value)?.label}
                                                                                        </div>
                                                                                    </div>
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
                                                                                        className='border-[#B4B3B3]'
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
                                                                                                        <Badge variant='outline' className='border-muted-foreground'>{token.tokenType}</Badge>
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
                                                        {/* <div className='text-sm text-center md:text-end pt-0.5 bg-green-500'> */}
                                                        <div className='text-sm text-center md:text-end pt-0.5'>
                                                            {formatCompactNumber(Number(payingTokenBalance))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button type='button' variant='ghost' size='sm' className='md:absolute top-1/2 -translate-y-1/2 z-10 rounded-full p-2 h-8 w-8 border-2 border-muted hover:bg-background group bg-background mt-2 md:mt-0' onClick={onSwitchToSell} disabled={buying}>
                                                <ArrowUpDown className='h-8 w-8 transition-transform duration-700 group-hover:rotate-[180deg]' />
                                            </Button>

                                            <div className='bg-muted rounded-b-lg w-full px-4 py-2 flex flex-col space-y-2 -mt-6 md:mt-2'>
                                                <div className='flex flex-row space-x-2 justify-between items-center'>
                                                    <div>You Receive</div>
                                                    {
                                                        chain &&
                                                        <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row space-x-1 items-center justify-center border-muted-foreground'>
                                                            <div className='font-light'>To</div>
                                                            <div className='font-semibold'>{formatWalletAddress(userAddress ?? '')}</div>
                                                        </Badge>
                                                    }
                                                </div>
                                                {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                                <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='receive_amount'
                                                            render={({ field }) => {
                                                                const numericValue = field.value ?? 1;
                                                                const handleIncrement = () => {
                                                                    if (numericValue < 8) field.onChange(numericValue + 1);
                                                                };
                                                                const handleDecrement = () => {
                                                                    if (numericValue > 1) field.onChange(numericValue - 1);
                                                                };
                                                                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    const value = parseInt(e.target.value, 10) || 1;
                                                                    const clampedValue = Math.min(Math.max(value, 1), 8);
                                                                    field.onChange(clampedValue);
                                                                };
                                                                const handleBlur = () => {
                                                                    const clampedValue = Math.max(1, Math.min(numericValue, 8));
                                                                    field.onChange(clampedValue);
                                                                };
                                                                return (
                                                                    // <FormItem className='bg-blue-500'>
                                                                    <FormItem>
                                                                        <div className='flex items-center justify-between rounded-full gap-1 border-2 border-[#B4B3B3] bg-background! md:w-3/4'>
                                                                            <Button type='button' variant='ghost' onClick={handleDecrement} disabled={numericValue <= 1}>-</Button>
                                                                            <Input type='number' min='1' max='8' step='1' value={numericValue} onChange={handleChange} onBlur={handleBlur} className='text-center focus-visible:ring-0 focus-visible:ring-offset-0 bg-accent' />
                                                                            <Button type='button' variant='ghost' onClick={handleIncrement} disabled={numericValue >= 8}>+</Button>
                                                                        </div>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                        {/* <div className='text-center md:text-start bg-green-500'> */}
                                                        <div className='text-center md:text-start'>
                                                            <div> &asymp; ${formatCompactPercentNumber((form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice.toFixed(4))))}</div>
                                                        </div>
                                                    </div>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='receive_token'
                                                            render={({ field }) => (
                                                                // <FormItem className='bg-blue-500'>
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <div className='w-full md:w-3/4 md:ml-auto'>
                                                                            <Button
                                                                                type='button'
                                                                                variant='outline'
                                                                                className={cn('border-2 border-[#B4B3B3] rounded-full z-10 w-full flex justify-between py-5 pl-1 pr-1.5', !field.value && 'text-muted-foreground')}
                                                                                onClick={() => setReceiveTokenDialogOpen(true)}
                                                                            >
                                                                                {field.value
                                                                                    ?
                                                                                    <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                        <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                            <Image src={BIT10Img as StaticImageData} alt='BIT10' width={35} height={35} className='z-20' />
                                                                                        </div>
                                                                                        <div>
                                                                                            {currentBIT10Tokens.find((t) => t.value === field.value)?.label}
                                                                                        </div>
                                                                                    </div>
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
                                                                                        className='border-[#B4B3B3]'
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
                                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-black p-0.5'>
                                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} />
                                                                                                        </div>
                                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                                            <div>{token.label}</div>
                                                                                                            <div>{formatAddress(token.address)}</div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <Badge variant='outline' className='border-muted-foreground'>{token.tokenType}</Badge>
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
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='rounded-lg px-4 py-2 bg-muted flex flex-col space-y-1 text-sm'>
                                            <div className='font-medium text-lg'>Summary</div>
                                            <div className='h-0.5 w-full bg-muted-foreground'></div>
                                            <div className='flex flex-row items-center justify-between space-x-2'>
                                                <div>Management Fee</div>
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <div className='flex flex-row space-x-1 items-center'>
                                                                <div>1%</div>
                                                                <div>
                                                                    <Info className='size-3 align-middle relative bottom-[1px] cursor-pointer' />
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
                                                <div>1 {form.watch('payment_token')} = {selectedBIT10TokenPrice > 0 ? formatCompactNumber(parseFloat(payingTokenPrice) / selectedBIT10TokenPrice) : '0'} {form.watch('receive_token')}</div>
                                            </div>
                                            <div className='flex flex-row items-center justify-between space-x-2'>
                                                <div>Expected Time</div>
                                                <div>1-2 min.</div>
                                            </div>
                                            <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                                <div>Expected Output</div>
                                                <div>{formatCompactNumber(form.watch('receive_amount'))} {form.watch('receive_token')}</div>
                                            </div>
                                        </div>

                                        <div className='py-2'>
                                            <motion.div className='p-[1.5px] rounded-lg' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                                <div className='relative rounded-lg px-4 py-2 bg-muted flex flex-col space-y-1'>
                                                    <motion.div className='absolute -top-3 right-3 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-black' style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                                        Limited time
                                                    </motion.div>
                                                    <div className='flex flex-row items-center justify-between'>
                                                        <div className='flex flex-row items-center space-x-1'>
                                                            <div>Estimated 5% Cashback</div>
                                                            <TooltipProvider>
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Info className='size-3 align-middle relative cursor-pointer' />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                                        Approximate {chain === 'icp' ? 'ckUSDC' : 'USDC'} you&apos;ll receive based on the amount of tokens purchased.
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <div>{selectedBIT10TokenPrice ? formatCompactPercentNumber((form.watch('receive_amount') * parseFloat(selectedBIT10TokenPrice.toFixed(4))) * 0.05) : '0'} {chain === 'icp' ? 'ckUSDC' : 'USDC'}</div>
                                                    </div>
                                                    <div className='flex flex-row items-center justify-between'>
                                                        <div className='flex flex-row items-center space-x-1'>
                                                            <div>Reward Pool Entries</div>
                                                            <TooltipProvider>
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Info className='size-3 align-middle relative cursor-pointer' />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                                        Each token you buy counts as one entry into the Reward Pool raffle.
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <div>{form.watch('receive_amount')} {form.watch('receive_amount') > 1 ? 'Tickets' : 'Ticket'}</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        {chain && !isApproved && (
                                            <div className='border-muted border rounded-lg flex flex-col items-center space-y-2 px-2 py-4 text-center'>
                                                <div>The Buy BIT10 page is gated for mainnet access. Your Wallet Address needs to be approved first to use the Buy BIT10 feature.</div>
                                                <div>For access, please contact <a href='https://x.com/bit10startup' className='text-primary underline'>@bit10startup</a> on Twitter/X.</div>
                                            </div>
                                        )}

                                        <Button className='w-full' disabled={buyDisabledConditions}>
                                            {buying && <Loader2 className='animate-spin mr-2' size={15} />}
                                            {getBuyMessage()}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </>
    )
}
