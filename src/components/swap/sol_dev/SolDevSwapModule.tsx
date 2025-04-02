import React, { useState, useMemo, useCallback } from 'react'
import * as z from 'zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { type Program } from '@project-serum/anchor'
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js'
import { type TeSwap } from '@/lib/te_swap.idl'
import { useProgram } from '@/context/SOLSwapProgramContextProvider'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronsUpDown, Check, Loader2, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import SOLImg from '@/assets/swap/sol.svg'
import BIT10Img from '@/assets/swap/bit10.svg'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import crypto from 'crypto'
import { newTokenSwap } from '@/actions/dbActions'

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

// const tabs = ['Quick Swap', 'Advanced Trading']

const paymentMethod = [
    { label: 'SOL', value: 'SOL', img: SOLImg as StaticImageData }
]

const bit10Amount = [
    '1',
    '2',
    '3',
    '4',
    '5'
]

// const bit10Token = [
//     'Test BIT10.DEFI',
//     'Test BIT10.BRC20',
//     'Test BIT10.TOP',
//     'Test BIT10.MEME'
// ]

const bit10Token = [
    { label: 'Test BIT10.DEFI', value: 'Test BIT10.DEFI', img: BIT10Img as StaticImageData },
    // { label: 'Test BIT10.BRC20', value: 'Test BIT10.BRC20', img: BIT10Img as StaticImageData },
    // { label: 'Test BIT10.TOP', value: 'Test BIT10.TOP', img: BIT10Img as StaticImageData },
    // { label: 'Test BIT10.MEME', value: 'Test BIT10.MEME', img: BIT10Img as StaticImageData },
]

const FormSchema = z.object({
    payment_method: z.string({
        required_error: 'Please select a payment method',
    }),
    bit10_amount: z.string({
        required_error: 'Please select the number of BIT10 tokens to receive',
    }),
    bit10_token: z.string({
        required_error: 'Please select the BIT10 token to receive',
    }),
});

export default function SolDevSwapModule() {
    // const [activeTab, setActiveTab] = useState('Quick Swap');
    const [swaping, setSwaping] = useState<boolean>(false);

    const { connected } = useWallet();
    const wallet = useWallet();
    const { program, tokenMint } = useProgram();

    // const handleTabChange = (label: string | null) => {
    //   if (label) {
    //     setActiveTab(label)
    //   }
    // }

    const fetchBit10Price = useCallback(async (tokenPriceAPI: string) => {
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
                queryFn: () => fetchBit10Price('bit10-latest-price-defi'),
                refetchInterval: 1800000, // 30 min.
            },
            // {
            //     queryKey: ['bit10BRC20TokenPrice'],
            //     queryFn: () => fetchBit10Price('bit10-latest-price-brc20'),
            //     refetchInterval: 1800000,
            // },
            // {
            //     queryKey: ['bit10TOPTokenPrice'],
            //     queryFn: () => fetchBit10Price('test-bit10-latest-price-top'),
            //     refetchInterval: 1800000,
            // },
            // {
            //     queryKey: ['bit10MEMETokenPrice'],
            //     queryFn: () => fetchBit10Price('test-bit10-latest-price-meme'),
            //     refetchInterval: 1800000,
            // },
        ],
    });

    const isLoading = useMemo(() => bit10PriceQueries.some(query => query.isLoading), [bit10PriceQueries]);
    const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);
    // const bit10BRC20Price = useMemo(() => bit10PriceQueries[1].data, [bit10PriceQueries]);
    // const bit10TOPPrice = useMemo(() => bit10PriceQueries[2].data, [bit10PriceQueries]);
    // const bit10MEMEPrice = useMemo(() => bit10PriceQueries[3].data, [bit10PriceQueries]);

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
                refetchInterval: 10000, // 10 sec.
            },
        ],
    });

    const solAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            payment_method: 'SOL',
            bit10_amount: '1',
            bit10_token: 'Test BIT10.DEFI'
        },
    });

    const payWithTokenImg = (): StaticImageData => {
        const payWithToken = form.watch('payment_method');
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

    const bit10TokenPrice = (): number => {
        const bit10Token = form.watch('bit10_token');
        if (bit10Token === 'Test BIT10.DEFI') {
            return bit10DEFIPrice ?? 0;
        }
        // else if (bit10Token === 'Test BIT10.BRC20') {
        //     return bit10BRC20Price ?? 0;
        // } else if (bit10Token === 'Test BIT10.TOP') {
        //     return bit10TOPPrice ?? 0;
        // } else if (bit10Token === 'Test BIT10.MEME') {
        //     return bit10MEMEPrice ?? 0;
        // }
        else {
            return 0;
        }
    };

    const selectedBit10TokenPrice = bit10TokenPrice();

    const swapDisabledConditions = !connected || swaping || payingTokenPrice == '0' || selectedBit10TokenPrice == 0;

    async function executeSwap(program: Program<TeSwap>, tokenMint: PublicKey, params: SwapParams) {
        const { tickInName, tickOutName, tickOutAmount } = params;

        const swapResultKeypair = Keypair.generate();

        const user = program.provider.publicKey!;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [smartContractPda, _] = PublicKey.findProgramAddressSync(
            [Buffer.from("smart_contract_seed")],
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
            toast.info('Allow the transaction on your wallet to proceed.');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const transfer = await executeSwap(program, tokenMint, {
                tickInName: values.payment_method,
                tickOutName: values.bit10_token,
                tickOutAmount: Number(values.bit10_amount)
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

                const result = await newTokenSwap({
                    newTokenSwapId: newTokenSwapId,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    principalId: wallet.publicKey.toString(),
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
                        ICPAddress: wallet.publicKey.toString(),
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
                toast.error('Approval failed.');
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
        <>

            {/* <div className='grid place-content-center'>
    <div className='relative flex flex-row space-x-2 items-center justify-center border rounded px-2 py-1'>
      <AnimatedBackground
        defaultValue='Quick Swap'
        className='rounded bg-primary'
        transition={{
          ease: 'easeInOut',
          duration: 0.2,
        }}
        onValueChange={(newActiveId) => handleTabChange(newActiveId)}
      >
        {tabs.map((label, index) => (
          <button
            key={index}
            data-id={label}
            type='button'
            className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}
          >
            {label}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  </div>

  {activeTab === 'Quick Swap' && <div> Quick Swap </div>}
  {activeTab === 'Advanced Trading' && <div> Advanced Trading </div>} */}

            <div className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
                {isLoading ? (
                    <Card className='w-[300px] md:w-[580px] px-2 pt-6 animate-fade-bottom-up'>
                        <CardContent className='flex flex-col space-y-2'>
                            {['h-24', 'h-32', 'h-32', 'h-12'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className='w-[300px] md:w-[580px] animate-fade-bottom-up'>
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                            </CardTitle>
                            <CardDescription>BIT10 exchange</CardDescription>
                        </CardHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                                <CardContent className='flex flex-col space-y-2'>
                                    <div className='rounded-lg border-2 py-2 px-6'>
                                        <p>Pay with</p>
                                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                            <div className='text-4xl text-center md:text-start'>
                                                {selectedBit10TokenPrice ? ((parseInt(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.03).toFixed(6) : '0'}
                                            </div>

                                            <div className='grid grid-cols-5 items-center'>
                                                <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                                                    <FormField
                                                        control={form.control}
                                                        name='payment_method'
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
                                                                                    ? paymentMethod.find(
                                                                                        (paymentMethod) => paymentMethod.value === field.value
                                                                                    )?.label
                                                                                    : 'Select token'}
                                                                                <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                            </Button>
                                                                        </FormControl>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className='w-[180px] p-0 ml-8'>
                                                                        <Command>
                                                                            <CommandInput placeholder='Search token...' />
                                                                            <CommandList>
                                                                                <CommandEmpty>No token found.</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {paymentMethod.map((paymentMethod) => (
                                                                                        <CommandItem
                                                                                            value={paymentMethod.label}
                                                                                            key={paymentMethod.label}
                                                                                            onSelect={() => {
                                                                                                form.setValue('payment_method', paymentMethod.value)
                                                                                            }}
                                                                                        >
                                                                                            <div className='flex flex-row items-center'>
                                                                                                <Image src={paymentMethod.img} alt={paymentMethod.label} width={15} height={15} className='rounded-full bg-white mr-1' />
                                                                                                {paymentMethod.label}
                                                                                            </div>
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    'ml-auto',
                                                                                                    paymentMethod.value === field.value
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
                                                    <Image src={payingTokenImg} alt={form.watch('payment_method')} width={75} height={75} className='z-20' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                            <TooltipProvider>
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <div className='flex flex-row space-x-1'>
                                                            $ {selectedBit10TokenPrice ? ((parseInt(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))) * 1.03).toFixed(4) : '0'}
                                                            <Info className='w-5 h-5 cursor-pointer ml-1' />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                        Price in {form.watch('payment_method')} + 3% Platform fee <br />
                                                        $ {(parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? 'N/A'))} + $ {0.03 * (parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0'))} = $ {(parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')) + (0.03 * (parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')))}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <div>
                                                1 {form.watch('payment_method')} = $ {payingTokenPrice}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='rounded-lg border-2 py-2 px-6'>
                                        <p>Receive</p>
                                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                                            <div className='w-full md:w-3/4'>
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

                                            <div className='grid grid-cols-5 items-center'>
                                                <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                                                    <FormField
                                                        control={form.control}
                                                        name='bit10_token'
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
                                                                                    ? bit10Token.find(
                                                                                        (bit10Token) => bit10Token.value === field.value
                                                                                    )?.label
                                                                                    : 'Select token'}
                                                                                <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                            </Button>
                                                                        </FormControl>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className='w-[200px] p-0 ml-8'>
                                                                        <Command>
                                                                            <CommandInput placeholder='Search token...' />
                                                                            <CommandList>
                                                                                <CommandEmpty>No token found.</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {bit10Token.map((bit10Token) => (
                                                                                        <CommandItem
                                                                                            value={bit10Token.label}
                                                                                            key={bit10Token.label}
                                                                                            onSelect={() => {
                                                                                                form.setValue('bit10_token', bit10Token.value)
                                                                                            }}
                                                                                        >
                                                                                            <div className='flex flex-row items-center'>
                                                                                                <Image src={bit10Token.img} alt={bit10Token.label} width={15} height={15} className='rounded-full bg-white mr-1' />
                                                                                                {bit10Token.label}
                                                                                            </div>
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    'ml-auto',
                                                                                                    bit10Token.value === field.value
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
                                                    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                                                    <Image src={BIT10Img} alt='BIT10' width={75} height={75} className='z-20' />
                                                </div>
                                            </div>
                                        </div>

                                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                                            <div>$ {(parseInt(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))).toFixed(4)}</div>
                                            <div>
                                                1 {form.watch('bit10_token')} = $ {selectedBit10TokenPrice.toFixed(4)}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className='flex flex-row space-x-2 w-full items-center'>
                                    <Button className='w-full' disabled={swapDisabledConditions}>
                                        {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                                        {swaping ? 'Swaping...' : 'Swap'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                )}
            </div>
        </>
    )
}
