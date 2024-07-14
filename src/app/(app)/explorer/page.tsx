"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const FormSchema = z.object({
    swapID: z.string({
        required_error: 'Swap ID is required.',
    }).min(8, {
        message: 'Enter a valid Swap ID.',
    }).includes('swap', {
        message: 'Enter a valid Swap ID.',
    }),
})

export default function Page() {
    const router = useRouter();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            swapID: '',
        }
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        router.push(`/explorer/${data.swapID}`);
    }

    return (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
            <Card className='w-[90vw] md:w-[550px]'>
                <CardHeader>
                    <CardTitle className='text-4xl text-center'>BIT10 Explorer</CardTitle>
                    <CardDescription className='text-center'>
                        Enter the Swap ID to view the details of the swap
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='w-full flex flex-col space-y-4'>
                            <FormField
                                control={form.control}
                                name='swapID'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Swap ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} className='dark:border-white' placeholder='Swap ID' />
                                        </FormControl>
                                        <FormDescription>Please enter the Swap ID associated with your transaction.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type='submit'>
                                Submit
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
