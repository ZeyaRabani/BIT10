"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { addUserSignUps } from '@/actions/dbActions'
import MaxWidthWrapper from './MaxWidthWrapper'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image, { type StaticImageData } from 'next/image'
import XImg from '@/assets/footer/x.svg'
import TelegramImg from '@/assets/footer/telegram.svg'

interface FooterLinkType {
    title: string;
    link: string;
}

interface SocialLinkType {
    link: string;
    imageName: StaticImageData;
}

const forCompany: FooterLinkType[] = [
    {
        title: 'About Us',
        link: '/'
    },
    {
        title: 'Contact Us',
        link: '/contact-us'
    }
]

const forLegal: FooterLinkType[] = [
    {
        title: 'Terms of Service',
        link: 'tos'
    },
    {
        title: 'Privacy Policy',
        link: 'privacy'
    },
    {
        title: 'Audit',
        link: 'audit'
    }
]

const companySocial: SocialLinkType[] = [
    {
        link: 'https://x.com/bit10startup',
        imageName: XImg as StaticImageData,
    },
    {
        link: 'https://t.me/zr00083',
        imageName: TelegramImg as StaticImageData,
    }
]

const FormSchema = z.object({
    email: z.string({
        required_error: 'Email is required',
    }).email({
        message: 'Invalid email format',
    })
})

export default function Footer() {
    const currentYear = new Date().getFullYear();

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
                    toast.info('User already added to the newsletter.');
                } else {
                    toast.success('User added to newsletter successfully!');
                    form.reset();
                }
            }
        }
    }

    return (
        <MaxWidthWrapper>
            <motion.footer
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
                className='bg-accent my-2.5 md:my-6 rounded backdrop-blur-0'>
                <div className='container p-6 mx-auto'>

                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4'>
                        <div className='sm:col-span-2'>
                            <h1 className='max-w-lg text-xl font-semibold tracking-wide'>Subscribe to Our Newsletter to Get Updates:</h1>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off' className='flex flex-col mx-auto mt-6 md:space-x-2 space-y-3 md:space-y-0 md:flex-row'>
                                    <FormField
                                        control={form.control}
                                        name='email'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input {...field} className='w-full' placeholder='Email Address' />
                                                </FormControl>
                                                <FormDescription>
                                                    Don&apos;t worry we will not send you spam emails.
                                                </FormDescription>
                                                <FormMessage className='text-destructive tracking-wide' />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type='submit'>
                                        Subscribe
                                    </Button>
                                </form>
                            </Form>
                        </div>

                        <div>
                            <p className='font-semibold tracking-wide'>Platform</p>

                            <div className='flex flex-col items-start mt-5 space-y-2'>
                                {forCompany.map((link, index) => (
                                    <Link href={link.link} key={index} passHref>
                                        <p className='transition-colors duration-300 hover:text-primary hover:cursor-pointer'>{link.title}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className='font-semibold tracking-wide'>Legal</p>

                            <div className='flex flex-col items-start mt-5 space-y-2'>
                                {forLegal.map((link, index) => (
                                    <Link href={link.link} key={index} passHref>
                                        <p className='transition-colors duration-300 hover:text-primary hover:cursor-pointer'>{link.title}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <hr className='my-6 border-gray-700 h-2' />

                    <div className='sm:flex sm:items-center sm:justify-between'>
                        <div className='flex flex-col space-y-2'>
                            <h1 className='text-lg'>Connect with us on:</h1>
                            <div className='flex gap-2 hover:cursor-pointer items-center'>
                                {companySocial.map((social, index) => (
                                    <a href={social.link} target='_blank' rel='noopener noreferrer' key={index} className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                                        <Image src={social.imageName} height={20} width={20} quality={100} alt={social.link} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className='flex flex-wrap justify-center items-center py-2 text-center text-xl w-full mx-auto'>&copy; {currentYear} BIT10, Inc. All rights reserved.</p>
                </div>
            </motion.footer>
        </MaxWidthWrapper>
    )
}
