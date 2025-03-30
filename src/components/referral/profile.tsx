import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Wallet, Tickets, Trophy, SquareCheck } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable } from '@/components/ui/data-table-referral-profile'
import type { ReferralProfileTableDataType } from '@/components/ui/data-table-referral-profile'

const referralProfileData = [
    {
        task: 'Post about BIT10 on Twitter/X',
        points: 1,
        status: true,
    },
    {
        task: 'Follow BIT10 on Twitter/X',
        points: 1,
        status: false,
    },
    {
        task: 'Like BIT10 Post on on Twitter/X',
        points: 1,
        status: false,
    },
    {
        task: 'Swap on Mainnet',
        points: 1,
        status: false,
    }
]

const referralProfileTableColumns: ColumnDef<ReferralProfileTableDataType>[] = [
    {
        accessorKey: 'task',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Task' />
        ),
    },
    {
        accessorKey: 'points',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Points' />
        ),
    },
    {
        accessorKey: 'action',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Action' />
        ),
    },
]

export default function Profile() {
    // const { principalId } = useWallet();

    return (
        <div className='pt-4 flex flex-col space-y-4'>
            <div className='flex flex-col space-y-2'>
                <div className='text-xl'>Your Referral Status</div>
                <div className='grid md:grid-cols-4 gap-4'>
                    <Card className='md:col-span-1'>
                        <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                            <div className='text-xl'>
                                Incentive
                            </div>
                            <div>
                                <Wallet className='h-5 w-5' />
                            </div>
                        </CardHeader>
                        <CardContent className='text-2xl font-semibold tracking-wide'>
                            <div>
                                2 ICP
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='md:col-span-1'>
                        <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                            <div className='text-xl'>
                                Point
                            </div>
                            <div>
                                <Tickets className='h-5 w-5' />
                            </div>
                        </CardHeader>
                        <CardContent className='text-2xl font-semibold tracking-wide'>
                            <div>
                                22
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='md:col-span-1'>
                        <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                            <div className='text-xl'>
                                Tasks Completed
                            </div>
                            <div>
                                <SquareCheck className='h-5 w-5' />
                            </div>
                        </CardHeader>
                        <CardContent className='text-2xl font-semibold tracking-wide'>
                            <div>
                                4
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='md:col-span-1'>
                        <CardHeader className='flex flex-row items-center justify-between space-x-2'>
                            <div className='text-xl'>
                                Rank
                            </div>
                            <div>
                                <Trophy className='h-5 w-5' />
                            </div>
                        </CardHeader>
                        <CardContent className='text-2xl font-semibold tracking-wide'>
                            <div>
                                🏆 Grandmaster
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Accordion type='multiple' defaultValue={['item-1', 'item-2']}>
                <AccordionItem value='item-1'>
                    <AccordionTrigger className='text-xl hover:no-underline'>Referral Points</AccordionTrigger>
                    <AccordionContent>
                        <ul className='list-disc pl-8 text-[1rem] md:text-lg'>
                            <li>1 Point for each task completed.</li>
                            <li>1 Point for each transaction done on the Liquidity Hub (Instant Liquidity Provider or Staked Liquidity Provider). Each successful transaction on Testnet by your referral will earn 1 Point.</li>
                            <li>2 Points for each Swap transaction (Swap or Reverse Swap). Each successful transaction on Mainnet by your referral will earn 2 Points.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-2'>
                    <AccordionTrigger className='text-xl hover:no-underline'>Referral Instructions</AccordionTrigger>
                    <AccordionContent>
                        <ol className='list-decimal pl-8 text-[1rem] md:text-lg'>
                            <li>Leaderboard refreshs every 30 minutes.</li>
                            <li>Only successfully completed transactions will be counted towards points.</li>
                            <li>Points are awarded only once per task; repeating the same task will not increase points.</li>
                            <li>The referral user must use the referral link and connect their wallet on the same device.</li>
                            <li>If User C uses the referral link of Person A, completes a swap/reverse swap transaction on mainnet, and then later uses the referral link of Person B to do another swap, the referral points will be awarded to Person A.</li>
                            <li>However, if User C uses Person A&apos;s referral link but does not complete any transaction, and later uses Person B&apos;s referral link to complete a swap, the referral points will be awarded to Person B.</li>
                        </ol>
                        <ul className='list-disc -ml-[-0.75rem] text-[1rem] md:text-lg'>5. Your rank is based on the points you have earned:
                            <li className='ml-8'>🏆 Grandmaster → 20+ points</li>
                            <li className='ml-8'>🎖 Master → 15-19 points</li>
                            <li className='ml-8'>🥇 Gold → 12-14 points</li>
                            <li className='ml-8'>🥈 Silver → 11 points</li>
                            <li className='ml-8'>🥉 Bronze → For beginners (Less than 11 points)</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className='flex flex-col space-y-2'>
                <div className='text-xl'>Tasks</div>
                <div>
                    <DataTable
                        columns={referralProfileTableColumns}
                        data={referralProfileData ?? []}
                    />
                </div>
            </div>
        </div>
    )
}
