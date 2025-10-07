import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { useQueries } from '@tanstack/react-query'
import { userRecentBIT10BuyActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-portfolio'
import type { PortfolioTableDataType } from '@/components/ui/data-table-portfolio'

const portfolioTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'tokenSwapId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Transaction ID' />
        ),
    },
    {
        accessorKey: 'mode',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Type' />
        ),
    },
    {
        accessorKey: 'tickIn',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Spent' info='Amount spent for buying token' />
        ),
    },
    {
        accessorKey: 'tickOutName',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Received' />
        ),
    },
    {
        accessorKey: 'tokenBoughtAt',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Timestamp' />
        ),
    },
    {
        accessorKey: 'viewTransaction',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='View Transaction' />
        ),
    }
]

export default function RecentActivity() {
    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { isEVMConnected, evmAddress } = useEVMWallet();

    const fetchRecentActivity = async () => {
        let response;
        if (chain === 'icp' && isICPConnected && icpAddress) {
            response = await userRecentBIT10BuyActivity({ paymentAddress: icpAddress, chain: 'ICP' });
        } else if (chain === 'base' && isEVMConnected && evmAddress) {
            response = await userRecentBIT10BuyActivity({ paymentAddress: evmAddress, chain: 'Base' });
        } else {
            response = [];
        }
        if (response === 'Error fetching user recent activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as PortfolioTableDataType[];
        }
    };

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentActivity'],
                queryFn: () => fetchRecentActivity()
            },
        ]
    })

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentActivityData = recentActivityQuery[0].data;

    return (
        <div>
            {isLoading ? (
                <Card className='dark:border-white animate-fade-bottom-up-slow'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='dark:border-white animate-fade-bottom-up-slow'>
                    <CardHeader>
                        <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent activity</div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={portfolioTableColumns}
                            data={recentActivityData ?? []}
                            userSearchColumn='tickOutName'
                            inputPlaceHolder='Search by Received token name'
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
