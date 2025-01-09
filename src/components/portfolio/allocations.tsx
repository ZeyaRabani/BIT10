/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

const bit10Tokens = ['BIT10.DEFI', 'BIT10.BRC20']

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function Allocations() {
    const [loading, setLoading] = useState(true);
    const [selectedToken, setSelectedToken] = useState('BIT10.DEFI');
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [tokenData, setTokenData] = useState([]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(70);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const fetchApiData = async () => {
            try {
                setLoading(true);

                const apiEndpoint =
                    selectedToken === 'BIT10.DEFI' ? 'bit10-defi-server' : 'bit10-brc20-server';

                const response = await fetch(`/api/${apiEndpoint}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch from ${apiEndpoint}: ${response.statusText}`);
                }

                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const data = await response.json();

                const apiDataKey = selectedToken === 'BIT10.DEFI' ? 'bit10_defi' : 'bit10_brc20';

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (data[apiDataKey] && data[apiDataKey].length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    setTokenData(data[apiDataKey][0].data);
                } else {
                    console.warn(`No data found for ${apiDataKey}`);
                }
            } catch (error) {
                console.error('Error fetching data from API:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApiData().catch((err) =>
            console.error('Unexpected error in fetchApiData:', err)
        );
    }, [selectedToken]);


    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const chartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokenData.map((token: { symbol: string }) => [
                token.symbol,
                {
                    label: token.symbol,
                    // @ts-ignore
                    color: color[tokenData.indexOf(token) % color.length],
                }
            ])
        )
    };

    const pieChartData = tokenData.map((token, index) => ({
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: token.symbol,
        value: (100 / tokenData.length),
        fill: color[index % color.length],
    }));

    return (
        <div>
            {loading ? (
                <Card className='dark:border-white w-full lg:col-span-1 animate-fade-left-slow'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='dark:border-white w-full lg:col-span-1 animate-fade-in-down-slow'>
                    <CardHeader className='flex flex-col md:flex-row items-center md:justify-between'>
                        <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Allocations</div>
                        <Select onValueChange={setSelectedToken} defaultValue={selectedToken}>
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
                    </CardHeader>
                    <CardContent className='grid md:grid-cols-2 gap-4 items-center'>
                        <div className='flex-1'>
                            <ChartContainer
                                config={chartConfig}
                                className='aspect-square max-h-[300px]'
                            >
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={pieChartData}
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
                                                                {selectedToken}
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
                        <div className='flex w-full flex-col space-y-3'>
                            <h1 className='text-2xl'>{selectedToken} Allocations</h1>
                            <div className='flex flex-col'>
                                {tokenData.map((token, index) => (
                                    <div key={index} className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'>
                                        <div className='flex flex-row items-center space-x-1'>
                                            <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                            {/* @ts-ignore */}
                                            <div>{token.symbol}</div>
                                        </div>
                                        <div>{(100 / tokenData.length).toFixed(2)} %</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
