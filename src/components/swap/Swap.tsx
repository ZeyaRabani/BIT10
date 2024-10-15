/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState } from 'react'
import { useWallet } from '@/context/WalletContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10_btc.did'
import { useQuery, useQueries } from '@tanstack/react-query'
import crypto from 'crypto'
import { newTokenSwap } from '@/actions/dbActions'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCw, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

interface BTCnSTXPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

interface CoinbasePriceResponse {
    data: {
        amount: string;
    };
};

interface CoinMarketCapResponse {
    data: {
        CFX: Array<{ quote: { USD: { price: number } } }>;
        SOV: Array<{ quote: { USD: { price: number } } }>;
        RIF: Array<{ quote: { USD: { price: number } } }>;
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
    bit10_amount: z.string({
        required_error: 'Please select the number of BIT10 tokens to receive',
    }),
})

export default function Swap() {
    const [rotate, setRotate] = useState(false);
    const [swaping, setSwaping] = useState<boolean>(false);

    const { isConnected, principalId } = useWallet();

    const fetchBTCPrice = async () => {
        const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/buy');
        if (!response.ok) {
            toast.error('Error fetching BTC price. Please try again!');
        }
        const data: BTCnSTXPriceResponse = await response.json();
        return data.data.amount;
    };

    const { data: btcAmount } = useQuery({
        queryKey: ['btcPrice'],
        queryFn: async () => {
            try {
                return await fetchBTCPrice();
            } catch (error) {
                toast.error('Error fetching BTC price. Please try again!');
                throw error;
            }
        },
        refetchInterval: 30000,
    });

    const fetchCoinbaseData = async (asset: string): Promise<number> => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${asset}-USD/buy`);
        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }
        const data: CoinbasePriceResponse = await response.json();
        return parseFloat(data.data.amount);
    };

    const fetchCoinMarketCapData = async (): Promise<number[]> => {
        const response = await fetch('/coinmarketcap');
        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }
        const data: CoinMarketCapResponse = await response.json();
        return [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            data.data.CFX[0].quote.USD.price,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            data.data.SOV[0].quote.USD.price,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            data.data.RIF[0].quote.USD.price,
        ];
    };

    const assets = ['STX', 'MAPO', 'ICP'];

    // Fetching Coinbase prices using useQueries
    const coinbaseQueries = useQueries({
        queries: assets.map(asset => ({
            queryKey: ['coinbase', asset],
            queryFn: () => fetchCoinbaseData(asset),
            onError: () => {
                toast.error('Error fetching BIT10 price. Please try again!');
            },
        })),
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: coinMarketCapData, error: coinMarketCapError, isLoading: isCoinMarketCapLoading } = useQuery({
        queryKey: ['coinMarketCap'],
        queryFn: fetchCoinMarketCapData,
        // onError: () => {
        //     toast.error('Error fetching CoinMarketCap prices. Please try again!');
        // },
    });

    const coinbaseData = coinbaseQueries.map(query => query.data ?? 0);

    const totalSum = React.useMemo(() => {
        const coinbaseTotal = coinbaseData.reduce((acc, curr) => acc + curr, 0);
        const coinMarketCapTotal = coinMarketCapData ? coinMarketCapData.reduce((acc, curr) => acc + curr, 0) : 0;

        if (coinbaseData.length > 0 && coinMarketCapData && coinMarketCapData.length > 0) {
            return (coinbaseTotal + coinMarketCapTotal) / 6;
        }

        return coinbaseTotal / 4;
    }, [coinbaseData, coinMarketCapData]);

    const refreshData = () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fetchBTCPrice().catch(error => {
            toast.error('Error fetching BTC price. Please try again!');
        });
        toast.info('Data refreshed');
        setRotate(true);
        setTimeout(() => setRotate(false), 1000);
    }

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            bit10_amount: '1'
        },
    });

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSwaping(true);
            // const bit10BTCCanisterId = 'eegan-kqaaa-aaaap-qhmgq-cai'
            const ckBTCLegerCanisterId = 'mxzaz-hqaaa-aaaar-qaada-cai'
            const bit10DEFICanisterId = 'bin4j-cyaaa-aaaap-qh7tq-cai';

            const hasAllowed = await window.ic.plug.requestConnect({
                whitelist: [ckBTCLegerCanisterId, bit10DEFICanisterId]
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (hasAllowed && btcAmount) {
                const actor = await window.ic.plug.createActor({
                    canisterId: ckBTCLegerCanisterId,
                    interfaceFactory: idlFactory
                });

                // ckBTC address
                const receiverAccountId = 'vhpiq-6dprt-6vc5j-xtzl5-dw2aj-mqzmy-5c2lo-xxmj7-5sivk-vwax6-5qe';

                const price = ((parseInt(values.bit10_amount) * totalSum) / parseFloat(btcAmount));
                const amount = Math.round(price * 100000000).toFixed(0);

                const args = {
                    to: {
                        owner: Principal.fromText(receiverAccountId),
                        subaccount: []
                    },
                    memo: [],
                    fee: [],
                    from_subaccount: [],
                    created_at_time: [],
                    amount: BigInt(amount)
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const transfer = await actor.icrc1_transfer(args);
                if (transfer.Ok && principalId) {
                    console.log('transfer.Ok ', transfer.Ok);
                    const uuid = crypto.randomBytes(16).toString('hex');
                    const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
                    const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

                    const result = await newTokenSwap({
                        newTokenSwapId: newTokenSwapId,
                        principalId: principalId,
                        paymentAmount: ((parseInt(values.bit10_amount) * totalSum) / parseFloat(btcAmount)).toString(),
                        paymentName: 'ckBTC',
                        paymentAmountUSD: (parseInt(values.bit10_amount) * totalSum).toString(),
                        bit10tokenQuantity: (values.bit10_amount).toString(),
                        bit10tokenName: 'BIT10.DEFI',
                        transactionIndex: transfer.Ok
                    });

                    await fetch('/bit10-defi-request', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            newTokenSwapId: newTokenSwapId,
                            principalId: principalId,
                            bit10tokenQuantity: (values.bit10_amount).toString(),
                            bit10tokenBoughtAt: new Date().toISOString(),
                        }),
                    });

                    if (result === 'Token swap added successfully') {
                        toast.success('Token swap was successful!');
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                } else if (transfer.Err.InsufficientFunds) {
                    toast.error('Insufficient funds');
                } else {
                    toast.error('Transfer failed.');
                }
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setSwaping(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setSwaping(false);
        }
    }

    return (
        <MaxWidthWrapper>
            <div className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
                {isCoinMarketCapLoading ? (
                    <Card className='w-[300px] md:w-[450px] px-2 pt-6 animate-fade-bottom-up'>
                        <CardContent className='flex flex-col space-y-2'>
                            {['h-24', 'h-32', 'h-32', 'h-12'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className='w-[300px] md:w-[450px] animate-fade-bottom-up'>
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                                <div className='flex flex-row space-x-1'>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <RotateCw className={`w-5 h-5 cursor-pointer transition-transform ${rotate ? 'animate-spin-fast' : ''}`} onClick={refreshData} />
                                            </TooltipTrigger>
                                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                Refresh data
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardTitle>
                            <CardDescription>BIT10 exchange</CardDescription>
                            <div className='text-center'>
                                Current BIT10.DEFI token price is $ {totalSum.toFixed(6)}
                            </div>
                        </CardHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                                <CardContent className='flex flex-col space-y-2'>
                                    <div className='rounded-lg border-2 py-2 px-6'>
                                        <p>Pay with</p>
                                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                            <div className='text-4xl text-center md:text-start'>
                                                {
                                                    btcAmount &&
                                                    (((parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))) / parseFloat(btcAmount)) * 1.03).toFixed(6)
                                                }
                                            </div>
                                            <div className='flex flex-row items-center'>
                                                <div className='py-1 px-2 mr-6 border-2 rounded-l-full z-10 w-full'>
                                                    <div className='pl-4 py-1'>
                                                        ckBTC
                                                    </div>
                                                </div>
                                                <div className='-ml-12 z-20'>
                                                    <Image src='/assets/swap/ckbtc.png' alt='ckBTC' width={75} height={75} className='z-20 border-2 rounded-full' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                            <TooltipProvider>
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <div className='flex flex-row space-x-1'>
                                                            $ {((parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))) * 1.03).toFixed(4)}
                                                            <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                        Price in ckBTC + 3% Platform fee <br />
                                                        {/* $ {(parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))).toFixed(4)} + $ {(0.03 * (parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4)))).toFixed(4)} = $ {((parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))) + (0.03 * (parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))))).toFixed(4)} */}
                                                        $ {(parseFloat(form.watch('bit10_amount')) * totalSum)} + $ {(0.03 * (parseInt(form.watch('bit10_amount')) * totalSum))} = $ {((parseInt(form.watch('bit10_amount')) * totalSum) + (0.03 * (parseInt(form.watch('bit10_amount')) * totalSum)))}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <div>
                                                1 ckBTC = $ {
                                                    btcAmount &&
                                                    parseFloat(btcAmount).toLocaleString(undefined, { minimumFractionDigits: 3 })
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <div className='rounded-lg border-2 py-2 px-6'>
                                        <p>Receive</p>
                                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name='bit10_amount'
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
                                            <div className='flex flex-row items-center'>
                                                <div className='py-1 px-2 mr-6 border-2 rounded-l-full z-10 w-full'>
                                                    <div className='pl-4 py-1'>
                                                        BIT10.DEFI
                                                    </div>
                                                </div>
                                                <div className='-ml-12 z-20'>
                                                    <Image src='/assets/swap/bit10.svg' alt='bit10' width={75} height={75} className='z-20' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                            <div>$ {(parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))).toFixed(4)}</div>
                                            <div>
                                                1 BIT10.DEFI = $ {totalSum?.toFixed(4)}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className='flex flex-row space-x-2 w-full items-center'>
                                    <Button className='w-full' disabled={!isConnected || swaping || !btcAmount || ((parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))) / parseFloat(btcAmount)) < 0.00002 || Number.isNaN((parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))) / parseFloat(btcAmount))} >
                                        {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                                        {swaping ? 'Swaping...' : 'Swap'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                )}
            </div>
        </MaxWidthWrapper>
    )
}
