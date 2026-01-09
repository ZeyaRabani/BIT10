"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { addUserSignUps } from '@/actions/dbActions'
import MaxWidthWrapper from './MaxWidthWrapper'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'
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

    const formDefaults = {
        email: ''
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

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        const email = data.email;

        if (email) {
            const result = await addUserSignUps({ email });

            if (result === 'Error adding user to signups') {
                toast.info('User already added to the newsletter.');
            } else {
                toast.success('User added to newsletter successfully!');
                form.reset();
            }
        }
    }

    return (
        <MaxWidthWrapper>
            <motion.footer initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }} className='my-2.5 md:mt-6 md:mb-2.5'>
                <div className='container p-6 mx-auto'>

                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4'>
                        <div className='sm:col-span-2'>
                            <h1 className='max-w-lg text-xl font-semibold tracking-wide'>Subscribe to Our Newsletter to Get Updates:</h1>
                            <form autoComplete='off' className='flex flex-col mx-auto mt-6 md:space-x-2 space-y-3 md:space-y-0 md:flex-row'
                                onSubmit={async (e) => {
                                    e.preventDefault()
                                    await form.handleSubmit()
                                }}
                            >
                                <form.Field name='email'>
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field data-invalid={isInvalid} className='max-w-full md:max-w-1/2'>
                                                <Input placeholder='Email Address' onChange={(e) => field.handleChange(e.target.value)} />
                                                <FieldDescription>Don&apos;t worry we will not send you spam emails.</FieldDescription>
                                                {isInvalid && (
                                                    <FieldError errors={field.state.meta.errors} />
                                                )}
                                            </Field>
                                        );
                                    }}
                                </form.Field>

                                <Button type='submit' className='md:-mt-0.5'>
                                    Subscribe
                                </Button>
                            </form>
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
                                        <Image src={social.imageName} height={20} width={20} alt={social.link} />
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
