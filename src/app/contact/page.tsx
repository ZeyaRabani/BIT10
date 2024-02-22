"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from "@/components/ui/use-toast"
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Image from 'next/image'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const FormSchemaAngle = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    twitter: z.string().min(2, {
        message: 'Twitter must be at least 2 characters.',
    }).includes('@', {
        message: 'Twitter must include @.',
    }),
    email: z.string().email({
        message: 'Invalid email format.',
    }),
    message: z.string().min(6, {
        message: 'Message must be at least 6 characters.',
    }),
});

const FormSchemaEveryone = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    email: z.string().email({
        message: 'Invalid email format.',
    }),
    message: z.string().min(6, {
        message: 'Message must be at least 6 characters.',
    }),
});

export default function Page() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast()

    const formAngle = useForm<z.infer<typeof FormSchemaAngle>>({
        resolver: zodResolver(FormSchemaAngle),
        defaultValues: {
            name: '',
            twitter: '',
            email: '',
            message: '',
        },
    });

    const form = useForm<z.infer<typeof FormSchemaEveryone>>({
        resolver: zodResolver(FormSchemaEveryone),
        defaultValues: {
            name: '',
            email: '',
            message: '',
        },
    });

    function onSubmitAngle(values: z.infer<typeof FormSchemaAngle>) {
        setIsSubmitting(true);

        fetch('/api/contact-form', {
            method: 'POST',
            body: JSON.stringify(values),
        })
            .then((res) => res.json())
            .then((response) => {
                toast({
                    title: response.message,
                })
                formAngle.reset();
            })
            .catch((error) => {
                toast({
                    variant: "destructive",
                    title: 'Uh oh! Something went wrong. Please try again.',
                })
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    function onSubmitEveryone(values: z.infer<typeof FormSchemaEveryone>) {
        setIsSubmitting(true);

        fetch('/api/contact-form-everyone', {
            method: 'POST',
            body: JSON.stringify(values),
        })
            .then((res) => res.json())
            .then((response) => {
                toast({
                    title: response.message,
                })
                formAngle.reset();
            })
            .catch((error) => {
                toast({
                    variant: "destructive",
                    title: 'Uh oh! Something went wrong. Please try again.',
                })
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    return (
        <MaxWidthWrapper className='flex flex-col justify-center items-center space-y-2'>
            <Tabs defaultValue="angle" className="w-[300px] md:w-[70%]">
                {/* <TabsList className="grid w-full grid-cols-2 mb-4"> */}
                    {/* <TabsTrigger value="angle">For Early Users</TabsTrigger> */}
                    {/* <TabsTrigger value="everyone">For Questions</TabsTrigger> */}
                {/* </TabsList> */}
                <div className='flex min-h-full items-center justify-center'>
                    <div className='animate-fade-in-down max-w-5xl border-2 border-accent rounded-lg mb-8' >
                        <div className='md:flex w-full'>
                            <div className='w-full md:w-1/2 p-4 md:p-10 flex flex-col'>
                                <div className='mb-0 md:mb-10'>
                                    <h1 className='font-bold text-3xl'>Get in touch</h1>
                                </div>
                                <div className='hidden md:flex md:items-center'>
                                    <Image src='/assets/contact/undraw_profile_data_re_v81r.svg' width='400' height='400' alt='Contact Us' className='w-full' />
                                </div>
                            </div>
                            <div className='w-full md:w-1/2 px-4 pb-4 md:p-10'>
                                <TabsContent value="angle">
                                    <Form {...formAngle}>
                                        <form onSubmit={formAngle.handleSubmit(onSubmitAngle)} className="space-y-4">
                                            <FormField
                                                control={formAngle.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Your Name</FormLabel>
                                                        <FormControl>
                                                            <Input className='w-full p-2' placeholder='Your Name' {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={formAngle.control}
                                                name="twitter"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Your Twitter handle</FormLabel>
                                                        <FormControl>
                                                            <Input className='w-full p-2' placeholder='Your Twitter handle' {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={formAngle.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>E-mail</FormLabel>
                                                        <FormControl>
                                                            <Input className='p-2' placeholder='Your Email' {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={formAngle.control}
                                                name="message"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Your message</FormLabel>
                                                        <FormControl>
                                                            <div className='flex'>
                                                                <Textarea className='w-full min-h-[8.5rem]' placeholder='Your message'  {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type='submit' className='text-white w-full' disabled={isSubmitting}>
                                                {isSubmitting ? 'Submitting...' : 'Send'}
                                            </Button>
                                        </form>
                                    </Form>
                                </TabsContent>
                                {/* <TabsContent value="everyone">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmitEveryone)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Your Name</FormLabel>
                                                        <FormControl>
                                                            <Input className='w-full p-2' placeholder='Your Name' {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>E-mail</FormLabel>
                                                        <FormControl>
                                                            <Input className='p-2' placeholder='Your Email' {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="message"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Your message</FormLabel>
                                                        <FormControl>
                                                            <div className='flex'>
                                                                <Textarea className='w-full min-h-[8.5rem]' placeholder='Your message'  {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type='submit' className='text-white w-full' disabled={isSubmitting}>
                                                {isSubmitting ? 'Submitting...' : 'Send'}
                                            </Button>
                                        </form>
                                    </Form>
                                </TabsContent> */}
                            </div>
                        </div>
                    </div>
                </div>
            </Tabs>
        </MaxWidthWrapper>
    )
}
