import React, { useState, useMemo, useCallback } from 'react'
import * as z from 'zod'
import { useWallet } from '@/context/WalletContext'
import { useBTCWallet } from '@/context/BTCWalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronsUpDown, Check, Loader2, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { request } from '@stacks/connect'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Image, { type StaticImageData } from 'next/image'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import BitcoinImg from '@/assets/swap/bitcoin.svg'
import BIT10Img from '@/assets/swap/bit10.svg'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/liquidity_hub.did'

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

const tickIn = [
    { label: 'tBTC', value: 'BTC', img: BitcoinImg as StaticImageData }
]

const tickOut = [
    { label: 'ckUSDC', value: 'ckUSDC', img: BIT10Img as StaticImageData }
]

const FormSchema = z.object({
    // liquidity_chain: z.string({
    //     required_error: 'Please select a chain',
    // }),
    liquidity_token: z.string({
        required_error: 'Please select a token',
    }),
    liquidity_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        required_error: 'Please enter the number of tokens.',
    })
        .positive('The amount must be a positive number')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    recieving_token: z.string({
        required_error: 'Please select the token to receive',
    })
})

export default function ILP() {
    const [processing, setProcessing] = useState<boolean>(false);

    const { principalId } = useWallet();
    const { BTCAddress, isBTCConnected, connectBTCWallet, disconnectBTCWallet } = useBTCWallet();

    const fetchPayWithPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as BuyingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
    const canisterId = 'jskxc-iiaaa-aaaap-qpwrq-cai';

    const agent = new HttpAgent({ host });
    const actor = Actor.createActor(idlFactory, { agent, canisterId });

    const fetchPoolSupply = async () => {
        const totalSupply = actor.btc_required_pool_size ? await actor.btc_required_pool_size() : undefined;

        if (!totalSupply) {
            toast.error('Error fetching BTC Pool supply. Please try again!');
        }

        if (totalSupply && typeof totalSupply === 'bigint') {
            const scaledTotalSupply = Number(totalSupply) / 100000000;
            return scaledTotalSupply;
        } else {
            return 0;
        }
    }

    const payWithPriceQueries = useQueries({
        queries: [
            {
                queryKey: ['btcPrice'],
                queryFn: () => fetchPayWithPrice('BTC'),
                refetchInterval: 10000, // 10 sec.
            },
            {
                queryKey: ['usdcPrice'],
                queryFn: () => fetchPayWithPrice('USDC'),
                refetchInterval: 10000,
            },
            {
                queryKey: ['btcPoolSupply'],
                queryFn: () => fetchPoolSupply()
            },
        ],
    });

    const isLoading = useMemo(() => payWithPriceQueries.some(query => query.isLoading), [payWithPriceQueries]);
    const btcAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
    const usdcAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);
    const btcPool = useMemo(() => payWithPriceQueries[2].data, [payWithPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            liquidity_token: 'BTC',
            liquidity_amount: 0.00003,
            recieving_token: 'ckUSDC'
        },
    });

    const liquidityTokenImg = (): StaticImageData => {
        const liquidityName = form.watch('liquidity_token');
        if (liquidityName === 'BTC') {
            return BitcoinImg as StaticImageData;
        } else {
            return BIT10Img as StaticImageData;
        }
    };

    const liquidityImg = liquidityTokenImg();

    const liquidityTokenPrice = (): string => {
        const liquidityName = form.watch('liquidity_token');
        if (liquidityName === 'BTC') {
            return btcAmount ?? '0';
        } else {
            return '0';
        }
    };

    const liquidityPrice = liquidityTokenPrice();

    const recivingTokenPrice = (): string => {
        const recivingName = form.watch('recieving_token');
        if (recivingName === 'ckUSDC') {
            return usdcAmount ?? '0';
        } else {
            return '0';
        }
    };

    const recivingPrice = recivingTokenPrice();

    const swapDisabledConditions = !isBTCConnected || processing || recivingPrice === '0' || liquidityPrice === '0';

    const formatAddress = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 8)}........${id.slice(-9)}`;
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setProcessing(true);

            const liquidityHubCanisterId = 'jskxc-iiaaa-aaaap-qpwrq-cai'

            const hasAllowed = await window.ic.plug.requestConnect({
                whitelist: [liquidityHubCanisterId]
            });

            toast.info('Allow the transaction on your wallet to proceed.');

            const destinatioAddress = '2MvxteUZggvbprjogjMQVrRZ3NSNVskCpaz';
            const amountInMicroUnits = 100000000 * values.liquidity_amount;
            const response = await request('sendTransfer', {
                recipients: [
                    {
                        address: destinatioAddress,
                        amount: amountInMicroUnits
                    }
                ],
                network: 'testnet'
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (response.txid && hasAllowed) {
                console.log(response.txid);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const actor2 = await window.ic.plug.createActor({
                    canisterId: liquidityHubCanisterId,
                    interfaceFactory: idlFactory,
                });

                const args2 = {
                    tick_in_tx_block: response.txid,
                    tick_out_name: values.recieving_token,
                    tick_in_name: values.liquidity_token,
                    tick_in_network: 'bitcoin_testnet'
                };

                setTimeout(() => {
                    setProcessing(false);
                    toast.info('Transaction was successful. Funds will be sent to your wallet after confirming the transaction.!');
                }, 2000);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                await actor2.te_ilp(args2);
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            console.log(error);
            setProcessing(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className='flex flex-col py-4 items-center justify-center'>
            {isLoading ? (
                <Card className='w-[300px] md:w-[500px] px-2 pt-6 animate-fade-bottom-up'>
                    <CardContent className='flex flex-col space-y-2'>
                        {['h-24', 'h-32', 'h-32', 'h-8', 'h-8', 'h-12', 'h-12'].map((classes, index) => (
                            <Skeleton key={index} className={classes} />
                        ))}
                    </CardContent>
                </Card>
            ) : (
                <Card className='w-[300px] md:w-[500px] animate-fade-bottom-up'>
                    <CardHeader>
                        <CardTitle className='flex flex-row items-center justify-between'>
                            <div>Instant Liquidity Provider</div>
                        </CardTitle>
                        <CardDescription>Swap assets instantly and earn rewards: no lock-up, no fees-just pure liquidity, plus extra incentives from the platform fee.</CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                            <CardContent className='flex flex-col space-y-3'>
                                <div className='rounded-lg border-2 py-4 px-6 z-[1]'>
                                    <div className='font-semibold tracking-wide'>Spent</div>
                                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 items-start md:items-center md:justify-between text-sm'>
                                        <div>Chain: Bitcoin Testnet</div>
                                        <div className='flex flex-row items-center'>
                                            <div>
                                                Pool: {btcPool?.toFixed(4)} BTC
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <div className='flex flex-row space-x-1'>
                                                            <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                        Total number of tokens required
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <FormField
                                            control={form.control}
                                            name='liquidity_amount'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} placeholder='Tokens to send' className='dark:border-white' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className='grid grid-cols-5 items-center'>
                                            <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                                                <FormField
                                                    control={form.control}
                                                    name='liquidity_token'
                                                    render={({ field }) => (
                                                        <FormItem className='w-full px-2'>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant='outline'
                                                                            role='combobox'
                                                                            className={cn(
                                                                                'border-none justify-between px-1.5 w-full',
                                                                                !field.value && 'text-muted-foreground'
                                                                            )}
                                                                        >
                                                                            {field.value
                                                                                ? tickIn.find(
                                                                                    (tickIn) => tickIn.value === field.value
                                                                                )?.label
                                                                                : 'Select token'}
                                                                            <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className='w-[180px] p-0 ml-10'>
                                                                    <Command>
                                                                        <CommandInput placeholder='Search token...' />
                                                                        <CommandList>
                                                                            <CommandEmpty>No token found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {tickIn.map((tickIn) => (
                                                                                    <CommandItem
                                                                                        value={tickIn.label}
                                                                                        key={tickIn.label}
                                                                                        onSelect={() => {
                                                                                            form.setValue('liquidity_token', tickIn.value)
                                                                                        }}
                                                                                    >
                                                                                        <div className='flex flex-row items-center'>
                                                                                            <Image src={tickIn.img} alt={tickIn.label} width={15} height={15} className='rounded-full bg-white mr-1' />
                                                                                            {tickIn.label}
                                                                                        </div>
                                                                                        <Check
                                                                                            className={cn(
                                                                                                'ml-auto',
                                                                                                tickIn.value === field.value
                                                                                                    ? 'opacity-100'
                                                                                                    : 'opacity-0'
                                                                                            )}
                                                                                        />
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className='col-span-1 -ml-6 z-20'>
                                                <Image src={liquidityImg} alt='BIT10' width={75} height={75} className='z-20 bg-white rounded-full' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <div>{(form.watch('liquidity_amount') * parseFloat(liquidityPrice)).toFixed(4)} $</div>
                                        <div>
                                            1 {form.watch('liquidity_token')} = $ {parseFloat(liquidityPrice).toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                                <div className='rounded-lg border-2 py-4 px-6 z-[1]'>
                                    <div className='flex flex-row items-center'>
                                        <div className='font-semibold tracking-wide'>
                                            Recieve
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <div className='flex flex-row space-x-1'>
                                                        <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                    For testnet user will get the BIT10.BTC instead of {form.watch('recieving_token')}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className='text-sm'>Chain: ICP</div>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <div className='text-4xl text-center md:text-start'>
                                            {((parseFloat(liquidityPrice) * form.watch('liquidity_amount')) / parseFloat(recivingPrice)).toFixed(4)}
                                        </div>
                                        <div className='grid grid-cols-5 items-center'>
                                            <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                                                <FormField
                                                    control={form.control}
                                                    name='recieving_token'
                                                    render={({ field }) => (
                                                        <FormItem className='w-full px-2'>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant='outline'
                                                                            role='combobox'
                                                                            className={cn(
                                                                                'border-none justify-between px-1.5 w-full',
                                                                                !field.value && 'text-muted-foreground'
                                                                            )}
                                                                        >
                                                                            {field.value
                                                                                ? tickOut.find(
                                                                                    (tickOut) => tickOut.value === field.value
                                                                                )?.label
                                                                                : 'Select token'}
                                                                            <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className='w-[180px] p-0 ml-10'>
                                                                    <Command>
                                                                        <CommandInput placeholder='Search token...' />
                                                                        <CommandList>
                                                                            <CommandEmpty>No token found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {tickOut.map((tickOut) => (
                                                                                    <CommandItem
                                                                                        value={tickOut.label}
                                                                                        key={tickOut.label}
                                                                                        onSelect={() => {
                                                                                            form.setValue('liquidity_token', tickOut.value)
                                                                                        }}
                                                                                    >
                                                                                        <div className='flex flex-row items-center'>
                                                                                            <Image src={tickOut.img} alt={tickOut.label} width={15} height={15} className='rounded-full bg-white mr-1' />
                                                                                            {tickOut.label}
                                                                                        </div>
                                                                                        <Check
                                                                                            className={cn(
                                                                                                'ml-auto',
                                                                                                tickOut.value === field.value
                                                                                                    ? 'opacity-100'
                                                                                                    : 'opacity-0'
                                                                                            )}
                                                                                        />
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className='col-span-1 -ml-6 z-20'>
                                                <Image src={BIT10Img as StaticImageData} alt='BIT10' width={75} height={75} className='z-20' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                            <TooltipProvider>
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <div className='flex flex-row space-x-1'>
                                                            {((parseFloat(liquidityPrice) * form.watch('liquidity_amount')) / parseFloat(recivingPrice)).toFixed(4)} $
                                                            <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                        Recieving amount + Platform fee incentive<br />
                                                        {((parseFloat(liquidityPrice) * form.watch('liquidity_amount')) / parseFloat(recivingPrice)).toFixed(4)}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div>1 {form.watch('recieving_token')} = $ {parseFloat(recivingPrice).toFixed(4)}</div>
                                    </div>
                                </div>

                            </CardContent>
                            <CardFooter>
                                {isBTCConnected ? (
                                    <div className='w-full fex flex-col space-y-2'>
                                        <h1>Your spent address: {formatAddress(BTCAddress)}</h1>
                                        <h1>Your receive address: {formatAddress(principalId)}</h1>
                                        <div className='w-full rounded text-center py-2 font-medium cursor-pointer bg-destructive hover:bg-destructive/90 text-white' onClick={disconnectBTCWallet}>Disconnect Bitcoin Wallet</div>
                                        <Button className='w-full' disabled={swapDisabledConditions}>
                                            {processing && <Loader2 className='animate-spin mr-2' size={15} />}
                                            {processing ? 'Swapping...' : 'Swap'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className='w-full'>
                                        <div className='bg-primary rounded text-center py-2 font-medium cursor-pointer hover:bg-primary/90 text-white' onClick={connectBTCWallet}>Connect Bitcoin Wallet</div>
                                    </div>
                                )}
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            )}
        </div>
    )
}
