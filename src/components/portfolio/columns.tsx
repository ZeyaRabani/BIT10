"use client"

import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'

export type PortfolioTableDataType = {
    token_swap_id: string;
    user_principal_id: string;
    token_purchase_amount: string;
    token_purchase_name: string;
    bit10_token_quantity: string;
    bit10_token_name: string;
    token_transaction_status: string;
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
            <DataTableColumnHeader column={column} title='Quantity' info='No. of BIT10 token bought' />
        ),
    },
    {
        accessorKey: 'bit10_token_name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='BIT10 Token' />
        ),
    },
    {
        accessorKey: 'token_bought_at',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Token Bought at' />
        ),
    },
    {
        accessorKey: 'token_transaction_status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Transaction Status' />
        ),
    }
]
