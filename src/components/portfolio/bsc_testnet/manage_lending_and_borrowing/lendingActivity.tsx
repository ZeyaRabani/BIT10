import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useQueries } from '@tanstack/react-query'
import { userRecentLendActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-lend-portfolio'
import type { PortfolioTableDataType } from '@/components/ui/data-table-lend-portfolio'

const recentLendingActivityTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'tokenAmount',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Amount Lend' />
        ),
    },
    {
        accessorKey: 'interestRate',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='APY' info='Annualized return from lending, including compounding' />
        ),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Status' />
        ),
    },
    {
        accessorKey: 'token_lended_on',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Token Lended On' />
        ),
    },
    {
        id: 'withdraw',
        cell: ({ row }) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const order = row.original;

            return (
                <Button>
                    Withdraw / Claim Interest
                </Button>
            )
        },
    }
]

export default function LendingActivity() {
    const { address } = useAccount();

    const fetchRecentLendingActivity = async (address: string) => {
        const response = await userRecentLendActivity({ source_chain: 'Binance Smart Chain', address: address });
        if (response === 'Error fetching user lending activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as PortfolioTableDataType[];
        }
    };

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentLendingActivity'],
                queryFn: () => address ? fetchRecentLendingActivity(address) : toast.error('User address is undefined')
            }
        ]
    });

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentLendingActivityData = recentActivityQuery[0].data as PortfolioTableDataType[] | undefined;

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
                        <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent Lending activity</div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={recentLendingActivityTableColumns}
                            data={recentLendingActivityData ?? []}
                            userSearchColumn='tokenAmount'
                            inputPlaceHolder='Search by token name'
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
