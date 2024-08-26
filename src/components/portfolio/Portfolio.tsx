"use client"

import React, { useState, useEffect } from 'react'
import { userRecentActivity } from '@/actions/dbActions'
import { useWallet } from '@/context/WalletContext'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10_btc.did'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Label, Pie, PieChart } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { bit10Allocation } from '@/data/bit10TokenAllocation'
import Performance from './performance'
import { PortfolioTableDataType, portfolioTableColumns } from './columns'
import { DataTable } from '@/components/ui/data-table-portfolio'

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

export default function Portfolio() {
    const [loading, setLoading] = useState(true);
    const [bit10DEFI, setBit10DEFI] = useState<bigint>(BigInt(0));
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [coinbaseData, setCoinbaseData] = useState<number[]>([]);
    const [coinMarketCapData, setCoinMarketCapData] = useState<number[]>([]);
    const [totalSum, setTotalSum] = useState<number>(0);
    const [recentActivityLoading, setRecentActivityLoading] = useState(true);
    const [portfolioData, setPortfolioData] = useState<PortfolioTableDataType[]>([]);

    const { principalId } = useWallet();

    // BIT10.DEFI Canister
    const canisterId = 'hbs3g-xyaaa-aaaap-qhmna-cai';
    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';

    const agent = new HttpAgent({ host });
    const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
    });

    useEffect(() => {
        const fetchBalance = async () => {
            if (principalId) {
                const account = {
                    owner: Principal.fromText(principalId),
                    subaccount: [],
                };
                try {
                    const balance = await actor.icrc1_balance_of(account);
                    setBit10DEFI(balance as bigint);
                } catch (error) {
                    toast.error('An error occurred while fetching user portfolio. Please try again!');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                toast.error('An error occurred while fetching user portfolio. Please try again!');
            }
        };

        fetchBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [principalId]);

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

    const formatPrincipalId = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 4)}...${id.slice(-3)}`;
    };

    const formatBit10DEFI = (amount: bigint) => {
        const num = Number(amount) / 100000000;
        const rounded = num.toFixed(5);
        return rounded.replace(/\.?0+$/, '');
    };

    const currentBalanceChartData = Number(formatBit10DEFI(bit10DEFI)) === 0
        ? [{ tokenName: 'No Data', tokenQuantity: 1, fill: '#ebebe0' }]
        : [{ tokenName: 'BIT10.DEFI', tokenQuantity: Number(formatBit10DEFI(bit10DEFI)), fill: '#D5520E' }]

    const showChartTooltip = Number(formatBit10DEFI(bit10DEFI)) > 0;

    return (
        <div className='py-4'>
            {loading ? (
                <div className='flex flex-col space-y-4'>
                    <div className='flex flex-col lg:grid lg:grid-cols-2 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
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
                    </div>
                    <Card className='dark:border-white w-full animate-fade-right-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
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
                                                                        {formatBit10DEFI(bit10DEFI)}
                                                                    </tspan>
                                                                    <tspan
                                                                        x={viewBox.cx}
                                                                        y={(viewBox.cy || 0) + 24}
                                                                        className='fill-muted-foreground'
                                                                    >
                                                                        BIT10.DEFI Balance
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
                                    <div className='flex flex-row items-center justify-start space-x-2'>
                                        <p className='text-3xl font-semibold'>{formatBit10DEFI(bit10DEFI)} BIT10.DEFI</p>
                                    </div>
                                    {Number(formatBit10DEFI(bit10DEFI)) > 0 && (
                                        <div>
                                            <p className='text-xl font-semibold'>~ $ {(Number(formatBit10DEFI(bit10DEFI)) * totalSum).toFixed(9)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h1 className='text-xl md:text-2xl font-semibold'>Portfolio Holdings</h1>
                                        <div className='flex flex-col space-y-1 py-1'>
                                            <div className='flex flex-row justify-between items-center px-2'>
                                                <div>Token Name</div>
                                                <div>No. of Tokens</div>
                                            </div>
                                            {Number(formatBit10DEFI(bit10DEFI)) <= 0 ? (
                                                <div className='text-center'>You currently own no BIT10 tokens</div>
                                            ) : (
                                                <div className='flex flex-row justify-between items-center hover:bg-accent p-2 rounded'>
                                                    <div>BIT10.DEFI</div>
                                                    <div>{formatBit10DEFI(bit10DEFI)}</div>
                                                </div>
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
                                            <div key={name} className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'>
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

                        <Performance />
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
