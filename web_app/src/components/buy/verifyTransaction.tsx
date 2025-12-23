import React, { useState } from 'react'
import { useChain } from '@/context/ChainContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import ICPImg from '@/assets/wallet/icp-logo.svg'
import BaseImg from '@/assets/wallet/base-logo.svg'
import SolanaImg from '@/assets/wallet/solana-logo.svg'
import BscImg from '@/assets/wallet/bsc-logo.svg'
import { verifyBaseTransaction } from './base/BaseBuyModule'
import { verifySolanaTransaction } from './solana/SolanaBuyModule'
import { verifyBSCTransaction } from './bsc/BSCBuyModule'

const FormSchema = z.object({
    source_chain: z.string({
        required_error: 'Select a chain'
    }),
    mode: z.string({
        required_error: 'Select a mode'
    }),
    trx_hash: z.string({ required_error: 'Please enter the inbound transaction hash' })
        .min(8, { message: 'Please enter a valid transaction hash' })
});

export default function VerifyTransaction({ mode }: { mode: string }) {
    const [verifying, setVerifying] = useState<boolean>(false);

    const { chain } = useChain();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            source_chain: 'base',
            mode: mode
        }
    });

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setVerifying(true);

            if (values.source_chain === 'base') {
                await verifyBaseTransaction({ mode: values.mode, trxHash: values.trx_hash });
            } else if (values.source_chain === 'solana') {
                await verifySolanaTransaction({ mode: values.mode, trxHash: values.trx_hash });
            } else if (values.source_chain === 'bsc') {
                await verifyBSCTransaction({ mode: values.mode, trxHash: values.trx_hash });
            }

            setVerifying(false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred during verification. Please try again!');
        } finally {
            setVerifying(false);
        }
    };

    const verifyDisabledConditions = !chain || chain === 'icp' || form.watch('source_chain') === 'icp' || verifying;

    const getVerifyMessage = (): string => {
        if (!chain) return 'Connect wallet to continue';
        if (verifying) return 'Verifying...';
        return 'Verify';
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <p className='pt-2 text-primary underline cursor-pointer'>
                    Swap didn&apos;t go through?
                </p>
            </DialogTrigger>
            <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                <DialogHeader>
                    <DialogTitle>Transaction Verification</DialogTitle>
                    <DialogDescription>
                        Verify your transaction to recover missing funds.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                        <div className='flex flex-col space-y-2'>
                            <FormField
                                control={form.control}
                                name='source_chain'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source chain</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className='rounded-full'>
                                                    <SelectValue placeholder='Select a chain' />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className='rounded-2xl'>
                                                <SelectItem className='rounded-full' value='icp'>
                                                    <div className='flex items-center gap-1'>
                                                        <Image src={ICPImg as StaticImageData} alt='ICP Logo' width={16} height={16} />
                                                        <span>ICP</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem className='rounded-full' value='base'>
                                                    <div className='flex items-center gap-1'>
                                                        <Image src={BaseImg as StaticImageData} alt='Base Logo' width={16} height={16} />
                                                        <span>Base</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem className='rounded-full' value='solana'>
                                                    <div className='flex items-center gap-1'>
                                                        <Image src={SolanaImg as StaticImageData} alt='Solana Logo' width={16} height={16} />
                                                        <span>Solana</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem className='rounded-full' value='bsc'>
                                                    <div className='flex items-center gap-1'>
                                                        <Image src={BscImg as StaticImageData} alt='BSC Logo' width={16} height={16} />
                                                        <span>Binance Smart Chain</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Select the chain where the transaction was initiated
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='mode'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mode</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className='rounded-full'>
                                                    <SelectValue placeholder='Select the mode' />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className='rounded-2xl'>
                                                <SelectItem className='rounded-full' value='buy'>Buy</SelectItem>
                                                <SelectItem className='rounded-full' value='sell'>Sell</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Select the mode of the transaction
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='trx_hash'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transaction Hash</FormLabel>
                                        <FormControl>
                                            <Input placeholder='Enter transaction hash' {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Enter the transaction hash where the funds were taken
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {chain === 'icp' || form.watch('source_chain') == 'icp' && (
                            <div className='pt-2 text-sm'>
                                To verify funds on the ICP chain, please contact our team at <a href='mailto:harshalraikwar@bit10.app' rel='noopener noreferrer' className='text-primary underline cursor-pointer'>harshalraikwar@bit10.app</a>.
                            </div>
                        )}

                        <DialogFooter className='pt-4'>
                            <Button className='w-full' disabled={verifyDisabledConditions}>
                                {verifying && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getVerifyMessage()}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
