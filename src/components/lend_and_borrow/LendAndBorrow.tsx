import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable } from '@/components/ui/data-table-lend-and-borrow'
import type { LendAndBorrorTableDataType } from '@/components/ui/data-table-lend-and-borrow'
import Lend from './lend'
import Borrow from './borrow'

const lendAndBorrowData = [
    {
        token_name: 'ckUSDC',
        token_address: 'eegan-kqaaa-aaaap-qhmgq-cai', // BIT10.BTC as we dont have ckUSDC on testnet
        token_chain: 'ICP',
        ltv: '75%',
        apy: '4.5%',
        available_liquidity: '20'
    },
    {
        token_name: 'USDC',
        token_address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        token_chain: 'Solana',
        ltv: '85%',
        apy: '3%',
        available_liquidity: '20'
    },
    {
        token_name: 'USDC',
        token_address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        token_chain: 'Ethereum',
        ltv: '80%',
        apy: '4%',
        available_liquidity: '20'
    },
    {
        token_name: 'USDC',
        token_address: '0x64544969ed7EBf5f083679233325356EbE738930',
        token_chain: 'Binance Smart Chain',
        ltv: '80%',
        apy: '5.5%',
        available_liquidity: '20'
    }
]

const lendAndBorrowTableColumns: ColumnDef<LendAndBorrorTableDataType>[] = [
    {
        accessorKey: 'token_details',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Token' />
        ),
    },
    {
        accessorKey: 'ltv',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='LTV' info='How much you can borrow against your collateral' />
        ),
    },
    {
        accessorKey: 'apy',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='APY' info='Annualized return from lending, including compounding' />
        ),
    },
    {
        accessorKey: 'available_liquidity',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Available Liquidity' />
        ),
    },
    {
        id: 'lend',
        header: 'Lend',
        cell: ({ row }) => {
            const order = row.original;

            return (
                <Lend item={order} />
            )
        },
    },
    {
        id: 'borrow',
        header: 'Borrow',
        cell: ({ row }) => {
            const order = row.original;

            return (
                <Borrow item={order} />
            )
        },
    }
]

export default function LendAndBorrow() {
    return (
        <Card className='dark:border-white w-full lg:col-span-1 animate-fade-bottom-up-slow'>
            <CardHeader>
                <div className='text-2xl md:text-4xl text-center md:text-start'>Lend & Borrow</div>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={lendAndBorrowTableColumns}
                    data={lendAndBorrowData ?? []}
                />
            </CardContent>
        </Card>
    )
}
