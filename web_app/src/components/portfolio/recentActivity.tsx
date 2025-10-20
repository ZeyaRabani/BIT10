import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { useQueries } from '@tanstack/react-query'
import { userRecentBIT10BuyActivity, userRecentDEXSwapActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-portfolio'
import type { PortfolioTableDataType } from '@/components/ui/data-table-portfolio'
import { DataTable as DEXDataTable } from '@/components/ui/data-table-dex-portfolio'
import type { PortfolioTableDataType as DEXPortfolioTableDataType } from '@/components/ui/data-table-dex-portfolio'
import { formatAmount, getTokenName } from '@/lib/utils'

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
            const formattedAmount = formatAmount(Number(row.original.tickOutAmount));
            const tokenName = getTokenName(row.original.tickOutName);
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

const recentSwapTableColumns: ColumnDef<DEXPortfolioTableDataType>[] = [
    {
        accessorKey: 'tokenSwapId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Swap ID' />
        ),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Status' />
        ),
    },
    {
        accessorKey: 'from',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='From' info='Amount spent for swapping token' />
        ),
    },
    {
        accessorKey: 'to',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='To' />
        ),
        filterFn: (row, columnId, value) => {
            const formattedAmount = formatAmount(Number(row.original.amountOut));
            const tokenName = getTokenName(row.original.tokenOutAddress);
            const tokenChain = getTokenName(row.original.destinationChain);
            const searchableText = `${formattedAmount} ${tokenName} (on ${tokenChain})`.toLowerCase();
            return searchableText.includes((value as string).toLowerCase());
        },
    },
    {
        accessorKey: 'token_swap_on',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Timestamp' />
        ),
    },
    {
        accessorKey: 'view_inbound_transaction',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Inbound Transaction' />
        ),
    },
    {
        accessorKey: 'view_outbound_transaction',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Outbound Transaction' />
        ),
    }
]

export default function RecentActivity() {
    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { connected: isSolanaConnected } = useWallet();
    const wallet = useWallet();

    const fetchRecentActivity = async () => {
        let response;
        if (chain === 'icp' && isICPConnected && icpAddress) {
            response = await userRecentBIT10BuyActivity({ paymentAddress: icpAddress.toLowerCase(), chain: 'ICP' });
        } else if (chain === 'base' && isEVMConnected && evmAddress) {
            response = await userRecentBIT10BuyActivity({ paymentAddress: evmAddress.toLowerCase(), chain: 'Base' });
        } else if (chain === 'solana' && isSolanaConnected && wallet.publicKey) {
            response = await userRecentBIT10BuyActivity({ paymentAddress: wallet.publicKey?.toBase58(), chain: 'Solana' });
        } else if (chain === 'bsc' && isEVMConnected && evmAddress) {
            response = await userRecentBIT10BuyActivity({ paymentAddress: evmAddress.toLowerCase(), chain: 'Binance Smart Chain' });
        } else {
            response = [];
        }
        if (response === 'Error fetching user recent activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as PortfolioTableDataType[];
        }
    };

    const fetchRecentDEXActivity = async () => {
        let response;
        if (chain === 'icp' && isICPConnected && icpAddress) {
            response = await userRecentDEXSwapActivity({ walletAddress: icpAddress.toLowerCase(), source_chain: 'ICP' });
        } else if (chain === 'base' && isEVMConnected && evmAddress) {
            response = await userRecentDEXSwapActivity({ walletAddress: evmAddress.toLowerCase(), source_chain: 'Base' });
        } else if (chain === 'solana' && isSolanaConnected && wallet.publicKey) {
            response = await userRecentDEXSwapActivity({ walletAddress: wallet.publicKey?.toBase58(), source_chain: 'Solana' });
        } else if (chain === 'bsc' && isEVMConnected && evmAddress) {
            response = await userRecentDEXSwapActivity({ walletAddress: evmAddress.toLowerCase(), source_chain: 'Binance Smart Chain' });
        } else {
            response = [];
        }
        if (response === 'Error fetching user recent activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as DEXPortfolioTableDataType[];
        }
    };

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentActivity'],
                queryFn: () => fetchRecentActivity()
            },
            {
                queryKey: ['dexRecentActivity'],
                queryFn: () => fetchRecentDEXActivity()
            },
        ]
    })

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentActivityData = recentActivityQuery[0].data;
    const recentDEXActivityData = recentActivityQuery[1].data;

    return (
        <div>
            {isLoading ? (
                <div className='flex flex-col space-y-1'>
                    <Card className='border-muted animate-fade-bottom-up-slow'>
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
                    <Card className='border-muted animate-fade-bottom-up-slow'>
                        <CardHeader>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent activity</div>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={portfolioTableColumns}
                                data={recentActivityData ?? []}
                                userSearchColumn='tickOutName'
                                inputPlaceHolder='Search by Received token name'
                            />
                        </CardContent>
                    </Card>

                    <Card className='border-muted animate-fade-bottom-up-slow'>
                        <CardHeader>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent DEX activity</div>
                        </CardHeader>
                        <CardContent>
                            <DEXDataTable
                                columns={recentSwapTableColumns}
                                data={recentDEXActivityData ?? []}
                                userSearchColumn='to'
                                inputPlaceHolder='Search by Received token name'
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
