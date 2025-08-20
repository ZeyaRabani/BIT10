'use client'

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { DataTableViewOptions } from '@/components/ui/data-table-view-options'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { Search, X, ExternalLink } from 'lucide-react'

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

    const formatTokenAmount = (value: number | null | undefined): string => {
        if (value === null || value === undefined || isNaN(value)) return '0';
        if (value === 0) return '0';
        const strValue = value.toFixed(10).replace(/\.?0+$/, '');
        const [integerPart, decimalPart = ''] = strValue.split('.');
        const formattedInteger = Number(integerPart).toLocaleString();

        if (!decimalPart) return formattedInteger || '0';

        const firstNonZeroIndex = decimalPart.search(/[1-9]/);

        if (firstNonZeroIndex === -1) return formattedInteger || '0';

        const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);

        return `${formattedInteger}.${trimmedDecimal}`;
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
        const normalizedAddress = tokenAddress.toLowerCase();

        switch (normalizedAddress) {
            case '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'.toLocaleLowerCase():
                return 'USDC (on Ethereum)';
            case '0x0000000000000000000000000000000000000000e'.toLocaleLowerCase():
                return 'ETH (on Ethereum)';
            case '0x0000000000000000000000000000000000000000'.toLocaleLowerCase():
                return 'ETH (on Ethereum)';
            case '0x0000000000000000000000000000000000000000b'.toLocaleLowerCase():
                return 'tBNB (on Binance Smart Chain)';
            case '0x64544969ed7ebf5f083679233325356ebe738930'.toLocaleLowerCase():
                return 'USDC (on Binance Smart Chain)';
            case '0x6Ce8da28e2f864420840cf74474eff5fd80e65b8'.toLocaleLowerCase():
                return 'BTCB (on Binance Smart Chain)';
            default:
                return tokenAddress;
        }
    };

    const getTokenExplorer = (tokenAddress: string): string => {
        const normalizedAddress = tokenAddress.toLowerCase();
        switch (normalizedAddress) {
            case '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'.toLocaleLowerCase():
                return 'https://sepolia.etherscan.io/tx';
            case '0x0000000000000000000000000000000000000000e'.toLocaleLowerCase():
                return 'https://sepolia.etherscan.io/tx';
            case '0x0000000000000000000000000000000000000000'.toLocaleLowerCase():
                return 'https://sepolia.etherscan.io/tx';
            case '0x0000000000000000000000000000000000000000b'.toLocaleLowerCase():
                return 'https://testnet.bscscan.com/tx/'
            case '0x64544969ed7ebf5f083679233325356ebe738930'.toLocaleLowerCase():
                return 'https://testnet.bscscan.com/tx/'
            case '0x6ce8da28e2f864420840cf74474eff5fd80e65b8'.toLocaleLowerCase():
                return 'https://testnet.bscscan.com/tx/'
            default:
                return 'https://sepolia.etherscan.io/tx';
        }
    };

    const renderCellContent = (cell: CellContext<PortfolioTableDataType, unknown>, row: { original: PortfolioTableDataType }) => {
        switch (cell.column.id) {
            case 'from':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div>
                            {formatTokenAmount(Number(row.original.amountIn))}
                        </div>
                        <div>{getTokenName(row.original.tokenInAddress)}</div>
                    </div>
                );
            case 'to':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div>
                            {formatTokenAmount(Number(row.original.amountOut))}
                        </div>
                        <div>{getTokenName(row.original.tokenOutAddress)}</div>
                    </div>
                );
            case 'token_swap_on':
                return formatDate(row.original.timestamp);
            case 'view_inbound_transaction':
                return (
                    <a
                        href={`${getTokenExplorer(row.original.tokenInAddress)}${getTokenExplorer(row.original.tokenInAddress).endsWith('/') ? '' : '/'}${row.original.txHashIn}`}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        <Button>
                            View Transaction
                            <ExternalLink className='ml-1 w-4 h-4' />
                        </Button>
                    </a>
                )
            case 'view_outbound_transaction':
                return (
                    <a
                        href={`${getTokenExplorer(row.original.tokenOutAddress.toLowerCase())}${getTokenExplorer(row.original.tokenOutAddress.toLowerCase()).endsWith('/') ? '' : '/'}${row.original.txHashOut}`}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        <Button>
                            View Transaction
                            <ExternalLink className='ml-1 w-4 h-4' />
                        </Button>
                    </a>
                )
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
