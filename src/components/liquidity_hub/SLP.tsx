import React, { useState } from 'react'
import * as z from 'zod'
import { useWallet } from '@/context/WalletContext'
import { useQueries } from '@tanstack/react-query'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { idlFactory as idlFactory2 } from '@/lib/liquidity_hub.did'
import crypto from 'crypto'
import { newLiquidityProvider, userStakedLiquidityHistory } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Image, { type StaticImageData } from 'next/image'
import BIT10Img from '@/assets/swap/bit10.svg'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable } from '@/components/ui/data-table-slp'
import type { SLPTableDataType } from '@/components/ui/data-table-slp'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const SLPTableColumns: ColumnDef<SLPTableDataType>[] = [
    {
        accessorKey: 'liquidation_type',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Liquidation Type' />
        ),
    },
    {
        accessorKey: 'staked_amount',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Staked Amount' />
        ),
    },
    // {
    //     accessorKey: 'duration',
    //     header: ({ column }) => (
    //         <DataTableColumnHeader column={column} title='Stake Duration' info='Duration of Staking (in days)' />
    //     ),
    // },
    {
        accessorKey: 'staked_on',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Staked on' />
        ),
    }
]

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

const tickIn = [
    { label: 'BIT10.BTC', value: 'BIT10.BTC', img: BIT10Img as StaticImageData }
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
    staking_duration: z.number({
        required_error: 'Please select the number of days to stake'
    }).min(1, { message: 'Staking duration must be at least 1 day' })
        .positive({ message: 'Staking duration must be a positive number' })
})

const FormWithdrawSchema = z.object({
    // withdraw_liquidity_chain: z.string({
    //     required_error: 'Please select a chain',
    // }),
    withdraw_liquidity_token: z.string({
        required_error: 'Please select a token',
    }),
    withdraw_liquidity_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        required_error: 'Please enter the number of tokens.',
    })
        .positive('The amount must be a positive number')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
})

export default function SLP() {
    const [processing, setProcessing] = useState<boolean>(false);
    const [withdrawing, setWithdrawing] = useState<boolean>(false);

    const { principalId } = useWallet();

    const fetchSLPHistory = async () => {
        try {
            if (!principalId) {
                toast.error('Please connect your wallet first');
                return [];
            }

            const response = await userStakedLiquidityHistory({ userAddress: principalId });
            if (response === 'Error fetching user staked liquidity history') {
                toast.error('An error occurred while fetching user recent activity. Please try again!');
            } else {
                return response as SLPTableDataType[];
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Failed to fetch staking history. Please try again later.');
            return [];
        }
    }

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFITokenList'],
                queryFn: () => fetchSLPHistory()
            }
        ]
    })

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10SLPHistory = bit10Queries[0].data as [];

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            liquidity_token: 'BIT10.BTC',
            liquidity_amount: 0.03,
            staking_duration: 1
        },
    });

    const withdrawForm = useForm<z.infer<typeof FormWithdrawSchema>>({
        resolver: zodResolver(FormWithdrawSchema),
        defaultValues: {
            withdraw_liquidity_token: 'BIT10.BTC',
            withdraw_liquidity_amount: 0.03
        },
    });

    const liquidityTokenImg = (): StaticImageData => {
        const liquidityName = form.watch('liquidity_token');
        if (liquidityName === 'BIT10.BTC') {
            return BIT10Img as StaticImageData;
        } else {
            return BIT10Img as StaticImageData;
        }
    };

    const liquidityImg = liquidityTokenImg();

    const stakeDisabledConditions = processing;

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setProcessing(true);
            const bit10BTCCanisterId = 'eegan-kqaaa-aaaap-qhmgq-cai'
            const teLiquidityHubCanisterId = 'jskxc-iiaaa-aaaap-qpwrq-cai'

            const hasAllowed = await window.ic.plug.requestConnect({
                whitelist: [bit10BTCCanisterId, teLiquidityHubCanisterId]
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (hasAllowed) {
                toast.info('Allow the transaction on your wallet to proceed.');

                const selectedCanisterId = bit10BTCCanisterId;

                const actor = await window.ic.plug.createActor({
                    canisterId: selectedCanisterId,
                    interfaceFactory: idlFactory,
                }) as ICRC2ActorType;

                const selectedAmount = values.liquidity_amount * 1.5; // More in case of sudden price change

                const price = selectedAmount;
                const amount = Math.round(price * 100000000).toFixed(0);
                const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

                const args = {
                    spender: {
                        owner: Principal.fromText(teLiquidityHubCanisterId),
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

                if (approve.Ok && principalId) {
                    toast.success('Approval was successful! Proceeding with transfer...');

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const actor2 = await window.ic.plug.createActor({
                        canisterId: teLiquidityHubCanisterId,
                        interfaceFactory: idlFactory2,
                    });

                    const tickInAmountNat = Math.round(values.liquidity_amount * 100000000).toFixed(0);

                    const args2 = {
                        tick_in_name: values.liquidity_token,
                        tick_in_amount: Number(tickInAmountNat),
                        duration: values.staking_duration,
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    const transfer = await actor2.te_slp(args2);

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if (transfer.Ok) {
                        const uuid = crypto.randomBytes(16).toString('hex');
                        const generateNewLiquidityId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
                        const newLiquidityId = 'liquidity_' + generateNewLiquidityId;

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                        const principal = Principal.fromUint8Array(transfer.Ok.tick_in_address._arr);
                        const textualRepresentation = principal.toText();

                        const formatTimestamp = (nanoseconds: string): string => {
                            const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                            const date = new Date(Number(milliseconds));

                            return date.toISOString().replace('T', ' ').replace('Z', '+00');
                        };

                        const result = await newLiquidityProvider({
                            newLiquidationId: newLiquidityId,
                            tickInAddress: textualRepresentation,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                            tickInName: transfer.Ok.tick_in_name,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                            tickInAmount: transfer.Ok.tick_in_amount,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                            duration: transfer.Ok.duration,
                            tickInNetwork: 'ICP',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                            tickInTxBlock: transfer.Ok.tick_in_block.toString(),
                            liquidationType: 'Staked Liquidity',
                            liquidationMode: 'Stake',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                            transactionTimestamp: formatTimestamp(transfer.Ok.tick_in_timestamp)
                        })

                        if (result === 'Staking successfully') {
                            toast.success('Tokens staked successfully!');
                        } else {
                            toast.error('An error occurred while processing your request. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    } else if (transfer.Err) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        const errorMessage = String(transfer.Err);
                        if (errorMessage.includes('Insufficient withdrawable balance')) {
                            toast.error('Insufficient funds');
                        } else {
                            toast.error('An error occurred while processing your request. Please try again!');
                        }
                    }
                } else {
                    toast.error('Approval failed.');
                }
            } else {
                toast.error('Transfer failed.');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setProcessing(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setProcessing(false);
        }
    }

    async function withdrawOnSubmit(values: z.infer<typeof FormWithdrawSchema>) {
        try {
            setWithdrawing(true);
            const liquidityHubCanisterId = 'jskxc-iiaaa-aaaap-qpwrq-cai'

            const hasAllowed = await window.ic.plug.requestConnect({
                whitelist: [liquidityHubCanisterId]
            });

            toast.info('Allow the transaction on your wallet to proceed.');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (hasAllowed) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const actor = await window.ic.plug.createActor({
                    canisterId: liquidityHubCanisterId,
                    interfaceFactory: idlFactory2,
                });

                const tickOutAmountNat = Math.round(values.withdraw_liquidity_amount * 100000000);

                const args = {
                    tick_out_name: values.withdraw_liquidity_token,
                    tick_out_amount: Number(tickOutAmountNat)
                };

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const transfer = await actor.te_slp_withdraw(args);

                console.log(transfer)

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (transfer.Ok) {
                    const uuid = crypto.randomBytes(16).toString('hex');
                    const generateNewLiquidityId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
                    const newLiquidityId = 'liquidity_' + generateNewLiquidityId;

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    const principal = Principal.fromUint8Array(transfer.Ok.tick_out_address._arr);
                    const textualRepresentation = principal.toText();

                    const formatTimestamp = (nanoseconds: string): string => {
                        const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                        const date = new Date(Number(milliseconds));

                        return date.toISOString().replace('T', ' ').replace('Z', '+00');
                    };

                    const result = await newLiquidityProvider({
                        newLiquidationId: newLiquidityId,
                        tickInAddress: textualRepresentation,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        tickInName: transfer.Ok.tick_out_name,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        tickInAmount: transfer.Ok.tick_out_amount,
                        duration: 0,
                        tickInNetwork: 'ICP',
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                        tickInTxBlock: transfer.Ok.tick_out_block.toString(),
                        liquidationType: 'Staked Liquidity',
                        liquidationMode: 'Withdraw',
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                        transactionTimestamp: formatTimestamp(transfer.Ok.tick_out_time)
                    })

                    if (result === 'Staking successfully') {
                        toast.success('Tokens staked successfully!');
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                } else if (transfer.Err) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const errorMessage = String(transfer.Err);
                    if (errorMessage.includes('Insufficient withdrawable balance. Available:')) {
                        toast.error('Insufficient withdrawable balance');
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                }
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            console.log(error)
            setWithdrawing(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setWithdrawing(false);
        }
    }

    return (
        <div>
            {
                isLoading ?
                    <div className='flex w-full'>
                        <Card className='dark:border-white w-full lg:col-span-1 animate-fade-left-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    :
                    <div className={bit10SLPHistory.length > 0 ? 'flex flex-col lg:grid lg:grid-cols-6 gap-4 pb-4' : 'pb-4'}>
                        <div className={bit10SLPHistory.length > 0 ? 'lg:col-span-2' : 'flex flex-col py-4 items-center justify-center'}>
                            <Card className={bit10SLPHistory.length > 0 ? 'animate-fade-bottom-up' : 'w-[300px] md:w-[500px]'}>
                                <CardHeader>
                                    <CardTitle className='flex flex-row items-center justify-between'>
                                        <div>Staked Liquidity Provider</div>
                                    </CardTitle>
                                    <CardDescription>Lock your assets for a fixed duration and earn boosted rewards from platform fees. The more you stake, the more rewards you receive. You can claim the rewards weekly.</CardDescription>
                                </CardHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                                        <CardContent>
                                            <div className='rounded-lg border-2 py-4 px-6 z-[1] flex flex-col space-y-3'>
                                                <div className='flex flex-col'>
                                                    <div>Staking Token</div>
                                                    <div className='grid grid-cols-5 items-center'>
                                                        <div className='col-span-4 px-2 border-2 rounded-l-full z-10 w-full md:w-[105%]'>
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
                                                                            <PopoverContent className='w-[180px] md:w-72 p-0 ml-10'>
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
                                                        <div className='col-span-1 -ml-6 md:-ml-0 z-20'>
                                                            <Image src={liquidityImg} alt='BIT10' width={75} height={75} className='z-20 bg-white rounded-full' />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='flex flex-col space-y-1'>
                                                    <div>Token Amount</div>
                                                    <div>
                                                        <FormField
                                                            control={form.control}
                                                            name='liquidity_amount'
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input {...field} placeholder='Tokens to stake' className='dark:border-white' />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className='flex flex-col space-y-1'>
                                                    <div>Staking duration (in days)</div>
                                                    <div>
                                                        <FormField
                                                            control={form.control}
                                                            name='staking_duration'
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input 
                                                                            {...field}
                                                                            placeholder='Token staking duration' 
                                                                            className='dark:border-white' 
                                                                            type='number'
                                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className='w-full' disabled={stakeDisabledConditions}>
                                                {processing && <Loader2 className='animate-spin mr-2' size={15} />}
                                                {processing ? 'Staking...' : 'Stake'}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Form>
                            </Card>
                        </div>
                        <div className={bit10SLPHistory.length > 0 ? 'lg:col-span-4' : 'hidden'}>
                            <Card className='animate-fade-bottom-up'>
                                <CardHeader className='flex flex-col md:flex-row space-y-2 md:space-y-0 items-center justify-between'>
                                    <div className='text-2xl font-semibold leading-none tracking-tight'>Staked Liquidity History</div>
                                    <div>
                                        <Dialog>
                                            <DialogTrigger>
                                                <Button>Withdraw & Claim Tokens</Button>
                                            </DialogTrigger>
                                            <DialogContent className='w-[300px] md:w-[500px]'>
                                                <DialogHeader>
                                                    <DialogTitle>Withdraw & Claim Tokens</DialogTitle>
                                                </DialogHeader>
                                                <div className='flex flex-col space-y-2 max-h-[80vh]'>
                                                    <div className='flex flex-col items-center'>
                                                        <Button>Claim Airdrop</Button>
                                                    </div>
                                                    <div className='bg-primary h-0.5 w-full rounded' />
                                                    <div>
                                                        <div className='text-xl font-semibold tracking-wide pb-2'>Withdraw tokens</div>
                                                        <div>
                                                            <Form {...withdrawForm}>
                                                                <form onSubmit={withdrawForm.handleSubmit(withdrawOnSubmit)} autoComplete='off' className='flex flex-col space-y-2 border-2 rounded-md p-2.5'>
                                                                    <div className='flex flex-col'>
                                                                        <div>Withdrawing Token</div>
                                                                        <div className='grid grid-cols-5 items-center'>
                                                                            <div className='col-span-4 px-2 border-2 rounded-l-full z-10 w-full md:w-[105%]'>
                                                                                <FormField
                                                                                    control={withdrawForm.control}
                                                                                    name='withdraw_liquidity_token'
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
                                                                                                <PopoverContent className='w-[180px] md:w-72 p-0 ml-10'>
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
                                                                            <div className='col-span-1 -ml-6 md:-ml-0 z-20'>
                                                                                <Image src={liquidityImg} alt='BIT10' width={75} height={75} className='z-20 bg-white rounded-full' />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className='flex flex-col space-y-1'>
                                                                        <div>Token Amount</div>
                                                                        <div>
                                                                            <FormField
                                                                                control={withdrawForm.control}
                                                                                name='withdraw_liquidity_amount'
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input {...field} placeholder='Tokens to stake' className='dark:border-white' />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className='flex pt-2 w-full'>
                                                                        <Button type='submit' disabled={withdrawing} className='w-full'>
                                                                            {withdrawing && <Loader2 className='animate-spin mr-2' size={15} />}
                                                                            {withdrawing ? 'Withdrawing...' : 'Withdraw Tokens'}
                                                                        </Button>
                                                                    </div>
                                                                </form>
                                                            </Form>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <DataTable
                                        columns={SLPTableColumns}
                                        data={bit10SLPHistory ?? []}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
            }
        </div>
    )
}
