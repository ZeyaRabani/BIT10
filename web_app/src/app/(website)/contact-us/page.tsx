"use client";

import { useState, Suspense } from 'react';
import Preloader from '@/components/Preloader';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { toast } from 'sonner';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import ContactImg from '@/assets/contact/contact.svg';
import { Card, CardTitle } from '@/components/ui/card';
import Image, { type StaticImageData } from 'next/image';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { UserIcon, MailIcon, Loader2Icon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const FormSchema = z.object({
    name: z.string({
        required_error: 'Name is required.',
    }).min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    email: z.string({
        required_error: 'Email is required.',
    }).email({
        message: 'Invalid email format.',
    }),
    message: z.string({
        required_error: 'Message is required.',
    }).min(6, {
        message: 'Message must be at least 6 characters.',
    }),
});

export default function Page() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formDefaults = {
        name: '',
        email: '',
        message: '',
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
        setIsSubmitting(true);

        fetch('/contact-form', {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .then((response: { message: React.ReactNode }) => {
                toast.success(response.message);
                form.reset();
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch((error) => {
                toast.error('An error occurred while submitting the form. Please try again!');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    return (
        <Suspense fallback={<Preloader />}>
            <MaxWidthWrapper className='md:px-36 pt-4'>
                <Card className='animate-fade-in-down grid md:grid-cols-2 p-4 md:p-10 shadow-2xl gap-6'>
                    <div className='flex flex-col justify-between'>
                        <div>
                            <CardTitle className='text-2xl font-semibold leading-tight tracking-wider lg:text-3xl'>Let&apos;s talk about everything!</CardTitle>
                            <div className='mt-4 tracking-wide'>
                                Hate forms? Send an <a href='mailto:zeyarabani@bit10.app' className='text-primary underline cursor-pointer'>email</a> instead.
                            </div>
                        </div>
                        <div className='mt-2 text-center p-2 md:p-8'>
                            <Image className='w-full' src={ContactImg as StaticImageData} width='200' height='200' alt='Contact Us' />
                        </div>
                    </div>
                    <form autoComplete='off' className='flex flex-col space-y-4'
                        onSubmit={async (e) => {
                            e.preventDefault()
                            await form.handleSubmit()
                        }}
                    >
                        <form.Field name='name'>
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel>Your Name</FieldLabel>
                                        <div className='flex'>
                                            <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center'><UserIcon height={20} width={20} /></div>
                                            <Input className='w-full -ml-10 pl-10 pr-3 py-2' placeholder='Your Name' onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                        {isInvalid && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <form.Field name='email'>
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel>E-mail</FieldLabel>
                                        <div className='flex'>
                                            <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center'><MailIcon height={20} width={20} /></div>
                                            <Input className='w-full -ml-10 pl-10 pr-3 py-2' placeholder='Your Email' onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                        {isInvalid && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <form.Field name='message'>
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel>Your message</FieldLabel>
                                        <Textarea className='w-full min-h-56' placeholder='Your message' onChange={(e) => field.handleChange(e.target.value)} />
                                        {isInvalid && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <Button type='submit' disabled={isSubmitting}>
                            {isSubmitting && <Loader2Icon className='mr-2 h-4 w-4 animate-spin' size={20} />}
                            {isSubmitting ? 'Sending...' : 'Send'}
                        </Button>
                    </form>
                </Card>
            </MaxWidthWrapper>
        </Suspense>
    )
}
