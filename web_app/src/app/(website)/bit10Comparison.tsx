import React, { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardTitle, CardContent, CardHeader, CardDescription, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import AnimatedBackground from '@/components/ui/animated-background'
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn, formatAmount } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const tabs = ['10Y', '5Y', '3Y', '1Y'];

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
    apy?: number;
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

export default function BIT10Comparison() {
    const [activeTab, setActiveTab] = useState('10Y');
    const [processing, setProcessing] = useState<boolean>(false);
    const [calculationResult, setCalculationResult] = useState<ComparisonResult | null>(null);

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    };

    const fetchBit10Comparison = async (year: number) => {
        const validYears = [1, 3, 5, 10, 15];
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
            {
                queryKey: ['bit10TokenComparison1Y'],
                queryFn: () => fetchBit10Comparison(1)
            },
            {
                queryKey: ['bit10TokenComparison15Y'],
                queryFn: () => fetchBit10Comparison(15)
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10Comparison10Y = bit10Queries[0].data?.bit10_top ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10Comparison5Y = bit10Queries[1].data?.bit10_top ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10Comparison3Y = bit10Queries[2].data?.bit10_top ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10Comparison1Y = bit10Queries[3].data?.bit10_top ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10ComparisonCalculator = bit10Queries[4].data?.bit10_top ?? [];

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

    // eslint-disable-next-line react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any
    const safeParseFloat = (value: any): number => {
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
    };

    const processInvestmentData = useMemo(() => {
        return (data: BIT10Entry[]): ProcessedDataPoint[] => {
            if (!data || data.length === 0) return [];

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const initialBIT10Top = safeParseFloat(data[0].bit10Top);
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
                    bit10TopValue: parseFloat((100 * (currentBit10Top / initialBIT10Top)).toFixed(2)),
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
        '1Y': processInvestmentData(bit10Comparison1Y),
    }), [bit10Comparison10Y, bit10Comparison5Y, bit10Comparison3Y, bit10Comparison1Y, processInvestmentData]);

    const currentData = investmentData[activeTab as keyof typeof investmentData];

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

    const calculateAPY = (initialValue: number, finalValue: number, years: number): number => {
        if (years <= 0 || initialValue <= 0) return 0;
        return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    };

    const apyData = useMemo(() => {
        const calculatePeriodAPY = (data: BIT10Entry[], periodLabel: string) => {
            if (!data || data.length < 2) return null;

            const firstEntry = data[0];
            const lastEntry = data[data.length - 1];

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const initialBIT10Top = safeParseFloat(firstEntry.bit10Top);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const finalBIT10Top = safeParseFloat(lastEntry.bit10Top);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const initialBtc = safeParseFloat(firstEntry.btc);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const finalBtc = safeParseFloat(lastEntry.btc);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const initialSp500 = safeParseFloat(firstEntry.sp500);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const finalSp500 = safeParseFloat(lastEntry.sp500);

            const years = {
                '1Y': 1,
                '5Y': 5,
                '10Y': 10
            }[periodLabel] ?? 1;

            return {
                period: periodLabel,
                bit10Top: calculateAPY(initialBIT10Top, finalBIT10Top, years),
                btc: calculateAPY(initialBtc, finalBtc, years),
                sp500: calculateAPY(initialSp500, finalSp500, years)
            };
        };

        return {
            '1Y': calculatePeriodAPY(bit10Comparison1Y, '1Y'),
            '5Y': calculatePeriodAPY(bit10Comparison5Y, '5Y'),
            '10Y': calculatePeriodAPY(bit10Comparison10Y, '10Y')
        };
    }, [bit10Comparison1Y, bit10Comparison5Y, bit10Comparison10Y, safeParseFloat]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            initial_investment: '10',
            initial_investment_start_date: new Date('2015-07-29'),
            initial_investment_end_date: new Date('2025-08-05'),
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

        // Calculate time difference in years for APY
        const timeDiffMs = endDate.getTime() - startDate.getTime();
        const timeDiffYears = timeDiffMs / (1000 * 60 * 60 * 24 * 365.25);

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
                    apy: 0
                };
            }

            const currentValue = investmentAmount * (endPrice / startPrice);
            const totalReturn = currentValue - investmentAmount;
            const percentageReturn =
                ((currentValue - investmentAmount) / investmentAmount) * 100;

            const apy = calculateAPY(investmentAmount, currentValue, timeDiffYears);

            return {
                name,
                initialInvestment: investmentAmount,
                currentValue: parseFloat(currentValue.toFixed(2)),
                totalReturn: parseFloat(totalReturn.toFixed(2)),
                percentageReturn: parseFloat(percentageReturn.toFixed(2)),
                apy: parseFloat(apy.toFixed(2))
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
        <div className='flex flex-col space-y-4'>
            <div className='mt-4 py-4'>
                <div className='grid md:grid-cols-3 gap-8'>
                    {['1Y', '5Y', '10Y'].map((period) => (
                        <div key={period} className='border-2 rounded py-8 px-3'>
                            <h4 className='font-medium text-2xl text-center mb-2'>BIT10.TOP {period} APY</h4>
                            {apyData[period as keyof typeof apyData] ? (
                                <div className='font-bold text-4xl text-center'>{apyData[period as keyof typeof apyData]?.bit10Top.toFixed(2)}%</div>
                            ) : (
                                <p className='text-center text-gray-500'>Loading...</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className='grid md:grid-cols-5 gap-3'>
                <div className='md:col-span-3'>
                    <Card className='dark:border-white animate-fade-left-slow'>
                        <CardHeader className='flex flex-col md:flex-row items-center justify-between'>
                            <div className='flex flex-1 flex-col justify-center gap-1 pb-3 sm:pb-0'>
                                <CardTitle>$100 Investment Growth Comparison</CardTitle>
                                <CardDescription>
                                    Performance of a $100 investment in each asset since tracking began
                                </CardDescription>
                            </div>
                            <div className='flex flex-col md:flex-row items-center space-y-2 md:space-x-4 md:space-y-0'>
                                <div className='relative flex flex-row space-x-2 items-center justify-center border dark:border-white rounded-md px-2 py-1.5'>
                                    <AnimatedBackground defaultValue='10Y' className='rounded bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={(newActiveId) => handleTabChange(newActiveId)}>
                                        {tabs.map((label, index) => (
                                            <button key={index} data-id={label} type='button' className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}>
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
                                    <Skeleton className='h-[300px] md:h-[400px] w-full' />
                                </div>
                            ) : (
                                <div className='select-none -ml-4'>
                                    <ChartContainer config={investmentChartConfig} className='max-h-[300px] md:max-h-[600px] w-full'>
                                        <LineChart accessibilityLayer data={currentData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine={true} axisLine={true} tickMargin={8} tickFormatter={tickFormatter} stroke='#D5520E' />
                                            <YAxis tickLine={true} axisLine={true} tickMargin={8} tickCount={5} stroke='#D5520E' tickFormatter={yAxisFormatter} />
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
                <div className='md:col-span-2'>
                    <Card className='dark:border-white animate-fade-right-slow h-full flex flex-col'>
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
                                            name='initial_investment_start_date'
                                            render={({ field }) => (
                                                <FormItem className='flex flex-col'>
                                                    <FormLabel>Date of Initial Investment</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant='outline' className={cn('w-full dark:border-white pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Select start date</span>
                                                                    )}
                                                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className='w-auto p-0' align='start'>
                                                            <Calendar mode='single' selected={field.value} onSelect={field.onChange} disabled={(date) => !availableDatesSet.has(date.toDateString())} captionLayout='dropdown' />
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
                                            control={form.control}
                                            name='initial_investment_end_date'
                                            render={({ field }) => (
                                                <FormItem className='flex flex-col'>
                                                    <FormLabel>Date of Final Investment</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant='outline' className={cn('w-full dark:border-white pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Select end date</span>
                                                                    )}
                                                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className='w-auto p-0' align='start'>
                                                            <Calendar mode='single' selected={field.value} onSelect={field.onChange} disabled={(date) => !availableDatesSet.has(date.toDateString())} captionLayout='dropdown' />
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
                                            <h3 className='font-semibold text-green-800 dark:text-green-200 mb-3'>
                                                Investment Comparison
                                            </h3>
                                            <table className='w-full text-sm border-collapse'>
                                                <thead>
                                                    <tr className='border-b border-green-200 dark:border-green-800'>
                                                        <th className='text-left p-2'>Asset</th>
                                                        <th className='text-center p-2'>Initial Investment</th>
                                                        <th className='text-center p-2'>Current Value</th>
                                                        <th className='text-center p-2'>Total Return</th>
                                                        <th className='text-center p-2'>% Return</th>
                                                        <th className='text-center p-2'>APY</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {calculationResult.assets.map((asset) => (
                                                        <tr
                                                            key={asset.name}
                                                            className='border-b border-green-200 dark:border-green-800 last:border-0'
                                                        >
                                                            <td className='p-2'>{asset.name}</td>
                                                            <td className='p-2 text-right'>
                                                                ${formatAmount(asset.initialInvestment)}
                                                            </td>
                                                            <td className='p-2 text-right text-green-600 dark:text-green-400'>
                                                                ${formatAmount(asset.currentValue)}
                                                            </td>
                                                            <td
                                                                className={`p-2 text-right ${asset.totalReturn >= 0
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                                    }`}
                                                            >
                                                                ${formatAmount(asset.totalReturn)}
                                                            </td>
                                                            <td
                                                                className={`p-2 text-right ${asset.percentageReturn >= 0
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                                    }`}
                                                            >
                                                                {asset.percentageReturn >= 0 ? '+' : ''}
                                                                {formatAmount(asset.percentageReturn)}%
                                                            </td>
                                                            <td className='p-2 text-right'>
                                                                {asset.apy !== undefined ? `${asset.apy.toFixed(2)}%` : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className='pt-2 text-xs text-gray-500 dark:text-gray-400'>
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
        </div>
    )
}
