"use client";

import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TrxDetails from './TrxDetails';

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

const FormSchema = z.object({
    swap_id: z.string({
        message: 'Transaction ID is required.',
    }).min(8, {
        message: 'Enter a valid Transaction ID.',
    })
})

export default function Explorer() {
    const [submittedSwapId, setSubmittedSwapId] = useState<string | null>(null);

    const formDefaults = {
        swap_id: ''
    };

    const form = useForm({
        defaultValues: formDefaults,
        validators: {
            onSubmit: FormSchema,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value)
        },
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get('id');

        if (idParam) {
            setSubmittedSwapId(idParam);
        }
    }, []);

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setSubmittedSwapId(data.swap_id)

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', data.swap_id);
        window.history.pushState({}, '', newUrl);
    }

    if (submittedSwapId) {
        return (
            <div className='flex flex-col py-4 h-full items-center justify-center'>
                <Card className='w-full md:w-3/4'>
                    <TrxDetails swapId={submittedSwapId} />
                </Card>
            </div>
        )
    }

    return (
        <div className='flex flex-col py-16 h-full items-center justify-center'>
            <Card className='w-[90vw] md:w-[550px]'>
                <CardHeader>
                    <CardTitle className='text-4xl text-center'>BIT10 Explorer</CardTitle>
                    <CardDescription className='text-center'>
                        Enter the Transaction ID to view the details of the transaction
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form autoComplete='off' className='w-full flex flex-col space-y-4'
                        onSubmit={async (e) => {
                            e.preventDefault()
                            await form.handleSubmit()
                        }}
                    >
                        <form.Field name='swap_id'>
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel>Transaction ID</FieldLabel>
                                        <Input placeholder='Transaction ID' onChange={(e) => field.handleChange(e.target.value)} />
                                        <FieldDescription>Please enter the Transaction ID associated with your transaction.</FieldDescription>
                                        {isInvalid && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <Button type='submit'>
                            Submit
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
