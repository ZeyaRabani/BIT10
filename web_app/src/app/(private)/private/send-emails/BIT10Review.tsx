"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FormSchema = z.object({
    email: z.string({
        required_error: 'Email is required.',
    }).email({
        message: 'Invalid email format.',
    })
})

export default function BIT10Review() {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
        }
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (data.email) {

            setSubmitting(true);

            await fetch('/bit10-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email
                })
            })
                .then((res) => res.json())
                .then((response: { message: string }) => {
                    toast.success(response.message as React.ReactNode)
                    form.reset();
                })
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .catch((error) => {
                    toast.error('An error occurred while submitting the form. Please try again!');
                })
                .finally(() => {
                    setSubmitting(false);
                });
        }
    }

    return (
        <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
            <h1 className='Text-2xl'>Send BIT10 Review Email</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='w-full flex flex-col space-y-4'>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Send email to</FormLabel>
                                <FormControl>
                                    <Input {...field} className='dark:border-white' placeholder='Send email to' />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type='submit' disabled={submitting}>
                        {submitting && <Loader2 className='w-4 h-4 animate-spin mr-2' />}
                        {submitting ? 'Sending...' : 'Send Email'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
