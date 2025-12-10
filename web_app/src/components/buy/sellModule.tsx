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
import { sellPayTokensICP, sellReceiveTokensICP, fetchICPTokenBalance, sellICPBIT10Token } from './icp/ICPBuyModule'
import { sellPayTokensBase, sellReceiveTokensBase, fetchBaseTokenBalance, sellBaseBIT10Token } from './base/BaseBuyModule'
import { sellPayTokensSolana, sellReceiveTokensSolana, fetchSolanaTokenBalance, sellSolanaBIT10Token } from './solana/SolanaBuyModule'
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface SellModuleProps {
    onSwitchToBuy: () => void;
}

interface WhitelistedPrincipal {
    userPrincipalId: string;
}

interface SellingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

const FormSchema = z.object({
    from_bit10_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        required_error: 'Please enter the number of BIT10 tokens you wish to sell',
    })
        .positive('The amount must be a positive number')
        .min(0.03, 'Minimum amount should be 0.03')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    from_bit10_token: z.string({
        required_error: 'Please select the BIT10 token to sell',
    }),
    to_token: z.string({
        required_error: 'Please select the token to recieve after selling'
    })
});

export default function SellModule({ onSwitchToBuy }: SellModuleProps) {
    const [selling, setSelling] = useState<boolean>(false);
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
        }
        else if (chain == 'base' || chain == 'bsc') {
            return evmAddress;
        }
        else if (chain == 'solana') {
            return wallet.publicKey?.toBase58();
        }
        return undefined;
    }, [chain, icpAddress, evmAddress, wallet.publicKey]);

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
                queryKey: ['bit10DEFITokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-defi'),
                refetchInterval: 1800000, // 30 min.
            },
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-top'),
                refetchInterval: 1800000,
            }
        ],
    });

    const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data?.tokenPrice, [bit10PriceQueries]);
    const bit10DEFITokens = useMemo(() => bit10PriceQueries[0]?.data?.data as { id: string, name: string, symbol: string, marketCap: number, price: number }[] | undefined, [bit10PriceQueries]);
    const bit10TOPPrice = useMemo(() => bit10PriceQueries[1]?.data?.tokenPrice, [bit10PriceQueries]);
    const bit10TOPTokens = useMemo(() => bit10PriceQueries[1]?.data?.data as { id: string, name: string, symbol: string, marketCap: number, price: number }[] | undefined, [bit10PriceQueries]);

    const fetchRecievePrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as SellingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const receivePriceQueries = useQueries({
        queries: [
            {
                queryKey: ['icpPrice'],
                queryFn: () => fetchRecievePrice('ICP'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['ethPrice'],
                queryFn: () => fetchRecievePrice('ETH'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['solPrice'],
                queryFn: () => fetchRecievePrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            }
        ],
    });

    const icpAmount = useMemo(() => receivePriceQueries[0].data, [receivePriceQueries]);
    const ethAmount = useMemo(() => receivePriceQueries[1].data, [receivePriceQueries]);
    const solAmount = useMemo(() => receivePriceQueries[2].data, [receivePriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            from_bit10_amount: 0.03,
            from_bit10_token: 'BIT10.TOP',
            to_token: 'ICP',
        },
    });

    const selectedBIT10Tokens = useMemo(() => {
        const fromToken = form.watch('from_bit10_token');
        if (fromToken === 'BIT10.DEFI') {
            return bit10DEFITokens ?? [];
        } else if (fromToken === 'BIT10.TOP') {
            return bit10TOPTokens ?? [];
        }
        return bit10TOPTokens ?? [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_bit10_token'), bit10DEFITokens, bit10TOPTokens]);

    const selectedBIT10TokenPrice = useMemo(() => {
        const fromToken = form.watch('from_bit10_token');
        if (fromToken === 'BIT10.DEFI') {
            return Number(bit10DEFIPrice) || 0;
        } else if (fromToken === 'BIT10.TOP') {
            return Number(bit10TOPPrice) || 0;
        }
        return 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_bit10_token'), bit10TOPPrice, bit10DEFIPrice]);

    const receiveingTokenPrice = useMemo(() => {
        const receiveToken = form.watch('to_token');
        // ICP
        if (chain === 'icp' || chain === undefined) {
            if (receiveToken === 'ICP') {
                return icpAmount ?? 0;
            }
        }
        // Base
        else if (chain === 'base') {
            if (receiveToken === 'Ethereum') {
                return ethAmount ?? 0;
            }
        }
        // Solana
        else if (chain === 'solana') {
            if (receiveToken === 'Solana') {
                return solAmount ?? 0;
            }
        }
        else {
            return 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, form.watch('to_token'), icpAmount, ethAmount, solAmount]);

    const fromBalanceQueries = useQueries({
        queries: [
            // For ICP
            {
                queryKey: ['paymentTokenBalanceDEFI', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'bin4j-cyaaa-aaaap-qh7tq-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceTOP', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'g37b3-lqaaa-aaaap-qp4hq-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            // For Base
            {
                queryKey: ['paymentTokenBalanceTOP', evmAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'base' || !payingTokenAddress) return '0';
                    return fetchBaseTokenBalance({ tokenAddress: '0x2d309c7c5FbBf74372EdfC25B10842a7237b92dE', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'base' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            // For Solana
            {
                queryKey: ['paymentTokenBalanceSolanaTOP', publicKey, payingTokenAddress, chain],
                queryFn: () => {
                    if (!publicKey || chain !== 'solana' || !payingTokenAddress) return '0';
                    return fetchSolanaTokenBalance({ tokenAddress: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', publicKey: publicKey });
                },
                enabled: !!publicKey && chain === 'solana' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            }
        ],
    });

    const payingTokenBalance = useMemo(() => {
        if (payingTokenAddress == 'bin4j-cyaaa-aaaap-qh7tq-cai') {
            return fromBalanceQueries[0].data;
        } else if (payingTokenAddress == 'g37b3-lqaaa-aaaap-qp4hq-cai') {
            return fromBalanceQueries[1].data;
        } else if (payingTokenAddress == '0x2d309c7c5FbBf74372EdfC25B10842a7237b92dE') {
            return fromBalanceQueries[2].data;
        } else if (payingTokenAddress == 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1') {
            return fromBalanceQueries[3].data;
        }
        return '0';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromBalanceQueries, payingTokenAddress, chain]);

    const fromAmount = Number(form.watch('from_bit10_amount'));
    const balance = Number(payingTokenBalance);

    // ToDo: temp.
    const sellDisabledConditions = chain === 'bsc' || !chain || !isApproved || selling || fromAmount > balance || fromAmount <= 0 || balance <= 0;

    const getSellMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        // ToDo: temp.
        if (chain === 'bsc') return 'Selling coming soon on Binance Smart Chain';
        if (!isApproved) return 'Access Restricted';
        if (selling) return 'Selling...';
        if (fromAmount >= balance || fromAmount >= balance * 1.01 && !selling) return 'Your balance is too low for this transaction';
        if (fromAmount <= 0) return 'Amount too low';
        return 'Sell';
    };

    const currentPaymentTokens = useMemo(() => {
        if (chain === 'icp') {
            return sellPayTokensICP;
        } else if (chain === 'base') {
            return sellPayTokensBase;
        } else if (chain === 'solana') {
            return sellPayTokensSolana;
        } else {
            return sellPayTokensICP;
        }
    }, [chain]);

    const currentReceiveTokens = useMemo(() => {
        if (chain === 'icp') {
            return sellReceiveTokensICP;
        } else if (chain === 'base') {
            return sellReceiveTokensBase;
        } else if (chain === 'solana') {
            return sellReceiveTokensSolana;
        } else {
            return sellReceiveTokensICP;
        }
    }, [chain]);

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSelling(true);

            const selectedPaymentToken = currentPaymentTokens.find(
                (token) => token.value === values.from_bit10_token
            );

            const selectedReceiveToken = currentReceiveTokens.find(
                (token) => token.value === values.to_token
            );

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (!selectedBIT10TokenPrice || !receiveingTokenPrice || isNaN(selectedBIT10TokenPrice) || isNaN(receiveingTokenPrice) || receiveingTokenPrice <= 0) {
                toast.error('Price data unavailable.');
                return;
            }

            const tokenInAmount = isNaN(values.from_bit10_amount) ? 0 : Number(values.from_bit10_amount);
            const tokenOutAmount = (form.watch('from_bit10_amount') * selectedBIT10TokenPrice) / Number(receiveingTokenPrice);

            if (chain === 'icp') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await sellICPBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenInAmount: tokenInAmount.toString(), icpAddress: icpAddress! });
            } else if (chain === 'base') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await sellBaseBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenInAmount: tokenInAmount.toString(), tokenOutAmount: tokenOutAmount.toString(), baseAddress: evmAddress! });
            } else if (chain === 'solana') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await sellSolanaBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenInAmount: tokenInAmount.toString(), tokenOutAmount: tokenOutAmount.toString(), solanaAddress: wallet.publicKey?.toBase58(), wallet: wallet });
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setSelling(false);
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
        return currentReceiveTokens.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveTokenSearch, chain]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const recivingTokenImg = useMemo(() => {
        const currentToken = form.watch('to_token');
        const token = currentReceiveTokens.find(t => t.value === currentToken);
        return token?.img ?? BIT10Img as StaticImageData;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('to_token'), currentReceiveTokens]);

    useEffect(() => {
        if (currentPaymentTokens.length > 0 && !form.watch('from_bit10_token')) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            form.setValue('from_bit10_token', currentPaymentTokens[0].value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, currentPaymentTokens]);

    useEffect(() => {
        const currentToken = form.watch('from_bit10_token');
        const token = currentPaymentTokens.find(t => t.value === currentToken);
        if (token) {
            setPayingTokenAddress(token.address);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_bit10_token'), currentPaymentTokens]);

    const receiveAmount = useMemo(() => {
        if (selectedBIT10TokenPrice > 0 && Number(receiveingTokenPrice) > 0) {
            const amount = (((form.watch('from_bit10_amount') * 1.01) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / Number(receiveingTokenPrice));
            return Number(amount.toFixed(8));
        }
        return 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_bit10_amount'), selectedBIT10TokenPrice, receiveingTokenPrice]);

    const exchangeRate = useMemo(() => {
        if (selectedBIT10TokenPrice > 0 && Number(receiveingTokenPrice) > 0) {
            return Number(((selectedBIT10TokenPrice * 0.99) / Number(receiveingTokenPrice)).toFixed(8));
        }
        return 0;
    }, [selectedBIT10TokenPrice, receiveingTokenPrice]);

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
                                <CardTitle>Sell</CardTitle>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-2'>
                                <Skeleton className='bg-muted rounded-md w-full h-32' />
                                <Skeleton className='bg-muted rounded-md w-full h-32' />
                                <Skeleton className='bg-muted rounded-md w-full h-14' />
                                <Skeleton className='bg-muted rounded-md w-full h-12' />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className='flex flex-col-reverse space-y-2 md:space-y-0 lg:grid lg:grid-cols-5 gap-4'>
                    <div className='lg:col-span-3'>
                        <TokenDetails token_price={selectedBIT10TokenPrice} token_name={form.watch('from_bit10_token')} token_list={selectedBIT10Tokens} />
                    </div>

                    <div className='md:col-span-2'>
                        <Card className='border-none animate-fade-right'>
                            <CardHeader>
                                <CardTitle>Sell</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off' className='flex flex-col space-y-2'>
                                        <div className='relative flex flex-col items-center'>
                                            <div className='bg-muted rounded-t-lg w-full px-4 py-2 flex flex-col space-y-2'>
                                                <div className='flex flex-row space-x-2 justify-between items-center'>
                                                    <div>You Sell</div>
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
                                                        <FormField
                                                            control={form.control}
                                                            name='from_bit10_amount'
                                                            render={({ field }) => (
                                                                // <FormItem className='py-[1.5px] bg-blue-500'>
                                                                <FormItem className='py-[1.5px]'>
                                                                    <FormControl>
                                                                        <Input {...field} placeholder='BIT10 Tokens to sell' className='border-[#B4B3B3] rounded-full' />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        {/* <div className='pt-[0.5px] text-center md:text-start bg-green-500'> */}
                                                        <div className='pt-[0.5px] text-center md:text-start'>
                                                            <TooltipProvider>
                                                                <Tooltip delayDuration={300}>
                                                                    <div className='flex flex-row space-x-1 text-sm items-center justify-center md:justify-start pt-0.5'>
                                                                        &asymp; ${formatCompactPercentNumber((form.watch('from_bit10_amount') * selectedBIT10TokenPrice) * 1.01)}
                                                                        <TooltipTrigger asChild>
                                                                            <Info className='w-4 h-4 cursor-pointer ml-1 -mt-0.5' />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                                            Price of {form.watch('from_bit10_token')} (in USD) + 1% Management fee <br />
                                                                            $ {formatCompactPercentNumber((form.watch('from_bit10_amount') * selectedBIT10TokenPrice))} + $ {formatCompactPercentNumber(0.01 * ((form.watch('from_bit10_amount') * selectedBIT10TokenPrice)))} = $ {formatCompactPercentNumber((form.watch('from_bit10_amount') * selectedBIT10TokenPrice) * 1.01)}
                                                                        </TooltipContent>
                                                                    </div>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </div>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='from_bit10_token'
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
                                                                                            <Image src={BIT10Img as StaticImageData} alt={form.watch('from_bit10_token')} width={35} height={35} className='z-20' />
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
                                                        {/* <div className='text-sm text-center md:text-end pt-0.5 bg-green-500'> */}
                                                        <div className='text-sm text-center md:text-end pt-0.5'>
                                                            {formatCompactNumber(Number(payingTokenBalance))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button type='button' variant='ghost' size='sm' className='md:absolute top-1/2 -translate-y-1/2 z-10 rounded-full p-2 h-8 w-8 border-2 border-muted hover:bg-background group bg-background mt-2 md:mt-0' onClick={onSwitchToBuy} disabled={selling}>
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
                                                    <div className='flex flex-col space-y-[1.5px] text-center md:text-start'>
                                                        {/* <div className='text-4xl text-wrap pt-[3px] bg-blue-500'> */}
                                                        <div className='text-4xl text-wrap pt-[3px]'>
                                                            {formatCompactNumber(((form.watch('from_bit10_amount') * selectedBIT10TokenPrice) / Number(receiveingTokenPrice)))}
                                                        </div>
                                                        {/* <div className='pt-px bg-green-500'> */}
                                                        <div className='pt-px'>
                                                            &asymp; ${formatCompactPercentNumber(form.watch('from_bit10_amount') * selectedBIT10TokenPrice)}
                                                        </div>
                                                    </div>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='to_token'
                                                            render={({ field }) => (
                                                                // <FormItem className='flex flex-row items-center justify-end bg-blue-500'>
                                                                <FormItem className='flex flex-row items-center justify-end'>
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
                                                                                            <Image src={recivingTokenImg} alt='BIT10' width={35} height={35} className='z-20' />
                                                                                        </div>
                                                                                        <div>
                                                                                            {currentReceiveTokens.find((t) => t.value === field.value)?.label}
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
                                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white p-0.5'>
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
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Accordion type='single' collapsible>
                                            <AccordionItem value='item-1' className='rounded-lg border-2 my-2 border-none bg-muted/50 px-4'>
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
                                                        1 {form.watch('from_bit10_token')} = {formatCompactNumber(exchangeRate)} {form.watch('to_token')}
                                                    </div>
                                                    <div className='flex flex-row items-center justify-between space-x-2'>
                                                        <div>Expected Time</div>
                                                        <div>1-2 min.</div>
                                                    </div>
                                                    <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                                        <div>Expected Output</div>
                                                        <div>{formatCompactNumber(receiveAmount)} {form.watch('to_token')}</div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>

                                        {chain && !isApproved && (
                                            <div className='border-muted border rounded-lg flex flex-col items-center space-y-2 px-2 py-4 text-center'>
                                                <div>The Sell BIT10 page is gated for mainnet access. Your Wallet Address needs to be approved first to use the Sell BIT10 feature.</div>
                                                <div>For access, please contact <a href='https://x.com/bit10startup' className='text-primary underline'>@bit10startup</a> on Twitter/X.</div>
                                            </div>
                                        )}

                                        <Button className='w-full rounded-lg' disabled={sellDisabledConditions}>
                                            {selling && <Loader2 className='animate-spin mr-2' size={15} />}
                                            {getSellMessage()}
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
