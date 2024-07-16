"use client"

import React, { useState } from 'react'
import { addUserSignUps } from '@/actions/dbActions'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const FormSchema = z.object({
    email: z.string({
        required_error: 'Email is required.',
    }).email({
        message: 'Invalid email format.',
    }),
})

export default function Page() {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
        }
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        const email = data.email;

        if (email) {
            const result = await addUserSignUps({ email });

            if (result) {
                if (result === 'Error adding user to signups') {
                    toast.info('User already signed up.');
                } else {
                    toast.success('User Signed Up!');
                    form.reset();
                }
                setSubmitting(false);
            }
        }
    }

    return (
        <MaxWidthWrapper className='py-4 md:py-36 flex items-center justify-center'>
            <Card className='w-[90vw] md:w-[550px]'>
                <CardHeader>
                    <CardTitle className='text-4xl md:text-5xl text-center'>BIT10</CardTitle>
                    <CardDescription className='text-lg py-2'>
                        <p className='py-0.5'>Sign up to become our Phase 2 <a href='https://x.com/bit10startup/status/1812843218247041507' target='_blank' className='underline'>testnet user</a> of BIT10.</p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='w-full flex flex-col space-y-4'>
                            <FormField
                                control={form.control}
                                name='email'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input {...field} className='dark:border-white' placeholder='Email' />
                                        </FormControl>
                                        <FormMessage className='text-destructive' />
                                    </FormItem>
                                )}
                            />

                            <Button type='submit' disabled={submitting}>
                                {submitting && <Loader2 className='w-4 h-4 animate-spin mr-2' />}
                                {submitting ? 'Submitting...' : 'Join Us'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </MaxWidthWrapper>
    )
}
