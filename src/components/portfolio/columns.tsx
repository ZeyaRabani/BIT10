"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

export type PreformanceTableDataType = {
    settelment: string;
    tradeDate: string;
    symbol: string;
    name: string;
    quantity: number;
    type: 'Fund Recieved' | 'Divident' | 'Reinested' | 'Buy';
    price: number;
    fees: number;
}

export const preformanceTableColumns: ColumnDef<PreformanceTableDataType>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label='Select all'
            />
        ),
        cell: ({ row }) => (
            <div className='h-4'>
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label='Select row'
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'settelment',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Settelment' />
        ),
    },
    {
        accessorKey: 'tradeDate',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Trade Date' />
        ),
    },
    {
        accessorKey: 'symbol',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Symbol' />
        ),
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Name' />
        ),
    },
    {
        accessorKey: 'quantity',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Quantity' />
        ),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Type' />
        ),
    },
    {
        accessorKey: 'price',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Price (in USD)' />
        ),
    },
    {
        accessorKey: 'fees',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Fees (in USD)' />
        ),
    },
    // {
    //     id: 'actions',
    //     header: 'Actions',
    //     cell: ({ row }) => {
    //         const order = row.original

    //         return (
    //             <DropdownMenu>
    //                 <DropdownMenuTrigger asChild>
    //                     <Button variant='ghost' className='h-8 w-8 p-0'>
    //                         <MoreHorizontal className='h-4 w-4' />
    //                     </Button>
    //                 </DropdownMenuTrigger>
    //                 <DropdownMenuContent align='end'>
    //                     <DropdownMenuLabel>Actions</DropdownMenuLabel>
    //                     <DropdownMenuItem
    //                         onClick={() => navigator.clipboard.writeText(order.name)}
    //                         className='cursor-pointer'
    //                     >
    //                         Copy Name
    //                     </DropdownMenuItem>
    //                 </DropdownMenuContent>
    //             </DropdownMenu>
    //         )
    //     },
    // }
]