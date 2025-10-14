import React, { useState, useMemo, useCallback, useEffect } from 'react'
import * as z from 'zod'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatAddress, formatAmount } from '@/lib/utils'
import { ChevronsUpDown, Loader2, Info, Wallet, ArrowUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sellPayTokensICP, sellReceiveTokensICP, fetchICPTokenBalance, sellICPBIT10Token } from './icp/ICPBuyModule'
import BIT10Img from '@/assets/tokens/bit10.svg'
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
    onSwitchToBuy: () => void
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

    const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);
    const bit10TOPPrice = useMemo(() => bit10PriceQueries[1].data, [bit10PriceQueries]);

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
        ],
    });

    const icpAmount = useMemo(() => receivePriceQueries[0].data, [receivePriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            from_bit10_amount: 0.03,
            from_bit10_token: 'BIT10.TOP',
            to_token: 'ICP',
        },
    });

    const selectedBIT10TokenPrice = useMemo(() => {
        if (payingTokenAddress === 'bin4j-cyaaa-aaaap-qh7tq-cai') {
            return Number(bit10DEFIPrice) || 0;
        } else if (payingTokenAddress === 'g37b3-lqaaa-aaaap-qp4hq-cai') {
            return Number(bit10TOPPrice) || 0;
        }
        return 0;
    }, [payingTokenAddress, bit10TOPPrice, bit10DEFIPrice]);

    const receiveingTokenPrice = useMemo(() => {
        const receiveToken = form.watch('to_token');
        // ICP
        if (chain === 'icp' || chain === undefined) {
            if (receiveToken === 'ICP') {
                return icpAmount ?? 0;
            }
        } else {
            return 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, form.watch('to_token'), icpAmount]);

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
        ],
    });

    const payingTokenBalance = useMemo(() => {
        if (payingTokenAddress == 'bin4j-cyaaa-aaaap-qh7tq-cai') {
            return fromBalanceQueries[0].data;
        } else if (payingTokenAddress == 'g37b3-lqaaa-aaaap-qp4hq-cai') {
            return fromBalanceQueries[1].data;
        }
        return '0';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromBalanceQueries, payingTokenAddress, chain]);

    const fromAmount = Number(form.watch('from_bit10_amount'));
    const balance = Number(payingTokenBalance);

    // ToDo: temp.
    const sellDisabledConditions = chain === 'base' || chain === 'bsc' || !chain || selling || fromAmount > balance || fromAmount <= 0;

    const getSellMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        // ToDo: temp.
        if (chain === 'base' || chain === 'bsc') return `Selling coming soon on ${chain === 'base' ? 'Base' : 'Binance Smart Chain'}`;
        if (selling) return 'Selling...';
        if (fromAmount >= balance || fromAmount >= balance * 1.01 && !selling) return 'Your balance is too low for this transaction';
        if (fromAmount <= 0) return 'Amount too low';
        return 'Sell';
    };

    const currentPaymentTokens = useMemo(() => {
        if (chain === 'icp') {
            return sellPayTokensICP;
        } else {
            return sellPayTokensICP;
        }
    }, [chain]);

    const currentReceiveTokens = useMemo(() => {
        if (chain === 'icp') {
            return sellReceiveTokensICP;
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


            if (chain === 'icp') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await sellICPBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenInAmount: tokenInAmount, icpAddress: icpAddress! });
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
            const amount = (Number(form.watch('from_bit10_amount')) * selectedBIT10TokenPrice * 0.99) / Number(receiveingTokenPrice);
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                <div className='flex flex-col space-y-2'>
                    <div className='bg-muted rounded-lg p-4'>
                        <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:justify-between md:items-center'>
                            <div>You Sell</div>
                            <div className='flex flex-row space-x-1 items-center'>
                                <Wallet size={16} />
                                <p>{formatAmount(Number(payingTokenBalance ?? 0))}</p>
                            </div>
                        </div>
                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                            <div className='w-full'>
                                <FormField
                                    control={form.control}
                                    name='from_bit10_amount'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input {...field} placeholder='BIT10 Tokens to sell' className='dark:border-white' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className='grid grid-cols-5 items-center'>
                                <FormField
                                    control={form.control}
                                    name='from_bit10_token'
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
                                    <Image src={BIT10Img as StaticImageData} alt={form.watch('from_bit10_token')} width={75} height={75} className='z-20' />
                                </div>
                            </div>
                        </div>

                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                            <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <div className='flex flex-row space-x-1'>
                                            $ {formatAmount(form.watch('from_bit10_amount') * selectedBIT10TokenPrice)} {form.watch('from_bit10_token')}
                                            <Info className='w-5 h-5 cursor-pointer ml-1' />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                        The Management Fee (1%) is deducted from your output amount <br />
                                        You sell {formatAmount(Number(form.watch('from_bit10_amount')))} {form.watch('from_bit10_token')} worth ${formatAmount(Number(form.watch('from_bit10_amount')) * selectedBIT10TokenPrice)},
                                        receive {formatAmount(receiveAmount)} {form.watch('to_token')}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <div>
                                1 {form.watch('from_bit10_token')} = $ {formatAmount(Number(receiveingTokenPrice))}
                            </div>
                        </div>
                    </div>

                    <div className='grid place-items-center z-[2] my-6'>
                        <Button type='button' variant='ghost' size='sm' className='rounded-full p-2 h-8 w-8 border-2 border-gray-300 hover:border-gray-400 group bg-background' onClick={onSwitchToBuy}>
                            <ArrowUpDown className='h-4 w-4 transition-transform duration-700 group-hover:rotate-[180deg]' />
                        </Button>
                    </div>

                    <div className='bg-muted rounded-lg p-4'>
                        <p>You Receive</p>
                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                            <div className='text-4xl text-center md:text-start'>
                                {formatAmount(receiveAmount)}
                            </div>

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
                                                        onClick={() => setReceiveTokenDialogOpen(true)}
                                                    >
                                                        {field.value
                                                            ? currentReceiveTokens.find((t) => t.value === field.value)?.label
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
                                    <Image src={recivingTokenImg} alt='BIT10' width={75} height={75} className='z-20' />
                                </div>
                            </div>
                        </div>

                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                            <div>$ {formatAmount(Number(form.watch('from_bit10_amount')) * Number(receiveingTokenPrice ?? 0))}</div>
                            <div>
                                1 {form.watch('to_token')} = $ {formatAmount(Number(receiveingTokenPrice))}
                            </div>
                        </div>
                    </div>
                </div>

                <Accordion type='single' collapsible>
                    <AccordionItem value='item-1' className='rounded-lg border-2 px-6 my-2'>
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
                                1 {form.watch('from_bit10_token')} = {formatAmount(exchangeRate)} {form.watch('to_token')}
                            </div>
                            <div className='flex flex-row items-center justify-between space-x-2'>
                                <div>Expected Time</div>
                                <div>1-2 min.</div>
                            </div>
                            <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                <div>Expected Output</div>
                                <div>{formatAmount(receiveAmount)} {form.watch('to_token')}</div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className='flex flex-row space-x-2 w-full items-center pt-3'>
                    <Button className='w-full rounded-lg' disabled={sellDisabledConditions}>
                        {selling && <Loader2 className='animate-spin mr-2' size={15} />}
                        {getSellMessage()}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
