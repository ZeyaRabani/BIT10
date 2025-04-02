import React from 'react'
import { useICPWallet } from '@/context/ICPWalletContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable } from '@/components/ui/data-table-leaderboard'
import type { LeaderboardTableDataType } from '@/components/ui/data-table-leaderboard'

const leaderboardData = [
    {
        place: 4,
        address: 'q7xwg-4zws5-ucimy-glczv-nmm6f-lwt3b-mrefz-ewr4l-avwcx-7jkfi-aae1',
        points: 16,

    },
    {
        place: 5,
        address: 'q7xwg-4zws5-ucimy-glczv-nmm6f-lwt3b-mrefz-ewr4l-avwcx-7jkfi-aae',
        points: 13,
    },
    {
        place: 6,
        address: 'q7xwg-4zws5-ucimy-glczv-nmm6f-lwt3b-mrefz-ewr4l-avwcx-7jkfi-aae',
        points: 12,

    },
    {
        place: 7,
        address: 'q7xwg-4zws5-ucimy-glczv-nmm6f-lwt3b-mrefz-ewr4l-avwcx-7jkfi-aae',
        points: 11,

    },
    {
        place: 8,
        address: 'q7xwg-4zws5-ucimy-glczv-nmm6f-lwt3b-mrefz-ewr4l-avwcx-7jkfi-aae',
        points: 10,

    }
]

const leaderboardTableColumns: ColumnDef<LeaderboardTableDataType>[] = [
    {
        accessorKey: 'place',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Place' />
        ),
    },
    {
        accessorKey: 'ICPAddress',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Principal ID' />
        ),
    },
    {
        accessorKey: 'points',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Points' />
        ),
    },
    {
        accessorKey: 'user_rank',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='User Rank' />
        ),
    },
]

export default function Leaderboard() {
    const { ICPAddress } = useICPWallet();

    return (
        <div className='pt-4 flex flex-col space-y-2'>
            <div className='grid md:grid-cols-3 gap-4'>
                <Card className='md:col-span-1'>
                    <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                        <div>
                            <div className='block md:hidden text-lg'>{ICPAddress ? `${ICPAddress.slice(0, 6)}...${ICPAddress.slice(-6)}` : ''}</div>
                            <div className='hidden md:block text-lg'>{ICPAddress ? `${ICPAddress.slice(0, 14)}...${ICPAddress.slice(-14)}` : ''}</div>
                        </div>
                        <div>
                            <Trophy fill='#FFBB29' stroke='#FFBB29' className='h-6 w-6' />
                        </div>
                    </CardHeader>
                    <CardContent className='flex flex-col space-y-2'>
                        <div className='flex flex-row items-center space-x-2 font-semibold text-xl'>
                            🏆 Grandmaster
                        </div>
                        <div>
                            Total Points: 42
                        </div>
                        <div>
                            Incentive: 2 ICP
                        </div>
                    </CardContent>
                </Card>

                <Card className='md:col-span-1'>
                    <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                        <div>
                            <div className='block md:hidden'>{ICPAddress ? `${ICPAddress.slice(0, 6)}...${ICPAddress.slice(-6)}` : ''}</div>
                            <div className='hidden md:block'>{ICPAddress ? `${ICPAddress.slice(0, 14)}...${ICPAddress.slice(-14)}` : ''}</div>
                        </div>
                        <div>
                            <Trophy fill='#EDEDED' stroke='#EDEDED' className='h-6 w-6' />
                        </div>
                    </CardHeader>
                    <CardContent className='flex flex-col space-y-2'>
                        <div className='flex flex-row items-center space-x-2 font-semibold text-xl'>
                            🏆 Grandmaster
                        </div>
                        <div>
                            Total Points: 38
                        </div>
                        <div>
                            Incentive: 2 ICP
                        </div>
                    </CardContent>
                </Card>

                <Card className='md:col-span-1'>
                    <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                        <div>
                            <div className='block md:hidden'>{ICPAddress ? `${ICPAddress.slice(0, 6)}...${ICPAddress.slice(-6)}` : ''}</div>
                            <div className='hidden md:block'>{ICPAddress ? `${ICPAddress.slice(0, 14)}...${ICPAddress.slice(-14)}` : ''}</div>
                        </div>
                        <div>
                            <Trophy fill='#F7A552' stroke='#F7A552' className='h-6 w-6' />
                        </div>
                    </CardHeader>
                    <CardContent className='flex flex-col space-y-2'>
                        <div className='flex flex-row items-center space-x-2 font-semibold text-xl'>
                            🏆 Grandmaster
                        </div>
                        <div>
                            Total Points: 29
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
                    data={leaderboardData ?? []}
                    userSearchColumn='ICPAddress'
                    inputPlaceHolder='Search by Principal ID'
                />
            </div>
        </div>
    )
}
