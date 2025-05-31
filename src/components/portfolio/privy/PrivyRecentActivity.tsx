import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { userRecentActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { usePrivy } from '@privy-io/react-auth'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-portfolio'
import type { PortfolioTableDataType } from '@/components/ui/data-table-portfolio'

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
    },
    {
        accessorKey: 'tokenBoughtAt',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Timestamp' />
        ),
    },
    {
        id: 'view_transaction',
        header: 'View Transaction',
        cell: ({ row }) => {
            const order = row.original;

            return (
                <a
                    href={`https://solscan.io/tx/${order.tickOutTxBlock}?cluster=devnet`}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    <Button>
                        View Transaction
                        <ExternalLink className='ml-1 w-4 h-4' />
                    </Button>
                </a>
            )
        },
    }
]

export default function PrivyRecentActivity() {
    const { user } = usePrivy();
    const UserWallet = user?.wallet?.address;

    const fetchRecentActivity = async (SOLAddress: string) => {
        const response = await userRecentActivity({ paymentAddress: SOLAddress });
        if (response === 'Error fetching user recent activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as PortfolioTableDataType[];
        }
    };

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentActivity'],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                queryFn: () => UserWallet.toString() ? fetchRecentActivity(UserWallet.toString()) : toast.error('Wallet Address is undefined')
            },
        ]
    })

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentActivityData = recentActivityQuery[0].data as PortfolioTableDataType[] | undefined;

    return (
        <div>
            {isLoading ? (
                <Card className='dark:border-white animate-fade-bottom-up-slow'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='dark:border-white animate-fade-bottom-up-slow'>
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
            )}
        </div>
    )
}
