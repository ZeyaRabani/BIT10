import React, { useState, useMemo } from 'react'
import type { LendAndBorrorTableDataType } from '@/components/ui/data-table-lend-and-borrow'
import { useChain } from '@/context/ChainContext'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useQueries } from '@tanstack/react-query'
import { useICPWallet } from '@/context/ICPWalletContext'
import { fetchICPTokenBalance, createICPLendTransaction } from './icp/ICPLendandBorrowModule'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { formatAmount } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const FormSchema = z.object({
    lend_amount: z
        .preprocess((val) => (val === '' ? undefined : Number(val)), z.number())
        .refine((val) => /^\d+(\.\d{1,6})?$/.test(val.toString()), {
            message: 'Amount must be a number with up to 6 decimal places',
        })
});

export default function Lend({ item }: { item: LendAndBorrorTableDataType }) {
    const [lending, setLending] = useState<boolean>(false);

    const { chain } = useChain();
    const { ICPAddress } = useICPWallet();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            lend_amount: 0.01
        },
    });

    const lendBalanceQueries = useQueries({
        queries: [
            // For ckUSDC
            {
                queryKey: ['icpBalance', ICPAddress, 'eegan-kqaaa-aaaap-qhmgq-cai'],
                queryFn: () => {
                    if (!ICPAddress || chain !== 'icp') return '0';
                    return fetchICPTokenBalance('eegan-kqaaa-aaaap-qhmgq-cai', ICPAddress);
                },
                enabled: !!ICPAddress && chain === 'icp',
                refetchInterval: 10000, // 10 seconds
            }
        ],
    });

    const fetchTokenBalance = useMemo(() => {
        if (!chain) return 0;

        // For ICP
        if (item.token_chain === 'ICP' && chain === 'icp' && item.token_address === 'eegan-kqaaa-aaaap-qhmgq-cai') {
            return lendBalanceQueries[0].data ?? 0;
        }
        else {
            return 0;
        }
    }, [chain, lendBalanceQueries, item.token_address, item.token_chain]);

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setLending(true);
            if (chain === 'icp' && ICPAddress) {
                await createICPLendTransaction({ values: values, tokenAddress: item.token_address, address: ICPAddress, chain: item.token_chain });
            } else {
                toast.error('Unsupported chain');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred during the lending. Please try again!');
        } finally {
            setLending(false);
        }
    };

    const lendTokenSourceChain = (): string | undefined => {
        const sourceChain = item.token_chain;
        if (sourceChain === 'ICP') {
            return 'icp';
        }
        else {
            return undefined;
        }
    };

    const lendTokenChain = lendTokenSourceChain();

    const lendDisabledConditions = !chain || chain !== lendTokenChain || lending || form.watch('lend_amount') >= (Number(fetchTokenBalance) * 1.01) || form.watch('lend_amount') <= 0;

    const getLendMessage = (): string => {
        const lendingAmount = Number(form.watch('lend_amount'));
        const balance = Number(fetchTokenBalance);

        if (!chain) return 'Connect your wallet to continue';
        // ToDo: Temp, remove this when supported
        if (item.token_chain !== 'ICP') return `Lending will be available on ${item.token_chain} soon`;
        if (chain !== lendTokenChain) return `Connect wallet on ${item.token_chain} to continue`;
        if (lendingAmount >= balance || lendingAmount >= balance * 1.01 && !lending) return 'Your balance is too low for lending';
        if (lendingAmount <= 0) return 'Amount too low';
        if (lending) return 'Lending...';
        return 'Lend';
    };

    return (
        <Dialog>
            <DialogTrigger>
                <Button>Lend Token</Button>
            </DialogTrigger>
            <DialogContent className='max-w-[90vw] md:max-w-lg'>
                <DialogHeader>
                    <DialogTitle>Lend Token</DialogTitle>
                    <DialogDescription>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                                <div className='flex flex-col space-y-2 pt-2'>
                                    <FormField
                                        control={form.control}
                                        name='lend_amount'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lending amount</FormLabel>
                                                <FormControl>
                                                    <Input className='dark:border-white' placeholder='Lending amount' {...field} type='number' />
                                                </FormControl>
                                                <FormDescription>
                                                    Number of tokens you want to lend
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className='bg-blue-200 flex flex-col space-y-1 rounded border-2 border-blue-600 text-black p-2'>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Selected Token</div>
                                            <div>{item.token_name} (on {item.token_chain})</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Current APY</div>
                                            <div>{item.apy}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Estimated Earnings</div>
                                            <div>{formatAmount(form.watch('lend_amount') * (parseFloat(item.apy) / 100) * (7 / 365))} (per 7 days)</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Pool Liquidity</div>
                                            <div>{item.available_liquidity} {item.token_name}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Minimum lock-in</div>
                                            <div>7 days</div>
                                        </div>
                                    </div>

                                    <Button className='w-full rounded-lg' disabled={lendDisabledConditions}>
                                        {lending && <Loader2 className='animate-spin mr-2' size={15} />}
                                        {getLendMessage()}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
