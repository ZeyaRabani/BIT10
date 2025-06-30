"use client"

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CircleCheck, ExternalLink } from 'lucide-react'

export type ReferralProfileTableDataType = {
    task: string,
    points: number
    status?: boolean,
    route?: string
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

    const { chain } = useChain();

    const { ICPAddress } = useICPWallet();

    const handleCopyMainnetReferral = (route: string) => {
        if (!ICPAddress) {
            toast.error('Please connect your wallet first');
            return;
        }

        const referralLink =
            `https://bit10.app/${route}?referral=${ICPAddress}`
        // `http://localhost:3000/${route}?referral=${ICPAddress}`;

        navigator.clipboard.writeText(referralLink)
            .then(() => {
                toast.success('Referral link copied to clipboard!');
            })
            .catch(() => {
                toast.error('Failed to copy referral link');
            });
    };

    const handleCopyTestnetReferral = (route: string) => {
        if (!ICPAddress) {
            toast.error('Please connect your wallet first');
            return;
        }

        const referralLink =
            `https://testnet.bit10.app/${route}?referral=${ICPAddress}`
        // `http://localhost:3000/${route}?referral=${ICPAddress}`;

        navigator.clipboard.writeText(referralLink)
            .then(() => {
                toast.success('Referral link copied to clipboard!');
            })
            .catch(() => {
                toast.error('Failed to copy referral link');
            });
    };

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
                            <Button variant='outline' className='dark:border-white w-full'>
                                <CircleCheck className='mr-2 h-4 w-4' />
                                Task Completed
                            </Button>
                        ) : (
                            // row.original.task === 'Post about BIT10 on Twitter/X' ? <Button className='w-full'>Post</Button> :
                            //     row.original.task === 'Follow BIT10 on Twitter/X' ? <Button className='w-full'>Follow BIT10</Button> :
                            //         row.original.task === 'Like BIT10 Post on on Twitter/X' ? <Button className='w-full'>Like Post</Button> :
                            //             <Button className='w-full'>Swap on Mainnet</Button>
                            row.original.task === 'Swap on Internet Computer Testnet' ?
                                <a href='https://testnet.bit10.app/swap' target='_blank'>
                                    <Button className='w-full'>
                                        Swap on Testnet
                                        <ExternalLink className='ml-2 h-4 w-4' />
                                    </Button>
                                </a> :
                                row.original.task === 'Swap on Internet Computer Liquidity Hub' ?
                                    <a href='https://testnet.bit10.app/liquidity-hub' target='_blank'>
                                        <Button className='w-full'>
                                            Swap on Liquidity Hub
                                            <ExternalLink className='ml-2 h-4 w-4' />
                                        </Button>
                                    </a> :
                                    <a href='https://bit10.app/swap' target='_blank'>
                                        <Button className='w-full'>
                                            Swap on Mainnet
                                            <ExternalLink className='ml-2 h-4 w-4' />
                                        </Button>
                                    </a>
                        )}
                    </div>
                );
            case 'others_action':
                return (
                    <>
                        {chain === 'icp' && (
                            <div>
                                {row.original.task === 'Swap on Internet Computer Liquidity Hub' ?
                                    <Button className='w-full' onClick={() => handleCopyTestnetReferral('liquidity-hub')}>
                                        <Copy className='mr-2 h-4 w-4' />
                                        Copy your Liquidity Hub referral link
                                    </Button> :
                                    row.original.task === 'Swap on BIT10 Testnet' ?
                                        <Button className='w-full' onClick={() => handleCopyTestnetReferral('swap')}>
                                            <Copy className='mr-2 h-4 w-4' />
                                            Copy your Testnet Swap referral link
                                        </Button> :
                                        <Button className='w-full' onClick={() => handleCopyMainnetReferral('swap')}>
                                            <Copy className='mr-2 h-4 w-4' />
                                            Copy your Mainnet Swap referral link
                                        </Button>
                                }
                            </div>
                        )}
                    </>
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
            {/* <div>
                <DataTablePagination table={table} />
            </div> */}
        </div>
    )
}
