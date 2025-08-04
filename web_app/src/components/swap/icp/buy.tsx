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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import CkBTCImg from '@/assets/swap/ckBTC.png'
import CkETHImg from '@/assets/swap/ckETH.png'
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

const paymentToken = [
    { label: 'ICP', value: 'ICP', img: ICPImg, address: 'ryjl3-tyaaa-aaaaa-aaaba-cai', slug: ['internet computer'] },
    { label: 'ckBTC', value: 'ckBTC', img: CkBTCImg, address: 'mxzaz-hqaaa-aaaar-qaada-cai', slug: ['bitcoin'] },
    { label: 'ckETH', value: 'ckETH', img: CkETHImg, address: 'ss2fx-dyaaa-aaaar-qacoq-cai', slug: ['ethereum'] },
]

const bit10Amount = [
    '1',
    '2',
    '3',
    '4',
    '5'
]

const bit10Token = [
    // { label: 'BIT10.DEFI', value: 'BIT10.DEFI', img: BIT10Img as StaticImageData, address: 'bin4j-cyaaa-aaaap-qh7tq-cai', slug: ['defi'] },
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', slug: ['top crypto'] },
]

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

export default function Buy() {
    const [swaping, setSwaping] = useState<boolean>(false);
    const [paymentTokenDialogOpen, setPaymentTokenDialogOpen] = useState(false);
    const [paymentTokenSearch, setPaymentTokenSearch] = useState('');
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState(false);
    const [receiveTokenSearch, setReceiveTokenSearch] = useState('');

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
                    let decimals = 0;

                    if (canisterId === 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
                        decimals = 8;
                    } else if (canisterId === 'mxzaz-hqaaa-aaaar-qaada-cai') {
                        decimals = 8;
                    } else if (canisterId === 'ss2fx-dyaaa-aaaar-qacoq-cai') {
                        decimals = 18;
                    }

                    const balance = await actor.icrc1_balance_of(account);
                    const value = Number(balance) / 10 ** decimals;

                    return formatTokenAmount(value);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
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
                queryKey: ['icpBalance'],
                queryFn: () => fetchTokenBalance('ryjl3-tyaaa-aaaaa-aaaba-cai'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['ckBTCBalance'],
                queryFn: () => fetchTokenBalance('mxzaz-hqaaa-aaaar-qaada-cai'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['ckETHBalance'],
                queryFn: () => fetchTokenBalance('ss2fx-dyaaa-aaaar-qacoq-cai'),
                refetchInterval: 30000, // 30 sec.
            }
        ],
    });

    const isLoading = useMemo(() => bit10PriceQueries.some(query => query.isLoading), [bit10PriceQueries]);
    const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);
    const bit10TOPPrice = useMemo(() => bit10PriceQueries[1].data, [bit10PriceQueries]);
    const icpWalletBalance = useMemo(() => bit10PriceQueries[2].data, [bit10PriceQueries]);
    const ckBTCWalletBalance = useMemo(() => bit10PriceQueries[3].data, [bit10PriceQueries]);
    const ckETHWalletBalance = useMemo(() => bit10PriceQueries[4].data, [bit10PriceQueries]);

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
                refetchInterval: 10000, // 10 sec.
            },
            {
                queryKey: ['ethPrice'],
                queryFn: () => fetchPayWithPrice('ETH'),
                refetchInterval: 10000,
            },
            {
                queryKey: ['icpPrice'],
                queryFn: () => fetchPayWithPrice('ICP'),
                refetchInterval: 10000,
            },
        ],
    });

    const btcAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
    const ethAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);
    const icpAmount = useMemo(() => payWithPriceQueries[2].data, [payWithPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            payment_token: 'ICP',
            receive_amount: '1',
            receive_token: 'BIT10.TOP'
        },
    });

    const payWithTokenImg = (): StaticImageData => {
        const paymentMethod = form.watch('payment_token');
        if (paymentMethod === 'ICP') {
            return ICPImg;
        } else if (paymentMethod === 'ckBTC') {
            return CkBTCImg;
        } else if (paymentMethod === 'ckETH') {
            return CkETHImg;
        } else {
            return CkBTCImg;
        }
    };

    const payingTokenImg = payWithTokenImg();

    const payWithTokenPrice = (): string => {
        const paymentMethod = form.watch('payment_token');
        if (paymentMethod === 'ICP') {
            return icpAmount ?? '0';
        } else if (paymentMethod === 'ckBTC') {
            return btcAmount ?? '0';
        } else if (paymentMethod === 'ckETH') {
            return ethAmount ?? '0';
        } else {
            return '0';
        }
    };

    const payingTokenPrice = payWithTokenPrice();

    const payWithTokenBalance = (): string => {
        const paymentMethod = form.watch('payment_token');
        if (paymentMethod === 'ICP') {
            return icpWalletBalance ?? '0';
        } else if (paymentMethod === 'ckBTC') {
            return ckBTCWalletBalance ?? '0';
        } else if (paymentMethod === 'ckETH') {
            return ckETHWalletBalance ?? '0';
        } else {
            return '0';
        }
    };

    const payingTokenBalance = payWithTokenBalance();

    const bit10TokenPrice = (): number => {
        const bit10Token = form.watch('receive_token');
        if (bit10Token === 'BIT10.DEFI') {
            return bit10DEFIPrice ?? 0;
        }
        else if (bit10Token === 'BIT10.TOP') {
            return bit10TOPPrice ?? 0;
        }
        else {
            return 0;
        }
    };

    const selectedBit10TokenPrice = bit10TokenPrice();

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

    const filteredPaymentTokens = useMemo(() => {
        const query = paymentTokenSearch.toLowerCase();
        return paymentToken.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query) ||
            token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
        );
    }, [paymentTokenSearch]);

    const filteredReceiveTokens = useMemo(() => {
        const query = receiveTokenSearch.toLowerCase();
        return bit10Token.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
    }, [receiveTokenSearch]);

    const formatAddress = (id: string) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 9)}.....${id.slice(-9)}`;
    };

    const fromAmount = (Number(form.watch('receive_amount')) * Number(selectedBit10TokenPrice)) / parseFloat(payingTokenPrice) * 1.01; // 1% management fee
    const swapDisabledConditions = !isConnected || !principalId || swaping || payingTokenPrice == '0' || selectedBit10TokenPrice == 0 || fromAmount > Number(payingTokenBalance) || fromAmount >= ((Number(payingTokenBalance) * 1.01) + 0.002);

    const getSwapMessage = (): string => {
        const balance = Number(payingTokenBalance || 0);

        if (fromAmount >= balance || fromAmount >= (balance * 1.01) + 0.002 && !swaping) {
            return 'Your balance is too low for this transaction';
        }
        if (swaping) {
            return 'Swapping...';
        }
        return 'Swap';
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSwaping(true);

            const ckBTCLegerCanisterId = 'mxzaz-hqaaa-aaaar-qaada-cai';
            const ckETHLegerCanisterId = 'ss2fx-dyaaa-aaaar-qacoq-cai';
            const ICPLegerCanisterId = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
            const swapCanisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

            const hasAllowed = await window.ic.plug.requestConnect({
                whitelist: [ckBTCLegerCanisterId, ckETHLegerCanisterId, ICPLegerCanisterId, swapCanisterId]
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (hasAllowed && btcAmount && ethAmount && icpAmount) {
                toast.info('Allow the transaction on your wallet to proceed.');

                let selectedCanisterId;

                if (values.payment_token === 'ckBTC') {
                    selectedCanisterId = ckBTCLegerCanisterId;
                } else if (values.payment_token === 'ckETH') {
                    selectedCanisterId = ckETHLegerCanisterId;
                } else if (values.payment_token === 'ICP') {
                    selectedCanisterId = ICPLegerCanisterId;
                } else {
                    throw new Error('Invalid payment method');
                }

                const actor = await window.ic.plug.createActor({
                    canisterId: selectedCanisterId,
                    interfaceFactory: idlFactory,
                }) as ICRC2ActorType;

                let selectedAmount;

                if (values.payment_token === 'ckBTC') {
                    selectedAmount = ((parseFloat(values.receive_amount) * selectedBit10TokenPrice) / parseFloat(btcAmount) * 1.5); // More in case of sudden price change
                } else if (values.payment_token === 'ckETH') {
                    selectedAmount = ((parseFloat(values.receive_amount) * selectedBit10TokenPrice) / parseFloat(ethAmount) * 1.5);
                } else if (values.payment_token === 'ICP') {
                    selectedAmount = ((parseFloat(values.receive_amount) * selectedBit10TokenPrice) / parseFloat(icpAmount) * 1.5);
                } else {
                    throw new Error('Invalid payment method');
                }

                const price = selectedAmount;
                const amount = Math.round(price * 100000000).toFixed(0);
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

                    const args2 = {
                        tick_in_name: values.payment_token,
                        tick_out_name: values.receive_token,
                        tick_out_amount: Number(values.receive_amount)
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    const transfer = await actor2.mb_swap(args2);

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
                            toast.success('Token swap was successful!');
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
            setSwaping(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setSwaping(false);
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
                                        <div>Pay with</div>
                                        <div className='flex flex-row space-x-1 items-center'>
                                            <Wallet size={16} />
                                            <p>{formatTokenAmount(Number(payingTokenBalance))}</p>
                                        </div>
                                    </div>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                        <div className='text-4xl text-center md:text-start'>
                                            {selectedBit10TokenPrice ? formatTokenAmount((parseInt(form.watch('receive_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.03) : '0'}
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
                                                                            placeholder='Search tokens by name, symbol, or address'
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
                                                                                        className='flex flex-row items-center justify-start py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setPaymentTokenDialogOpen(false);
                                                                                            setPaymentTokenSearch('');
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
                                                <Image src={payingTokenImg} alt={form.watch('payment_token')} width={75} height={75} className='z-20 border-[3px] dark:border-[#B0B0B0] bg-white rounded-full p-0.5' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <div className='flex flex-row space-x-1'>
                                                        $ {selectedBit10TokenPrice ? formatTokenAmount((parseInt(form.watch('receive_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))) * 1.03) : '0'}
                                                        <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                    Price  {form.watch('payment_token')} + 1% Management fee <br />
                                                    $ {formatTokenAmount(parseFloat(form.watch('receive_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? 'N/A'))} + $ {formatTokenAmount(0.01 * (parseFloat(form.watch('receive_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')))} = $ {formatTokenAmount((parseFloat(form.watch('receive_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')) + (0.01 * (parseFloat(form.watch('receive_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0'))))}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div>
                                            1 {form.watch('payment_token')} = $ {formatTokenAmount(parseFloat(payingTokenPrice))}
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
                                                                            placeholder='Search tokens by name, symbol, or address'
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
                                                                                        className='flex flex-row items-center justify-start py-6'
                                                                                        onClick={() => {
                                                                                            field.onChange(token.value);
                                                                                            setReceiveTokenDialogOpen(false);
                                                                                            setReceiveTokenSearch('');
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
                                                <Image src={BIT10Img as StaticImageData} alt='BIT10' width={75} height={75} className='z-20' />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                        <div>$ {formatTokenAmount((parseInt(form.watch('receive_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))))}</div>
                                        <div>
                                            1 {form.watch('receive_token')} = $ {formatTokenAmount(selectedBit10TokenPrice)}
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
                                            <div>1 {form.watch('payment_token')} = {selectedBit10TokenPrice > 0 ? formatTokenAmount(parseFloat(payingTokenPrice) / selectedBit10TokenPrice) : '0'} {form.watch('receive_token')}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Expected Time</div>
                                            <div>1-2 min.</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                            <div>Expected Output</div>
                                            <div>{formatTokenAmount(parseFloat(form.watch('receive_amount')))} {form.watch('receive_token')}</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                        <div className='flex flex-row space-x-2 w-full items-center pt-2'>
                            <Button className='w-full rounded-lg' disabled={swapDisabledConditions}>
                                {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getSwapMessage()}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    )
}
