import React, { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardTitle, CardContent, CardHeader, CardDescription, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import AnimatedBackground from '@/components/ui/animated-background'
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const tabs = ['10Y', '5Y', '3Y'];

type Bit10Entry = {
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

export default function BIT10Comparison() {
    const [activeTab, setActiveTab] = useState('10Y');
    const [processing, setProcessing] = useState<boolean>(false);
    const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    };

    const fetchBit10Comparison = async (year: number) => {
        const validYears = [3, 5, 10];
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

            const data = await response.json() as { bit10_top: Bit10Entry[] };
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
                queryKey: ['bit10TokenComparison10Y'],
                queryFn: () => fetchBit10Comparison(10)
            },
            {
                queryKey: ['bit10TokenComparison5Y'],
                queryFn: () => fetchBit10Comparison(5)
            },
            {
                queryKey: ['bit10TokenComparison3Y'],
                queryFn: () => fetchBit10Comparison(3)
            },
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10Comparison10Y = bit10Queries[0].data?.bit10_top ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10Comparison5Y = bit10Queries[1].data?.bit10_top ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10Comparison3Y = bit10Queries[2].data?.bit10_top ?? [];

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
        return (data: Bit10Entry[]): ProcessedDataPoint[] => {
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

    const investmentData = useMemo(() => ({
        '10Y': processInvestmentData(bit10Comparison10Y),
        '5Y': processInvestmentData(bit10Comparison5Y),
        '3Y': processInvestmentData(bit10Comparison3Y),
    }), [bit10Comparison10Y, bit10Comparison5Y, bit10Comparison3Y, processInvestmentData]);

    const currentData = investmentData[activeTab as keyof typeof investmentData];

    const tickFormatter = useMemo(() =>
        (value: string) => value.slice(0, value.indexOf(',')), []
    );

    const yAxisFormatter = useMemo(() =>
        (value: number) => `$${value}`, []
    );

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
        const startPrice = safeParseFloat(startEntry.bit10Top);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const endPrice = safeParseFloat(endEntry.bit10Top);

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
        <div className='grid md:grid-cols-5 gap-3'>
            <div className='md:col-span-3'>
                <Card className='dark:border-white animate-fade-left-slow'>
                    <CardHeader className='flex flex-col md:flex-row items-center justify-between'>
                        <div className='flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0'>
                            <CardTitle>$100 Investment Growth Comparison</CardTitle>
                            <CardDescription>
                                Performance of a $100 investment in each asset since tracking began
                            </CardDescription>
                        </div>
                        <div className='flex flex-col md:flex-row items-center space-y-2 md:space-x-4 md:space-y-0'>
                            <div className='relative flex flex-row space-x-2 items-center justify-center border dark:border-white rounded-md px-2 py-1.5'>
                                <AnimatedBackground
                                    defaultValue='10Y'
                                    className='rounded bg-primary'
                                    transition={{
                                        ease: 'easeInOut',
                                        duration: 0.2,
                                    }}
                                    onValueChange={(newActiveId) => handleTabChange(newActiveId)}
                                >
                                    {tabs.map((label, index) => (
                                        <button
                                            key={index}
                                            data-id={label}
                                            type='button'
                                            className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </AnimatedBackground>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className='flex flex-col space-y-4'>
                        {isLoading ? (
                            <div className='flex flex-col h-full space-y-2'>
                                <Skeleton className='h-56 md:h-64 w-full' />
                            </div>
                        ) : (
                            <div className='select-none -ml-4'>
                                <ChartContainer config={investmentChartConfig} className='max-h-[300px] md:max-h-[380px] w-full'>
                                    <LineChart accessibilityLayer data={currentData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey='day'
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickFormatter={tickFormatter}
                                            stroke='#D5520E'
                                        />
                                        <YAxis
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickCount={5}
                                            stroke='#D5520E'
                                            tickFormatter={yAxisFormatter}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent />}
                                        />
                                        <Line
                                            dataKey='bit10TopValue'
                                            type='linear'
                                            stroke='green'
                                            name={investmentChartConfig.bit10TopValue.label}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        <Line
                                            dataKey='btcValue'
                                            type='linear'
                                            stroke='orange'
                                            name={investmentChartConfig.btcValue.label}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        <Line
                                            dataKey='sp500Value'
                                            type='linear'
                                            stroke='blue'
                                            name={investmentChartConfig.sp500Value.label}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ChartContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className='md:col-span-2'>
                <Card className='dark:border-white animate-fade-right-slow h-full flex flex-col'>
                    <CardHeader>
                        <CardTitle>
                            BIT10 Investment Calculator
                        </CardTitle>
                        <CardDescription>Estimate your returns and see how your investment would have grown over time.</CardDescription>
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
                                <Button className='w-full' disabled={isLoading || processing} onClick={form.handleSubmit(onSubmit)}>
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
                                                    <span>From {new Date(calculationResult.startDate).toLocaleDateString()} to {new Date(calculationResult.endDate).toLocaleDateString()} (as of today)</span>
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
        </div>
    )
}
