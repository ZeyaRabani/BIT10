/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable } from '@/components/ui/data-table-leaderboard'
import type { LeaderboardTableDataType } from '@/components/ui/data-table-leaderboard'

type Bit10ReferralType = {
    bit10_june_2025_referral: {
        address: string;
        total_points: number;
        position: number;
        referred_users: string[];
        referral_points: {
            total_no_of_liquidity_hub_transaction_by_address_on_testnet: number;
            total_no_of_liquidity_hub_transaction_by_referral_on_testnet: number;
            total_no_of_swap_by_referral_on_testnet: number;
            total_no_of_swap_or_reverse_swap_by_address_on_mainnet: number;
            total_no_of_swap_by_referral_on_mainnet: number;
        }[];
        tasks_completed: {
            swap_on_mainnet: boolean;
            swap_on_internet_computer_testnet: boolean;
            liquidity_hub_tx_on_internet_computer_testnet: boolean;
        };
    }[];
};

const leaderboardTableColumns: ColumnDef<LeaderboardTableDataType>[] = [
    {
        accessorKey: 'position',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Place' />
        ),
    },
    {
        accessorKey: 'address',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Principal ID' />
        ),
    },
    {
        accessorKey: 'total_points',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Points' />
        ),
    }
]

export default function Leaderboard() {
    const fetchReferral = async () => {
        const response = await fetch('referral-leaderboard');

        if (!response.ok) {
            toast.error('Error fetching Referral. Please try again!');
        }

        const data = await response.json() as Bit10ReferralType;
        return data;
    };

    const bit10ReferralQueries = useQueries({
        queries: [
            {
                queryKey: ['bit10Referral'],
                queryFn: () => fetchReferral(),
            },
        ],
    });

    const isLoading = bit10ReferralQueries.some(query => query.isLoading);
    const bit10Data = bit10ReferralQueries[0]?.data ?? [];
    const bit10Top3 = Array.isArray(bit10Data) ? bit10Data.slice(0, 3) : [];
    const bit10Leaderboard = Array.isArray(bit10Data) ? bit10Data.slice(3) : [];

    return (
        <div className='pt-4 '>
            {isLoading ?
                <div className='flex flex-col space-y-2'>
                    <div className='grid md:grid-cols-3 gap-4'>
                        <Card className='md:col-span-1 p-4'>
                            <Skeleton className='h-40 w-full rounded-md' />
                        </Card>
                        <Card className='md:col-span-1 p-4'>
                            <Skeleton className='h-40 w-full rounded-md' />
                        </Card>
                        <Card className='md:col-span-1 p-4'>
                            <Skeleton className='h-40 w-full rounded-md' />
                        </Card>
                    </div>
                    <div>
                        <Card className='animate-fade-bottom-up-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                :
                <div className='flex flex-col space-y-2'>
                    <div className='grid md:grid-cols-3 gap-4'>
                        <Card className='md:col-span-1'>
                            <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                                <div>
                                    <div className='block md:hidden text-lg'>
                                        {/* @ts-expect-error */}
                                        {bit10Top3[0]?.address ? `${bit10Top3[0].address.slice(0, 6)}...${bit10Top3[0].address.slice(-6)}` : '--'}
                                    </div>
                                    <div className='hidden md:block text-lg'>
                                        {/* @ts-expect-error */}
                                        {bit10Top3[0]?.address ? `${bit10Top3[0].address.slice(0, 14)}...${bit10Top3[0].address.slice(-14)}` : '--'}
                                    </div>
                                </div>
                                <div>
                                    <Trophy fill='#FFBB29' stroke='#FFBB29' className='h-6 w-6' />
                                </div>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-2 text-2xl'>
                                <div>
                                    {/* @ts-expect-error */}
                                    Total Points: {bit10Top3[0]?.total_points || '--'}
                                </div>
                                <div>
                                    Incentive: 5 ICP
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='md:col-span-1'>
                            <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                                <div>
                                    <div className='block md:hidden text-lg'>
                                        {/* @ts-expect-error */}
                                        {bit10Top3[1]?.address ? `${bit10Top3[1].address.slice(0, 6)}...${bit10Top3[1].address.slice(-6)}` : '--'}
                                    </div>
                                    <div className='hidden md:block text-lg'>
                                        {/* @ts-expect-error */}
                                        {bit10Top3[1]?.address ? `${bit10Top3[1].address.slice(0, 14)}...${bit10Top3[1].address.slice(-14)}` : '--'}
                                    </div>
                                </div>
                                <div>
                                    <Trophy fill='#EDEDED' stroke='#EDEDED' className='h-6 w-6' />
                                </div>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-2 text-2xl'>
                                <div>
                                    {/* @ts-expect-error */}
                                    Total Points: {bit10Top3[1]?.total_points || '--'}
                                </div>
                                <div>
                                    Incentive: 3 ICP
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='md:col-span-1'>
                            <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                                <div>
                                    <div className='block md:hidden text-lg'>
                                        {/* @ts-expect-error */}
                                        {bit10Top3[2]?.address ? `${bit10Top3[2].address.slice(0, 6)}...${bit10Top3[2].address.slice(-6)}` : '--'}
                                    </div>
                                    <div className='hidden md:block text-lg'>
                                        {/* @ts-expect-error */}
                                        {bit10Top3[2]?.address ? `${bit10Top3[2].address.slice(0, 14)}...${bit10Top3[2].address.slice(-14)}` : '--'}
                                    </div>
                                </div>
                                <div>
                                    <Trophy fill='#F7A552' stroke='#F7A552' className='h-6 w-6' />
                                </div>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-2 text-2xl'>
                                <div>
                                    {/* @ts-expect-error */}
                                    Total Points: {bit10Top3[2]?.total_points || '--'}
                                </div>
                                <div>
                                    Incentive: 2 ICP
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className='pt-2'>
                        <DataTable
                            columns={leaderboardTableColumns}
                            data={bit10Leaderboard ?? []}
                            userSearchColumn='address'
                            inputPlaceHolder='Search by Principal ID'
                        />
                    </div>
                </div>
            }
        </div>
    )
}
