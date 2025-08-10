"use client"

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardTitle, CardContent, CardHeader, CardDescription, CardFooter } from '@/components/ui/card'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import bit10_top from './bit10_data.json'

type CalculationResult = {
    initialInvestment: number;
    currentValue: number;
    totalReturn: number;
    percentageReturn: number;
    startDate: string;
    endDate: string;
};

const FormSchema = z.object({
    initial_investment: z.string()
        .min(1, { message: 'Amount is required' })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0, { message: 'Must be a positive number' }),
    initial_investment_start_year: z.string()
        .min(1, { message: 'Start year is required' })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0 && val <= 10, { message: 'Must be between 1 and 10 years' }),
    initial_investment_token: z.string({
        required_error: 'Select a token'
    })
});

export default function Page() {
    const [processing, setProcessing] = useState<boolean>(false);
    const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            initial_investment: '10',
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            initial_investment_start_year: '5',
            initial_investment_token: 'BIT10.TOP'
        },
    });

    const bit10Comparison10Y = bit10_top.bit10_top;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeParseFloat = (value: any): number => {
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
    };

    const calculateBIT10Return = (investmentAmount: number, yearsAgo: number): CalculationResult | null => {
        if (!bit10Comparison10Y || bit10Comparison10Y.length === 0) {
            return null;
        }

        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() - yearsAgo);

        let startIndex = 0;
        let minDateDiff = Infinity;

        for (let i = 0; i < bit10Comparison10Y.length; i++) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const entryDate = new Date(bit10Comparison10Y[i].date);
            const dateDiff = Math.abs(entryDate.getTime() - targetDate.getTime());

            if (dateDiff < minDateDiff) {
                minDateDiff = dateDiff;
                startIndex = i;
            }
        }

        const startEntry = bit10Comparison10Y[startIndex];
        const endEntry = bit10Comparison10Y[bit10Comparison10Y.length - 1];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const startPrice = safeParseFloat(startEntry.equalWeightPrice);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const endPrice = safeParseFloat(endEntry.equalWeightPrice);

        if (startPrice === 0) {
            return null;
        }

        const currentValue = investmentAmount * (endPrice / startPrice);
        const totalReturn = currentValue - investmentAmount;
        const percentageReturn = ((currentValue - investmentAmount) / investmentAmount) * 100;

        return {
            initialInvestment: investmentAmount,
            currentValue: parseFloat(currentValue.toFixed(2)),
            totalReturn: parseFloat(totalReturn.toFixed(2)),
            percentageReturn: parseFloat(percentageReturn.toFixed(2)),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            startDate: startEntry.date,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            endDate: endEntry.date
        };
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setProcessing(true);
            setCalculationResult(null);

            if (values.initial_investment_token === 'BIT10.TOP') {
                const result = calculateBIT10Return(values.initial_investment, values.initial_investment_start_year);

                if (result) {
                    setCalculationResult(result);
                    toast.success('Investment calculation completed successfully!');
                } else {
                    toast.error('Unable to calculate returns. Please check your inputs and try again.');
                }
            }

            setProcessing(false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setProcessing(false);
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className='flex flex-col items-center justify-center py-4 md:py-8'>
            <Card className='dark:border-white animate-fade-right-slow h-full w-[300px] md:w-[450px] flex flex-col'>
                <CardHeader>
                    <CardTitle>
                        BIT10 Investment Calculator
                    </CardTitle>
                    <CardDescription>
                        Estimate your returns and see how your investment would have grown over time.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <div onSubmit={form.handleSubmit(onSubmit)} className='flex-1 flex flex-col'>
                        <CardContent className='flex-1'>
                            <div className='flex flex-col space-y-2'>
                                <FormField
                                    control={form.control}
                                    name='initial_investment'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Initial Investment</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='Initial investment amount' type='number' className='dark:border-white' />
                                            </FormControl>
                                            <FormDescription>
                                                Enter the amount (in USD) you want to invest
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name='initial_investment_start_year'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Year</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='Initial investment start year' type='number' className='dark:border-white' max={10} min={1} />
                                            </FormControl>
                                            <FormDescription>
                                                Enter how many years ago you started investing (max 10 years)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name='initial_investment_token'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Token</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className='dark:border-white'>
                                                        <SelectValue placeholder='Select a investment token' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value='BIT10.TOP'>BIT10.TOP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Select the token for your investment calculation
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className='flex flex-col space-y-4'>
                            <Button className='w-full' disabled={processing} onClick={form.handleSubmit(onSubmit)}>
                                {processing && <Loader2 className='animate-spin mr-2' size={15} />}
                                {processing ? 'Calculating...' : 'Calculate'}
                            </Button>

                            {calculationResult && (
                                <div className='w-full p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20'>
                                    <h3 className='font-semibold text-green-800 dark:text-green-200 mb-3'>Investment Results</h3>
                                    <div className='space-y-2 text-sm'>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600 dark:text-gray-400'>Initial Investment:</span>
                                            <span className='font-medium'>${calculationResult.initialInvestment.toLocaleString()}</span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600 dark:text-gray-400'>Current Value:</span>
                                            <span className='font-medium text-green-600 dark:text-green-400'>${calculationResult.currentValue.toLocaleString()}</span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600 dark:text-gray-400'>Total Return:</span>
                                            <span className={`font-medium ${calculationResult.totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                ${calculationResult.totalReturn.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600 dark:text-gray-400'>Percentage Return:</span>
                                            <span className={`font-medium ${calculationResult.percentageReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {calculationResult.percentageReturn >= 0 ? '+' : ''}{calculationResult.percentageReturn}%
                                            </span>
                                        </div>
                                        <div className='pt-2 border-t border-green-200 dark:border-green-800'>
                                            <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400'>
                                                <span>Period:</span>
                                                <span>From {new Date(calculationResult.startDate).toLocaleDateString()} to {new Date().toLocaleDateString('en-US')} (as of today)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardFooter>
                    </div>
                </Form>
            </Card>
        </div>
    )
}
