"use client"

import React, { useState, useEffect } from 'react'
import { userSignUps } from '@/actions/dbActions'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SignUpTypes, signUpColumns } from './columns'
import { DataTable } from '@/components/ui/data-table'

export default function Page() {
    const [loading, setLoading] = useState(true);
    const [signUpsData, setSignUpsData] = useState<SignUpTypes[]>([]);

    useEffect(() => {
        const fetchSignUpData = async () => {
            const result = await userSignUps();
            setSignUpsData(result as SignUpTypes[]);
            setLoading(false);
            if (result === 'Error fetching user signups') {
                toast.error('An error occurred while fetching user signups. Please try again!');
                setLoading(false);
            }
        };

        fetchSignUpData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <MaxWidthWrapper className='py-4 md:py-8'>
            {loading ? (
                <Card>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>User Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={signUpColumns()}
                            data={signUpsData}
                            userSearchColumn='email'
                            inputPlaceHolder='Search by email'
                        />
                    </CardContent>
                </Card>
            )}
        </MaxWidthWrapper>
    )
}
