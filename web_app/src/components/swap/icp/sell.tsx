import React, { useState, useMemo, useCallback } from 'react'
import * as z from 'zod'
import { useWallet } from '@/context/WalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronsUpDown, Loader2, Info, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import Image, { type StaticImageData } from 'next/image'
import ICPImg from '@/assets/swap/ICP.png'
import BIT10Img from '@/assets/swap/bit10.svg'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { idlFactory as idlFactory2 } from '@/lib/swap.did'
import crypto from 'crypto'
import { newTokenSwap } from '@/actions/dbActions'

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

type ICRC2ActorType = {
    icrc2_approve: (args: {
        spender: { owner: Principal; subaccount: [] };
        fee: [];
        memo: [];
        from_subaccount: [];
        created_at_time: [];
        amount: bigint;
        expected_allowance: [];
        expires_at: [bigint];

    }) => Promise<{ Ok?: number; Err?: { InsufficientFunds?: null } }>;
};

const fromToken = [
    { label: 'BIT10.DEFI', value: 'BIT10.DEFI', img: BIT10Img as StaticImageData, address: 'bin4j-cyaaa-aaaap-qh7tq-cai', slug: ['defi'] },
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', slug: ['top crypto'] },
]

const toToken = [
    { label: 'ICP', value: 'ICP', img: ICPImg, address: 'ryjl3-tyaaa-aaaaa-aaaba-cai', slug: ['internet computer'] },
]

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

export default function Sell() {
    const [selling, setSelling] = useState<boolean>(false);
    const [fromTokenDialogOpen, setFromTokenDialogOpen] = useState(false);
    const [fromTokenSearch, setFromTokenSearch] = useState('');
    const [toTokenDialogOpen, setToTokenDialogOpen] = useState(false);
    const [toTokenSearch, setToTokenSearch] = useState('');

    const { isConnected, principalId } = useWallet();

    const fetchBit10Price = useCallback(async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        const data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> };
        return data.tokenPrice ?? 0;
    }, []);

    const fetchTokenBalance = useCallback(async (canisterId: string) => {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        if (principalId) {
            const account = {
                owner: Principal.fromText(principalId),
                subaccount: [],
            };
            if (actor && actor.icrc1_balance_of) {
                try {
                    const balance = await actor.icrc1_balance_of(account);
                    const value = Number(balance) / 100000000;

                    return formatTokenAmount(value);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    console.log(error);
                    toast.error('An error occurred while fetching user wallet balance. Please try again!');
                }
            } else {
                toast.error('An error occurred while fetching user wallet balance. Please try again!');
                return '0';
            }
        }
    }, [principalId]);

    const bit10PriceQueries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFITokenPrice'],
                queryFn: () => fetchBit10Price('bit10-latest-price-defi'),
                refetchInterval: 1800000, // 30 min.
            },
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBit10Price('bit10-latest-price-top'),
                refetchInterval: 1800000,
            },
            {
                queryKey: ['bit10DEFIBalance'],
                queryFn: () => fetchTokenBalance('bin4j-cyaaa-aaaap-qh7tq-cai'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['bit10TOPBalance'],
                queryFn: () => fetchTokenBalance('g37b3-lqaaa-aaaap-qp4hq-cai'),
                refetchInterval: 30000, // 30 sec.
            }
        ],
    });

    const isLoading = useMemo(() => bit10PriceQueries.some(query => query.isLoading), [bit10PriceQueries]);
    const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);
    const bit10TOPPrice = useMemo(() => bit10PriceQueries[1].data, [bit10PriceQueries]);
    const bit10DEFIWalletBalance = useMemo(() => bit10PriceQueries[2].data, [bit10PriceQueries]);
    const bit10TOPWalletBalance = useMemo(() => bit10PriceQueries[3].data, [bit10PriceQueries]);

    const fetchToTokenPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as BuyingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const toTokenPriceQueries = useQueries({
        queries: [
            {
                queryKey: ['icpPrice'],
                queryFn: () => fetchToTokenPrice('ICP'),
                refetchInterval: 30000, // 30 sec.
            },
        ],
    });

    const icpAmount = useMemo(() => toTokenPriceQueries[0].data, [toTokenPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            from_bit10_amount: 0.03,
            from_bit10_token: 'BIT10.TOP',
            to_token: 'ICP',
        },
    });

    const recieveTokenPrice = (): string => {
        const paymentMethod = form.watch('to_token');
        if (paymentMethod === 'ICP') {
            return icpAmount ?? '0';
        } else {
            return '0';
        }
    };

    const toTokenPrice = recieveTokenPrice();

    const payWithTokenBalance = (): string => {
        const paymentMethod = form.watch('from_bit10_token');
        if (paymentMethod === 'BIT10.DEFI') {
            return bit10DEFIWalletBalance ?? '0';
        } else if (paymentMethod === 'BIT10.TOP') {
            return bit10TOPWalletBalance ?? '0';
        } else {
            return '0';
        }
    };

    const payingTokenBalance = payWithTokenBalance();

    const bit10TokenPrice = (): number => {
        const bit10Token = form.watch('from_bit10_token');
        if (bit10Token === 'BIT10.DEFI') {
            return bit10DEFIPrice ?? 0;
        } else if (bit10Token === 'BIT10.TOP') {
            return bit10TOPPrice ?? 0;
        } else {
            return 0;
        }
    };

    const selectedBit10TokenPrice = bit10TokenPrice();

    const toTokenImg = (): StaticImageData => {
        const paymentMethod = form.watch('to_token');
        if (paymentMethod === 'ICP') {
            return ICPImg;
        } else {
            return ICPImg;
        }
    };

    const recivingTokenImg = toTokenImg();

    const formatTokenAmount = (value: number | null | undefined): string => {
        if (value === null || value === undefined || isNaN(value)) return '0';
        if (value === 0) return '0';
        const strValue = value.toFixed(10).replace(/\.?0+$/, '');
        const [integerPart, decimalPart = ''] = strValue.split('.');
        const formattedInteger = Number(integerPart).toLocaleString();

        if (!decimalPart) return formattedInteger ?? '0';

        const firstNonZeroIndex = decimalPart.search(/[1-9]/);

        if (firstNonZeroIndex === -1) return formattedInteger ?? '0';

        const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);

        return `${formattedInteger}.${trimmedDecimal}`;
    };

    const filteredFromTokens = useMemo(() => {
        const query = fromTokenSearch.toLowerCase();
        return fromToken.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query) ||
            token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
        );
    }, [fromTokenSearch]);

    const filteredToTokens = useMemo(() => {
        const query = toTokenSearch.toLowerCase();
        return toToken.filter(token =>
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

    const fromAmount = Number(form.watch('from_bit10_amount')) * 1.01; // 1% management fee
    const sellDisabledConditions = !isConnected || !principalId || selling || payingTokenBalance == '0' || selectedBit10TokenPrice == 0 || fromAmount > Number(payingTokenBalance) || fromAmount >= ((Number(payingTokenBalance) * 1.01) + 0.06);

    const getSellingMessage = (): string => {
        const balance = Number(payingTokenBalance || 0);

        if (fromAmount >= balance || fromAmount >= (balance * 1.01) + 0.06 && !selling) {
            return 'Your balance is too low for this transaction';
        }
        if (selling) {
            return 'Selling...';
        }
        return 'Sell';
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSelling(true);

            const bit10DEFICanisterId = 'bin4j-cyaaa-aaaap-qh7tq-cai';
            const bit10TOPCanisterId = 'g37b3-lqaaa-aaaap-qp4hq-cai';
            const swapCanisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

            const hasAllowed = await window.ic.plug.requestConnect({
                whitelist: [bit10DEFICanisterId, bit10TOPCanisterId, swapCanisterId]
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (hasAllowed && fromAmount && fromAmount !== 0) {
                toast.info('Allow the transaction on your wallet to proceed.');

                let selectedCanisterId;

                if (values.from_bit10_token === 'BIT10.DEFI') {
                    selectedCanisterId = bit10DEFICanisterId;
                }
                else if (values.from_bit10_token === 'BIT10.TOP') {
                    selectedCanisterId = bit10TOPCanisterId;
                }
                else {
                    throw new Error('Invalid payment method');
                }

                const actor = await window.ic.plug.createActor({
                    canisterId: selectedCanisterId,
                    interfaceFactory: idlFactory,
                }) as ICRC2ActorType;

                const mintingAmount = ((values.from_bit10_amount * 1.03) + 0.03).toFixed(8); // More in case of sudden price change
                const amount = Math.round(parseFloat(mintingAmount) * 100000000).toString();
                const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

                const args = {
                    spender: {
                        owner: Principal.fromText(swapCanisterId),
                        subaccount: [] as []
                    },
                    fee: [] as [],
                    memo: [] as [],
                    from_subaccount: [] as [],
                    created_at_time: [] as [],
                    amount: BigInt(amount),
                    expected_allowance: [] as [],
                    expires_at: [time] as [bigint],
                }

                const approve = await actor.icrc2_approve(args);

                if (approve.Ok) {
                    toast.success('Approval was successful! Proceeding with transfer...');

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const actor2 = await window.ic.plug.createActor({
                        canisterId: swapCanisterId,
                        interfaceFactory: idlFactory2,
                    });

                    const tickInAmount = Math.round(parseFloat(values.from_bit10_amount.toString()) * 100000000).toString();

                    const args2 = {
                        tick_in_name: values.from_bit10_token,
                        tick_in_amount: Number(tickInAmount),
                        tick_out_name: values.to_token
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    const transfer = await actor2.mb_reverse_swap(args2);

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if (transfer.Ok) {
                        const uuid = crypto.randomBytes(16).toString('hex');
                        const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
                        const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                        const principal = Principal.fromUint8Array(transfer.Ok.user_principal_id._arr);
                        const textualRepresentation = principal.toText();

                        const formatTimestamp = (nanoseconds: string): string => {
                            const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                            const date = new Date(Number(milliseconds));

                            return date.toISOString().replace('T', ' ').replace('Z', '+00');
                        };

                        const result = await newTokenSwap({
                            newTokenSwapId: newTokenSwapId,
                            principalId: textualRepresentation,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                            tickInName: transfer.Ok.tick_in_name,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickInAmount: transfer.Ok.tick_in_amount.toString(),
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickInUSDAmount: transfer.Ok.tick_in_usd_amount.toString(),
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickInTxBlock: transfer.Ok.tick_in_tx_block.toString(),
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickOutName: transfer.Ok.tick_out_name,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickOutAmount: transfer.Ok.tick_out_amount.toString(),
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickOutTxBlock: transfer.Ok.tick_out_tx_block.toString(),
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            transactionType: transfer.Ok.transaction_type as 'Swap' | 'Reverse Swap',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            network: transfer.Ok.network,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                            transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
                        });

                        await fetch('/bit10-token-request', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                newTokenSwapId: newTokenSwapId,
                                principalId: principalId,
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                                tickOutName: transfer.Ok.tick_out_name,
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                                tickOutAmount: transfer.Ok.tick_out_amount.toString(),
                                transactionTimestamp: new Date().toISOString(),
                            }),
                        });

                        if (result === 'Token swap successfully') {
                            toast.success('Token reverse swap was successful!');
                        } else {
                            toast.error('An error occurred while processing your request. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    } else if (transfer.Err) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        const errorMessage = String(transfer.Err);
                        if (errorMessage.includes('Insufficient balance')) {
                            toast.error('Insufficient funds');
                        } else {
                            toast.error('An error occurred while processing your request. Please try again!');
                        }
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                } else {
                    toast.error('Approval failed.');
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setSelling(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setSelling(false);
        }
    }

    return (
        <div>
            {isLoading ? (
                <div className='p-2'>
                    <div className='flex flex-col space-y-2'>
                        {['h-24', 'h-32', 'h-12', 'h-12'].map((classes, index) => (
                            <Skeleton key={index} className={classes} />
                        ))}
                    </div>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                        <div className='flex flex-col space-y-2'>
                            <div className='rounded-lg border-2'>
                                <div className='py-2 px-6 bg-muted rounded-lg'>
                                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:justify-between md:items-center'>
                                        <div>Sell</div>
                                        <div className='flex flex-row space-x-1 items-center'>
                                            <Wallet size={16} />
                                            <p>{formatTokenAmount(Number(payingTokenBalance))}</p>
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
                                                                    onClick={() => setFromTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? fromToken.find((t) => t.value === field.value)?.label
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={fromTokenDialogOpen} onOpenChange={setFromTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select Selling Token</DialogTitle>
                                                                        </DialogHeader>
                                                                        <Input
                                                                            placeholder='Search tokens by name, symbol, or address'
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
                                                                                        className='flex flex-row items-center justify-start py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setFromTokenDialogOpen(false);
                                                                                            setFromTokenSearch('');
                                                                                        }}
                                                                                    >
                                                                                        <div>
                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                        </div>
                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                            <div>{token.label}</div>
                                                                                            <div>{formatAddress(token.address)}</div>
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
                                            <div className='col-span-1 -ml-6 z-20'>
                                                <Image src={BIT10Img as StaticImageData} alt={form.watch('from_bit10_token')} width={75} height={75} className='z-20' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <div className='flex flex-row space-x-1'>
                                                        {form.watch('from_bit10_amount') * 1.01} {form.watch('from_bit10_token')}
                                                        <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                    Price of {form.watch('from_bit10_token')} + 1% Management fee <br />
                                                    {form.watch('from_bit10_amount')} + {0.01 * form.watch('from_bit10_amount')} = {form.watch('from_bit10_amount') * 1.01}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div>
                                            1 {form.watch('from_bit10_token')} = $ {formatTokenAmount(Number(selectedBit10TokenPrice))}
                                        </div>
                                    </div>
                                </div>

                                <div className='py-2 px-6'>
                                    <p>Receive</p>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <div className='text-4xl text-center md:text-start'>
                                            {formatTokenAmount((selectedBit10TokenPrice * form.watch('from_bit10_amount')) / parseFloat(toTokenPrice))}
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
                                                                    onClick={() => setToTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? toToken.find((t) => t.value === field.value)?.label
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={toTokenDialogOpen} onOpenChange={setToTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select Receive Token</DialogTitle>
                                                                        </DialogHeader>
                                                                        <Input
                                                                            placeholder='Search tokens by name, symbol, or address'
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
                                                                                        className='flex flex-row items-center justify-start py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setToTokenDialogOpen(false);
                                                                                            setToTokenSearch('');
                                                                                        }}
                                                                                    >
                                                                                        <div>
                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                        </div>
                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                            <div>{token.label}</div>
                                                                                            <div>{formatAddress(token.address)}</div>
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
                                            <div className='col-span-1 -ml-6 z-20'>
                                                <Image src={recivingTokenImg} alt='BIT10' width={75} height={75} className='z-20 border-[3px] dark:border-[#B0B0B0] bg-white rounded-full p-0.5' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <div>$ {formatTokenAmount(form.watch('from_bit10_amount') * parseFloat(toTokenPrice))}</div>
                                        <div>
                                            1 {form.watch('to_token')} = $ {formatTokenAmount(Number(toTokenPrice))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Accordion type='single' collapsible>
                                <AccordionItem value='item-1' className='rounded-lg border-2 px-6'>
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
                                            <div>1 {form.watch('from_bit10_token')} = {Number(toTokenPrice) > 0 ? formatTokenAmount(selectedBit10TokenPrice / Number(toTokenPrice)) : '0'} {form.watch('to_token')}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Expected Time</div>
                                            <div>1-2 min.</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                            <div>Expected Output</div>
                                            <div>{formatTokenAmount(((selectedBit10TokenPrice * form.watch('from_bit10_amount')) / Number(toTokenPrice)))} {form.watch('to_token')}</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                        <div className='flex flex-row space-x-2 w-full items-center pt-2'>
                            <Button className='w-full rounded-lg' disabled={sellDisabledConditions}>
                                {selling && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getSellingMessage()}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    )
}
