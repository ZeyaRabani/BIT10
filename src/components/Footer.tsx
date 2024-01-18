"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { addUserNewsletter } from '@/lib/supabaseRequests'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormField, FormItem, FormDescription, FormMessage } from './ui/form'
import { Linkedin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

const FormSchema = z.object({
    email: z.string().email({
        message: 'Invalid email format.',
    }),
})

interface FooterLinks {
    title: string;
    link: string;
}

const quickLinks: FooterLinks[] = [
    {
        title: 'Dashboard',
        link: 'dashboard'
    },
    {
        title: 'Regulatory Compliance',
        link: 'regulatory-compliance'
    }
]

const forCompany: FooterLinks[] = [
    {
        title: 'About Us',
        link: '/'
    },
    {
        title: 'Contact Us',
        link: 'contact'
    },
    {
        title: 'Frequently Asked Questions',
        link: 'faqs'
    },
    {
        title: 'Terms of Service',
        link: 'tos'
    },
    {
        title: 'Privacy Policy',
        link: 'privacy'
    }
]

export default function Footer() {
    const [waitlist, setWaitlist] = useState([]);

    const currentYear = new Date().getFullYear()
    const { toast } = useToast()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        const email = data.email;

        if (email) {
            const result = await addUserNewsletter({ email });

            if (result) {
                // @ts-ignore
                if (result.error === '409') {
                    toast({
                        title: "User already added to the newsletter",
                    })
                } else {
                    // @ts-ignore
                    setWaitlist((prevWaitlist) => [...prevWaitlist, email]);
                    toast({
                        title: "User added to newslette!",
                    })
                    form.reset();
                }
            }
        }
    }

    return (
        <footer className="bg-gray-100 dark:bg-gray-900">
            <div className="container px-6 py-12 mx-auto">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                        <h1 className="max-w-lg text-xl font-semibold tracking-tight text-gray-800 xl:text-2xl dark:text-white">Subscribe our newsletter to get update.</h1>

                        {/* <div className="flex flex-col mx-auto mt-6 space-x-0 md:space-x-2 space-y-3 md:space-y-0 md:flex-row">
                            <Input id="email" type="text" className='w-full md:w-1/2' placeholder="Email Address" />

                            <Button>
                                Subscribe
                            </Button>
                        </div> */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col mx-auto mt-6 md:space-x-2 space-y-3 md:space-y-0 md:flex-row'>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input {...field} className="w-full" placeholder='Email Address' />
                                            </FormControl>
                                            <FormDescription>
                                                Don&apos;t worry we will not send you spam emails.
                                            </FormDescription>
                                            <FormMessage className='text-destructive' />
                                        </FormItem>
                                    )}
                                />

                                <Button type='submit' className='text-white bg-primary hover:bg-primary/90'>
                                    Subscribe
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">Quick Link</p>

                        <div className="flex flex-col items-start mt-5 space-y-2">
                            {quickLinks.map((link, index) => (
                                <Link href={link.link} key={index} passHref>
                                    <div className='text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:text-blue-500'>{link.title}</div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">About Company</p>

                        <div className="flex flex-col items-start mt-5 space-y-2">
                            {forCompany.map((link, index) => (
                                <Link href={link.link} key={index} passHref>
                                    <div className='text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:text-blue-500'>{link.title}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <hr className="my-6 border-gray-200 md:my-8 dark:border-gray-700" />

                <div className="flex items-center justify-between">
                    <Link href='/' passHref>
                        <div className="text-3xl font-semibold text-gray-800 dark:text-white">BIT10</div>
                    </Link>

                    <div className="flex md:-mx-2">
                        <a href="#" className="mx-0.5 md:mx-2 text-gray-600 transition-colors duration-300 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400" aria-label="Reddit">
                            <Linkedin />
                        </a>

                        <a href="#" className="mx-0.5 md:mx-2 text-gray-600 transition-colors duration-300 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400" aria-label="Reddit">
                            <Facebook />
                        </a>

                        <a href="#" className="mx-0.5 md:mx-2 text-gray-600 transition-colors duration-300 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400" aria-label="Reddit">
                            <Instagram />
                        </a>

                        <a href="#" className="mx-0.5 md:mx-2 text-gray-600 transition-colors duration-300 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400" aria-label="Reddit">
                            <Twitter />
                        </a>

                        <a href="#" className="mx-0.5 md:mx-2 text-gray-600 transition-colors duration-300 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400" aria-label="Reddit">
                            <Youtube />
                        </a>

                    </div>
                </div>
            </div>

            <div className='flex flex-wrap justify-center items-center py-2 text-center text-xl w-full mx-auto z-[48]'>
                &copy; {currentYear} BIT10, Inc. All rights reserved.
            </div>
        </footer>
    )
}
