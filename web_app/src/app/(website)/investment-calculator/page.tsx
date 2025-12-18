"use client"

import React, { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardTitle, CardContent, CardHeader, CardDescription, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type BIT10Entry = {
    date: string;
    bit10Top: string;
    btc: string;
    sp500: string;
};

type ProcessedDataPoint = {
    day: string;
    bit10TopValue: number;
    btcValue: number;
    sp500Value: number;
};

type AssetComparison = {
    name: string;
    initialInvestment: number;
    currentValue: number;
    totalReturn: number;
    percentageReturn: number;
};

type ComparisonResult = {
    startDate: string;
    endDate: string;
    assets: AssetComparison[];
};

const FormSchema = z.object({
    initial_investment: z.string()
        .min(1, { message: 'Amount is required' })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0, { message: 'Must be a positive number' }),
    initial_investment_start_date: z.date({
        required_error: 'Please choose a valid start date',
    }),
    initial_investment_end_date: z.date({
        required_error: 'Please choose a valid end date after the start date',
    }),
    initial_investment_token: z.string({
        required_error: 'Select a token'
    })
});

export default function Page() {
    const [processing, setProcessing] = useState<boolean>(false);
    const [calculationResult, setCalculationResult] = useState<ComparisonResult | null>(null);

    const fetchBIT10Comparison = async (year: number) => {
        const validYears = [15];
        if (!validYears.includes(year)) {
            toast.error('Invalid year selected.');
            return null;
        }

        try {
            const response = await fetch(`bit10-comparison-data-${year}`);

            if (!response.ok) {
                toast.error('Error fetching BIT10 Performance. Please try again!');
                return null;
            }

            const data = await response.json() as { bit10_top: BIT10Entry[] };
            return { bit10_top: data.bit10_top.reverse() };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Network error. Please try again!');
            return null;
        }
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TokenComparison15Y'],
                queryFn: () => fetchBIT10Comparison(15)
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10ComparisonCalculator = bit10Queries[0].data?.bit10_top ?? [];

    const investmentChartConfig = {
        bit10TopValue: {
            label: 'BIT10.TOP Investment',
            color: 'green',
        },
        btcValue: {
            label: 'Bitcoin Investment',
            color: 'orange',
        },
        sp500Value: {
            label: 'S&P500 Investment',
            color: 'blue',
        },
    } satisfies ChartConfig;

    const dateFormatter = useMemo(() =>
        new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        }), []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeParseFloat = (value: any): number => {
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
    };

    const processInvestmentData = useMemo(() => {
        return (data: BIT10Entry[]): ProcessedDataPoint[] => {
            if (!data || data.length === 0) return [];

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const initialBit10Top = safeParseFloat(data[0].bit10Top);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const initialBtc = safeParseFloat(data[0].btc);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const initialSp500 = safeParseFloat(data[0].sp500);

            return data.map((entry) => {
                const date = new Date(entry.date);
                const currentBit10Top = safeParseFloat(entry.bit10Top);
                const currentBtc = safeParseFloat(entry.btc);
                const currentSp500 = safeParseFloat(entry.sp500);

                return {
                    day: dateFormatter.format(date),
                    bit10TopValue: parseFloat((100 * (currentBit10Top / initialBit10Top)).toFixed(2)),
                    btcValue: parseFloat((100 * (currentBtc / initialBtc)).toFixed(2)),
                    sp500Value: parseFloat((100 * (currentSp500 / initialSp500)).toFixed(2)),
                };
            });
        };
    }, [dateFormatter]);

    const tickFormatter = useMemo(() =>
        (value: string) => value.slice(0, value.indexOf(',')), []
    );

    const yAxisFormatter = useMemo(() =>
        (value: number) => `$${value}`, []
    );

    const availableDatesSet = useMemo(() => {
        return new Set(
            bit10ComparisonCalculator.map(entry =>
                new Date(entry.date).toDateString()
            )
        );
    }, [bit10ComparisonCalculator]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            initial_investment: '10',
            initial_investment_start_date: new Date('2015-07-29'),
            // initial_investment_end_date: new Date('2025-08-05'),
            initial_investment_end_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // current date - 12 days
            initial_investment_token: 'BIT10.TOP'
        },
    });

    const calculateAllReturns = (
        investmentAmount: number,
        startDate: Date,
        endDate: Date
    ): ComparisonResult | null => {
        if (!bit10ComparisonCalculator || bit10ComparisonCalculator.length === 0) {
            return null;
        }

        const findClosestEntry = (targetDate: Date) => {
            return bit10ComparisonCalculator.reduce((closest, entry) => {
                const entryDate = new Date(entry.date);
                const diff = Math.abs(entryDate.getTime() - targetDate.getTime());
                const closestDiff = Math.abs(
                    new Date(closest.date).getTime() - targetDate.getTime()
                );
                return diff < closestDiff ? entry : closest;
            });
        };

        const startEntry = findClosestEntry(startDate);
        const endEntry = findClosestEntry(endDate);

        const tokens: { key: keyof BIT10Entry; name: string }[] = [
            { key: 'bit10Top', name: 'BIT10.TOP' },
            { key: 'btc', name: 'Bitcoin' },
            { key: 'sp500', name: 'S&P500' },
        ];

        const assets: AssetComparison[] = tokens.map(({ key, name }) => {
            const startPrice = safeParseFloat(startEntry[key]);
            const endPrice = safeParseFloat(endEntry[key]);

            if (startPrice === 0) {
                return {
                    name,
                    initialInvestment: investmentAmount,
                    currentValue: 0,
                    totalReturn: 0,
                    percentageReturn: 0,
                };
            }

            const currentValue = investmentAmount * (endPrice / startPrice);
            const totalReturn = currentValue - investmentAmount;
            const percentageReturn =
                ((currentValue - investmentAmount) / investmentAmount) * 100;

            return {
                name,
                initialInvestment: investmentAmount,
                currentValue: parseFloat(currentValue.toFixed(2)),
                totalReturn: parseFloat(totalReturn.toFixed(2)),
                percentageReturn: parseFloat(percentageReturn.toFixed(2)),
            };
        });

        return {
            startDate: startEntry.date,
            endDate: endEntry.date,
            assets,
        };
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setProcessing(true);
            setCalculationResult(null);

            const result = calculateAllReturns(
                values.initial_investment,
                values.initial_investment_start_date,
                values.initial_investment_end_date
            );

            if (result) {
                setCalculationResult(result);
                toast.success('Investment calculation completed successfully!');
            } else {
                toast.error('Unable to calculate returns. Please try again.');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request.');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <MaxWidthWrapper className='py-4'>
            <div className='grid lg:grid-cols-5 gap-3'>
                <div className='lg:col-span-3'>
                    <Card className='border-muted animate-fade-left-slow'>
                        <CardHeader>
                            <CardTitle>Investment Growth Over Selected Period</CardTitle>
                            <CardDescription>
                                Showing performance between your chosen start and end dates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='flex flex-col space-y-4'>
                            {isLoading ? (
                                <div className='flex flex-col h-full space-y-2'>
                                    <Skeleton className='h-[300px] lg:h-[400px] w-full' />
                                </div>
                            ) : (
                                <div className='select-none -ml-4'>
                                    <ChartContainer config={investmentChartConfig} className='max-h-[300px] lg:max-h-[600px] w-full'>
                                        <LineChart
                                            accessibilityLayer
                                            data={processInvestmentData(
                                                bit10ComparisonCalculator.filter((entry) => {
                                                    const entryDate = new Date(entry.date);
                                                    const start = form.watch('initial_investment_start_date');
                                                    const end = form.watch('initial_investment_end_date');
                                                    return entryDate >= start && entryDate <= end;
                                                })
                                            )}
                                        >
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={tickFormatter} stroke='#ffffff' interval='preserveStartEnd' />
                                            <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} stroke='#ffffff' tickFormatter={yAxisFormatter} />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <ChartLegend content={<ChartLegendContent />} />
                                            <Line dataKey='bit10TopValue' type='linear' stroke='green' name={investmentChartConfig.bit10TopValue.label} strokeWidth={2} dot={false} />
                                            <Line dataKey='btcValue' type='linear' stroke='orange' name={investmentChartConfig.btcValue.label} strokeWidth={2} dot={false} />
                                            <Line dataKey='sp500Value' type='linear' stroke='blue' name={investmentChartConfig.sp500Value.label} strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className='lg:col-span-2'>
                    <Card className='border-muted animate-fade-right-slow h-full flex flex-col'>
                        <CardHeader>
                            <CardTitle>
                                BIT10 Investment Calculator
                            </CardTitle>
                            <CardDescription>
                                Estimate your returns and see how your investment would have grown over time.
                            </CardDescription>
                        </CardHeader>
                        <Form {...form}>
                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                            {/* @ts-expect-error */}
                            <div onSubmit={form.handleSubmit(onSubmit)} className='flex-1 flex flex-col'>
                                <CardContent className='flex-1'>
                                    <div className='flex flex-col space-y-2'>
                                        <FormField
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-expect-error
                                            control={form.control}
                                            name='initial_investment'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Initial Investment</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder='Initial investment amount' type='number' />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Enter the amount (in USD) you want to invest
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-expect-error
                                            control={form.control}
                                            name='initial_investment_start_date'
                                            render={({ field }) => (
                                                <FormItem className='flex flex-col'>
                                                    <FormLabel>Date of Initial Investment</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant='outline' className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Select start date</span>
                                                                    )}
                                                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className='w-auto p-0 border-muted' align='start'>
                                                            <Calendar mode='single' selected={field.value} onSelect={field.onChange} disabled={(date) => !availableDatesSet.has(date.toDateString())} captionLayout='dropdown' className='rounded-md' />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormDescription>
                                                        When your investment begins
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-expect-error
                                            control={form.control}
                                            name='initial_investment_end_date'
                                            render={({ field }) => (
                                                <FormItem className='flex flex-col'>
                                                    <FormLabel>Date of Final Investment</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant='outline' className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Select end date</span>
                                                                    )}
                                                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className='border-muted w-auto p-0' align='start'>
                                                            <Calendar mode='single' selected={field.value} onSelect={field.onChange} disabled={(date) => !availableDatesSet.has(date.toDateString())} captionLayout='dropdown' className='rounded-md' />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormDescription>
                                                        When your investment ends
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-expect-error
                                            control={form.control}
                                            name='initial_investment_token'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Token</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className='rounded-full'>
                                                                <SelectValue placeholder='Select a investment token' />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className='rounded-2xl'>
                                                            <SelectItem className='rounded-full' value='BIT10.TOP'>BIT10.TOP</SelectItem>
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
                                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                    {/* @ts-expect-error */}
                                    <Button className='w-full' disabled={isLoading || processing} onClick={form.handleSubmit(onSubmit)}>
                                        {processing && <Loader2 className='animate-spin mr-2' size={15} />}
                                        {processing ? 'Calculating...' : 'Calculate'}
                                    </Button>

                                    {calculationResult && (
                                        <div className='w-full p-4 border border-green-800 rounded-lg bg-green-900/20'>
                                            <h3 className='font-semibold text-green-200 mb-3'>
                                                Investment Comparison
                                            </h3>
                                            <div className='overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 max-w-[80vw]'>
                                                <table className='w-full text-sm border-collapse '>
                                                    <thead>
                                                        <tr className='border-b border-green-800'>
                                                            <th className='text-left p-2'>Asset</th>
                                                            <th className='text-center p-2'>Initial Capital</th>
                                                            <th className='text-center p-2'>Current Value</th>
                                                            <th className='text-center p-2'>Total Return</th>
                                                            <th className='text-center p-2'>% Return</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {calculationResult.assets.map((asset) => (
                                                            <tr
                                                                key={asset.name}
                                                                className='border-b border-green-800 last:border-0'
                                                            >
                                                                <td className='p-2'>{asset.name}</td>
                                                                <td className='p-2 text-right'>
                                                                    ${asset.initialInvestment.toLocaleString()}
                                                                </td>
                                                                <td className='p-2 text-right text-green-400'>
                                                                    ${asset.currentValue.toLocaleString()}
                                                                </td>
                                                                <td
                                                                    className={`p-2 text-right ${asset.totalReturn >= 0
                                                                        ? 'text-green-400'
                                                                        : 'text-red-400'
                                                                        }`}
                                                                >
                                                                    ${asset.totalReturn.toLocaleString()}
                                                                </td>
                                                                <td
                                                                    className={`p-2 text-right ${asset.percentageReturn >= 0
                                                                        ? 'text-green-400'
                                                                        : 'text-red-400'
                                                                        }`}
                                                                >
                                                                    {asset.percentageReturn >= 0 ? '+' : ''}
                                                                    {asset.percentageReturn}%
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className='pt-2 text-xs text-gray-400'>
                                                Period: From {new Date(calculationResult.startDate).toLocaleDateString()} to{' '}
                                                {new Date(calculationResult.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    )}
                                </CardFooter>
                            </div>
                        </Form>
                    </Card>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}
