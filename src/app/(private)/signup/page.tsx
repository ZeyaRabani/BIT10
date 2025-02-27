"use client"

import React, { useState, useEffect } from 'react'
import { userSignUps } from '@/actions/dbActions'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable } from '@/components/ui/data-table'

type SignUpTypes = {
    newsletter_subscribers_id: number;
    email: string;
}

const signUpColumns = (): ColumnDef<SignUpTypes>[] => [
    {
        accessorKey: 'newsletter_subscribers_id',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Newsletter Subscribers ID' />
        ),
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Email' />
        ),
    }
];

export default function Page() {
    const [loading, setLoading] = useState(true);
    const [signUpsData, setSignUpsData] = useState<SignUpTypes[]>([]);

    useEffect(() => {
        const fetchSignUpData = async () => {
            const result = await userSignUps();
            setSignUpsData((result as { email: string; newsletterSubscribersId: number; }[]).map(item => ({
                email: item.email,
                newsletter_subscribers_id: item.newsletterSubscribersId
            })));
            setLoading(false);
            if (result === 'Error fetching user signups') {
                toast.error('An error occurred while fetching user signups. Please try again!');
                setLoading(false);
            }
        };

        fetchSignUpData().catch(_error => {
            toast.error('An error occurred while fetching user signups. Please try again!');
            setLoading(false);
        });
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
