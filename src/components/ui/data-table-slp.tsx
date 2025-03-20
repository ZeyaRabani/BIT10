"use client"

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { DataTableViewOptions } from '@/components/ui/data-table-view-options'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { Badge } from '@/components/ui/badge'

export type SLPTableDataType = {
    liquidationId: string,
    tickInName: string,
    tickInAmount: number,
    duration: number,
    liquidationMode: string,
    transactionTimestamp: Date | string
}

interface DataTableProps<TData> {
    columns: ColumnDef<SLPTableDataType>[];
    data: TData[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<SLPTableDataType>) {
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

    const formatTokenAmount = (value: number): string => {
        if (value === 0) return '0';

        const strValue = value.toFixed(10).replace(/\.?0+$/, '');
        const [integerPart, decimalPart = ''] = strValue.split('.');

        if (!decimalPart) return integerPart ?? '0';

        const firstNonZeroIndex = decimalPart.search(/[1-9]/);

        if (firstNonZeroIndex === -1) return integerPart ?? '0';

        const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);

        return `${integerPart}.${trimmedDecimal}`;
    };

    const formatDate = (dateInput: Date | string): string => {
        const date = new Date(dateInput);
        const addOrdinalSuffix = (day: number): string => {
            if (day >= 11 && day <= 13) {
                return day + 'th';
            }
            switch (day % 10) {
                case 1: return day + 'st';
                case 2: return day + 'nd';
                case 3: return day + 'rd';
                default: return day + 'th';
            }
        };
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const formattedDay = addOrdinalSuffix(day);
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const period = hour < 12 ? 'AM' : 'PM';
        const formattedDate = `${formattedDay} ${month} ${year} at ${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;

        return formattedDate;
    };

    const renderCellContent = (cell: CellContext<SLPTableDataType, unknown>, row: { original: SLPTableDataType }) => {
        switch (cell.column.id) {
            case 'liquidation_type':
                return (
                    <Badge className={row.original.liquidationMode === 'Stake' ? 'bg-primary' : 'bg-[#FF0066] hover:bg-[#f64189]'}>{row.original.liquidationMode}</Badge>
                );
            case 'staked_amount':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div>{formatTokenAmount(row.original.tickInAmount / 100000000)}</div>
                        <div>{row.original.tickInName}</div>
                        <div>
                            {row.original.duration > 0 && `for ${row.original.duration} day`}
                        </div>
                    </div>
                );
            case 'staked_on':
                return formatDate(row.original.transactionTimestamp);
            default:
                return cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell) : null;
        }
    };

    return (
        <div className='flex flex-col space-y-2'>
            <div className='flex items-center justify-end'>
                <DataTableViewOptions table={table} />
            </div>
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
