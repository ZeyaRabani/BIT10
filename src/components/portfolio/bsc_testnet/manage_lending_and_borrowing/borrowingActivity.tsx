import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useQueries } from '@tanstack/react-query'
import { userRecentBorrowActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-borrow-portfolio'
import type { PortfolioTableDataType } from '@/components/ui/data-table-borrow-portfolio'
import { formatAmount, getTokenName } from '@/lib/utils'

const recentBorrowingActivityTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'tokenBorrowed',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Amount Borrowed' />
        ),
        filterFn: (row, columnId, value) => {
            const formattedAmount = row.original.borrowTokenChain.toLowerCase() === 'icp'
                ? formatAmount(Number(row.original.borrowTokenAmount) / 100000000)
                : formatAmount(Number(row.original.borrowTokenAmount));
            const tokenName = getTokenName(row.original.borrowTokenAddress);
            const searchableText = `${formattedAmount} ${tokenName}`.toLowerCase();
            return searchableText.includes((value as string).toLowerCase());
        },
    },
    {
        accessorKey: 'tokenCollateral',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Collateral Token' />
        ),
    },
    {
        accessorKey: 'interestRate',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Interest' />
        ),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Status' />
        ),
    },
    {
        accessorKey: 'token_borrowed_on',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Token Borrowed On' />
        ),
    },
    {
        id: 'borrow',
        cell: ({ row }) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const order = row.original;

            return (
                <Button>
                    Repay / Add Collateral
                </Button>
            )
        },
    }
]

export default function BorrowingActivity() {
    const { address } = useAccount();

    const fetchRecentBorrowingActivity = async (address: string) => {
        const response = await userRecentBorrowActivity({ source_chain: 'Binance Smart Chain', address: address });
        if (response === 'Error fetching user borrowing activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as PortfolioTableDataType[];
        }
    };

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentBorrowingActivity'],
                queryFn: () => address ? fetchRecentBorrowingActivity(address) : toast.error('User address is undefined')
            }
        ]
    });

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentBorrowingActivityData = recentActivityQuery[0].data as PortfolioTableDataType[] | undefined;

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
                        <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent Borrowing activity</div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={recentBorrowingActivityTableColumns}
                            data={recentBorrowingActivityData ?? []}
                            userSearchColumn='tokenBorrowed'
                            inputPlaceHolder='Search by borrowed token name'
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
