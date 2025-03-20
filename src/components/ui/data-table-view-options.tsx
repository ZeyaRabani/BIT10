"use client"

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Settings2 } from 'lucide-react'
import type { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface DataTableViewOptionsProps<TData> {
    table: Table<TData>
}

const formatColumnName = (columnName: string): string => {
    if (columnName === 'tokenSwapId') {
        return 'Swap ID';
    } else if (columnName === 'paymentAmount') {
        return 'Purchase Amount';
    } else if (columnName === 'bit10TokenName') {
        return 'BIT10 Token';
    } else if (columnName === 'tokenBoughtAt') {
        return 'Token Bought at';
    } else if (columnName === 'view_transaction') {
        return 'Ciew Transaction';
    } else if (columnName === 'duration') {
        return 'Staking Duration';
    } else if (columnName === 'liquidationId') {
        return 'Liquidation ID';
    }

    return columnName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant='outline'
                    size='sm'
                    className='ml-auto hidden h-8 lg:flex dark:border-white'
                >
                    <Settings2 className='mr-2 h-4 w-4' />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-[200px]'>
                <DropdownMenuLabel>View columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== 'undefined' && column.getCanHide()
                    )
                    .map((column) => {
                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className='capitalize'
                                checked={column.getIsVisible()}
                                onCheckedChange={(value: boolean) => column.toggleVisibility(value)}
                            >
                                {formatColumnName(column.id)}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
