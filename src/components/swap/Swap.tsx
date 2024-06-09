"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { sendBtcTransaction, BitcoinNetworkType, request } from 'sats-connect'
import { newTokenSwap } from '@/actions/dbActions'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCw, Loader2 } from 'lucide-react'
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

const paymentMethod = [
    'BTC',
    'STX'
]

const bit10Amount = [
    '1',
    '2',
    '3',
    '4',
    '5'
]

const bit10Token = [
    'Bit10.DeFi'
]

const FormSchema = z.object({
    payment_method: z.string({
        required_error: 'Please select a payment method',
    }),
    bit10_amount: z.string({
        required_error: 'Please select the number of Bit10 tokens to receive',
    }),
    bit10_token: z.string({
        required_error: 'Please select the Bit10 token to receive',
    }),
})

export default function Swap() {
    const [btcAmount, setbtcAmount] = useState<string>('');
    const [stxAmount, setstxAmount] = useState<string>('');
    const [coinbaseData, setCoinbaseData] = useState<number[]>([]);
    const [coinMarketCapData, setCoinMarketCapData] = useState<number[]>([]);
    const [totalSum, setTotalSum] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [swaping, setSwaping] = useState<boolean>(false);

    const { isConnected, paymentAddress, stacksAddress, ordinalsAddress } = useWallet();

    const fetchBTCPrice = async () => {
        try {
            const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/buy');
            const data: BTCnSTXPriceResponse = await response.json();
            setbtcAmount(data.data.amount);
        } catch (error) {
            toast.error('Error fetching BTC price. Please try again!');
        }
    };

    const fetchSTXPrice = async () => {
        try {
            const response = await fetch('https://api.coinbase.com/v2/prices/STX-USD/buy');
            const data: BTCnSTXPriceResponse = await response.json();
            setstxAmount(data.data.amount);
        } catch (error) {
            toast.error('Error fetching STX price. Please try again!');
        }
    };

    useEffect(() => {
        const fetchData = () => {
            fetchBTCPrice();
            fetchSTXPrice();
        }

        fetchData();

        // const intervalId = setInterval(fetchData, 30000);
        // return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchCoinbaseData = async () => {
            const assets = ['STX', 'MAPO', 'ICP', 'RIF'];
            try {
                const coinbaseRequests = assets.map(async (asset) => {
                    const response = await fetch(`https://api.coinbase.com/v2/prices/${asset}-USD/buy`);
                    const data = await response.json();
                    return parseFloat(data.data.amount);
                });
                const result = await Promise.all(coinbaseRequests);
                setCoinbaseData(result);
            } catch (error) {
                toast.error('Error fetching Bit10 price. Please try again!');
            }
        };

        const fetchCoinMarketCapData = async () => {
            try {
                const response = await fetch('/coinmarketcap')
                const data = await response.json();

                const prices = [
                    data.data.CFX[0].quote.USD.price,
                    data.data.SOV[0].quote.USD.price
                ];

                setCoinMarketCapData(prices);
            } catch (error) {
                toast.error('Error fetching Bit10 price. Please try again!');
            }
        };

        fetchCoinbaseData();
        fetchCoinMarketCapData();
    }, []);

    useEffect(() => {
        if (coinbaseData.length > 0 && coinMarketCapData.length > 0) {
            const sum = coinbaseData.reduce((acc, curr) => acc + curr, 0) + coinMarketCapData.reduce((acc, curr) => acc + curr, 0);
            const bit10DeFi = sum / 6;
            setTotalSum(bit10DeFi);
        } else {
            const sum = coinbaseData.reduce((acc, curr) => acc + curr, 0);
            const bit10DeFi = sum / 4;
            setTotalSum(bit10DeFi);
        }
        setLoading(false);
    }, [coinbaseData, coinMarketCapData]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            payment_method: 'BTC',
            bit10_amount: '1',
            bit10_token: 'Bit10.DeFi'
        },
    });

    const refreshData = () => {
        fetchBTCPrice();
        fetchSTXPrice();
        toast.info('Data refreshed');
    }

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            if (isConnected) {
                const recepiantAddressBTC = '2MyfoeF2QHheX5TAA1omfamkwk7esaiJVsX'
                const recepiantAddressSTX = 'ST1SAX5AM1E593ZMTY8XEFCGQ45Q7J7ME38Q7K3FP'
                let sig: string | undefined;
                if (values.payment_method === 'BTC') {
                    setSwaping(true);
                    const btcPayment = (((parseInt(values.bit10_amount) * parseFloat(totalSum.toFixed(4))) / parseFloat(btcAmount))).toFixed(6);
                    const btcPaymentSats = Math.round(parseFloat(btcPayment) * 100000000).toFixed(0);

                    await sendBtcTransaction({
                        payload: {
                            network: {
                                type: BitcoinNetworkType.Testnet,
                            },
                            recipients: [
                                {
                                    address: recepiantAddressBTC,
                                    amountSats: BigInt(btcPaymentSats),
                                },
                            ],
                            senderAddress: paymentAddress!,
                        },
                        onFinish: (response) => {
                            sig = response;
                        },
                        onCancel: () => {
                            toast.error('Transaction canceled!');
                        },
                    });
                } else {
                    setSwaping(true);
                    const stxPayment = ((parseInt(values.bit10_amount) * parseFloat(totalSum.toFixed(4))) / parseFloat(stxAmount)).toFixed(6);
                    const microstacksPayment = (parseFloat(stxPayment) * 1e6).toFixed(0);

                    const response = await request('stx_transferStx', {
                        recipient: recepiantAddressSTX,
                        amount: Number(microstacksPayment),
                        // memo,
                    });

                    if (response.status === 'success') {
                        sig = response.result.txid;
                    } else {
                        if (response.error.message === 'User rejected the Stacks transaction signing request') {
                            toast.error('Transaction canceled!');
                        } else {
                            toast.error('An error occurred while processing your request. Please try again!');
                        }
                    }
                }

                if (sig && paymentAddress && stacksAddress && ordinalsAddress) {
                    setSwaping(true);
                    const result = await newTokenSwap({
                        paymentAddress: paymentAddress,
                        ordinalsAddress: ordinalsAddress,
                        stacksAddress: stacksAddress,
                        paymentAmount: values.payment_method === 'BTC' ?
                            ((parseInt(values.bit10_amount) * parseFloat(totalSum.toFixed(4))) / parseFloat(btcAmount)).toFixed(6) :
                            ((parseInt(values.bit10_amount) * parseFloat(totalSum.toFixed(4))) / parseFloat(stxAmount)).toFixed(6),
                        paymentName: values.payment_method,
                        paymentAmountUSD: (parseInt(values.bit10_amount) * parseFloat(totalSum.toFixed(4))).toFixed(4),
                        bit10tokenAmount: values.bit10_amount,
                        bit10tokenName: values.bit10_token,
                        transactionSignature: sig
                    });
                    if (result === 'Token swap added successfully') {
                        toast.success('Token swap was successful!');
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                }
                setSwaping(false);
            }
        }
        catch (error) {
            setSwaping(false);
            toast.error('An error occurred while processing your request. Please try again!');
        }
        finally {
            setSwaping(false);
        }
    }

    return (
        <MaxWidthWrapper>
            <div className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
                {loading ? (
                    <Card className='w-[300px] md:w-[450px] px-2 py-6'>
                        <CardContent className='flex flex-col space-y-2'>
                            {['h-24', 'h-32', 'h-32', 'h-12'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className='w-[300px] md:w-[450px]'>
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                                <div className='flex flex-row space-x-1'>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <RotateCw size={16} onClick={refreshData} className='cursor-pointer' />
                                            </TooltipTrigger>
                                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                Refresh data
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardTitle>
                            <CardDescription>Bit10 exchange</CardDescription>
                            <div className='text-center'>
                                Current Bit10.DeFi token price is $ {totalSum.toFixed(6)}
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
                                                    form.watch('payment_method') === 'BTC' ?
                                                        ((parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))) / parseFloat(btcAmount)).toFixed(6) :
                                                        ((parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))) / parseFloat(stxAmount)).toFixed(6)
                                                }
                                            </div>
                                            <div className='flex flex-row items-center'>
                                                <div className='py-1 px-2 mr-6 border-2 rounded-l-full z-10 w-full'>
                                                    <FormField
                                                        control={form.control}
                                                        name='payment_method'
                                                        render={({ field }) => (
                                                            <FormItem className='w-full px-2'>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className='border-none focus:bg-none px-8 md:px-2'>
                                                                            <SelectValue placeholder='Select payment method' />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {paymentMethod.map((name) => (
                                                                            <SelectItem key={name} value={name}>
                                                                                {name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className='-ml-12 z-20'>
                                                    <Image src={`/assets/swap/${form.watch('payment_method')}.svg`} alt={form.watch('payment_method')} width={75} height={75} className='z-20' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                            <div>$ {(parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))).toFixed(4)}</div>
                                            <div className='mr-1'>
                                                1 {form.watch('payment_method')} = $ {form.watch('payment_method') === 'BTC' ? parseFloat(btcAmount).toLocaleString(undefined, { minimumFractionDigits: 3 }) : parseFloat(stxAmount).toLocaleString(undefined, { minimumFractionDigits: 3 })}
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
                                                                    <SelectTrigger className='border-white'>
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
                                                    <FormField
                                                        control={form.control}
                                                        name='bit10_token'
                                                        render={({ field }) => (
                                                            <FormItem className='w-full px-2'>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className='border-none focus:bg-none'>
                                                                            <SelectValue placeholder='Select payment method' />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {bit10Token.map((name) => (
                                                                            <SelectItem key={name} value={name}>
                                                                                {name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className='-ml-12 z-20'>
                                                    <Image src='/assets/swap/Bit10.svg' alt='bit10' width={75} height={75} className='z-20' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                            <div>$ {(parseInt(form.watch('bit10_amount')) * parseFloat(totalSum.toFixed(4))).toFixed(4)}</div>
                                            <div className='mr-1'>
                                                1 {form.watch('bit10_token')} = $ {totalSum?.toFixed(4)}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className='flex flex-row space-x-2 w-full items-center'>
                                    <Button className='w-full' disabled={!isConnected || swaping} >
                                        {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                                        {swaping ? 'Trading...' : 'Trade'}
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
