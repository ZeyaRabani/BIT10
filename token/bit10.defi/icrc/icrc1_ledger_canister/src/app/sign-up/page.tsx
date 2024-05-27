"use client"

import React, { useState } from 'react'
import { signUpUserList } from '@/lib/supabaseRequests'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from "@/components/ui/use-toast"
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Image from 'next/image'
import { Form, FormControl, FormField, FormItem, FormDescription, FormMessage, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FormSchema = z.object({
    user_name: z.string().min(3, {
        message: 'Name must be at least 3 characters long.',
    }),
    user_email: z.string().email({
        message: 'Invalid email format.',
    }),
    user_twitter: z.string().min(3, {
        message: 'Username must be at least 3 characters long.',
    }).optional()
})

export default function Page() {
    const [waitlist, setSignUpList] = useState([]);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            user_name: "",
            user_email: "",
            // user_twitter: "",
        },
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        const name = data.user_name;
        const email = data.user_email;
        const twitter = data.user_twitter;

        if (email) {
            const result = await signUpUserList({ user_name: name, user_email: email, user_twitter: twitter });

            if (result) {
                // @ts-ignore
                if (result.error === '409') {
                    toast({
                        title: "User already added Signed Up",
                    })
                } else {
                    // @ts-ignore
                    setSignUpList((prevWaitlist) => [...prevWaitlist, email]);
                    toast({
                        title: "User added to Signed Up list!",
                    })
                    form.reset();
                }
            }
        }
    }

    return (
        <MaxWidthWrapper>
            <div className='flex items-center justify-center pb-8'>
                <div className='w-full md:max-w-[60vw] grid md:grid-cols-2 gap-2 rounded-lg bg-[#F3F4F6]'>
                    <div className='hidden md:grid md:place-items-center bg-primary rounded-l-lg'>
                        <Image src='/assets/sign-up/undraw_nakamoto_-2-iv6.svg' className='p-8' alt='Sign Up' width={500} height={500} />
                    </div>
                    <div>
                        <h1 className='text-black text-3xl font-bold text-center pt-8'>Sign Up</h1>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col space-y-2 px-4 py-4'>
                                <FormField
                                    control={form.control}
                                    name="user_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-600'>Your Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="w-full bg-[#FFFFFF] text-gray-900" placeholder='Your Name' />
                                            </FormControl>
                                            <FormDescription>
                                                Your Full Name
                                            </FormDescription>
                                            <FormMessage className='text-destructive' />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="user_email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-600'>Your Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="w-full bg-[#FFFFFF] text-gray-900" placeholder='Your Email' />
                                            </FormControl>
                                            <FormDescription>
                                                Your Email
                                            </FormDescription>
                                            <FormMessage className='text-destructive' />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="user_twitter"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-600'>Your Twitter Handle (optional)</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="w-full bg-[#FFFFFF] text-gray-900" placeholder='Your Twitter Handle' />
                                            </FormControl>
                                            <FormDescription>
                                                Your Twitter Handle includeing @
                                            </FormDescription>
                                            <FormMessage className='text-destructive' />
                                        </FormItem>
                                    )}
                                />

                                <Button type='submit' className='text-white bg-primary w-full hover:bg-primary/90'>
                                    Sign Up for Waitlist
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}
