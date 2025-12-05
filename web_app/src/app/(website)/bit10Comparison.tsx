import React, { useState, useMemo, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import AnimatedBackground from '@/components/ui/animated-background'
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import Link from 'next/link'
import Image, { type StaticImageData } from 'next/image'
import ICPChainImg from '@/assets/wallet/icp-logo.svg'
import BaseChainImg from '@/assets/wallet/base-logo.svg'
import SolChainImg from '@/assets/wallet/solana-logo.svg'
import BSCChainImg from '@/assets/wallet/bsc-logo.svg'
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

const chains = [
    {
        name: 'Internet Computer',
        logo: ICPChainImg as StaticImageData,
    },
    {
        name: 'Base',
        logo: BaseChainImg as StaticImageData,
    },
    {
        name: 'Solana',
        logo: SolChainImg as StaticImageData,
    },
    {
        name: 'Binance Smart Chain',
        logo: BSCChainImg as StaticImageData,
    },
    {
        name: 'More coming soon...',
        // ToDo: logo: BSCChainImg as StaticImageData,
    }
]

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

const pricingItems = [
    {
        title: 'Free',
        tagline: 'Perfect for getting started with BIT10.',
        price: 'Free',
        features: [
            {
                text: 'Instant Top 10 Crypto Exposure',
                negative: false,
            },
            {
                text: '110% Over-Collateralized',
                negative: false,
            },
            {
                text: 'Weekly Auto-Rebalancing',
                negative: false,
            },
            {
                text: '1% Management Fee',
                negative: null,
            },
            {
                text: '5% Cashback',
                negative: true,
            },
            {
                text: '3 Weekly Raffles',
                negative: true,
            },
            {
                text: 'AI Portfolio Manager',
                negative: true,
            }
        ]
    },
    {
        title: 'Pro',
        tagline: 'Advanced tools and reduced fees for committed investors.',
        price: '9.99 USDC',
        features: [
            {
                text: 'Instant Top 10 Crypto Exposure',
                negative: false,
            },
            {
                text: '110% Over-Collateralized',
                negative: false,
            },
            {
                text: 'Weekly Auto-Rebalancing',
                negative: false,
            },
            {
                text: '0.5% Management Fee',
                negative: null,
            },
            {
                text: '5% Cashback',
                negative: false,
            },
            {
                text: '3 Weekly Raffles',
                negative: false,
            },
            {
                text: 'AI Portfolio Manager',
                negative: false,
            }
        ]
    },
    {
        title: 'Institutional',
        tagline: 'High-performance solutions for institutions.',
        price: 'Custom',
        features: [
            // {
            //     text: 'Instant Top 10 Crypto Exposure',
            //     negative: false,
            // },
            // {
            //     text: '110% Over-Collateralized',
            //     negative: false,
            // },
            // {
            //     text: 'Weekly Auto-Rebalancing',
            //     negative: false,
            // },
            // {
            //     text: '0.5% Management Fee',
            //     negative: null,
            // },
            // {
            //     text: 'AI Portfolio Manager',
            //     negative: false,
            // }
        ]
    }
]

export default function BIT10Comparison() {
    const [activeTab, setActiveTab] = useState('10Y');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    };

    const fetchBIT10Comparison = async (year: number) => {
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

    const fetchBIT10Tokens = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'bit10-latest-price-top') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: string, name: string, symbol: string, price: number }> }
            returnData = data.data ?? 0;
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TokenComparison10Y'],
                queryFn: () => fetchBIT10Comparison(10)
            },
            {
                queryKey: ['bit10TokenComparison5Y'],
                queryFn: () => fetchBIT10Comparison(5)
            },
            {
                queryKey: ['bit10TokenComparison3Y'],
                queryFn: () => fetchBIT10Comparison(3)
            },
            {
                queryKey: ['bit10TokenComparison1Y'],
                queryFn: () => fetchBIT10Comparison(1)
            },
            {
                queryKey: ['bit10TOPTokenList'],
                queryFn: () => fetchBIT10Tokens('bit10-latest-price-top')
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
    const bit10TOPTokens = bit10Queries[4].data as { id: string, name: string, symbol: string, marketCap: number, price: number }[] | undefined;

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
        (value: string) => {
            const yearMatch = /\d{4}/.exec(value);
            return yearMatch ? yearMatch[0] : value;
        }, []
    );

    const buildYAxisMeta = (data: ProcessedDataPoint[], tab: string) => {
        if (!data || data.length === 0) {
            return { domain: [0, 10000], ticks: [0, 10000] };
        }

        const allValues = data.flatMap(point => [
            point.bit10TopValue,
            point.btcValue,
            point.sp500Value,
        ]);
        const maxValue = Math.max(...allValues);

        if (tab === '10Y') {
            const roundedMax = Math.max(10000, Math.ceil(maxValue / 10000) * 10000);
            const ticks = Array.from(
                { length: Math.floor(roundedMax / 10000) + 1 },
                (_, idx) => idx * 10000
            );
            return { domain: [0, roundedMax], ticks };
        }

        const lines = 8;
        const paddedMax = maxValue * 1.05;
        const rawStep = paddedMax / lines;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const step = Math.ceil(rawStep / magnitude) * magnitude;
        const ticks = Array.from({ length: lines + 1 }, (_, idx) => Math.round(idx * step));
        const topBound = ticks[ticks.length - 1];

        return { domain: [0, topBound], ticks };
    };

    const { domain: yDomain, ticks: yTicks } = useMemo(
        () => buildYAxisMeta(currentData, activeTab),
        [currentData, activeTab]
    );

    const yAxisFormatter = useMemo(
        () => (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        []
    );

    const calculateAPR = (initialValue: number, finalValue: number, years: number): number => {
        if (years <= 0 || initialValue <= 0) return 0;
        return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    };

    const aprData = useMemo(() => {
        const calculatePeriodAPR = (data: BIT10Entry[], periodLabel: string) => {
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
                bit10Top: calculateAPR(initialBIT10Top, finalBIT10Top, years),
                btc: calculateAPR(initialBtc, finalBtc, years),
                sp500: calculateAPR(initialSp500, finalSp500, years)
            };
        };

        return {
            '1Y': calculatePeriodAPR(bit10Comparison1Y, '1Y'),
            '5Y': calculatePeriodAPR(bit10Comparison5Y, '5Y'),
            '10Y': calculatePeriodAPR(bit10Comparison10Y, '10Y')
        };
    }, [bit10Comparison1Y, bit10Comparison5Y, bit10Comparison10Y, safeParseFloat]);

    const tokens = (Array.isArray(bit10TOPTokens) ? bit10TOPTokens : []) as { name: string; symbol: string; marketCap: number }[];

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

    const bit10AllocationChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokens.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol,
                    color: color[index % color.length],
                }
            ])
        )
    };

    const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);

    const bit10AllocationPieChartData = tokens.map((token, index) => ({
        name: token.symbol.toUpperCase(),
        value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(4)),
        fill: color[index % color.length],
    }));

    return (
        <div className='flex flex-col items-center space-y-4'>
            <div className='flex flex-col space-y-2 items-center justify-center w-full'>
                <motion.div initial={{ opacity: 0.0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }} className='text-4xl md:text-6xl font-semibold text-center'>
                    BIT10.TOP Annualized Returns (AR)
                </motion.div>
                <motion.div initial='hidden' whileInView='visible' viewport={{ once: true }} variants={containerVariants} className='grid lg:grid-cols-3 gap-8 w-full'>
                    {['1Y', '5Y', '10Y'].map((period) => (
                        <motion.div variants={cardVariants} key={period} className='border-2 bg-card border-muted rounded-2xl py-8 px-3'>
                            <h4 className='font-semibold text-2xl text-center mb-2'>{period} AR</h4>
                            {aprData[period as keyof typeof aprData] ? (
                                <div className={`font-bold text-4xl text-center ${Number(aprData[period as keyof typeof aprData]?.bit10Top.toFixed(2)) > 0 ? 'text-primary' : 'text-red-500'}`}>{Number(aprData[period as keyof typeof aprData]?.bit10Top.toFixed(2)) > 0 && '+'}{aprData[period as keyof typeof aprData]?.bit10Top.toFixed(2)}%</div>
                            ) : (
                                <p className='text-center text-gray-500'>Loading...</p>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <div className='flex flex-col items-center space-y-2 w-full'>
                <motion.h1 initial={{ opacity: 0.0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }} className='text-4xl md:text-6xl font-semibold text-center z-[1]'>
                    Supported Chains
                </motion.h1>

                <motion.div initial='hidden' whileInView='visible' viewport={{ once: true }} variants={containerVariants} className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 w-full h-full py-4'>
                    {chains.map((chains, index) => (
                        <motion.div variants={cardVariants} key={index} className='flex flex-col space-y-2 items-center justify-start py-6 px-2 border-2 bg-card border-muted rounded-2xl w-full min-w-0 h-full'>
                            {chains.logo &&
                                <Image src={chains.logo} height={80} width={80} quality={100} alt={chains.name} />
                            }
                            <div className='font-semibold text-center'>{chains.name}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <div className='flex flex-col space-y-4 items-center justify-center'>
                <motion.div initial={{ opacity: 0.0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }} className='text-4xl md:text-6xl font-semibold text-center'>
                    Simple pricing based on your needs
                </motion.div>
                <div className='grid grid-cols-1 md:grid-cols-3 py-4 md:pt-8 gap-4 md:gap-0'>
                    {pricingItems.map((item, index) => {
                        const isPro = item.title === 'Pro';
                        const isFree = item.title === 'Free';
                        return (
                            <Card
                                key={item.title}
                                className={cn('flex flex-col space-y-4 p-6 border-2 shadow-lg', index === 0 && 'md:rounded-l-2xl md:rounded-r-none rounded-2xl border-2', index === 1 && 'md:rounded-t-2xl md:rounded-b-none rounded-2xl border-2', index === 2 && 'md:rounded-r-2xl md:rounded-l-none rounded-2xl border-2', isPro && 'md:-mt-6 border-primary')}>
                                <div className='text-2xl font-semibold text-center'>
                                    {item.title}
                                </div>
                                <div className='text-center text-gray-500 mb-4'>
                                    {item.tagline}
                                </div>
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
                                            {feature.negative ? (
                                                <XIcon className='h-6 w-6 text-red-500 flex-shrink-0' />
                                            ) : (
                                                <CheckIcon className='h-6 w-6 text-primary flex-shrink-0' />
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

            <div className='grid lg:grid-cols-2 gap-3 w-full'>
                <Card className='border-muted rounded-2xl animate-fade-left-slow h-full'>
                    <CardHeader className='text-4xl md:text-6xl font-semibold'>
                        <CardTitle>BIT10.TOP Allocations</CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col space-y-4 justify-center md:h-3/4'>
                        {isLoading ? (
                            <div className='flex flex-col h-full space-y-2'>
                                <Skeleton className='h-[300px] lg:h-[400px] w-full' />
                            </div>
                        ) : (
                            <div className='grid md:grid-cols-2 gap-4 items-center'>
                                <div className='flex-1'>
                                    <ChartContainer config={bit10AllocationChartConfig} className='aspect-square max-h-[300px]'>
                                        <PieChart>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={bit10AllocationPieChartData} dataKey='value' nameKey='name' innerRadius={innerRadius} strokeWidth={5}>
                                                <Label
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
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                                <div className='flex w-full flex-col space-y-3'>
                                    <div className='flex flex-col'>
                                        {tokens?.sort((a, b) => b.marketCap - a.marketCap).map((token, index) => (
                                            <div key={index} className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'>
                                                <div className='flex flex-row items-center space-x-1'>
                                                    <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }} />
                                                    <div>{token.name}</div>
                                                </div>
                                                <div>{((token.marketCap / totalMarketCap) * 100).toFixed(2)} %</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className='border-muted rounded-2xl animate-fade-right-slow h-full'>
                    <CardHeader className='flex flex-col lg:flex-row items-center justify-between'>
                        <div className='flex flex-1 flex-col justify-center gap-1 pb-3 sm:pb-0'>
                            <CardTitle>$100 Investment Growth Comparison</CardTitle>
                        </div>
                        <div className='flex flex-col lg:flex-row items-center space-y-2 lg:space-x-4 lg:space-y-0'>
                            <div className='relative flex flex-row space-x-2 items-center justify-center border border-muted rounded-md px-2 py-1.5'>
                                <AnimatedBackground defaultValue='10Y' className='rounded bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={(newActiveId) => handleTabChange(newActiveId)}>
                                    {tabs.map((label, index) => (
                                        <button key={index} data-id={label} type='button' className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-primary-foreground'}`}>
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
                                <Skeleton className='h-[300px] lg:h-[400px] w-full' />
                            </div>
                        ) : (
                            <div className='select-none -ml-4'>
                                <ChartContainer config={investmentChartConfig} className='max-h-[300px] lg:max-h-[600px] w-full'>
                                    <LineChart accessibilityLayer data={currentData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey='day' tickLine={true} axisLine={true} tickMargin={8} tickFormatter={tickFormatter} stroke='#21C45D' interval='preserveStartEnd' />
                                        <YAxis tickLine axisLine tickMargin={8} stroke='#21C45D' domain={Array.isArray(yDomain) ? yDomain.filter((v): v is number => typeof v === 'number') : yDomain} ticks={yTicks} tickFormatter={yAxisFormatter} />
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
        </div>
    )
}
