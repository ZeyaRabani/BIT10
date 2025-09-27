"use client"

import React, { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AnimatedBackground from '@/components/ui/animated-background'
import { Triangle } from 'lucide-react'
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

const tabs = ['30D', '60D', '1Y', '3Y'];

type Bit10Entry = {
    date: string;
    bit10Top: string;
    btc: string;
    sp500: string;
};

export default function Bit10Preformance() {
    const [selectedPreformanceToken, setSelectedPreformanceToken] = useState('BIT10.TOP');
    const [activeTab, setActiveTab] = useState('30D');

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    const fetchBit10Preformance = async () => {
        try {
            const response = await fetch(`bit10-comparison-data-3`);

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
                queryKey: ['bit10TOPTokenPreformance10Y'],
                queryFn: () => fetchBit10Preformance()
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPPreformance10Y = bit10Queries[0].data?.bit10_top ?? [];

    const getBit10Performance = (data: Bit10Entry[], range: string) => {
        if (!data || data.length === 0) {
            return [];
        }

        const latestEntry = data[data.length - 1];
        if (!latestEntry) {
            return [];
        }
        const latestDate = new Date(latestEntry.date);

        let startDate: Date;

        switch (range) {
            case '30D':
                startDate = new Date(latestDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '60D':
                startDate = new Date(latestDate.getTime() - 60 * 24 * 60 * 60 * 1000);
                break;
            case '1Y':
                startDate = new Date(latestDate);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case '3Y':
                startDate = new Date(latestDate);
                startDate.setFullYear(startDate.getFullYear() - 3);
                break;
            default:
                return [];
        }

        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= latestDate;
        });

        return filteredData;
    };

    const selectedBit10Token30D = () => {
        if (selectedPreformanceToken === 'BIT10.TOP') {
            return getBit10Performance(bit10TOPPreformance10Y, '30D');
        } else {
            return null;
        }
    };

    const tokens30D = selectedBit10Token30D();

    const selectedBit10Token60D = () => {
        if (selectedPreformanceToken === 'BIT10.TOP') {
            return getBit10Performance(bit10TOPPreformance10Y, '60D');
        } else {
            return null;
        }
    };

    const tokens60D = selectedBit10Token60D();

    const selectedBit10Token1Y = () => {
        if (selectedPreformanceToken === 'BIT10.TOP') {
            return getBit10Performance(bit10TOPPreformance10Y, '1Y');
        } else {
            return null;
        }
    };

    const tokens1Y = selectedBit10Token1Y();

    const selectedBit10Token3Y = () => {
        if (selectedPreformanceToken === 'BIT10.TOP') {
            return getBit10Performance(bit10TOPPreformance10Y, '3Y');
        } else {
            return null;
        }
    };

    const tokens3Y = selectedBit10Token3Y();

    const selectedBit10TokenChange = () => {
        if (selectedPreformanceToken === 'BIT10.TOP') {
            return bit10TOPPreformance10Y;
        } else {
            return null;
        }
    };

    const tokensChange = selectedBit10TokenChange();

    const getPercentageChange = (data: Bit10Entry[], range: string) => {
        if (!data || data.length < 2) return 0;

        const lastEntry = data[data.length - 1];
        if (!lastEntry) return 0;

        const currentPrice = lastEntry.bit10Top ?? 0;
        const timestamp = lastEntry.date;
        if (!timestamp) return 0;

        const now = new Date(timestamp);
        let targetDate: Date;

        if (range === '30D') {
            targetDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (range === '60D') {
            targetDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        } else if (range === '1Y') {
            targetDate = new Date(now);
            targetDate.setFullYear(targetDate.getFullYear() - 1);
        } else if (range === '3Y') {
            targetDate = new Date(now);
            targetDate.setFullYear(targetDate.getFullYear() - 3);
        } else {
            return 0;
        }

        let closestEntry = data[0];
        if (!closestEntry?.date) return 0;
        let closestDiff = Math.abs(new Date(closestEntry.date).getTime() - targetDate.getTime());

        for (let i = 1; i < data.length; i++) {
            const entry = data[i];
            if (!entry?.date) continue;
            const diff = Math.abs(new Date(entry.date).getTime() - targetDate.getTime());
            if (diff < closestDiff) {
                closestDiff = diff;
                closestEntry = entry;
            }
        }

        if (!closestEntry) return 0;
        const previousPrice = Number(closestEntry.bit10Top) || 0;

        if (previousPrice === 0) return 0;
        return ((Number(currentPrice) - previousPrice) / previousPrice) * 100;
    };

    const percentageChange30Days = getPercentageChange(tokensChange ?? [], '30D');
    const percentageChange60Days = getPercentageChange(tokensChange ?? [], '60D');
    const percentageChange1Year = getPercentageChange(tokensChange ?? [], '1Y');
    const percentageChange3Year = getPercentageChange(tokensChange ?? [], '3Y');

    const bit10PreformanceTokenDataName = () => {
        if (selectedPreformanceToken === 'BIT10.TOP') {
            return 'bit10TOP';
        } else {
            return 'bit10';
        }
    };

    const tokenDataName = bit10PreformanceTokenDataName();

    const bit10Tokens = ['BIT10.TOP'];

    const bit10PreformanceTokenName = () => {
        if (selectedPreformanceToken === 'BIT10.TOP') {
            return {
                name: 'bit10TOP',
                indexFundName: 'BIT10.TOP'
            };
        } else {
            return {
                name: 'bit10',
                indexFundName: 'BIT10'
            };
        }
    };

    const tokenName = bit10PreformanceTokenName();

    const bit10PreformanceChartConfig: ChartConfig = {
        [tokenName.name]: {
            label: tokenName.indexFundName,
        }
    };

    const bit10Preformance30DChartData = tokens30D?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    const bit10Preformance60DChartData = tokens60D?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    const bit10Preformance1YChartData = tokens1Y?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    const bit10Preformance3YChartData = tokens3Y?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    return (
        <div>
            {isLoading ? (
                <Card className='dark:border-white w-full animate-fade-right-slow'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-10 w-36', 'h-36', 'h-52'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='dark:border-white md:col-span-2 animate-fade-right-slow'>
                    <CardHeader className='flex flex-col md:flex-row items-center justify-between'>
                        <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Performance</div>
                        <div className='flex flex-col md:flex-row items-center space-y-2 md:space-x-4 md:space-y-0'>
                            <Select onValueChange={setSelectedPreformanceToken} defaultValue={selectedPreformanceToken}>
                                <SelectTrigger className='w-[180px] dark:border-white'>
                                    <SelectValue placeholder='Select Token' />
                                </SelectTrigger>
                                <SelectContent>
                                    {bit10Tokens.map((token) => (
                                        <SelectItem key={token} value={token}>
                                            {token}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className='relative flex flex-row space-x-2 items-center justify-center border dark:border-white rounded-md px-2 py-1.5'>
                                <AnimatedBackground
                                    defaultValue='30D'
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
                        <div className='flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-x-4 md:space-y-0'>
                            <Card className='flex flex-col h-full w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        30D %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-start flex flex-row space-x-2 items-center text-3xl'>
                                    <Triangle fill={percentageChange30Days >= 0 ? 'green' : 'red'} color={percentageChange30Days >= 0 ? 'green' : 'red'} className={percentageChange30Days > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange30Days.toFixed(2)}%
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col h-full w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        60D %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-start flex flex-row space-x-2 items-center text-3xl'>
                                    <Triangle fill={percentageChange60Days >= 0 ? 'green' : 'red'} color={percentageChange60Days >= 0 ? 'green' : 'red'} className={percentageChange60Days > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange60Days.toFixed(2)}%
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col h-full w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        1Y %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-start flex flex-row space-x-2 items-center text-3xl'>
                                    <Triangle fill={percentageChange1Year >= 0 ? 'green' : 'red'} color={percentageChange1Year >= 0 ? 'green' : 'red'} className={percentageChange1Year > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange1Year.toFixed(2)}%
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col h-full w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        3Y %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-start flex flex-row space-x-2 items-center text-3xl'>
                                    <Triangle fill={percentageChange3Year >= 0 ? 'green' : 'red'} color={percentageChange3Year >= 0 ? 'green' : 'red'} className={percentageChange3Year > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange3Year.toFixed(2)}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className='select-none -ml-12 md:-ml-8'>
                            {
                                activeTab === '30D' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance30DChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey='day'
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                            stroke="#D5520E"
                                        />
                                        <YAxis
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickCount={3}
                                            stroke="#D5520E"
                                        />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Line dataKey={tokenDataName} type='linear' stroke='#D5520E' strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ChartContainer>
                            }
                            {
                                activeTab === '60D' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance60DChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey='day'
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                            stroke="#D5520E"
                                        />
                                        <YAxis
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickCount={3}
                                            stroke="#D5520E"
                                        />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Line dataKey={tokenDataName} type='linear' stroke='#D5520E' strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ChartContainer>
                            }
                            {
                                activeTab === '1Y' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance1YChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey='day'
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                            stroke="#D5520E"
                                        />
                                        <YAxis
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickCount={3}
                                            stroke="#D5520E"
                                        />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Line dataKey={tokenDataName} type='linear' stroke='#D5520E' strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ChartContainer>
                            }
                            {
                                activeTab === '3Y' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance3YChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey='day'
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                            stroke="#D5520E"
                                        />
                                        <YAxis
                                            tickLine={true}
                                            axisLine={true}
                                            tickMargin={8}
                                            tickCount={3}
                                            stroke="#D5520E"
                                        />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Line dataKey={tokenDataName} type='linear' stroke='#D5520E' strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ChartContainer>
                            }
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
