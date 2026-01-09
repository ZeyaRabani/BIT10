"use client";

import { useMemo, useCallback } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '@/lib/canisters/rewards.did';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CopyIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default function Page() {
    const fetchRaffleEntries = useCallback(async () => {
        try {
            const agent = await HttpAgent.create({ host: 'https://icp-api.io' });
            const canisterId = '5fll2-liaaa-aaaap-qqlwa-cai';
            const actor = Actor.createActor(idlFactory, { agent, canisterId });
            const response = await actor.get_eligible_raffle_entry?.();
            return response;
        } catch {
            toast.error('Error fetching last cashback available time.');
            return [];
        };
    }, []);

    const rewardsQueriesConfig = useMemo(() => {
        const queries: UseQueryOptions[] = [
            {
                queryKey: ['cashbackRaffleQuery'] as const,
                queryFn: fetchRaffleEntries
            }
        ]
        return queries;
    }, [fetchRaffleEntries]);

    const rewardsQueries = useQueries({ queries: rewardsQueriesConfig });
    const isLoading = rewardsQueries.some((query) => query.isLoading) || rewardsQueries.some((query) => query.isFetching && !query.data);
    const raffleEntries = rewardsQueries[0]?.data as { Ok: Transaction[] };
    const transactions = useMemo(() => raffleEntries?.Ok ?? [], [raffleEntries]);

    const addressesList = useMemo(() => {
        const addresses: string[] = [];
        transactions.forEach((transaction) => {
            const count = Math.floor(parseFloat(transaction.token_out_amount));
            for (let i = 0; i < count; i++) {
                addresses.push(transaction.user_wallet_address);
            }
        });
        return addresses;
    }, [transactions]);

    const copyAddresses = () => {
        const text = addressesList.join('\n');
        void navigator.clipboard.writeText(text);
        toast.success('Addresses copied to clipboard!');
    };

    const formatAddress = (address: string) => {
        if (address.length <= 12) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <MaxWidthWrapper className='flex flex-col space-y-4 py-8'>
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle>Raffle Entries by Address</CardTitle>
                            <CardDescription>
                                {addressesList.length} total entries
                            </CardDescription>
                        </div>
                        <Button
                            onClick={copyAddresses}
                            variant='outline'
                            size='sm'
                            disabled={addressesList.length === 0}
                        >
                            <CopyIcon className='h-4 w-4 mr-2' />
                            Copy All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className='text-center py-8'>Loading addresses...</div>
                    ) : addressesList.length === 0 ? (
                        <div className='text-center py-8 text-muted-foreground'>No addresses found</div>
                    ) : (
                        <div className='max-h-96 overflow-auto border rounded-md p-4 bg-muted/30'>
                            <div className='font-mono text-sm space-y-1'>
                                {addressesList.map((address, index) => (
                                    <div key={index}>{address}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Raffle Entries</CardTitle>
                    <CardDescription>
                        {isLoading ? 'Loading...' : `${transactions.length} eligible entries`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className='text-center py-8'>Loading raffle entries...</div>
                    ) : transactions.length === 0 ? (
                        <div className='text-center py-8 text-muted-foreground'>No raffle entries found</div>
                    ) : (
                        <div className='rounded-md border overflow-auto'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Amount In</TableHead>
                                        <TableHead>USD Amount</TableHead>
                                        <TableHead>Amount Out</TableHead>
                                        <TableHead>Wallet Address</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction, index) => (
                                        <TableRow key={transaction.swap_id || index}>
                                            <TableCell>
                                                <Badge>
                                                    {transaction.transaction_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className='font-medium'>{transaction.network}</TableCell>
                                            <TableCell>{parseFloat(transaction.token_in_amount).toFixed(4)}</TableCell>
                                            <TableCell>${parseFloat(transaction.token_in_usd_amount).toFixed(2)}</TableCell>
                                            <TableCell>{parseFloat(transaction.token_out_amount).toFixed(4)}</TableCell>
                                            <TableCell className='text-xs'>
                                                {formatAddress(transaction.user_wallet_address)}
                                            </TableCell>
                                            <TableCell className='text-xs'>
                                                {formatDate(transaction.transaction_timestamp)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </MaxWidthWrapper>
    )
}
