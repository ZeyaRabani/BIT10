"use client"

import React, { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AnimatedBackground from '@/components/ui/animated-background'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

const tabs = ['24H', '7D']

type CoinData = {
    id: number;
    name: string;
    symbol: string;
    price: number;
};

type Bit10Entry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

export default function Preformance() {
    const [selectedPreformanceToken, setSelectedPreformanceToken] = useState('BIT10.DEFI');
    const [activeTab, setActiveTab] = useState('24H')

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
        if (tokenPreformance === 'bit10-historic-data-defi-1' || tokenPreformance === 'bit10-historic-data-defi-7') {
            data = await response.json() as { bit10_defi: Bit10Entry[] }
            returnData = { bit10_defi: data.bit10_defi.reverse() };
        } else if (tokenPreformance === 'bit10-historic-data-brc20-1' || tokenPreformance === 'bit10-historic-data-brc20-7') {
            data = await response.json() as { bit10_brc20: Bit10Entry[] }
            returnData = { bit10_brc20: data.bit10_brc20.reverse() };
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFITokenPreformance24h'],
                queryFn: () => fetchBit10Preformance('bit10-historic-data-defi-1')
            },
            {
                queryKey: ['bit10DEFITokenPreformance7d'],
                queryFn: () => fetchBit10Preformance('bit10-historic-data-defi-7')
            },
            {
                queryKey: ['bit10BRC20TokenPreformance24h'],
                queryFn: () => fetchBit10Preformance('bit10-historic-data-brc20-1')
            },
            {
                queryKey: ['bit10BRC20TokenPreformance7d'],
                queryFn: () => fetchBit10Preformance('bit10-historic-data-brc20-7')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10DEFIPreformance24H = bit10Queries[0].data ?? { bit10_defi: [] };
    const bit10DEFIPreformance7D = bit10Queries[1].data ?? { bit10_defi: [] };
    const bit10BRC20Preformance24H = bit10Queries[2].data ?? { bit10_brc20: [] };
    const bit10BRC20Preformance7D = bit10Queries[3].data ?? { bit10_brc20: [] };

    const selectedBit10Token24H = () => {
        if (selectedPreformanceToken === 'BIT10.DEFI') {
            return bit10DEFIPreformance24H.bit10_defi;
        } else if (selectedPreformanceToken === 'BIT10.BRC20') {
            return bit10BRC20Preformance24H.bit10_brc20;
        } else {
            return null;
        }
    };

    const tokens24H = selectedBit10Token24H();

    const selectedBit10Token7D = () => {
        if (selectedPreformanceToken === 'BIT10.DEFI') {
            return bit10DEFIPreformance7D.bit10_defi;
        } else if (selectedPreformanceToken === 'BIT10.BRC20') {
            return bit10BRC20Preformance7D.bit10_brc20;
        } else {
            return null;
        }
    };

    const tokens7D = selectedBit10Token7D();

    const bit10PreformanceTokenDataName = () => {
        if (selectedPreformanceToken === 'BIT10.DEFI') {
            return 'bit10DEFI';
        } else if (selectedPreformanceToken === 'BIT10.BRC20') {
            return 'bit10BRC20';
        } else {
            return 'bit10';
        }
    };

    const tokenDataName = bit10PreformanceTokenDataName();

    const bit10Tokens = ['BIT10.DEFI', 'BIT10.BRC20'];

    const bit10PreformanceTokenName = () => {
        if (selectedPreformanceToken === 'BIT10.DEFI') {
            return {
                name: 'bit10DEFI',
                indexFundName: 'BIT10.DEFI'
            };
        } else if (selectedPreformanceToken === 'BIT10.BRC20') {
            return {
                name: 'bit10BRC20',
                indexFundName: 'BIT10.BRC20'
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

    const bit10Preformance7dChartData = tokens7D?.map((entry) => {
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
                            {['h-10 w-36', 'h-44'].map((classes, index) => (
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
                    <CardContent className='select-none -ml-12 md:-ml-8'>
                        {
                            activeTab === '24H' &&
                            <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                <AreaChart accessibilityLayer data={bit10Preformance24hChartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey='day' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <defs>
                                        <linearGradient id={tokenDataName} x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='5%' stopColor='#D5520E' stopOpacity={0.8} />
                                            <stop offset='95%' stopColor='#D5520E' stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <Area dataKey={tokenDataName} type='linear' fill='#D5520E' fillOpacity={0.4} stroke='#D5520E' stackId='a' />
                                </AreaChart>
                            </ChartContainer>
                        }
                        {
                            activeTab === '7D' &&
                            <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                <AreaChart accessibilityLayer data={bit10Preformance7dChartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey='day' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <defs>
                                        <linearGradient id={tokenDataName} x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='5%' stopColor='#D5520E' stopOpacity={0.8} />
                                            <stop offset='95%' stopColor='#D5520E' stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <Area dataKey={tokenDataName} type='linear' fill='#D5520E' fillOpacity={0.4} stroke='#D5520E' stackId='a' />
                                </AreaChart>
                            </ChartContainer>
                        }
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
