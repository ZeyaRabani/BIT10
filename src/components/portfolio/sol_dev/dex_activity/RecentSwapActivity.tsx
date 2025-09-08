import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { useQueries } from '@tanstack/react-query'
import { userRecentDEXSwapActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-dex-portfolio'
import type { PortfolioTableDataType } from '@/components/ui/data-table-dex-portfolio'
import { formatAmount, getTokenName } from '@/lib/utils'

const recentSwapTableColumns: ColumnDef<PortfolioTableDataType>[] = [
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
            const searchableText = `${formattedAmount} ${tokenName}`.toLowerCase();
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

export default function RecentSwapActivity() {
    const wallet = useWallet();

    const fetchRecentSwapActivity = async (address: string) => {
        const response = await userRecentDEXSwapActivity({ source_chain: 'Solana', paymentAddress: address });
        if (response === 'Error fetching user recent DEX activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as PortfolioTableDataType[];
        }
    };

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentDEXActivity'],
                queryFn: () => wallet.publicKey ? fetchRecentSwapActivity((wallet.publicKey).toString()) : toast.error('User address is undefined')
            }
        ]
    })

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentDEXActivityData = recentActivityQuery[0].data as PortfolioTableDataType[] | undefined;

    return (
        <div>
            {isLoading ? (
                <div className='flex flex-col space-y-4'>
                    <Card className='dark:border-white animate-fade-bottom-up-slow'>
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
                <Card className='dark:border-white animate-fade-bottom-up-slow'>
                    <CardHeader>
                        <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent swap activity</div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={recentSwapTableColumns}
                            data={recentDEXActivityData ?? []}
                            userSearchColumn='to'
                            inputPlaceHolder='Search by Received token name'
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
