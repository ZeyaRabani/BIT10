import React, { useState, useMemo, useCallback } from 'react'
import * as z from 'zod'
import { usePrivy } from '@privy-io/react-auth'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { type Program } from '@project-serum/anchor'
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { type TeSwap } from '@/lib/te_swap.idl'
import { useProgram } from '@/context/PrivySwapProgramContextProvider'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronsUpDown, Loader2, Info, Settings, Wallet, MoveLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import SOLImg from '@/assets/swap/sol.svg'
import BIT10Img from '@/assets/swap/bit10.svg'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import crypto from 'crypto'
import { newTokenBuy } from '@/actions/dbActions'

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

interface SwapParams {
    tickInName: string;
    tickOutName: string;
    tickOutAmount: number;
}

const paymentToken = [
    { label: 'SOL', value: 'SOL', img: SOLImg as StaticImageData, address: 'So11111111111111111111111111111111111111111', slug: ['solana'] }
]

const bit10Amount = [
    '1',
    '2',
    '3',
    '4',
    '5'
]

// ToDo: Remove Test BIT10.DEFI
const bit10Token = [
    { label: 'Test BIT10.DEFI', value: 'Test BIT10.DEFI', img: BIT10Img as StaticImageData, address: '5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K', slug: ['top 6 defi'] },
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

export default function PrivySwapModule() {
    const [swaping, setSwaping] = useState<boolean>(false);
    const [slippageDialogOpen, setSlippageDialogOpen] = useState(false);
    const [paymentTokenDialogOpen, setPaymentTokenDialogOpen] = useState(false);
    const [paymentTokenSearch, setPaymentTokenSearch] = useState('');
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState(false);
    const [receiveTokenSearch, setReceiveTokenSearch] = useState('');

    const { authenticated, user } = usePrivy();
    const { program, tokenMint } = useProgram();
    const { connection } = useConnection();

    const fetchBit10Price = useCallback(async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        const data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> };
        return data.tokenPrice ?? 0;
    }, []);

    const fetchTokenBalance = useCallback(
        async (address: string) => {
            try {
                if (address === 'So11111111111111111111111111111111111111111') {
                    const userPublicKey = user?.wallet?.address;
                    if (!userPublicKey) {
                        toast.error('User wallet not connected.');
                        return '0';
                    }
                    const publicKey = new PublicKey(userPublicKey);
                    const balanceLamports = await connection.getBalance(publicKey);
                    const balanceSOL = formatTokenAmount(balanceLamports / LAMPORTS_PER_SOL);

                    return balanceSOL;
                } else {
                    toast.error('Fetching SPL token balance not implemented in this function.');
                    return '0';
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error('An error occurred while fetching user wallet balance. Please try again!');
                return '0';
            }
        },
        [user, connection]
    );

    const bit10PriceQueries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFITokenPrice'],
                queryFn: () => fetchBit10Price('bit10-latest-price-defi'),
                refetchInterval: 1800000, // 30 min.
            },
            {
                queryKey: ['solTokenPrice'],
                queryFn: () => fetchTokenBalance('So11111111111111111111111111111111111111111'),
                refetchInterval: 1800000, // 30 min.
            }
        ],
    });

    const isLoading = useMemo(() => bit10PriceQueries.some(query => query.isLoading), [bit10PriceQueries]);
    const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);
    const solWalletBalance = useMemo(() => bit10PriceQueries[1].data, [bit10PriceQueries]);

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
                queryKey: ['solPrice'],
                queryFn: () => fetchPayWithPrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            },
        ],
    });

    const solAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            slippage: 3,
            payment_token: 'SOL',
            receive_amount: '1',
            receive_token: 'Test BIT10.DEFI'
        },
    });

    const payWithTokenImg = (): StaticImageData => {
        const payWithToken = form.watch('payment_token');
        if (payWithToken === 'SOL') {
            return SOLImg as StaticImageData;
        } else {
            return SOLImg as StaticImageData;
        }
    };

    const payingTokenImg = payWithTokenImg();

    const payWithTokenPrice = (): string => {
        return solAmount ?? '0';
    };

    const payingTokenPrice = payWithTokenPrice();

    const payWithTokenBalance = (): string => {
        return solWalletBalance ?? '0';
    };

    const payingTokenBalance = payWithTokenBalance();

    const bit10TokenPrice = (): number => {
        const bit10Token = form.watch('receive_token');
        if (bit10Token === 'Test BIT10.DEFI') {
            return bit10DEFIPrice ?? 0;
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

    const swapDisabledConditions = !authenticated || swaping || payingTokenPrice == '0' || selectedBit10TokenPrice == 0;

    async function executeSwap(program: Program<TeSwap>, tokenMint: PublicKey, params: SwapParams) {
        const { tickInName, tickOutName, tickOutAmount } = params;

        const swapResultKeypair = Keypair.generate();

        const user = program.provider.publicKey!;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [smartContractPda, _] = PublicKey.findProgramAddressSync(
            [Buffer.from('smart_contract_seed')],
            program.programId
        );

        const smartContractTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            smartContractPda,
            true
        );

        const userTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            user
        );

        const userTokenAccountInfo = await program.provider.connection.getAccountInfo(userTokenAccount);
        if (!userTokenAccountInfo) {
            const createUserAccountTx = new anchor.web3.Transaction().add(
                createAssociatedTokenAccountInstruction(
                    user,
                    userTokenAccount,
                    user,
                    tokenMint
                )
            );
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await program.provider.sendAndConfirm(createUserAccountTx);
        }

        const recipient = new PublicKey('Cq6JPmEspG6oNcUC47WHuEJWU1K4knsLzHYHSfvpnDHk');
        const recipientTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            recipient
        );

        const recipientTokenAccountInfo = await program.provider.connection.getAccountInfo(recipientTokenAccount);
        if (!recipientTokenAccountInfo) {
            const createAccountTx = new anchor.web3.Transaction().add(
                createAssociatedTokenAccountInstruction(
                    user,
                    recipientTokenAccount,
                    recipient,
                    tokenMint
                )
            );
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await program.provider.sendAndConfirm(createAccountTx);
        }

        try {
            const tx = await program.methods
                .swap({
                    tickInName,
                    tickOutName,
                    tickOutAmount: new BN(tickOutAmount),
                })
                .accounts({
                    swapResult: swapResultKeypair.publicKey,
                    user,
                    systemProgram: SystemProgram.programId,
                    payer: user,
                    recipient,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    recipientTokenAccount,
                    smartContractPda,
                    smartContractTokenAccount,
                    userTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    mint: tokenMint,
                })
                .signers([swapResultKeypair])
                .rpc();

            const result = await program.account.swapResult.fetch(swapResultKeypair.publicKey);

            return { success: true, transactionId: tx, swapResult: result };
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
            return { success: false, error };
        }
    }

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSwaping(true);
            toast.info('Processing your transaction. Please wait for confirmation.');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const transfer = await executeSwap(program, tokenMint, {
                tickInName: values.payment_token,
                tickOutName: values.receive_token,
                tickOutAmount: Number(values.receive_amount)
            });

            if (transfer.swapResult) {
                const uuid = crypto.randomBytes(16).toString('hex');
                const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
                const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

                const formatTimestamp = (seconds: string): string => {
                    const milliseconds = BigInt(seconds) * BigInt(1_000);
                    const date = new Date(Number(milliseconds));

                    return date.toISOString().replace('T', ' ').replace('Z', '+00');
                };

                const result = await newTokenBuy({
                    newTokenBuyId: newTokenSwapId,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    principalId: user?.wallet?.address.toString(),
                    tickInName: transfer.swapResult.tickInName,
                    tickInAmount: transfer.swapResult.tickInAmount.toString(),
                    tickInUSDAmount: transfer.swapResult.tickInUsdAmount.toString(),
                    tickInTxBlock: transfer.transactionId.toString(),
                    tickOutName: transfer.swapResult.tickOutName,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    tickOutAmount: transfer.swapResult.tickOutAmount.words[0].toString(),
                    tickOutTxBlock: transfer.transactionId.toString(),
                    transactionType: transfer.swapResult.transactionType as 'Swap' | 'Reverse Swap',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    network: transfer.swapResult.network,
                    transactionTimestamp: formatTimestamp(transfer.swapResult.transactionTimestamp)
                });

                await fetch('/bit10-token-request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        newTokenSwapId: newTokenSwapId,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        principalId: user?.wallet?.address.toString(),
                        tickOutName: transfer.swapResult.tickOutName,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                        tickOutAmount: transfer.swapResult.tickOutAmount.words[0].toString(),
                        transactionTimestamp: new Date().toISOString(),
                    }),
                });

                if (result === 'Token swap successfully') {
                    toast.success('Token swap was successful!');
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }
            } else {
                toast.error('Transction approval failed.');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setSwaping(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setSwaping(false);
        }
    }

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

    return (
        <div className='flex flex-col items-center justify-center py-4'>
            {isLoading ? (
                <Card className='w-[300px] md:w-[580px] px-2 pt-6 animate-fade-bottom-up'>
                    <CardContent className='flex flex-col space-y-2'>
                        {['h-12', 'h-32', 'h-32', 'h-16', 'h-12'].map((classes, index) => (
                            <Skeleton key={index} className={classes} />
                        ))}
                    </CardContent>
                </Card>
            ) : (
                <Card className='w-[300px] md:w-[580px] animate-fade-bottom-up rounded-lg'>
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
                                                    <Image src={payingTokenImg} alt={form.watch('payment_token')} width={75} height={75} className='z-20' />
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
                                                        Price in {form.watch('payment_token')} + 1% Management fee <br />
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
                                                    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                                                    <Image src={BIT10Img} alt='BIT10' width={75} height={75} className='z-20' />
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
                                                <div>{formatTokenAmount(parseFloat(form.watch('receive_amount') || '0') * (1 - Number(form.watch('slippage') || 0) / 100))}</div>
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
                                                <div>1 {form.watch('payment_token')} = {selectedBit10TokenPrice > 0 ? formatTokenAmount(parseFloat(payingTokenPrice) / selectedBit10TokenPrice) : '0'} {form.watch('receive_token')}</div>
                                            </div>
                                            <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                                <div>Expected Output</div>
                                                <div>{formatTokenAmount(parseFloat(form.watch('receive_amount')))} {form.watch('receive_token')}</div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                            <CardFooter className='flex flex-row space-x-2 w-full items-center'>
                                <Button className='w-full rounded-lg' disabled={swapDisabledConditions}>
                                    {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                                    {swaping ? 'Swaping...' : 'Swap'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            )}
        </div>
    )
}
