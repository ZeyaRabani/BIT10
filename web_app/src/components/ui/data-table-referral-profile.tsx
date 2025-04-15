"use client"

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { Button } from '@/components/ui/button'
import { CircleCheck, ExternalLink } from 'lucide-react'

export type ReferralProfileTableDataType = {
    task: string,
    points: number
    status: boolean,
}

interface DataTableProps<TData> {
    columns: ColumnDef<ReferralProfileTableDataType>[];
    data: TData[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<ReferralProfileTableDataType>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });


    const renderCellContent = (cell: CellContext<ReferralProfileTableDataType, unknown>, row: { original: ReferralProfileTableDataType }) => {
        switch (cell.column.id) {
            case 'action':
                return (
                    <div>
                        {row.original.status ? (
                            <Button variant='outline' className='dark:border-white w-40'>
                                <CircleCheck className='mr-2 h-4 w-4' />
                                Task Completed
                            </Button>
                        ) : (
                            // row.original.task === 'Post about BIT10 on Twitter/X' ? <Button className='w-40'>Post</Button> :
                            //     row.original.task === 'Follow BIT10 on Twitter/X' ? <Button className='w-40'>Follow BIT10</Button> :
                            //         row.original.task === 'Like BIT10 Post on on Twitter/X' ? <Button className='w-40'>Like Post</Button> :
                            //             <Button className='w-40'>Swap on Mainnet</Button>
                            row.original.task === 'Swap on Internet Computer Testnet' ?
                                <a href='https://testnet.bit10.app/swap' target='_blank'>
                                    <Button className='w-40'>
                                        Swap on Testnet
                                        <ExternalLink className='ml-2 h-4 w-4' />
                                    </Button>
                                </a> :
                                <a href='https://bit10.app/swap' target='_blank'>
                                    <Button className='w-40'>
                                        Swap on Mainnet
                                        <ExternalLink className='ml-2 h-4 w-4' />
                                    </Button>
                                </a>
                        )}
                    </div>
                );
            default:
                return cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell) : null;
        }
    };

    return (
        <div className='flex flex-col space-y-2'>
            <div className='rounded-md border dark:border-white'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {renderCellContent(cell.getContext(), row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div>
                <DataTablePagination table={table} />
            </div>
        </div>
    )
}
