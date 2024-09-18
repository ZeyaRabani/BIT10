/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import AnimatedBackground from '@/components/ui/animated-background'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { performanceDataMonth, performanceDataMonth3, performanceDataMonth6 } from '@/data/performanceData'

const tabs = ['1M', '3M', '6M']

const chartConfig: ChartConfig = {
    'bit10DeFi': {
        label: 'BIT10.DEFI',
    }
}

export default function Performance() {
    const [activeTab, setActiveTab] = useState('1M')

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    return (
        <Card className='dark:border-white md:col-span-2 animate-fade-right-slow'>
            <CardHeader className='flex flex-col md:flex-row items-center justify-between'>
                <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Performance</div>
                <div className='relative flex flex-row space-x-2 items-center justify-center border rounded px-2 py-1'>
                    <AnimatedBackground
                        defaultValue='1M'
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
            </CardHeader>
            <CardContent className='select-none -ml-12 md:-ml-8'>
                {
                    activeTab === '1M' &&
                    <ChartContainer config={chartConfig} className='max-h-[300px] w-full'>
                        <AreaChart accessibilityLayer data={performanceDataMonth}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, value.indexOf(','))} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <defs>
                                <linearGradient id='bit10DeFi' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='#D5520E' stopOpacity={0.8} />
                                    <stop offset='95%' stopColor='#D5520E' stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <Area dataKey='bit10DeFi' type='natural' fill='#D5520E' fillOpacity={0.4} stroke='#D5520E' stackId='a' />
                        </AreaChart>
                    </ChartContainer>
                }
                {
                    activeTab === '3M' &&
                    <ChartContainer config={chartConfig} className='max-h-[300px] w-full'>
                        <AreaChart accessibilityLayer data={performanceDataMonth3}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey='month3' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, value.indexOf(','))} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <defs>
                                <linearGradient id='bit10DeFi' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='#D5520E' stopOpacity={0.8} />
                                    <stop offset='95%' stopColor='#D5520E' stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <Area dataKey='bit10DeFi' type='natural' fill='#D5520E' fillOpacity={0.4} stroke='#D5520E' stackId='a' />
                        </AreaChart>
                    </ChartContainer>
                }
                {
                    activeTab === '6M' &&
                    <ChartContainer config={chartConfig} className='max-h-[300px] w-full'>
                        <AreaChart accessibilityLayer data={performanceDataMonth6}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey='month6' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, value.indexOf(','))} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <defs>
                                <linearGradient id='bit10DeFi' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='#D5520E' stopOpacity={0.8} />
                                    <stop offset='95%' stopColor='#D5520E' stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <Area dataKey='bit10DeFi' type='natural' fill='#D5520E' fillOpacity={0.4} stroke='#D5520E' stackId='a' />
                        </AreaChart>
                    </ChartContainer>
                }
            </CardContent>
        </Card>
    )
}
