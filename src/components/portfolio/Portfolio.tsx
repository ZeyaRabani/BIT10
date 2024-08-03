"use client"

import React, { useState, useEffect } from 'react'
import { userPortfolioDetails, userRecentActivity } from '@/actions/dbActions'
import { useWallet } from '@/context/WalletContext'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Label, Pie, PieChart, Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { bit10Allocation } from '@/data/bit10TokenAllocation'
import clsx from 'clsx'
import { performanceDataMonth, performanceDataMonth3, performanceDataMonth6 } from '@/data/performanceData'
import { PortfolioTableDataType, portfolioTableColumns } from './columns'
import { DataTable } from '@/components/ui/data-table-portfolio'

interface UserPortfolioType {
    paymentAddress: string;
    token_purchase_amount: string;
    token_purchase_name: string;
    token_purchase_usd_amount: string;
    bit10_token_quantity: string;
    bit10_token_name: string;
}

type Tab = 'month' | 'month3' | 'month6';

const chartConfig: ChartConfig = {
    'bit10DeFi': {
        label: 'BIT10.DEFI',
    },
    'icp': {
        label: 'ICP',
    },
    'stx': {
        label: 'STX',
    },
    'cfx': {
        label: 'CFX',
    },
    'mapo': {
        label: 'MAPO',
    },
    'rif': {
        label: 'RIF',
    },
    'sov': {
        label: 'SOV',
    },
}

const bit10FillArray = [
    { tokenName: 'BIT10.DEFI', fill: '#D5520E' },
    { tokenName: 'BIT10.BRC20', fill: '#ff8533' },
];

export default function Portfolio() {
    const [loading, setLoading] = useState(true);
    const [userPortfolio, setUserPortfolio] = useState<UserPortfolioType[]>([]);
    const [bit10TokenSums, setBit10TokenSums] = useState<Record<string, number>>({});
    const [totalPurchaseUSD, setTotalPurchaseUSD] = useState<number>(0);
    const [totalPurchaseBit10Token, setTotalPurchaseBit10Token] = useState<number>(0);
    const [coinbaseData, setCoinbaseData] = useState<number[]>([]);
    const [coinMarketCapData, setCoinMarketCapData] = useState<number[]>([]);
    const [totalSum, setTotalSum] = useState<number>(0);
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [activeTab, setActiveTab] = useState<Tab>('month');
    const [recentActivityLoading, setRecentActivityLoading] = useState(true);
    const [portfolioData, setPortfolioData] = useState<PortfolioTableDataType[]>([]);

    const { principalId } = useWallet();

    useEffect(() => {
        const fetchCoinbaseData = async () => {
            const assets = ['STX', 'MAPO', 'ICP'];
            try {
                const coinbaseRequests = assets.map(async (asset) => {
                    const response = await fetch(`https://api.coinbase.com/v2/prices/${asset}-USD/buy`);
                    const data = await response.json();
                    return parseFloat(data.data.amount);
                });
                const result = await Promise.all(coinbaseRequests);
                setCoinbaseData(result);
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        const fetchCoinMarketCapData = async () => {
            try {
                const response = await fetch('/coinmarketcap')
                const data = await response.json();

                const prices = [
                    data.data.CFX[0].quote.USD.price,
                    data.data.SOV[0].quote.USD.price,
                    data.data.RIF[0].quote.USD.price
                ];

                setCoinMarketCapData(prices);
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        fetchCoinbaseData();
        fetchCoinMarketCapData();
    }, []);

    useEffect(() => {
        if (coinbaseData.length > 0 && coinMarketCapData.length > 0) {
            const sum = coinbaseData.reduce((acc, curr) => acc + curr, 0) + coinMarketCapData.reduce((acc, curr) => acc + curr, 0);
            const bit10DeFi = sum / 6;
            setTotalSum(bit10DeFi);
        } else {
            const sum = coinbaseData.reduce((acc, curr) => acc + curr, 0);
            const bit10DeFi = sum / 4;
            setTotalSum(bit10DeFi);
        }
        setLoading(false);
    }, [coinbaseData, coinMarketCapData]);

    useEffect(() => {
        const fetchUserPortfolio = async () => {
            if (principalId) {
                try {
                    const result = await userPortfolioDetails({ paymentAddress: principalId });
                    setUserPortfolio(result as UserPortfolioType[]);
                    if (result === 'Error fetching user portfolio details') {
                        toast.error('An error occurred while fetching user portfolio. Please try again!');
                        setLoading(false);
                    }
                } catch (error) {
                    toast.error('An error occurred while fetching user portfolio. Please try again!');
                    setLoading(false);
                }
            }
        }

        fetchUserPortfolio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (userPortfolio.length > 0) {
            const bit10TokenSums = userPortfolio.reduce((acc, item) => {
                if (item.bit10_token_name in acc) {
                    acc[item.bit10_token_name] += parseFloat(item.bit10_token_quantity);
                } else {
                    acc[item.bit10_token_name] = parseFloat(item.bit10_token_quantity);
                }
                return acc;
            }, {} as Record<string, number>);

            setBit10TokenSums(bit10TokenSums);

            const totalBit10 = Object.values(bit10TokenSums).reduce((acc, sum) => acc + sum, 0);
            setTotalPurchaseBit10Token(totalBit10);

            const tokenPurchaseUSDSums = userPortfolio.reduce((acc, item) => {
                if (item.token_purchase_name in acc) {
                    acc[item.token_purchase_name] += parseFloat(item.token_purchase_usd_amount);
                } else {
                    acc[item.token_purchase_name] = parseFloat(item.token_purchase_usd_amount);
                }
                return acc;
            }, {} as Record<string, number>);

            const totalUSD = Object.values(tokenPurchaseUSDSums).reduce((acc, sum) => acc + sum, 0);
            setTotalPurchaseUSD(totalUSD);

        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userPortfolio]);

    useEffect(() => {
        const fetchRecentActivityData = async () => {
            if (principalId) {
                const result = await userRecentActivity({ paymentAddress: principalId });
                setPortfolioData(result as PortfolioTableDataType[]);
                setRecentActivityLoading(false);
                if (result === 'Error fetching user recent activity') {
                    toast.error('An error occurred while fetching user recent activity. Please try again!');
                    setRecentActivityLoading(false);
                }
            }
        };

        fetchRecentActivityData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(60);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const formatPrincipalId = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 4)}...${id.slice(-3)}`;
    };

    const currentBalanceChartData = Object.keys(bit10TokenSums).length === 0
        ? [{ tokenName: 'No Data', tokenQuantity: 1, fill: '#ebebe0' }]
        : Object.entries(bit10TokenSums).map(([name, sum]) => {
            const foundToken = bit10FillArray.find(item => item.tokenName === name);
            return {
                tokenName: name,
                tokenQuantity: sum,
                fill: foundToken ? foundToken.fill : '#000000',
            };
        });

    const showChartTooltip = Object.keys(bit10TokenSums).length > 0;

    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab);
    };

    return (
        <div className='py-4'>
            {loading ? (
                <div className='flex flex-col space-y-4'>
                    <div className='flex flex-col lg:grid lg:grid-cols-4 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                        <Card className='dark:border-white w-full lg:col-span-1 animate-fade-left-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className='dark:border-white w-full lg:col-span-1 animate-fade-in-down-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className='dark:border-white w-full lg:col-span-2 animate-fade-right-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <Card className='dark:border-white w-full animate-fade-bottom-up-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className='flex flex-col space-y-4'>
                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between items-center'>
                        <h1 className='text-center md:text-start text-3xl font-bold animate-fade-left-slow'>Welcome back {formatPrincipalId(principalId)}</h1>
                        <Button className='animate-fade-right-slow' asChild>
                            <Link href='/swap'>Buy BIT10 Token</Link>
                        </Button>
                    </div>

                    <div className='flex flex-col lg:grid lg:grid-cols-2 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                        <Card className='dark:border-white w-full lg:col-span-1 animate-fade-left-slow'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>Your Current Balance</div>
                            </CardHeader>
                            <CardContent className='grid md:grid-cols-2 gap-4 items-center'>
                                <div className='flex-1 pb-0'>
                                    <ChartContainer
                                        config={chartConfig}
                                        className='aspect-square max-h-[300px]'
                                    >
                                        <PieChart>
                                            {showChartTooltip && (
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel />}
                                                />
                                            )}
                                            <Pie
                                                data={currentBalanceChartData}
                                                dataKey='tokenQuantity'
                                                nameKey='tokenName'
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
                                                                        className='fill-foreground text-3xl font-bold'
                                                                    >
                                                                        {totalPurchaseBit10Token} BIT10
                                                                    </tspan>
                                                                    <tspan
                                                                        x={viewBox.cx}
                                                                        y={(viewBox.cy || 0) + 24}
                                                                        className='fill-muted-foreground'
                                                                    >
                                                                        Total Balance
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
                                    <TooltipProvider>
                                        <ShadcnTooltip delayDuration={300}>
                                            <div className='flex flex-row items-center justify-start space-x-2'>
                                                <div className='flex flex-row items-end space-x-2'>
                                                    <TooltipTrigger asChild>
                                                        <p className='text-4xl font-semibold'>{totalPurchaseBit10Token} BIT10</p>
                                                    </TooltipTrigger>
                                                </div>
                                                <TooltipContent className={totalPurchaseBit10Token === 0 ? 'hidden' : 'block'}>
                                                    <p>BIT10 Token Current Value: $ {(totalPurchaseBit10Token * totalSum).toFixed(4)}</p>
                                                    <p>Initial Investment in BIT10 Tokens: ${totalPurchaseUSD.toFixed(4)}</p>
                                                </TooltipContent>
                                                <div>
                                                    {!isNaN(((totalPurchaseBit10Token * totalSum) - totalPurchaseUSD) / totalPurchaseUSD) &&
                                                        <Badge variant={(totalPurchaseBit10Token * totalSum) - totalPurchaseUSD >= 0 ? 'success' : 'destructive'} className='flex flex-row space-x-1'>
                                                            <div>
                                                                {((totalPurchaseBit10Token * totalSum) - totalPurchaseUSD) >= 0 ? '+' : '-'}
                                                            </div>
                                                            <div>
                                                                {Math.abs((((totalPurchaseBit10Token * totalSum) - totalPurchaseUSD) / totalPurchaseUSD) * 100).toFixed(2)}%
                                                            </div>
                                                        </Badge>
                                                    }
                                                </div>
                                            </div>
                                        </ShadcnTooltip>
                                    </TooltipProvider>
                                    <div>
                                        <p className='text-xl font-semibold'>~ $ {(totalPurchaseBit10Token * totalSum).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <h1 className='text-xl md:text-2xl font-semibold'>Portfolio Holdings</h1>
                                        <div className='flex flex-col space-y-1 py-1'>
                                            <div className='flex flex-row justify-between items-center px-2'>
                                                <div>Token Name</div>
                                                <div>No. of Tokens</div>
                                            </div>
                                            {Object.keys(bit10TokenSums).length === 0 ? (
                                                <div className='text-center'>You currently own no But10 tokens</div>
                                            ) : (
                                                Object.entries(bit10TokenSums).map(([name, sum]) => (
                                                    <div className='flex flex-row justify-between items-center hover:bg-accent p-2 rounded' key={name}>
                                                        <div>{name}</div>
                                                        <div>{sum}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='dark:border-white w-full lg:col-span-1 animate-fade-in-down-slow'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Allocations</div>
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
                                                data={bit10Allocation}
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
                                                                        BIT10.DEFI
                                                                    </tspan>
                                                                    <tspan
                                                                        x={viewBox.cx}
                                                                        y={(viewBox.cy || 0) + 24}
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
                                    <h1 className='text-2xl'>BIT10.DEFI Allocations</h1>
                                    <div className='flex flex-col'>
                                        {bit10Allocation.map(({ name, value, fill }) => (
                                            <div key={name} className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-2 rounded'>
                                                <div className='flex flex-row items-center space-x-1'>
                                                    <div className='w-3 h-3 rounded' style={{ backgroundColor: fill }}></div>
                                                    <div>{name}</div>
                                                </div>
                                                <div>{value} %</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='dark:border-white md:col-span-2 animate-fade-right-slow'>
                            <CardHeader className='flex flex-col md:flex-row items-center justify-between'>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Performance</div>
                                <div className='flex flex-row space-x-2 items-center justify-center'>
                                    <div className='relative flex flex-row justify-between bg-accent border px-2 py-1 rounded'>
                                        <div
                                            className={clsx(
                                                'absolute top-0 bottom-0 w-[30%] m-1 bg-primary rounded shadow-md transition-all duration-300 ease-in-out',
                                                activeTab === 'month' ? 'left-1' : activeTab === 'month3' ? 'left-[calc(33%-0.25rem)]' : 'left-[calc(66%-0.25rem)]'
                                            )}
                                        />
                                        <div onClick={() => handleTabClick('month')} className={`relative z-10 w-1/3 px-4 py-1 text-sm cursor-pointer text-center font-medium focus:outline-none ${activeTab === 'month' && 'text-white'}`}>1M</div>
                                        <div onClick={() => handleTabClick('month3')} className={`relative z-10 w-1/3 px-4 py-1 text-sm cursor-pointer text-center font-medium focus:outline-none ${activeTab === 'month3' && 'text-white'}`}>3M</div>
                                        <div onClick={() => handleTabClick('month6')} className={`relative z-10 w-1/3 px-4 py-1 text-sm cursor-pointer text-center font-medium focus:outline-none ${activeTab === 'month6' && 'text-white'}`}>6M</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='select-none -ml-12 md:-ml-8'>
                                {
                                    activeTab === 'month' &&
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
                                    activeTab === 'month3' &&
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
                                    activeTab === 'month6' &&
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
                    </div>

                    {recentActivityLoading ? (
                        <Card className='dark:border-white animate-fade-bottom-up-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className='dark:border-white animate-fade-bottom-up-slow'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent activity</div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={portfolioTableColumns}
                                    data={portfolioData}
                                    userSearchColumn='bit10_token_name'
                                    inputPlaceHolder='Search by BIT10 token name'
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
