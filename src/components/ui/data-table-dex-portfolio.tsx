'use client'

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { DataTableViewOptions } from '@/components/ui/data-table-view-options'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { Search, X } from 'lucide-react'

export type PortfolioTableDataType = {
    status: string,
    amountIn: string,
    amountOut: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    txHashIn: string,
    txHashOut: string,
    timestamp: number
}

interface DataTableProps<TData> {
    columns: ColumnDef<PortfolioTableDataType>[];
    data: TData[];
    userSearchColumn: string;
    inputPlaceHolder: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DataTable<TData, TValue>({
    columns,
    data,
    userSearchColumn,
    inputPlaceHolder,
}: DataTableProps<PortfolioTableDataType>) {
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
    })

    const clearSearch = () => {
        setColumnFilters([]);
        table.getColumn(userSearchColumn)?.setFilterValue('');
    };

    const formatDate = (dateInput: string | number | Date): string => {
        let date: Date;

        if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            const inputStr = dateInput.toString();
            const timestamp = inputStr.length > 13
                ? Number(inputStr.slice(0, 13))
                : Number(inputStr);
            date = new Date(timestamp);
        } else {
            date = new Date(dateInput);
        }

        const addOrdinalSuffix = (day: number): string => {
            if (day >= 11 && day <= 13) return day + 'th';
            const lastDigit = day % 10;
            if (lastDigit === 1) return day + 'st';
            if (lastDigit === 2) return day + 'nd';
            if (lastDigit === 3) return day + 'rd';
            return day + 'th';
        };

        const day = date.getDate();
        const formattedDay = addOrdinalSuffix(day);
        const month = date.toLocaleString(undefined, { month: 'long' });
        const year = date.getFullYear();

        const hour = date.getHours();
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const minute = date.getMinutes().toString().padStart(2, '0');
        const period = hour < 12 ? 'AM' : 'PM';

        return `${formattedDay} ${month} ${year} at ${formattedHour}:${minute} ${period}`;
    };

    const getTokenName = (tokenAddress: string): string => {
        switch (tokenAddress) {
            case '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238':
                return 'USDC';
            case '0x0000000000000000000000000000000000000000':
                return 'ETH';
            default:
                return 'Unknown';
        }
    };

    const renderCellContent = (cell: CellContext<PortfolioTableDataType, unknown>, row: { original: PortfolioTableDataType }) => {
        switch (cell.column.id) {
            case 'tickIn':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div>
                            {Number(row.original.amountIn).toFixed(4)}
                        </div>
                        <div>{getTokenName(row.original.tokenInAddress)}</div>
                    </div>
                );
            case 'tickOutName':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div>
                            {Number(row.original.amountOut).toFixed(4)}
                        </div>
                        <div>{getTokenName(row.original.tokenOutAddress)}</div>
                    </div>
                );
            case 'tokenBoughtAt':
                return formatDate(row.original.timestamp);
            default:
                return cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell) : null;
        }
    };

    return (
        <div className='flex flex-col space-y-2'>
            <div className='flex items-center'>
                <div className='flex w-full items-center'>
                    <div className='w-10 z-20 pl-1 text-center pointer-events-none flex items-center justify-center'><Search height={20} width={20} /></div>
                    <Input className='w-full md:max-w-md -mx-10 pl-10 pr-8 py-2 z-10 dark:border-white' placeholder={inputPlaceHolder}
                        value={(table.getColumn(userSearchColumn)?.getFilterValue() as string) ?? ''}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            table.getColumn(userSearchColumn)?.setFilterValue(event.target.value)
                        } />
                    <div
                        onClick={clearSearch}
                        className='ml-2 z-20 cursor-pointer'
                    >
                        <X />
                    </div>
                </div>
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
