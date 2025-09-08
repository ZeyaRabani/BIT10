"use client"

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Image, { type StaticImageData } from 'next/image'
import BIT10Img from '@/assets/swap/bit10.svg'
import USDCImg from '@/assets/swap/usdc.svg'
import ICPChainImg from '@/assets/swap/icp.svg'
import SOLChainImg from '@/assets/swap/sol.svg'
import ETHChainImg from '@/assets/swap/eth.svg'
import BSCChainImg from '@/assets/swap/bnb.svg'
import { formatAddress } from '@/lib/utils'

export type LendAndBorrorTableDataType = {
    token_name: string;
    token_address: string;
    token_chain: string;
    ltv: string;
    apy: string;
    available_liquidity: string;
}

interface DataTableProps<TData> {
    columns: ColumnDef<LendAndBorrorTableDataType>[];
    data: TData[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DataTable<TData, TValue>({ columns, data }: DataTableProps<LendAndBorrorTableDataType>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

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

    const getTokenImg = (token: string): StaticImageData => {
        switch (token) {
            case 'ckUSDC':
                return BIT10Img as StaticImageData;
            case 'USDC':
                return USDCImg as StaticImageData;
            default:
                return USDCImg as StaticImageData;
        }
    };

    const getTokenChainImg = (tokenChain: string): StaticImageData => {
        switch (tokenChain) {
            case 'ICP':
                return ICPChainImg as StaticImageData;
            case 'Solana':
                return SOLChainImg as StaticImageData;
            case 'Ethereum':
                return ETHChainImg as StaticImageData;
            case 'Binance Smart Chain':
                return BSCChainImg as StaticImageData;
            default:
                return USDCImg as StaticImageData;
        }
    };

    const renderCellContent = (cell: CellContext<LendAndBorrorTableDataType, unknown>, row: { original: LendAndBorrorTableDataType }) => {
        switch (cell.column.id) {
            case 'token_details':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div className='relative'>
                            <Image src={getTokenImg(row.original.token_name)} alt={row.original.token_address} width={50} height={50} />
                            <div className='absolute -bottom-2 right-0 border-[1px] border-[#B4B3B3] rounded-full bg-white'>
                                <Image src={getTokenChainImg(row.original.token_chain)} alt={row.original.token_address} width={20} height={20} />
                            </div>
                        </div>
                        <div className='flex flex-col'>
                            <div>{row.original.token_name} (on {row.original.token_chain})</div>
                            <div>{formatAddress(row.original.token_address)}</div>
                        </div>
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
        </div>
    )
}
