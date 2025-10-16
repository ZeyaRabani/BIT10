"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { addWhitelistedAddress } from '@/actions/dbActions'

const FormSchema = z.object({
    address: z.string({
        required_error: 'Wallet address is required.',
    }).min(8, {
        message: 'Enter a valid wallet address.',
    })
})

export default function Page() {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            address: '',
        }
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        try {
            const result = await addWhitelistedAddress({ address: data.address });

            if (result === 'Wallet address added successfully') {
                toast.success('Wallet address whitelisted successfully!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred. Please try again!');
            setSubmitting(false);
        }
    }

    return (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
            <Card className='w-[90vw] md:w-[550px]'>
                <CardHeader>
                    <CardTitle className='text-4xl text-center'>BIT10 Whitelist</CardTitle>
                    <CardDescription className='text-center'>
                        Enter the user&apos;s wallet address to add them to the waitlist.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='w-full flex flex-col space-y-4'>
                            <FormField
                                control={form.control}
                                name='address'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>User Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Wallet address' />
                                        </FormControl>
                                        <FormDescription>Please enter the wallet address of the user.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type='submit' disabled={submitting}>
                                Submit
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
