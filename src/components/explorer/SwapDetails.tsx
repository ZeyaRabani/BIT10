"use client"

import React, { useState } from 'react'
import { transactionDetails } from '@/actions/dbActions'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TransactionDetailsType {
    transactionId: string;
    transactionType: string;
    transactionTime: string;
    transactionFromAccount: string;
    transactionTickInAmount: string;
    transactionTickInName: string;
    transactionTickOutAmount: string;
    transactionTickOutName: string;
}

export default function SwapDetails({ swapId }: { swapId: string }) {
    const [isTransactionFound, setIsTransactionFound] = useState<boolean>(true);

    const fetchTransactionDetails = async (transactionId: string) => {
        const response = await transactionDetails({ transactionId: transactionId });
        if (response === 'Error fetching transaction details') {
            toast.error('An error occurred while fetching transaction details. Please try again!');
        } else {
            setIsTransactionFound(Array.isArray(response) && response.length > 0);
            return response as TransactionDetailsType[];
        }
    };

    const transactionQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10TransactionActivity'],
                queryFn: () => fetchTransactionDetails(swapId)
            },
        ]
    })

    const isLoading = transactionQuery.some(query => query.isLoading);
    const recentActivityData = transactionQuery[0].data;

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const addOrdinalSuffix = (day: number): string => {
            if (day >= 11 && day <= 13) {
                return day + 'th';
            }
            switch (day % 10) {
                case 1: return day + 'st';
                case 2: return day + 'nd';
                case 3: return day + 'rd';
                default: return day + 'th';
            }
        };
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const formattedDay = addOrdinalSuffix(day);
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const period = hour < 12 ? 'AM' : 'PM';
        const formattedDate = `${formattedDay} ${month} ${year} at ${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;

        return formattedDate;
    };

    return (
        <MaxWidthWrapper className='py-4 flex justify-center'>
            {isLoading ? (
                <Card className='w-full md:w-3/4 dark:border-white bg-transparent'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-10 w-64', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='w-full md:w-3/4 dark:border-white bg-transparent'>
                    <CardHeader className='text-center md:text-start text-3xl font-semibold'>
                        Transaction Details
                    </CardHeader>
                    <div className='px-6 mb-2'>
                        <hr className='h-0.5 w-full' />
                    </div>
                    <CardContent>
                        {isTransactionFound && recentActivityData ? (
                            <div>
                                {recentActivityData.map((activity, index) => (
                                    <div key={index} className='flex flex-col space-y-2'>
                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Transaction ID</div>
                                            <div className='break-words'>{activity.transactionId}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Transaction Type</div>
                                            <div>
                                                <Badge className={activity.transactionType === 'Swap' ? 'bg-primary' : 'bg-[#FF0066]'}>
                                                    {activity.transactionType}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Transaction Time</div>
                                            <div className='break-words'>{formatDate(activity.transactionTime)}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>From Account</div>
                                            <div className='break-words'>{activity.transactionFromAccount}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Spent</div>
                                            <div className='break-words'>{(parseFloat(activity.transactionTickInAmount) / 100000000).toFixed(8)} {activity.transactionTickInName}</div>
                                        </div>

                                        <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                            <div className='font-semibold tracking-wide'>Recieved</div>
                                            <div className='break-words'>{activity.transactionTickOutAmount} {activity.transactionTickOutName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center text-2xl py-16'>
                                No Details found for this Thransaction ID
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </MaxWidthWrapper>
    )
}
