"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletMinimal, CircleDollarSign, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const FormSchema = z.object({
    sender_address: z.string({
        required_error: 'Sender address is required.',
    }).min(8, 'Sender address is required.'),
    receiver_address: z.string({
        required_error: 'Receiver address is required.',
    }).min(8, 'Receiver address is required.'),
    bit10_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        required_error: 'Please enter the number of Test BIT10.DEFI tokens you wish to transfer.',
    })
        .positive('The amount must be a positive number.')
        .min(0.03, 'Minimum amount should be 0.03')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places.')),
});

export default function Page() {
    const [sending, setSending] = useState<boolean>(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            sender_address: '',
            receiver_address: '',
            bit10_amount: 1
        },
    });

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSending(true);
            const bit10DEFICanisterId = 'hbs3g-xyaaa-aaaap-qhmna-cai';

            const hasAllowed = await window.ic.plug.requestConnect({
                whitelist: [bit10DEFICanisterId]
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (hasAllowed) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const actor = await window.ic.plug.createActor({
                    canisterId: bit10DEFICanisterId,
                    interfaceFactory: idlFactory
                });

                const receiverAccountId = values.receiver_address;

                const amount = Math.round(values.bit10_amount * 100000000).toFixed(0).toString();

                const args = {
                    to: {
                        owner: Principal.fromText(receiverAccountId),
                        subaccount: []
                    },
                    memo: [],
                    fee: [],
                    from_subaccount: [],
                    created_at_time: [],
                    amount: BigInt(amount)
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const transfer = await actor.icrc1_transfer(args);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (transfer.Ok) {
                    toast.success('Transfer successful');
                    form.reset();
                }
                else {
                    toast.error('Transfer failed.');
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setSending(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setSending(false);
        }
    }

    return (
        <MaxWidthWrapper>
            <div className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
                <Card className='w-[300px] md:w-[550px] animate-fade-bottom-up'>
                    <CardHeader>
                        <CardTitle className='flex flex-row items-center justify-between'>
                            <div>Send Test BIT10.DEFI</div>
                        </CardTitle>
                        <CardDescription>Send Test BIT10.DEFI token</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off' className='flex flex-col space-y-2'>
                                <FormField
                                    control={form.control}
                                    name='sender_address'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Your Principal ID</FormLabel>
                                            <FormControl>
                                                <div className='flex'>
                                                    <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center'><WalletMinimal height={20} width={20} /></div>
                                                    <Input className='w-full -ml-10 pl-10 pr-3 py-2 dark:border-white' placeholder='Your Principal ID' {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name='receiver_address'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Receiver Principal ID</FormLabel>
                                            <FormControl>
                                                <div className='flex'>
                                                    <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center'><WalletMinimal height={20} width={20} /></div>
                                                    <Input className='w-full -ml-10 pl-10 pr-3 py-2 dark:border-white' placeholder='Receiver Principal ID' {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name='bit10_amount'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Test BIT10.DEFI Amount</FormLabel>
                                            <FormControl>
                                                <div className='flex'>
                                                    <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center'><CircleDollarSign height={20} width={20} /></div>
                                                    <Input className='w-full -ml-10 pl-10 pr-3 py-2 dark:border-white' type='number' placeholder='Test BIT10.DEFI amount to send' {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button className='w-full mt-4' disabled={sending} >
                                    {sending && <Loader2 className='animate-spin mr-2' size={15} />}
                                    {sending ? 'Sending...' : 'Send'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </MaxWidthWrapper>
    )
}
