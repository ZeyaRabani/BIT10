"use client"

import React, { useState } from 'react'
import { requestBIT10BTC } from '@/actions/dbActions'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/faucet.did'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FormSchema = z.object({
    email: z.string({
        required_error: 'Email is required.',
    }).email({
        message: 'Invalid email format.',
    }),
    principalID: z.string({
        required_error: 'Principal ID is required.',
    }).min(8, {
        message: 'Enter a valid Principal ID.',
    }),
})

const funnyFaucetMessage = [
    'Relax, Scrooge McCrypto! Leave some for the rest of us.',
    `You've got enough tokens to buy the moon. Faucet denied!`,
    `Nice try, but this isn't an all-you-can-eat buffet!`,
    `Even the faucet is jealous of your balance!`,
    `Bro, your wallet is heavier than my future. No more for you!`,
    `You could fund a small country. Step aside, please.`,
    `Faucet says: 'Nah fam, you good.'`,
    `Your wallet just filed for token obesity. No more!`,
    `You're already swimming in tokens, don't drown!`
];

export default function Page() {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            principalID: '',
        }
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (data.email && data.principalID) {

            setSubmitting(true);

            const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
            const canisterId = '5wxtf-uqaaa-aaaap-qpvha-cai';

            const agent = new HttpAgent({ host });
            const actor = Actor.createActor(idlFactory, {
                agent,
                canisterId,
            });

            if (data.principalID) {
                const to_account = {
                    owner: Principal.fromText(data.principalID),
                    subaccount: [],
                };

                if (actor && actor.check_and_transfer) {
                    try {
                        const balance = await actor.check_and_transfer({ to_account });

                        if (typeof balance === 'object' && balance !== null && 'Ok' in balance) {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            if (BigInt(balance.Ok) === BigInt(0)) {
                                const randomMessage = funnyFaucetMessage[Math.floor(Math.random() * funnyFaucetMessage.length)];
                                toast.info(randomMessage);
                                setSubmitting(false);
                            } else {
                                const result = await requestBIT10BTC({
                                    email: data.email,
                                    principalId: data.principalID
                                });

                                if (result) {
                                    await fetch('/bit10-btc-request', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            email: data.email,
                                            principalId: data.principalID,
                                        }),
                                    });

                                    if (result === 'Request added successfully') {
                                        toast.success('Request added successfully! BIT10.BTC will be sent to your principal ID.');
                                        form.reset();
                                        setSubmitting(false);
                                    } else {
                                        toast.error('An error occurred. Please try again!');
                                        setSubmitting(false);
                                    }
                                }
                            }
                        }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred. Please try again!');
                        setSubmitting(false);
                    }
                }
            }
        }
    }

    return (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
            <Card className='w-[90vw] md:w-[550px]'>
                <CardHeader>
                    <CardTitle className='text-4xl text-center'>BIT10.BTC Faucet</CardTitle>
                    <CardDescription className='text-center'>
                        Request BIT10.BTC for testing. BIT10.BTC is a test token representing BTC, allowing you to buy Test BIT10.DEFI tokens with it.
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
                                        <FormLabel>Your Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} className='dark:border-white' placeholder='Your Email' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='principalID'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Principal ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} className='dark:border-white' placeholder='Principal ID' />
                                        </FormControl>
                                        <FormDescription>Principal ID of your Plug wallet</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type='submit' disabled={submitting}>
                                {submitting && <Loader2 className='w-4 h-4 animate-spin mr-2' />}
                                {submitting ? 'Requesting...' : 'Request BIT10.BTC'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
