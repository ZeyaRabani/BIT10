"use client"

import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

export type PortfolioTableDataType = {
    tokenSwapId: string;
    tokenPurchaseAmount: string;
    tokenPurchaseName: string;
    bit10TokenQuantity: string;
    bit10TokenName: string;
    tokenTransactionStatus: string;
    tokenBoughtAt: Date | string;
    transactionIndex: string;
}

export const portfolioTableColumns: ColumnDef<PortfolioTableDataType>[] = [
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
            const order = row.original

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
