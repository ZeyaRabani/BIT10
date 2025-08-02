import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { userRecentDEXSwapActivity } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table-dex-portfolio'
import type { PortfolioTableDataType } from '@/components/ui/data-table-dex-portfolio'

const recentSwapTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'tickIn',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='From' info='Amount spent for swapping token' />
        ),
    },
    {
        accessorKey: 'tickOutName',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='To' />
        ),
    },
    {
        accessorKey: 'tokenBoughtAt',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Timestamp' />
        ),
    },
    {
        id: 'view_tick_in_transaction',
        header: 'Inbound Transaction',
        cell: ({ row }) => {
            const order = row.original;

            return (
                <a
                    href={`https://sepolia.etherscan.io/tx/${order.txHashIn}`}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    <Button>
                        View Transaction
                        <ExternalLink className='ml-1 w-4 h-4' />
                    </Button>
                </a>
            )
        },

    },
    {
        id: 'view_tick_out_transaction',
        header: 'Outbound Transaction',
        cell: ({ row }) => {
            const order = row.original;

            return (
                <a
                    href={`https://sepolia.etherscan.io/tx/${order.txHashOut}`}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    <Button>
                        View Transaction
                        <ExternalLink className='ml-1 w-4 h-4' />
                    </Button>
                </a>
            )
        },

    }
]

export default function RecentSwapActivity() {
    const { address } = useAccount();

    const fetchRecentSwapActivity = async (address: string) => {
        const response = await userRecentDEXSwapActivity({ paymentAddress: address });
        if (response === 'Error fetching user recent DEX activity') {
            toast.error('An error occurred while fetching user recent activity. Please try again!');
        } else {
            return response as PortfolioTableDataType[];
        }
    };

    const recentActivityQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10RecentDEXActivity'],
                queryFn: () => address ? fetchRecentSwapActivity(address) : toast.error('User address is undefined')
            }
        ]
    })

    const isLoading = recentActivityQuery.some(query => query.isLoading);
    const recentDEXActivityData = recentActivityQuery[0].data as PortfolioTableDataType[] | undefined;

    return (
        <div>
            {isLoading ? (
                <div className='flex flex-col space-y-4'>
                    <Card className='dark:border-white animate-fade-bottom-up-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className='dark:border-white animate-fade-bottom-up-slow'>
                    <CardHeader>
                        <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent swap activity</div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={recentSwapTableColumns}
                            data={recentDEXActivityData ?? []}
                            userSearchColumn='tickOutName'
                            inputPlaceHolder='Search by Received token name'
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
