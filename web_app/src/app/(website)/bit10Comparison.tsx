import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import AnimatedBackground from '@/components/ui/animated-background'
import { CartesianGrid, XAxis, YAxis, LineChart, Line, PieChart, Pie, Label as RechartsLabel } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import Link from 'next/link'
import Image, { type StaticImageData } from 'next/image'
import ICPChainImg from '@/assets/wallet/icp-logo.svg'
import BaseChainImg from '@/assets/wallet/base-logo.svg'
import SolChainImg from '@/assets/wallet/solana-logo.svg'
import BSCChainImg from '@/assets/wallet/bsc-logo.svg'
import ETHImg from '@/assets/tokens/eth.svg'
import AVAXImg from '@/assets/tokens/avax.svg'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { CheckIcon, XIcon } from 'lucide-react'

const containerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.3,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeInOut' } },
};

const tabs = ['1Y', '3Y', '5Y', '10Y'] as const;

type BIT10Entry = {
    date: string;
    bit10Top: string;
    btc: string;
    sp500: string;
};

const chains = [
    { name: 'Internet Computer', logo: ICPChainImg as StaticImageData },
    { name: 'Base', logo: BaseChainImg as StaticImageData },
    { name: 'Solana', logo: SolChainImg as StaticImageData },
    { name: 'Binance Smart Chain', logo: BSCChainImg as StaticImageData },
];

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

const pricingItems = [
    {
        title: 'Basic',
        tagline: 'Perfect for getting started with BIT10.',
        price: 'Free',
        features: [
            { text: 'Instant Top 10 Crypto Exposure', negative: false },
            { text: '110% Over-Collateralized', negative: false },
            { text: 'Weekly Auto-Rebalancing', negative: false },
            { text: '1% Management Fee', negative: false },
            { text: '5% Cashback', negative: true },
            { text: '3 Reward Pool Tickets', negative: true },
            { text: 'AI Portfolio Manager', negative: true },
        ],
    },
    {
        title: 'Pro',
        tagline: 'Advanced tools and reduced fees for committed investors.',
        price: '9.99 USDC',
        features: [
            { text: 'Instant Top 10 Crypto Exposure', negative: false },
            { text: '110% Over-Collateralized', negative: false },
            { text: 'Weekly Auto-Rebalancing', negative: false },
            { text: '0.5% Management Fee', negative: false },
            { text: '5% Cashback', negative: false },
            { text: '3 Reward Pool Tickets', negative: false },
            { text: 'AI Portfolio Manager', negative: false },
        ],
    },
    {
        title: 'Institutional',
        tagline: 'High-performance solutions for institutions.',
        price: 'Custom',
        features: [],
    },
];

const fetchBIT10Tokens = async (tokenPriceAPI: string) => {
    try {
        const response = await fetch(tokenPriceAPI);
        if (!response.ok) throw new Error('Failed to fetch tokens');

        const data = (await response.json()) as { data?: unknown };
        return Array.isArray(data?.data) ? (data.data as { id: string; name: string; symbol: string; marketCap: number; price: number }[]) : [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching BIT10 price. Please try again!');
        return [];
    }
};

const fetchBIT1010YPerformance = async (): Promise<{ bit10_top: BIT10Entry[] } | null> => {
    try {
        const response = await fetch('bit10-comparison-data-10');
        if (!response.ok) throw new Error('Network error');

        const data = (await response.json()) as { bit10_top?: BIT10Entry[] };
        return { bit10_top: (data.bit10_top ?? []).reverse() };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching BIT10 performance. Please try again!');
        return null;
    }
};

export default function BIT10Comparison() {
    const [activeTab, setActiveTab] = useState<'10Y' | '5Y' | '3Y' | '1Y'>('10Y');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const { data: queryData, isLoading } = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenList'],
                queryFn: () => fetchBIT10Tokens('bit10-latest-price-top'),
                staleTime: 300000, // 5 minutes
            },
            {
                queryKey: ['bit10TOPTokenPreformance3Y'],
                queryFn: () => fetchBIT1010YPerformance(),
                staleTime: 900000, // 15 minutes
            },
        ],
        combine: (results) => ({
            data: results.map((r) => r.data),
            isLoading: results.some((r) => r.isLoading),
        }),
    });

    const bit10TOPTokens = queryData?.[0] as
        | { id: string; name: string; symbol: string; marketCap: number; price: number }[]
        | undefined;

    const bit10TOPData = useMemo(() => {
        const performanceData = queryData?.[1];
        if (performanceData && typeof performanceData === 'object' && 'bit10_top' in performanceData) {
            return (performanceData as { bit10_top: BIT10Entry[] }).bit10_top ?? [];
        }
        return [];
    }, [queryData]);

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat('en-US', {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            }),
        []
    );

    const getPerformanceRange = useCallback(
        (data: BIT10Entry[], rangeYears: number) => {
            if (!data.length) return [];
            const lastEntry = data[data.length - 1];
            if (!lastEntry) return [];
            const now = new Date(lastEntry.date);
            const start = new Date(now);
            start.setFullYear(start.getFullYear() - rangeYears);
            return data.filter((entry) => new Date(entry.date) >= start);
        },
        []
    );

    const performance1Y = useMemo(() => getPerformanceRange(bit10TOPData, 1), [bit10TOPData, getPerformanceRange]);
    const performance3Y = useMemo(() => getPerformanceRange(bit10TOPData, 3), [bit10TOPData, getPerformanceRange]);
    const performance5Y = useMemo(() => getPerformanceRange(bit10TOPData, 5), [bit10TOPData, getPerformanceRange]);
    const performance10Y = useMemo(() => getPerformanceRange(bit10TOPData, 10), [bit10TOPData, getPerformanceRange]);

    const calculateAnnualizedReturn = useCallback((data: BIT10Entry[], years: number): number => {
        if (!data.length || years <= 0) return 0;

        const end = data[data.length - 1];
        if (!end) return 0;
        const endDate = new Date(end.date);
        const targetDate = new Date(endDate);
        targetDate.setFullYear(targetDate.getFullYear() - years);

        let closest = data[0];
        if (!closest) return 0;
        let minDiff = Math.abs(new Date(closest.date).getTime() - targetDate.getTime());

        for (let i = 1; i < data.length; i++) {
            const entry = data[i];
            if (!entry) continue;
            const diff = Math.abs(new Date(entry.date).getTime() - targetDate.getTime());
            if (diff < minDiff) {
                minDiff = diff;
                closest = entry;
            }
        }

        const finalValue = parseFloat(end.bit10Top) || 0;
        const initialValue = parseFloat(closest.bit10Top) || 0;
        if (initialValue === 0) return 0;

        return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    }, []);

    const arData = useMemo(
        () => [
            { label: '1Y AR', value: calculateAnnualizedReturn(performance1Y, 1) },
            { label: '5Y AR', value: calculateAnnualizedReturn(performance5Y, 5) },
            { label: '10Y AR', value: calculateAnnualizedReturn(performance10Y, 10) },
        ],
        [calculateAnnualizedReturn, performance1Y, performance5Y, performance10Y]
    );

    const tickFormatter = useCallback((value: string) => {
        const match = /\d{4}/.exec(value);
        return match ? match[0] : value;
    }, []);

    const formatChartData = useCallback(
        (rawData: BIT10Entry[]) => {
            if (!rawData.length) return [];

            const first = rawData[0];
            if (!first) return [];
            const initialBIT10Top = parseFloat(first.bit10Top) || 1;
            const initialBTC = parseFloat(first.btc) || 1;
            const initialSP500 = parseFloat(first.sp500) || 1;

            return rawData.map((entry) => ({
                day: dateFormatter.format(new Date(entry.date)),
                bit10TopValue: (parseFloat(entry.bit10Top) / initialBIT10Top) * 100,
                btcValue: (parseFloat(entry.btc) / initialBTC) * 100,
                sp500Value: (parseFloat(entry.sp500) / initialSP500) * 100,
            }));
        },
        [dateFormatter]
    );

    const chartData1Y = useMemo(() => formatChartData(performance1Y), [formatChartData, performance1Y]);
    const chartData3Y = useMemo(() => formatChartData(performance3Y), [formatChartData, performance3Y]);
    const chartData5Y = useMemo(() => formatChartData(performance5Y), [formatChartData, performance5Y]);
    const chartData10Y = useMemo(() => formatChartData(performance10Y), [formatChartData, performance10Y]);

    const activeChartData = useMemo(() => {
        switch (activeTab) {
            case '1Y':
                return chartData1Y;
            case '3Y':
                return chartData3Y;
            case '5Y':
                return chartData5Y;
            case '10Y':
                return chartData10Y;
            default:
                return chartData10Y;
        }
    }, [activeTab, chartData1Y, chartData3Y, chartData5Y, chartData10Y]);

    const tokens = useMemo(
        () => (Array.isArray(bit10TOPTokens) ? bit10TOPTokens : []),
        [bit10TOPTokens]
    );

    const totalMarketCap = useMemo(
        () => tokens.reduce((sum, t) => sum + (t.marketCap || 0), 0),
        [tokens]
    );

    const bit10AllocationChartConfig = useMemo(() => {
        const config: ChartConfig = {};
        tokens.forEach((token, index) => {
            config[token.symbol] = {
                label: token.symbol,
                color: color[index % color.length],
            };
        });
        return config;
    }, [tokens]);

    const bit10AllocationPieChartData = useMemo(
        () =>
            tokens.map((token, index) => ({
                name: token.symbol.toUpperCase(),
                value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(4)),
                fill: color[index % color.length],
            })),
        [tokens, totalMarketCap]
    );

    const handleTabChange = useCallback((label: string | null) => {
        if (label && (tabs as readonly string[]).includes(label)) {
            setActiveTab(label as '10Y' | '5Y' | '3Y' | '1Y');
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setInnerRadius(window.innerWidth >= 1200 ? 90 : 70);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const investmentChartConfig = {
        bit10TopValue: {
            label: 'BIT10.TOP Investment',
        },
        btcValue: {
            label: 'Bitcoin Investment',
        },
        sp500Value: {
            label: 'S&P500 Investment',
        },
    } satisfies ChartConfig;

    return (
        <div className='flex flex-col items-center space-y-4 md:space-y-16'>
            <div className='flex flex-col space-y-8 items-center w-full'>
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8 }} className='text-4xl md:text-6xl font-semibold text-center'>
                    BIT10.TOP Annualized Returns (AR)
                </motion.div>

                <motion.div initial='hidden' whileInView='visible' viewport={{ once: true }} variants={containerVariants} className='grid lg:grid-cols-3 gap-8 w-full'>
                    {arData.map((item) => (
                        <motion.div key={item.label} variants={cardVariants} className='border-2 bg-card border-muted rounded-2xl py-8 px-3'>
                            <h4 className='font-semibold text-2xl text-center mb-2'>{item.label}</h4>
                            <div className={`font-bold text-4xl text-center ${item.value > 0 ? 'text-primary' : item.value < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {item.value > 0 && '+'}
                                {item.value.toFixed(2)}%
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <div className='flex flex-col items-center space-y-2 w-full md:pt-8'>
                <motion.h1 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8 }} className='text-4xl md:text-6xl font-semibold text-center'>
                    Supported Chains
                </motion.h1>

                <motion.div initial='hidden' whileInView='visible' viewport={{ once: true }} variants={containerVariants} className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 w-full py-4'>
                    {chains.map((chain, index) => (
                        <motion.div key={index} variants={cardVariants} className='flex flex-col space-y-2 items-center justify-start py-6 px-2 border-2 bg-card border-muted rounded-2xl'>
                            <Image src={chain.logo} height={80} width={80} quality={100} alt={chain.name} className='object-contain' />
                            <div className='font-semibold text-center'>{chain.name}</div>
                        </motion.div>
                    ))}

                    <motion.div variants={cardVariants} className='flex flex-col space-y-2 items-center justify-start py-6 px-2 border-2 bg-card border-muted rounded-2xl col-span-2 lg:col-span-1'>
                        <div className='flex flex-row items-center justify-center -space-x-3 w-full'>
                            <Image src={ETHImg as StaticImageData} alt='Ethereum' height={80} width={80} quality={100} className='rounded-full bg-gray-200' />
                            <Image src={AVAXImg as StaticImageData} alt='Avalanche' height={80} width={80} quality={100} className='rounded-full bg-gray-200' />
                        </div>
                        <div className='font-semibold text-center'>More coming soon...</div>
                    </motion.div>
                </motion.div>
            </div>

            <div className='flex flex-col space-y-4 items-center w-full'>
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8 }} className='text-4xl md:text-6xl font-semibold text-center'>
                    Simple pricing based on your needs
                </motion.div>

                <div className='grid grid-cols-1 md:grid-cols-3 py-4 md:pt-8 gap-4 md:gap-0'>
                    {pricingItems.map((item) => {
                        const isPro = item.title === 'Pro';
                        const isFree = item.title === 'Basic';
                        return (
                            <Card key={item.title} className={cn('flex flex-col space-y-4 p-6 border-2 shadow-lg rounded-2xl', isPro && 'md:-mt-6 border-primary')}>
                                <div className='text-2xl font-semibold text-center'>{item.title}</div>
                                <div className='text-center text-gray-500 mb-4'>{item.tagline}</div>
                                <div className='text-center text-3xl font-bold tracking-wide'>
                                    {item.price}
                                    {!isFree && <span className='text-lg'>/month</span>}
                                </div>

                                <div className='flex w-full justify-center'>
                                    {isFree ? (
                                        <Button className='w-full lg:w-1/2' asChild>
                                            <Link href='/buy'>Buy BIT10.TOP</Link>
                                        </Button>
                                    ) : isPro ? (
                                        <Button variant='outline' className='w-full lg:w-1/2' disabled>
                                            Coming soon
                                        </Button>
                                    ) : (
                                        <Button
                                            variant='outline'
                                            className='w-full md:w-fit md:px-16'
                                            onClick={() => (window.location.href = 'mailto:zeyarabani@bit10.app')}
                                        >
                                            Talk to us
                                        </Button>
                                    )}
                                </div>

                                <div className='flex flex-col space-y-4'>
                                    {item.features.map((feature, index) => (
                                        <div key={index} className='flex flex-row space-x-2 items-center'>
                                            {feature.negative === false && (
                                                <CheckIcon className='h-6 w-6 text-primary flex-shrink-0' />
                                            )}
                                            {feature.negative === true && (
                                                <XIcon className='h-6 w-6 text-red-500 flex-shrink-0' />
                                            )}
                                            <div className='text-sm'>{feature.text}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className='grid lg:grid-cols-2 gap-3 w-full'>
                    <Card className='border-muted rounded-2xl animate-fade-left-slow h-full'>
                        <CardHeader>
                            <CardTitle>BIT10.TOP Allocations</CardTitle>
                        </CardHeader>
                        <CardContent className='flex flex-col space-y-4 md:h-3/4'>
                            {isLoading ? (
                                <Skeleton className='h-[300px] lg:h-[400px] w-full' />
                            ) : (
                                <div className='grid md:grid-cols-2 gap-4 items-center'>
                                    <div className='flex-1'>
                                        <ChartContainer config={bit10AllocationChartConfig} className='aspect-square max-h-[300px]'>
                                            <PieChart>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                <Pie data={bit10AllocationPieChartData} dataKey='value' nameKey='name' innerRadius={innerRadius} strokeWidth={5}>
                                                    <RechartsLabel
                                                        content={({ viewBox }) => {
                                                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                                return (
                                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                                                                        <tspan x={viewBox.cx} y={viewBox.cy} className='fill-foreground text-xl font-bold'>
                                                                            BIT10.TOP
                                                                        </tspan>
                                                                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className='fill-muted-foreground'>
                                                                            Allocations
                                                                        </tspan>
                                                                    </text>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                    </div>

                                    <div className='flex flex-col space-y-1'>
                                        {tokens
                                            .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
                                            .map((token, index) => (
                                                <div key={token.id} className='flex items-center justify-between hover:bg-accent p-1 rounded'>
                                                    <div className='flex items-center space-x-1'>
                                                        <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }} />
                                                        <span className='uppercase'>{token.symbol}</span>
                                                    </div>
                                                    <span>{((token.marketCap / totalMarketCap) * 100).toFixed(2)}%</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className='border-muted rounded-2xl animate-fade-right-slow h-full'>
                        <CardHeader className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3'>
                            <CardTitle>$100 Investment Growth Comparison</CardTitle>
                            <div className='relative flex flex-row space-x-2 bg-muted border border-muted rounded-md px-2 py-1.5 self-start lg:self-center'>
                                <AnimatedBackground defaultValue={activeTab} className='rounded bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={handleTabChange}>
                                    {tabs.map((label) => (
                                        <button key={label} data-id={label} type='button' className={`inline-flex px-2 text-sm items-center transition-transform active:scale-95 ${activeTab === label ? 'text-white' : 'text-foreground'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </AnimatedBackground>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className='h-[300px] lg:h-[400px] w-full' />
                            ) : (
                                <div className='select-none -ml-4'>
                                    <ChartContainer config={investmentChartConfig} className='max-h-[300px] lg:max-h-[380px] w-full'>
                                        <LineChart accessibilityLayer data={activeChartData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={tickFormatter} stroke='#ffffff' interval='preserveStartEnd' />
                                            <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} stroke='#ffffff' tickFormatter={(value) => `$${(value as number).toFixed(0)}`} />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <ChartLegend content={<ChartLegendContent />} />
                                            <Line dataKey='bit10TopValue' type='monotone' stroke='green' strokeWidth={2} dot={false} name='BIT10.TOP Investment' />
                                            <Line dataKey='btcValue' type='monotone' stroke='orange' strokeWidth={2} dot={false} name='Bitcoin Investment' />
                                            <Line dataKey='sp500Value' type='monotone' stroke='blue' strokeWidth={2} dot={false} name='S&P500 Investment' />
                                        </LineChart>
                                    </ChartContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
