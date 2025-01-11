"use client"

import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { userRecentActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useWallet } from '@/context/WalletContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-portfolio'

type PortfolioTableDataType = {
    tokenSwapId: string;
    tokenPurchaseAmount: string;
    tokenPurchaseName: string;
    bit10TokenQuantity: string;
    bit10TokenName: string;
    tokenTransactionStatus: string;
    tokenBoughtAt: Date | string;
    transactionIndex: string;
}

const portfolioTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'tokenSwapId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Swap ID' />
        ),
    },
    {
        accessorKey: 'paymentAmount',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Purchase Amount' info='Amount paid for buying token' />
        ),
    },
    // {
    //     accessorKey: 'bit10_token_quantity',
    //     header: ({ column }) => (
    //         <DataTableColumnHeader column={column} title='Quantity' info='No. of BIT10 token bought' />
    //     ),
    // },
    {
        accessorKey: 'bit10TokenName',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='BIT10 Token' />
        ),
    },
    {
        accessorKey: 'tokenBoughtAt',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Token Bought at' />
        ),
    },
    {
        id: 'view_transaction',
        header: 'View Transaction',
        cell: ({ row }) => {
            const order = row.original;

            return (
                <a
                    href={
                        order.tokenPurchaseName === 'ckBTC'
                            ? `https://dashboard.internetcomputer.org/bitcoin/transaction/${order.transactionIndex}`
                            : order.tokenPurchaseName === 'ckETH'
                                ? `https://dashboard.internetcomputer.org/ethereum/transaction/${order.transactionIndex}`
                                : order.tokenPurchaseName === 'ICP'
                                    ? `https://dashboard.internetcomputer.org/transaction/${order.transactionIndex}`
                                    : '#'
                    }
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

export default function RecentActivity() {
    const { principalId } = useWallet();

    const fetchRecentActivity = async (principalId: string) => {
        const response = await userRecentActivity({ paymentAddress: principalId });
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
                queryFn: () => principalId ? fetchRecentActivity(principalId) : toast.error('Principal ID is undefined')
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
                            userSearchColumn='bit10TokenName'
                            inputPlaceHolder='Search by BIT10 token name'
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
