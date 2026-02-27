"use client";

import { useQueries } from '@tanstack/react-query';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '@/lib/canisters/bit10_exchange.did';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactPercentNumber, formatDate, getTokenName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export interface RecentActivityItem {
    swap_id: string;
    transaction_type: string;
    transaction_timestamp: string;
    user_wallet_address: string;
    token_in_amount: string;
    token_in_address: string;
    token_out_amount: string;
    token_out_address: string;
}

export default function TrxDetails({ swapId }: { swapId: string }) {
    const processedSwapId = swapId.startsWith('/') ? swapId.slice(1) : swapId;

    const fetchTransactionDetails = async () => {
        try {
            const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';
            const agent = await HttpAgent.create({ host: 'https://icp-api.io' });
            const actor = Actor.createActor(idlFactory, { agent, canisterId });
            const response = await actor.get_swap_history_by_swap_id?.(processedSwapId.toLocaleLowerCase());
            return response as RecentActivityItem[];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error("An error occurred while fetching transaction details. Please try again!");
            return [];
        }
    };

    const transactionQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10TransactionActivity'],
                queryFn: () => fetchTransactionDetails()
            },
        ]
    })

    const isLoading = transactionQuery.some(query => query.isLoading);
    const recentActivityData = transactionQuery[0].data;

    return (
        <div>
            {isLoading ?
                <div className='flex flex-col h-full space-y-2 px-4'>
                    {['h-10 w-64', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10'].map((classes, index) => (
                        <Skeleton key={index} className={classes} />
                    ))}
                </div>
                :
                <div className='flex flex-col space-y-4 px-4'>
                    <div className='text-center md:text-start text-3xl font-semibold md:pl-2'>
                        Transaction Details
                    </div>
                    <div className='px-6 mb-2'>
                        <hr className='h-0.5 w-full' />
                    </div>
                    <div>
                        {!recentActivityData || (Array.isArray(recentActivityData) && recentActivityData.length === 0) ? (
                            <div className='text-center text-2xl py-16'>
                                No Details found for this Transaction ID
                            </div>
                        ) : (
                            <ScrollArea className='w-[80vw] md:w-full whitespace-nowrap'>
                                {recentActivityData.map((activity: RecentActivityItem, index) => (
                                    <div key={index} className='flex flex-col space-y-2 pb-2'>
                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Transaction ID</div>
                                            <div className='wrap-break-word'>{activity.swap_id}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Transaction Type</div>
                                            <div>
                                                <Badge className={activity.transaction_type === 'Buy' ? 'bg-primary' : 'bg-[#FF0066] hover:bg-[#f64189]'}>
                                                    {activity.transaction_type === 'Buy' ? 'Mint' : activity.transaction_type}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Transaction Time</div>
                                            <div className='wrap-break-word'>{formatDate(activity.transaction_timestamp)}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>From Account</div>
                                            <div className='wrap-break-word'>{activity.user_wallet_address}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Spent</div>
                                            <div className='wrap-break-words'>{formatCompactPercentNumber(parseFloat(activity.token_in_amount))} {getTokenName(activity.token_in_address)}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Recieved</div>
                                            <div className='wrap-break-words'>{formatCompactPercentNumber(parseFloat(activity.token_out_amount))} {getTokenName(activity.token_out_address)}</div>
                                        </div>
                                    </div>
                                ))}
                                <ScrollBar orientation='horizontal' />
                            </ScrollArea>
                        )}
                    </div>
                </div>
            }
        </div>
    )
}
