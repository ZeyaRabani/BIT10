import React, { useState, useEffect } from 'react'
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import AnimatedBackground from '@/components/ui/animated-background'
import { CartesianGrid, XAxis, YAxis, LineChart, Line, Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

const tabs = ['30D', '60D', '1Y', '3Y'];

type BIT10Entry = {
    date: string;
    bit10Top: string;
    btc: string;
    sp500: string;
};

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

export default function TokenDetails({ token_price, token_name, token_list }: { token_price: number, token_name: string, token_list: { id: string; name: string; symbol: string; marketCap: number; price: number; }[] }) {
    const [activeTab, setActiveTab] = useState('3Y');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(50);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

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

            const data = await response.json() as { bit10_top: BIT10Entry[] };
            return { bit10_top: data.bit10_top.reverse() };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Network error. Please try again!');
            return null;
        }
    };

    const gatedTokenPreformanceQueries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenPreformance10Y'],
                queryFn: () => fetchBit10Preformance()
            }
        ],
    });

    const isLoading = gatedTokenPreformanceQueries.some(query => query.isLoading);
    const bit10TOPPreformance10Y = gatedTokenPreformanceQueries[0].data?.bit10_top ?? [];

    const getBIT10Performance = (data: BIT10Entry[], range: string) => {
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

    const selectedBIT10Token30D = () => {
        if (token_name === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '30D');
        } else {
            return null;
        }
    };

    const tokens30D = selectedBIT10Token30D();

    const selectedBIT10Token60D = () => {
        if (token_name === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '60D');
        } else {
            return null;
        }
    };

    const tokens60D = selectedBIT10Token60D();

    const selectedBIT10Token1Y = () => {
        if (token_name === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '1Y');
        } else {
            return null;
        }
    };

    const tokens1Y = selectedBIT10Token1Y();

    const selectedBIT10Token3Y = () => {
        if (token_name === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '3Y');
        } else {
            return null;
        }
    };

    const tokens3Y = selectedBIT10Token3Y();

    const bit10PreformanceTokenDataName = () => {
        if (token_name === 'BIT10.TOP') {
            return 'bit10TOP';
        } else {
            return 'bit10';
        }
    };

    const tokenDataName = bit10PreformanceTokenDataName();

    const bit10PreformanceTokenName = () => {
        if (token_name === 'BIT10.TOP') {
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
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(2)),
        };
    });

    const rawTokens = token_list;
    const tokens = (Array.isArray(rawTokens) ? rawTokens : []) as { name: string, symbol: string; marketCap: number }[];

    const bit10AllocationChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokens.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol.toLocaleUpperCase(),
                    color: color[index % color.length],
                }
            ])
        )
    };

    const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);

    const bit10AllocationPieChartData = tokens.map((token, index) => ({
        name: token.symbol,
        value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(2)),
        fill: color[index % color.length],
    }));

    return (
        <>
            {isLoading ? (
                <div className='flex flex-col space-y-2 lg:space-y-4 lg:col-span-3'>
                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle className='flex flex-row space-x-2 items-center justify-between'>
                                <Skeleton className='bg-muted rounded-md w-16 h-12' />
                                <Skeleton className='bg-muted rounded-md w-36 h-8' />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='bg-muted rounded-md w-full h-52' />
                        </CardContent>
                    </Card>

                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle>
                                <Skeleton className='bg-muted rounded-md w-16 h-8' />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='bg-muted rounded-md w-full h-52' />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className='flex flex-col space-y-2 lg:space-y-4 lg:col-span-3'>
                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:items-center md:justify-between'>
                                <div className='md:text-3xl'>${(token_price).toFixed(2)}</div>
                                <div className='relative flex flex-row space-x-2 items-center justify-center border border-muted rounded-md px-2 py-1.5'>
                                    <AnimatedBackground
                                        defaultValue='3Y'
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
                                                className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] text-sm font-light`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </AnimatedBackground>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
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

                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle className='md:text-3xl'>
                                Allocation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='grid md:grid-cols-5 items-center'>
                            <div className='md:col-span-2'>
                                <div className='flex-1'>
                                    <ChartContainer
                                        config={bit10AllocationChartConfig}
                                        className='aspect-square max-h-[300px]'
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Pie
                                                data={bit10AllocationPieChartData}
                                                dataKey='value'
                                                nameKey='name'
                                                innerRadius={innerRadius}
                                                strokeWidth={5}
                                            >
                                                <Label
                                                    content={({ viewBox }) => {
                                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                            return (
                                                                <text
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    textAnchor='middle'
                                                                    dominantBaseline='middle'
                                                                >
                                                                    <tspan
                                                                        x={viewBox.cx}
                                                                        y={viewBox.cy}
                                                                        className='fill-foreground text-xl font-bold'
                                                                    >
                                                                        {token_name}
                                                                    </tspan>
                                                                    <tspan
                                                                        x={viewBox.cx}
                                                                        y={(viewBox.cy ?? 0) + 24}
                                                                        className='fill-muted-foreground'
                                                                    >
                                                                        Allocations
                                                                    </tspan>
                                                                </text>
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>
                            <div className='md:col-span-3'>
                                <div className='grid md:gap-x-6'>
                                    {tokens?.sort((a, b) => b.marketCap - a.marketCap).map((token, index) => (
                                        <div
                                            key={index}
                                            className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'
                                        >
                                            <div className='flex flex-row items-center space-x-1'>
                                                <div
                                                    className='w-3 h-3 rounded'
                                                    style={{ backgroundColor: color[index % color.length] }}
                                                ></div>
                                                <div>{token.name} ({token.symbol.toLocaleUpperCase()})</div>
                                            </div>
                                            <div>{((token.marketCap / totalMarketCap) * 100).toFixed(1)} %</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    )
}
