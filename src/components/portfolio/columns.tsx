"use client"

import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

export type PortfolioTableDataType = {
    token_swap_id: string;
    user_payment_address: string;
    user_ordinals_address: string;
    user_stacks_address: string;
    token_purchase_amount: string;
    token_purchase_name: string;
    bit10_token_quantity: string;
    bit10_token_name: string;
    token_transaction_signature: string;
    token_bought_at: Date | string;
}

export const portfolioTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'token_swap_id',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Swap ID' />
        ),
    },
    {
        accessorKey: 'token_purchase_amount',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Purchase Amount' info='Amount paid for buying token' />
        ),
    },
    {
        accessorKey: 'bit10_token_quantity',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Quantity' info='No. of Bit10 token bought' />
        ),
    },
    {
        accessorKey: 'bit10_token_name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Bit10 Token' />
        ),
    },
    {
        accessorKey: 'token_bought_at',
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
                <a href={order.token_purchase_name === 'BTC' ? `https://mempool.space/testnet/tx/${order.token_transaction_signature}` : `https://explorer.hiro.so/txid/${order.token_transaction_signature}?chain=testnet`} target='_blank'>
                    <Button>
                        View Transaction
                        <ExternalLink className='ml-1 w-4 h-4' />
                    </Button>
                </a>
            )
        },
    }
]
