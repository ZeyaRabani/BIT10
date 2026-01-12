"use client";

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import Image, { type StaticImageData } from 'next/image';
import BIT10Img from '@/assets/tokens/bit10.svg';
import BTCImg from '@/assets/tokens/btc.svg';
import ETHImg from '@/assets/tokens/eth.svg';
import XRPImg from '@/assets/tokens/xrp.svg';
import BNBImg from '@/assets/tokens/bnb.svg';
import SOLImg from '@/assets/tokens/sol.svg';
import TRXImg from '@/assets/tokens/trx.svg';
import DogeImg from '@/assets/tokens/doge.svg';
import ADAImg from '@/assets/tokens/cardano.svg';
import BCHImg from '@/assets/tokens/bch.svg';
import AVAXImg from '@/assets/tokens/avax.svg';
import DefinityDevImg from '@/assets/home/DFINITYDev.jpg';
import EasyaAppImg from '@/assets/home/easya_app.jpg';
import ICPImg from '@/assets/home/ICP.svg';
import EasyAImg from '@/assets/home/EasyA.png';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import ICPChainImg from '@/assets/wallet/icp-logo.svg';
import BaseChainImg from '@/assets/wallet/base-logo.svg';
import SolChainImg from '@/assets/wallet/solana-logo.svg';
import BSCChainImg from '@/assets/wallet/bsc-logo.svg';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUpIcon, ShieldIcon, ZapIcon, NetworkIcon, CheckIcon, XIcon } from 'lucide-react';

const containerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeInOut' } },
};

const imageVariants = {
    hidden: {
        x: '100%',
        opacity: 0,
    },
    visible: {
        x: '0%',
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
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

const pricingItems = [
    {
        title: 'Basic',
        tagline: 'Perfect for getting started with BIT10.',
        price: 'Free',
        features: [
            { text: 'Instant Top 10 Crypto Exposure', negative: false },
            { text: '110% Over-Collateralized', negative: false },
            { text: 'Weekly Auto-Rebalancing', negative: false },
            { text: '0.5% Management Fee', negative: false },
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

const whyChooseUs = [
    {
        title: 'Low Cost',
        desc: 'Pay 1 transaction fee instead of 10',
        icon: NetworkIcon
    },
    {
        title: 'Auto-Rebalanced',
        desc: 'Weekly rebalancing to stay up-to-date',
        icon: ZapIcon
    },
    {
        title: 'Diversified',
        desc: 'Instant exposure to Top 10 cryptocurrencies',
        icon: TrendingUpIcon
    },
    {
        title: 'Secure',
        desc: '110% over-collateralized for your protection',
        icon: ShieldIcon
    },
]

const testimonials = [
    {
        x_link: 'https://x.com/DFINITYDev/status/1808724918177312925',
        tweet: '@bit10startup is bringing the #Bitcoin ecosystem together for a pool party this #ChainFusionSummer⛱️ BIT10 is a #DeFi asset manager built using #ICP that offers an index tracking major #tokens, #ordinals, and #BRC20s on:🟧 ICP @dfinity, 🟧 @Stacks, 🟧 @MapProtocol, 🟧 @SovrynBTC, 🟧 @BadgerDAO, 🟧 @ALEXLabBTC, and more!',
        profile_pic: DefinityDevImg,
        name: 'DFINITY Developers',
        username: 'DFINITYDev'
    },
    {
        x_link: 'https://x.com/easya_app/status/1803087458663383383',
        tweet: 'Congrats to the gigabrains at BIT 10 Smart Assets! 👏 First started building at our EasyA x @Stacks hackathon in London, accepted into @btcstartuplab and now gearing up to launch their testnet! 🚀',
        profile_pic: EasyaAppImg,
        name: 'EasyA',
        username: 'easya_app'
    }
];

const parterners = [
    {
        name: 'ICP',
        logo: ICPImg as StaticImageData,
    },
    {
        name: 'EasyA',
        logo: EasyAImg,
    }
]

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

export default function Page() {
    const [activeTab, setActiveTab] = useState<'10Y' | '5Y' | '3Y' | '1Y'>('10Y');

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

    // const calculateAnnualizedReturn = useCallback((data: BIT10Entry[], years: number): number => {
    //     if (!data.length || years <= 0) return 0;

    //     const end = data[data.length - 1];
    //     if (!end) return 0;
    //     const endDate = new Date(end.date);
    //     const targetDate = new Date(endDate);
    //     targetDate.setFullYear(targetDate.getFullYear() - years);

    //     let closest = data[0];
    //     if (!closest) return 0;
    //     let minDiff = Math.abs(new Date(closest.date).getTime() - targetDate.getTime());

    //     for (let i = 1; i < data.length; i++) {
    //         const entry = data[i];
    //         if (!entry) continue;
    //         const diff = Math.abs(new Date(entry.date).getTime() - targetDate.getTime());
    //         if (diff < minDiff) {
    //             minDiff = diff;
    //             closest = entry;
    //         }
    //     }

    //     const finalValue = parseFloat(end.bit10Top) || 0;
    //     const initialValue = parseFloat(closest.bit10Top) || 0;
    //     if (initialValue === 0) return 0;

    //     return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    // }, []);

    // const arData = useMemo(
    //     () => [
    //         { label: '1Y AR', value: calculateAnnualizedReturn(performance1Y, 1) },
    //         { label: '5Y AR', value: calculateAnnualizedReturn(performance5Y, 5) },
    //         { label: '10Y AR', value: calculateAnnualizedReturn(performance10Y, 10) },
    //     ],
    //     [calculateAnnualizedReturn, performance1Y, performance5Y, performance10Y]
    // );

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

    const handleTabChange = useCallback((label: string | null) => {
        if (label && (tabs as readonly string[]).includes(label)) {
            setActiveTab(label as '10Y' | '5Y' | '3Y' | '1Y');
        }
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
        <div className='flex flex-col space-y-4'>
            <div className='max-w-7xl mx-auto z-10 w-full pt-8 md:pt-18'>
                <motion.div
                    initial={{ opacity: 0.0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
                    className='text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-400 bg-opacity-50 pb-2'>
                    On-Chain Crypto Index Funds
                </motion.div>

                <div className='flex flex-col md:flex-row md:space-x-4 items-center justify-center pt-6 px-4'>
                    <div className='flex flex-col space-y-2 items-center'>
                        <motion.div
                            initial={{ opacity: 0.0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}>
                            <Image src={BIT10Img as StaticImageData} alt='logo' width={85} height={85} className='border-2 w-16 md:w-16 lg:w-20 rounded-full' />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            className='text-xl font-semibold text-primary'>
                            BIT10.TOP
                        </motion.div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
                        className='text-6xl md:-mt-5'>
                        =
                    </motion.div>
                    <div className='flex flex-col space-y-2 items-start justify-center'>
                        <motion.div
                            variants={containerVariants}
                            initial='hidden'
                            whileInView='visible'
                            viewport={{ once: true }}
                            className='flex flex-row items-center justify-center -space-x-3 w-full'>
                            {[BTCImg, ETHImg, XRPImg, BNBImg, SOLImg, TRXImg, DogeImg, ADAImg, BCHImg, AVAXImg].map((imgSrc, index) => (
                                <motion.div key={index} variants={imageVariants}>
                                    <Image src={imgSrc as StaticImageData} alt='logo' width={85} height={85} className='border-2 rounded-full w-9 md:w-16 lg:w-20 h-full object-cover bg-gray-200' />
                                </motion.div>
                            ))}
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            className='text-xl font-semibold text-center'>
                            Top 10 cryptocurrencies in a single, secure, over-collateralized token.
                        </motion.div>
                    </div>
                </div>
            </div>

            <MaxWidthWrapper className='flex flex-col space-y-4 md:space-y-16 py-8'>
                <div className='flex justify-center w-full'>
                    <Card className='animate-fade-right-slow h-full w-full lg:w-3/4'>
                        <CardHeader className='flex flex-col lg:flex-row items-start lg:items-center justify-center lg:justify-between gap-3'>
                            <CardTitle className='text-center lg:text-start'>$100 Investment Growth Comparison</CardTitle>
                            <div className='relative flex flex-row space-x-2 bg-muted border rounded-full px-2 py-1.5 self-center'>
                                <AnimatedBackground defaultValue={activeTab} className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={handleTabChange}>
                                    {tabs.map((label) => (
                                        <button key={label} data-id={label} type='button' className={`inline-flex cursor-pointer px-2 text-sm items-center transition-transform active:scale-95 ${activeTab === label ? 'text-white' : 'text-foreground'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </AnimatedBackground>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className='h-75 lg:h-100 w-full' />
                            ) : (
                                <div className='select-none -ml-4'>
                                    <ChartContainer config={investmentChartConfig} className='max-h-75 lg:max-h-95 w-full'>
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

                {/* ToDo: Work on this */}
                {/* <div className='flex flex-col space-y-4 items-center w-full'>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className='text-4xl md:text-6xl font-semibold text-center'>
                        How BIT10 works?
                    </motion.div>
                </div> */}

                <div className='flex flex-col space-y-4 items-center w-full'>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className='text-4xl md:text-6xl font-semibold text-center'>
                        Simple pricing based on your needs
                    </motion.div>

                    <div className='grid grid-cols-1 md:grid-cols-3 py-4 md:pt-10 gap-4 md:gap-0'>
                        {pricingItems.map((item) => {
                            const isPro = item.title === 'Pro';
                            const isFree = item.title === 'Basic';
                            return (
                                <Card key={item.title} className={cn('flex flex-col p-6 border-2 shadow-lg', isPro && 'md:-mt-6 border-primary')}>
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
                                            <Button variant='outline' className='w-full md:w-fit md:px-16' asChild>
                                                <a href='mailto:zeyarabani@bit10.app'>
                                                    Talk to us
                                                </a>
                                            </Button>
                                        )}
                                    </div>

                                    <div className='flex flex-col space-y-4'>
                                        {item.features.map((feature, index) => (
                                            <div key={index} className='flex flex-row space-x-2 items-center'>
                                                {feature.negative === false && (
                                                    <CheckIcon className='h-6 w-6 text-primary shrink-0' />
                                                )}
                                                {feature.negative === true && (
                                                    <XIcon className='h-6 w-6 text-red-500 shrink-0' />
                                                )}
                                                <div className='text-sm'>{feature.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <div className='flex flex-col space-y-4 items-center w-full'>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className='text-4xl md:text-6xl font-semibold text-center'>
                        Why Choose BIT10.TOP?
                    </motion.div>

                    <motion.div initial='hidden' whileInView='visible' variants={containerVariants} viewport={{ once: true }} className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full h-full py-4'>
                        {whyChooseUs.map((item, index) => (
                            <motion.div variants={cardVariants} viewport={{ once: true }} key={index} className='flex flex-col space-y-2 items-center justify-start py-6 px-2 border-2 bg-card rounded-2xl w-full min-w-0 h-full'>
                                <div className='flex flex-col items-center justify-start h-full w-full'>
                                    <div className='mb-2 flex justify-center'>{item.icon && <item.icon className='h-12 w-12 text-primary' />}</div>
                                    <div className='text-2xl font-semibold text-center'>{item.title}</div>
                                    <div className='text-lg text-center max-w-56'>{item.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                <div className='flex flex-col space-y-4 items-center w-full'>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className='text-4xl md:text-6xl font-semibold text-center'>
                        Supported Chains
                    </motion.div>

                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        viewport={{ once: true }}
                        variants={containerVariants}
                        className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 w-full py-4'>
                        {chains.map((chain, index) => (
                            <motion.div
                                key={index}
                                variants={cardVariants}
                                className='flex flex-col space-y-2 items-center justify-start py-6 px-2 border-2 bg-card rounded-2xl'>
                                <Image src={chain.logo} height={80} width={80} alt={chain.name} className='object-contain' />
                                <div className='font-semibold text-center'>{chain.name}</div>
                            </motion.div>
                        ))}

                        <motion.div
                            variants={cardVariants}
                            className='flex flex-col space-y-2 items-center justify-start py-6 px-2 border-2 bg-card rounded-2xl col-span-2 lg:col-span-1'>
                            <div className='flex flex-row items-center justify-center -space-x-3 w-full'>
                                <Image src={ETHImg as StaticImageData} alt='Ethereum' height={80} width={80} className='rounded-full bg-gray-200' />
                                <Image src={AVAXImg as StaticImageData} alt='Avalanche' height={80} width={80} className='rounded-full bg-gray-200' />
                            </div>
                            <div className='font-semibold text-center'>More coming soon...</div>
                        </motion.div>
                    </motion.div>
                </div>

                <div className='flex flex-col space-y-4 items-center overflow-hidden'>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className='text-4xl md:text-6xl font-semibold text-center'>
                        Our Partners
                    </motion.div>

                    <InfiniteMovingCards
                        items={testimonials}
                        direction='right'
                        speed='slow'
                    />

                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        viewport={{ once: true }}
                        variants={containerVariants}
                        className='flex flex-col md:flex-row items-center justify-evenly w-full space-y-3 md:space-y-0'>
                        {parterners.map((partner, index) => (
                            <motion.div
                                variants={cardVariants}
                                key={index}
                                className='p-2 border-2 border-accent rounded-2xl bg-white'>
                                <Image src={partner.logo} height={50} width={400} alt={partner.name} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </MaxWidthWrapper>
        </div >
    )
}
