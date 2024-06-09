"use client"

import React from 'react'
import { addUserSignUps } from '@/actions/dbActions'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FormSchema = z.object({
    email: z.string({
        required_error: 'Email is required.',
    }).email({
        message: 'Invalid email format.',
    }),
})

export default function Page() {
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
            }
        }
    }

    return (
        <div className='relative h-screen'>
            <div className='absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-signup'></div>
            <div className='absolute top-4 left-2 z-10'>
                <Image src='/logo/logo.png' height={80} width={80} alt='img' />
            </div>
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
                <Card className='w-[90vw] md:w-[550px] md:px-6 bg-opacity-50 bg-white font-readex'>
                    <CardHeader>
                        <CardTitle className='text-black text-4xl md:text-5xl text-center'>BIT10</CardTitle>
                        <CardDescription className='text-black text-lg pt-8'>
                            <p className='py-0.5'>Sign up to become a <a href='https://twitter.com/bit10startup/status/1764954854965821729' target='_blank' className='underline'>testnet user</a> of BIT10.</p>
                            <p className='pt-0.5'>What you will get:</p>
                            <ul>
                                <li className='list-disc ml-5'>Early access to our first smart asset.</li>
                                <li className='list-disc ml-5'>Opportunity to develop new product with us.</li>
                                <li className='list-disc ml-5'>Access to a private channel in our future Discord.</li>
                                <li className='list-disc ml-5'>Points for…</li>
                            </ul>
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
                                                <Input {...field} className='w-full bg-white text-black text-lg' placeholder='Email' />
                                            </FormControl>
                                            <FormMessage className='text-destructive' />
                                        </FormItem>
                                    )}
                                />

                                <Button type='submit' className='text-white bg-black hover:bg-gray-900 w-56 self-center text-lg'>
                                    Join Us
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
