"use client"

import React, { useState, useEffect } from 'react'
import { swapDetails } from '@/actions/dbActions'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SwapDetailsType {
    token_swap_id: string;
    user_principal_id: string;
    token_purchase_amount: string;
    token_purchase_name: string;
    token_transaction_status: string;
    token_bought_at: string;
}

export default function SwapIdDetails({ swapId }: { swapId: string }) {
    const [loading, setLoading] = useState(true);
    const [isSwapFound, setIsSwapFound] = useState<boolean>(true);
    const [swapDetals, setSwapDetals] = useState<SwapDetailsType[]>([]);

    useEffect(() => {
        const fetchSwapDetails = async () => {
            if (swapId) {
                const result = await swapDetails({ swapId: swapId });
                setSwapDetals(result as SwapDetailsType[]);
                setIsSwapFound(Array.isArray(result) && result.length > 0);
                setLoading(false);
                if (result === 'Error fetching swap details') {
                    toast.error('An error occurred while fetching swap details. Please try again!');
                    setLoading(false);
                }
            }
        };

        fetchSwapDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getBadgeVariant = (status: string): 'success' | 'outline' | 'destructive' => {
        switch (status) {
            case 'Confirmed':
                return 'success';
            case 'Unconfirmed':
                return 'outline';
            case 'Failed':
                return 'destructive';
            default:
                return 'outline';
        }
    };

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
            {loading ? (
                <Card className='w-full md:w-3/4 dark:border-white'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-10 w-64', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10', 'h-10'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='w-full md:w-3/4 dark:border-white'>
                    <CardHeader className='text-center md:text-start text-3xl font-semibold'>
                        Swap Details
                    </CardHeader>
                    <div className='px-6 mb-2'>
                        <hr className='h-0.5 w-full' />
                    </div>
                    <CardContent>
                        {isSwapFound ? (
                            <div className='flex flex-col space-y-2'>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                    <div className='font-semibold tracking-wide'>Swap ID</div>
                                    <div className='break-words'>{swapDetals[0].token_swap_id}</div>
                                </div>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                    <div className='font-semibold tracking-wide'>Result</div>
                                    <div>
                                        <Badge variant={`${getBadgeVariant(swapDetals[0].token_transaction_status)}`}>{swapDetals[0].token_transaction_status}</Badge>
                                    </div>
                                </div>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                    <div className='font-semibold tracking-wide'>Timestamp</div>
                                    <div>{formatDate(swapDetals[0].token_bought_at)}</div>
                                </div>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                    <div className='font-semibold tracking-wide'>Confirmation</div>
                                    <div>{swapDetals[0].token_transaction_status}</div>
                                </div>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                    <div className='font-semibold tracking-wide'>From Address</div>
                                    <div>{swapDetals[0].user_principal_id}</div>
                                </div>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent hover:rounded py-1 px-2'>
                                    <div className='font-semibold tracking-wide'>Transfer Amount</div>
                                    <div>{swapDetals[0].token_purchase_amount} {swapDetals[0].token_purchase_name}</div>
                                </div>
                            </div>
                        ) : (
                            <div className='text-center text-2xl py-16'>
                                No Details found for this Swap ID
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </MaxWidthWrapper>
    )
}
