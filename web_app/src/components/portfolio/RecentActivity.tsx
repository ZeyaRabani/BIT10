import { useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useQueries } from '@tanstack/react-query';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '@/lib/canisters/bit10_exchange.did';
import { useChain } from '@/context/ChainContext';
import { toast } from 'sonner';
import { useICPWallet } from '@/context/ICPWalletContext';
import { useEVMWallet } from '@/context/EVMWalletContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table-portfolio';
import type { PortfolioTableDataType } from '@/components/ui/data-table-portfolio';
import { formatCompactNumber, getTokenName } from '@/lib/utils';

const portfolioTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'tokenSwapId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Transaction ID' />
        ),
    },
    {
        accessorKey: 'mode',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Type' />
        ),
    },
    {
        accessorKey: 'tickIn',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Spent' info='Amount spent for buying token' />
        ),
    },
    {
        accessorKey: 'tickOutName',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Received' />
        ),
        filterFn: (row, columnId, value) => {
            const formattedAmount = formatCompactNumber(Number(row.original.token_out_amount));
            const tokenName = getTokenName(row.original.token_out_address);
            const searchableText = `${formattedAmount} ${tokenName}`.toLowerCase();
            return searchableText.includes((value as string).toLowerCase());
        },
    },
    {
        accessorKey: 'tokenBoughtAt',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Timestamp' />
        ),
    },
    {
        accessorKey: 'viewTransaction',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='View Transaction' />
        ),
    }
]

export default function RecentActivity() {
    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { connected: isSolanaConnected } = useWallet();
    const wallet = useWallet();

    const chainConfig = useMemo(() => {
        if (chain === 'icp' && isICPConnected && icpAddress) {
            return { address: icpAddress.toLowerCase(), label: 'ICP' };
        }

        if ((chain === 'base' || chain === 'bsc') && isEVMConnected && evmAddress) {
            return {
                address: evmAddress.toLowerCase(),
                label: chain === 'base' ? 'Base' : 'Binance Smart Chain',
            };
        }

        if (chain === 'solana' && isSolanaConnected && wallet.publicKey) {
            return { address: wallet.publicKey.toBase58(), label: 'Solana' };
        }

        return null;
    }, [chain, evmAddress, icpAddress, isEVMConnected, isICPConnected, isSolanaConnected, wallet.publicKey]);

    const fetchRecentActivity = useCallback(async () => {
        if (!chainConfig) return [];

        try {
            const agent = await HttpAgent.create({ host: 'https://icp-api.io' });
            const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';
            const actor = Actor.createActor(idlFactory, { agent, canisterId });

            const { address, label } = chainConfig;

            const buyAndSellResponse = (await actor.get_buy_and_sell_history_by_address_and_chain?.(address, label)) as PortfolioTableDataType[] ?? [];

            return buyAndSellResponse.map((tx) => ({ ...tx, _timestamp: Number(tx.transaction_timestamp) })).sort((a, b) => b._timestamp - a._timestamp);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while fetching user portfolio. Please try again!');
            return [];
        }
    }, [chainConfig]);

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentActivity'],
                queryFn: () => fetchRecentActivity()
            }
        ]
    })

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentActivityData = recentActivityQuery[0].data;

    return (
        <div>
            {isLoading ? (
                <div className='flex flex-col space-y-1'>
                    <Card className='animate-fade-in-up-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className='flex flex-col space-y-1'>
                    <Card className='animate-fade-in-up-slow'>
                        <CardContent className='py-4 fleex flex-col space-y-4'>
                            <DataTable
                                columns={portfolioTableColumns}
                                data={recentActivityData ?? []}
                                userSearchColumn='tickOutName'
                                inputPlaceHolder='Search by Received token name'
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
