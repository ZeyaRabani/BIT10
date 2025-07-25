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

const tabs = ['24H', '7D', '30D', '60D'];

type Bit10Entry = {
    timestmpz: string;
    tokenPrice: number;
};

export default function Preformance() {
    const [selectedPreformanceToken, setSelectedPreformanceToken] = useState('Test BIT10.DEFI');
    const [activeTab, setActiveTab] = useState('24H');

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    const fetchBit10Preformance = async (tokenPreformance: string) => {
        const response = await fetch(tokenPreformance);

        if (!response.ok) {
            toast.error('Error fetching BIT10 Preformance. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPreformance === 'bit10-historic-data-defi-60') {
            data = await response.json() as { bit10_defi: Bit10Entry[] }
            returnData = { bit10_defi: data.bit10_defi.reverse() };
        } else if (tokenPreformance === 'bit10-historic-data-brc20-60') {
            data = await response.json() as { bit10_brc20: Bit10Entry[] }
            returnData = { bit10_brc20: data.bit10_brc20.reverse() };
        } else if (tokenPreformance === 'bit10-historic-data-top-60') {
            data = await response.json() as { bit10_top: Bit10Entry[] }
            returnData = { bit10_top: data.bit10_top.reverse() };
        } else if (tokenPreformance === 'test-bit10-historic-data-meme-60') {
            data = await response.json() as { bit10_meme: Bit10Entry[] }
            returnData = { bit10_meme: data.bit10_meme.reverse() };
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFITokenPreformance60d'],
                queryFn: () => fetchBit10Preformance('bit10-historic-data-defi-60')
            },
            {
                queryKey: ['bit10BRC20TokenPreformance60d'],
                queryFn: () => fetchBit10Preformance('bit10-historic-data-brc20-60')
            },
            {
                queryKey: ['bit10TOPTokenPreformance60d'],
                queryFn: () => fetchBit10Preformance('bit10-historic-data-top-60')
            },
            {
                queryKey: ['bit10MEMETokenPreformance60d'],
                queryFn: () => fetchBit10Preformance('test-bit10-historic-data-meme-60')
            },
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10DEFIPreformance60D = bit10Queries[0].data ?? { bit10_defi: [] };
    const bit10BRC20Preformance60D = bit10Queries[1].data ?? { bit10_brc20: [] };
    const bit10TOPPreformance60D = bit10Queries[2].data ?? { bit10_top: [] };
    const bit10MEMEPreformance60D = bit10Queries[3].data ?? { bit10_meme: [] };

    const getBit10Preformance = (data: Bit10Entry[], daysBack: number) => {
        if (!data || data.length === 0) {
            return [];
        }

        const latestEntry = data[data.length - 1];
        if (!latestEntry) {
            return [];
        }
        const latestDate = new Date(latestEntry.timestmpz);

        const sevenDaysAgo = new Date(latestDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.timestmpz);
            return entryDate >= sevenDaysAgo && entryDate <= latestDate;
        });

        return filteredData;
    };

    const selectedBit10Token24H = () => {
        if (selectedPreformanceToken === 'Test BIT10.DEFI') {
            return getBit10Preformance(bit10DEFIPreformance60D.bit10_defi ?? [], 1);
        } else if (selectedPreformanceToken === 'Test BIT10.BRC20') {
            return getBit10Preformance(bit10BRC20Preformance60D.bit10_brc20 ?? [], 1);
        } else if (selectedPreformanceToken === 'Test BIT10.TOP') {
            return getBit10Preformance(bit10TOPPreformance60D.bit10_top ?? [], 1);
        } else if (selectedPreformanceToken === 'Test BIT10.MEME') {
            return getBit10Preformance(bit10MEMEPreformance60D.bit10_meme ?? [], 1);
        } else {
            return null;
        }
    };

    const tokens24H = selectedBit10Token24H();

    const selectedBit10Token7D = () => {
        if (selectedPreformanceToken === 'Test BIT10.DEFI') {
            return getBit10Preformance(bit10DEFIPreformance60D.bit10_defi ?? [], 7);
        } else if (selectedPreformanceToken === 'Test BIT10.BRC20') {
            return getBit10Preformance(bit10BRC20Preformance60D.bit10_brc20 ?? [], 7);
        } else if (selectedPreformanceToken === 'Test BIT10.TOP') {
            return getBit10Preformance(bit10TOPPreformance60D.bit10_top ?? [], 7);
        } else if (selectedPreformanceToken === 'Test BIT10.MEME') {
            return getBit10Preformance(bit10MEMEPreformance60D.bit10_meme ?? [], 7);
        } else {
            return null;
        }
    };

    const tokens7D = selectedBit10Token7D();

    const selectedBit10Token30D = () => {
        if (selectedPreformanceToken === 'Test BIT10.DEFI') {
            return getBit10Preformance(bit10DEFIPreformance60D.bit10_defi ?? [], 30);
        } else if (selectedPreformanceToken === 'Test BIT10.BRC20') {
            return getBit10Preformance(bit10BRC20Preformance60D.bit10_brc20 ?? [], 30);
        } else if (selectedPreformanceToken === 'Test BIT10.TOP') {
            return getBit10Preformance(bit10TOPPreformance60D.bit10_top ?? [], 30);
        } else if (selectedPreformanceToken === 'Test BIT10.MEME') {
            return getBit10Preformance(bit10MEMEPreformance60D.bit10_meme ?? [], 30);
        } else {
            return null;
        }
    };

    const tokens30D = selectedBit10Token30D();

    const selectedBit10Token60D = () => {
        if (selectedPreformanceToken === 'Test BIT10.DEFI') {
            return getBit10Preformance(bit10DEFIPreformance60D.bit10_defi ?? [], 60);
        } else if (selectedPreformanceToken === 'Test BIT10.BRC20') {
            return getBit10Preformance(bit10BRC20Preformance60D.bit10_brc20 ?? [], 60);
        } else if (selectedPreformanceToken === 'Test BIT10.TOP') {
            return getBit10Preformance(bit10TOPPreformance60D.bit10_top ?? [], 60);
        } else if (selectedPreformanceToken === 'Test BIT10.MEME') {
            return getBit10Preformance(bit10MEMEPreformance60D.bit10_meme ?? [], 60);
        } else {
            return null;
        }
    };

    const tokens60D = selectedBit10Token60D();

    const selectedBit10TokenChange = () => {
        if (selectedPreformanceToken === 'Test BIT10.DEFI') {
            return bit10DEFIPreformance60D.bit10_defi;
        } else if (selectedPreformanceToken === 'Test BIT10.BRC20') {
            return bit10BRC20Preformance60D.bit10_brc20;
        } else if (selectedPreformanceToken === 'Test BIT10.TOP') {
            return bit10TOPPreformance60D.bit10_top;
        } else if (selectedPreformanceToken === 'Test BIT10.MEME') {
            return bit10MEMEPreformance60D.bit10_meme;
        } else {
            return null;
        }
    };

    const tokensChange = selectedBit10TokenChange();

    const getPercentageChange = (data: Bit10Entry[], daysBack: number) => {
        if (!data || data.length < 2) return 0;

        const lastEntry = data[data.length - 1];
        if (!lastEntry) return 0;

        const currentPrice = lastEntry.tokenPrice ?? 0;
        const timestamp = lastEntry.timestmpz;
        if (!timestamp) return 0;

        const now = new Date(timestamp);
        const oneDayAgo = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        let closestEntry = data[0];
        if (!closestEntry?.timestmpz) return 0;
        let closestDiff = Math.abs(new Date(closestEntry.timestmpz).getTime() - oneDayAgo.getTime());

        for (let i = 1; i < data.length; i++) {
            const entry = data[i];
            if (!entry?.timestmpz) continue;
            const diff = Math.abs(new Date(entry.timestmpz).getTime() - oneDayAgo.getTime());
            if (diff < closestDiff) {
                closestDiff = diff;
                closestEntry = data[i];
            }
        }

        if (!closestEntry) return 0;
        const previousPrice = closestEntry.tokenPrice ?? 0;
        return ((currentPrice - previousPrice) / previousPrice) * 100;
    };

    const percentageChange1Day = getPercentageChange(tokensChange ?? [], 1);
    const percentageChange7Day = getPercentageChange(tokensChange ?? [], 7);
    const percentageChange30Day = getPercentageChange(tokensChange ?? [], 30);
    const percentageChange60Day = getPercentageChange(tokensChange ?? [], 60);

    const bit10PreformanceTokenDataName = () => {
        if (selectedPreformanceToken === 'Test BIT10.DEFI') {
            return 'bit10DEFI';
        } else if (selectedPreformanceToken === 'Test BIT10.BRC20') {
            return 'bit10BRC20';
        } else if (selectedPreformanceToken === 'Test BIT10.TOP') {
            return 'bit10TOP';
        } else if (selectedPreformanceToken === 'Test BIT10.MEME') {
            return 'bit10MEME';
        } else {
            return 'bit10';
        }
    };

    const tokenDataName = bit10PreformanceTokenDataName();

    const bit10Tokens = ['Test BIT10.DEFI', 'Test BIT10.BRC20', 'Test BIT10.TOP', 'Test BIT10.MEME'];

    const bit10PreformanceTokenName = () => {
        if (selectedPreformanceToken === 'Test BIT10.DEFI') {
            return {
                name: 'bit10DEFI',
                indexFundName: 'Test BIT10.DEFI'
            };
        } else if (selectedPreformanceToken === 'Test BIT10.BRC20') {
            return {
                name: 'bit10BRC20',
                indexFundName: 'Test BIT10.BRC20'
            };
        } else if (selectedPreformanceToken === 'Test BIT10.TOP') {
            return {
                name: 'bit10TOP',
                indexFundName: 'Test BIT10.TOP'
            };
        } else if (selectedPreformanceToken === 'Test BIT10.MEME') {
            return {
                name: 'bit10MEME',
                indexFundName: 'Test BIT10.MEME'
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

    const bit10Preformance24hChartData = tokens24H?.map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(entry.tokenPrice.toFixed(4)),
        };
    });

    const bit10Preformance7dChartData = tokens7D?.filter((_, index) => index % 4 === 0).map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(entry.tokenPrice.toFixed(4)),
        };
    });

    const bit10Preformance30dChartData = tokens30D?.filter((_, index) => index % 48 === 0).map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(entry.tokenPrice.toFixed(4)),
        };
    });

    const bit10Preformance60dChartData = tokens60D?.filter((_, index) => index % 48 === 0).map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(entry.tokenPrice.toFixed(4)),
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
                        <div className='text-2xl md:text-4xl text-center md:text-start'>Test BIT10 Performance</div>
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
                                    defaultValue='24H'
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
                                        24H %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-start flex flex-row space-x-2 items-center text-3xl'>
                                    <Triangle fill={percentageChange1Day >= 0 ? 'green' : 'red'} color={percentageChange1Day >= 0 ? 'green' : 'red'} className={percentageChange1Day > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange1Day.toFixed(2)}%
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col h-full w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        7D %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-start flex flex-row space-x-2 items-center text-3xl'>
                                    <Triangle fill={percentageChange7Day >= 0 ? 'green' : 'red'} color={percentageChange7Day >= 0 ? 'green' : 'red'} className={percentageChange7Day > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange7Day.toFixed(2)}%
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col h-full w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        30D %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-start flex flex-row space-x-2 items-center text-3xl'>
                                    <Triangle fill={percentageChange30Day >= 0 ? 'green' : 'red'} color={percentageChange30Day >= 0 ? 'green' : 'red'} className={percentageChange30Day > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange30Day.toFixed(2)}%
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
                                    <Triangle fill={percentageChange60Day >= 0 ? 'green' : 'red'} color={percentageChange60Day >= 0 ? 'green' : 'red'} className={percentageChange60Day > 0 ? '' : 'rotate-180'} />
                                    <p className='font-bold tracking-wider'>
                                        {percentageChange60Day.toFixed(2)}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className='select-none -ml-12 md:-ml-8'>
                            {
                                activeTab === '24H' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance24hChartData}>
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
                                activeTab === '7D' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance7dChartData}>
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
                                activeTab === '30D' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance30dChartData}>
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
                                    <LineChart accessibilityLayer data={bit10Preformance60dChartData}>
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
