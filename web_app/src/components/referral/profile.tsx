/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react'
import { useWallet } from '@/context/WalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, Tickets, SquareCheck } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable } from '@/components/ui/data-table-referral-profile'
import type { ReferralProfileTableDataType } from '@/components/ui/data-table-referral-profile'

type Bit10ReferralType = {
    bit10_apr_referral: {
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

// const referralProfileData = [
// {
//     task: 'Post about BIT10 on Twitter/X',
//     points: 10,
//     status: true,
// },
// {
//     task: 'Follow BIT10 on Twitter/X',
//     points: 10,
//     status: false,
// },
// {
//     task: 'Turn on all notifications for BIT10 X account',
//     points: 10,
//     status: false,
// },
// {
//     task: 'Like BIT10 Post on on Twitter/X',
//     points: 10,
//     status: false,
// },
//     {
//         task: 'Swap on Mainnet',
//         points: 10,
//         status: false,
//     },
//     {
//         task: 'Swap on Internet Computer Testnet',
//         points: 10,
//         status: false,
//     }
// ]

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
    const { principalId } = useWallet();

    const fetchUserReferral = async (userAddress: string) => {
        const response = await fetch(userAddress);

        if (!response.ok) {
            toast.error('Error fetching Referral. Please try again!');
        }

        const data = await response.json() as Bit10ReferralType;
        return data;
    };

    const bit10UserReferralQueries = useQueries({
        queries: [
            {
                queryKey: ['bit10UserReferral'],
                queryFn: () => fetchUserReferral(`referral-user-${principalId}`),
            },
        ],
    });

    const isLoading = bit10UserReferralQueries.some(query => query.isLoading);
    const bit10Data = bit10UserReferralQueries[0]?.data ?? [];
    // const bit10ReferralTask = bit10UserReferralQueries[0]?.data ?? [];

    // console.log(bit10ReferralTask);

    // @ts-expect-error
    const tasksData = bit10Data.tasks_completed ? [
        {
            task: 'Swap on Mainnet',
            points: 10,
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            status: bit10Data.tasks_completed.swap_on_mainnet,
            swap_on_mainnet: 'Swap on Mainnet'
        },
        {
            task: 'Swap on Internet Computer Testnet',
            points: 10,
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            status: bit10Data.tasks_completed.swap_on_internet_computer_testnet,
            swap_on_mainnet: 'Swap on Internet Computer Testnet'
        },
        {
            task: 'Swap on Internet Computer Liquidity Hub',
            points: 10,
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            status: bit10Data.tasks_completed.liquidity_hub_tx_on_internet_computer_testnet,
            swap_on_mainnet: 'Swap on Internet Computer Testnet'
        }
    ] : [];

    return (
        <div className='pt-4 flex flex-col space-y-4'>
            <div className='flex flex-col space-y-2'>
                <div className='text-xl'>Your Referral Status</div>
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
                                        {['h-12', 'h-12'].map((classes, index) => (
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
                                    <div className='text-xl'>
                                        Incentive
                                    </div>
                                    <div>
                                        <Wallet className='h-5 w-5' />
                                    </div>
                                </CardHeader>
                                <CardContent className='text-3xl font-semibold tracking-wide'>
                                    <div>
                                        {/* Update this for points: 5, 3, 2 */}
                                        {/* @ts-expect-error */}
                                        {bit10Data?.position === 1 && bit10Data?.total_points !== 0 ? '0 ICP' :
                                            // @ts-expect-error
                                            bit10Data?.position === 2 && bit10Data?.total_points !== 0 ? '0 ICP' :
                                                // @ts-expect-error
                                                bit10Data?.position === 3 && bit10Data?.total_points !== 0 ? '0 ICP' :
                                                    '0 ICP'}
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
                                <CardContent className='text-3xl font-semibold tracking-wide'>
                                    <div>
                                        {/* @ts-expect-error */}
                                        {bit10Data?.total_points || '0'}
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
                                <CardContent className='text-3xl font-semibold tracking-wide'>
                                    <div>
                                        {/* @ts-expect-error */}
                                        {bit10Data.tasks_completed ?
                                            // @ts-expect-error
                                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                            Object.values(bit10Data.tasks_completed).filter(status => status === true).length
                                            : 0}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div>
                            <DataTable
                                columns={referralProfileTableColumns}
                                data={tasksData ?? []}
                            />
                        </div>
                    </div>
                }
            </div>

            <Accordion type='multiple' defaultValue={['item-1', 'item-2']}>
                <AccordionItem value='item-1'>
                    <AccordionTrigger className='text-xl hover:no-underline'>Referral Points</AccordionTrigger>
                    <AccordionContent>
                        <ul className='list-disc pl-8 text-[1rem] md:text-lg'>
                            <li>10 points per completed task.</li>
                            <li>5 points per Liquidity Hub transaction (Instant or Staked) by your referral.</li>
                            <li>5 points for each Testnet transaction by your referral.</li>
                            <li>20 points for each Mainnet Swap by your referral.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-2'>
                    <AccordionTrigger className='text-xl hover:no-underline'>Referral Instructions</AccordionTrigger>
                    <AccordionContent>
                        <ol className='list-decimal pl-8 text-[1rem] md:text-lg'>
                            <li>Points and leaderboard updates every 30 mins.</li>
                            <li>Only successful transactions count.</li>
                            <li>Each task gives points once only.</li>
                            <li>Referral link must be used on the same device.</li>
                            <li>First referrer gets the points if a transaction is completed. For eg. if User C uses the referral link of Person A and completes a swap/reverse swap transaction on mainnet, then later uses the referral link of Person B, the referral points will still be awarded to Person A.</li>
                            <li>If no transaction is done, points go to the next valid referrer. for eg. if User C initially uses Person A&apos;s referral link but does not complete any transaction, and later uses Person B&apos;s referral link and completes a transaction, then the referral points will be awarded to Person B.</li>
                        </ol>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
