"use client"

import React, { useMemo, useCallback } from 'react'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/cashback.did'
import { useQueries, type UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface Transaction {
    token_in_amount: string;
    transaction_type: string;
    token_in_address: string;
    token_out_address: string;
    token_in_tx_hash: string;
    network: string;
    swap_id: string;
    token_out_tx_hash: string;
    user_wallet_address: string;
    transaction_timestamp: string;
    token_in_usd_amount: string;
    token_out_amount: string;
}

interface CashbackActor {
    get_eligible_raffle_entry?: () => Promise<{ Ok: Transaction[] } | []>;
}

export default function Page() {
    const agent = useMemo(() => new HttpAgent({ host: 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io' }), []);

    const cashbackActor = useMemo(() =>
        Actor.createActor(idlFactory, { agent, canisterId: '5fll2-liaaa-aaaap-qqlwa-cai' }) as CashbackActor,
        [agent]
    );

    const fetchRaffleEntries = useCallback(async () => {
        try {
            return (await cashbackActor.get_eligible_raffle_entry?.()) ?? [];
        } catch {
            toast.error('Error fetching last cashback available time.');
            return [];
        };
    }, [cashbackActor]);

    const rewardsQueriesConfig = useMemo((): UseQueryOptions<unknown, unknown, unknown, readonly unknown[]>[] => {
        const queries: UseQueryOptions<unknown, unknown, unknown, readonly unknown[]>[] = [
            {
                queryKey: ['cashbackRaffleQuery'] as const,
                queryFn: fetchRaffleEntries
            }
        ]
        return queries;
    }, [fetchRaffleEntries]);

    const rewardsQueries = useQueries({ queries: rewardsQueriesConfig });
    const isLoading = rewardsQueries.some((query) => query.isLoading) || rewardsQueries.some((query) => query.isFetching && !query.data);
    const raffleEntries = rewardsQueries[0]?.data as { Ok?: Transaction[] };
    const entries = raffleEntries?.Ok ?? [];

    const walletList = entries.map((tx) => tx.user_wallet_address);
    const walletText = walletList.join('\n');

    const copyWallets = async () => {
        await navigator.clipboard.writeText(walletText);
        toast.info('Wallet addresses copied');
    };

    return (
        <MaxWidthWrapper className='py-6'>
            {
                isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <div className='py-6 flex flex-col space-y-4'>
                        <div className='flex flex-col space-y-2'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-xl font-medium'>Wallet Addresses</h3>
                                <Button variant='outline' size='sm' onClick={copyWallets}>Copy All</Button>
                            </div>

                            <div className='rounded-md border bg-muted p-4 text-sm font-mono whitespace-pre max-h-[240px] overflow-y-auto'>
                                {walletList.length === 0 ? (
                                    <span className='text-muted-foreground'>No wallets found</span>
                                ) : (
                                    walletList.map((wallet, idx) => (
                                        <div key={`${wallet}-${idx}`}>{wallet}</div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className='flex flex-col space-y-2'>
                            <div className='text-xl font-medium'>Raffle Entries</div>
                            <div className='rounded-md border overflow-x-auto'>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Network</TableHead>
                                            <TableHead>Token In</TableHead>
                                            <TableHead>Token Out</TableHead>
                                            <TableHead>USD Value</TableHead>
                                            <TableHead>Wallet</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {entries.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className='text-center'>
                                                    No raffle entries found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            entries.map((tx) => (
                                                <TableRow key={tx.swap_id}>
                                                    <TableCell>{tx.transaction_type}</TableCell>
                                                    <TableCell>{tx.network}</TableCell>
                                                    <TableCell>{tx.token_in_amount}</TableCell>
                                                    <TableCell>{tx.token_out_amount}</TableCell>
                                                    <TableCell>${Number(tx.token_in_usd_amount).toFixed(2)}</TableCell>
                                                    <TableCell className='truncate max-w-[160px]'>{tx.user_wallet_address}</TableCell>
                                                    <TableCell>{new Date(Number(tx.transaction_timestamp) / 1_000_000).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )
            }
        </MaxWidthWrapper>
    )
}
