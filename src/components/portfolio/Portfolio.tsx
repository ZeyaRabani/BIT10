"use client"

import React, { useState, useEffect } from 'react'
import { userPortfolioDetails, userRecentActivity } from '@/actions/dbActions'
import { useWallet } from '@/context/WalletContext'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import clsx from 'clsx'
import { LineChart, PieChart, Pie, Tooltip, Cell, Label, TooltipProps, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, ReferenceArea } from 'recharts'
import { performanceDataMonthly, performanceDataWeekly } from './performanceData'
import { RotateCcw } from 'lucide-react'
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

type Tab = 'monthly' | 'weekly';

const data02 = [
    { name: 'ICP', value: 16.66 },
    { name: 'STX', value: 16.66 },
    { name: 'CFX', value: 16.66 },
    { name: 'MAPO', value: 16.66 },
    { name: 'RIF', value: 16.66 },
    { name: 'SOV', value: 16.66 },
];

const colors = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366'];

export default function Portfolio() {
    const [loading, setLoading] = useState(true);
    const [userPortfolio, setUserPortfolio] = useState<UserPortfolioType[]>([]);
    const [bit10TokenSums, setBit10TokenSums] = useState<Record<string, number>>({});
    const [totalPurchaseUSD, setTotalPurchaseUSD] = useState<number>(0);
    const [totalPurchaseBit10Token, setTotalPurchaseBit10Token] = useState<number>(0);
    const [coinbaseData, setCoinbaseData] = useState<number[]>([]);
    const [coinMarketCapData, setCoinMarketCapData] = useState<number[]>([]);
    const [totalSum, setTotalSum] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<Tab>('monthly');
    const [selection, setSelection] = useState<{ startX: string | null, endX: string | null }>({ startX: null, endX: null });
    const [data, setData] = useState(performanceDataWeekly);
    const [rotate, setRotate] = useState(false);
    const [recentActivityLoading, setRecentActivityLoading] = useState(true);
    const [portfolioData, setPortfolioData] = useState<PortfolioTableDataType[]>([]);

    const { principalId } = useWallet();

    useEffect(() => {
        const fetchCoinbaseData = async () => {
            const assets = ['STX', 'MAPO', 'ICP', 'RIF'];
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
                    data.data.SOV[0].quote.USD.price
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

    const formatPrincipalId = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 4)}...${id.slice(-3)}`;
    };

    const CustomPieChartTooltip: React.FC<TooltipProps<any, any>> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const colorClasses = ['text-[#ff0066]', 'text-[#ff8c1a]', 'text-[#1a1aff]', 'text-[#ff1aff]', 'text-[#3385ff]', 'text-[#ffa366]'];
            return (
                <div className='bg-white p-2 rounded'>
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className={`text-sm tracking-wide ${colorClasses[index]}`}>
                            {entry.name}: {entry.value.toFixed(2)}%
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    }

    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab);
    };

    const CustomTooltip = ({ active, payload, label, payloadTitle }: { active: boolean, payload: any[], label?: string, payloadTitle: string[] }) => {
        if (active && payload && payload.length) {
            const colorClasses = ['text-[#ff0066]', 'text-[#ff8c1a]', 'text-[#1a1aff]', 'text-[#ff1aff]', 'text-[#3385ff]', 'text-[#ffa366]'];
            return (
                <div className='bg-white px-2 pt-1 rounded'>
                    <div className='text-gray-800'>{`${label}`}</div>
                    <div className='text-sm tracking-wide text-primary'>{`${payloadTitle[0]}`}: $ {`${payload[0].value}`}</div>
                    <div className='grid grid-cols-2 gap-y-1 gap-x-1 py-1'>
                        {payloadTitle.slice(1, 7).map((title, index) => (
                            <div key={index} className={`text-sm tracking-wide ${colorClasses[index]}`}>
                                {`${title}`}: $ {`${payload[index + 1].value}`}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };

    const handleMouseDown = (e: any) => {
        if (e && e.activeLabel) {
            setSelection({ startX: e.activeLabel as string, endX: e.activeLabel as string });
        }
    };

    const handleMouseMove = (e: any) => {
        if (selection.startX !== null && e && e.activeLabel) {
            setSelection(prev => ({ ...prev, endX: e.activeLabel as string }));
        }
    };

    const handleMouseUp = () => {
        if (selection.startX !== null && selection.endX !== null) {
            const startIndex = performanceDataWeekly.findIndex(data => data.week === selection.startX);
            const endIndex = performanceDataWeekly.findIndex(data => data.week === selection.endX);
            const zoomedData = performanceDataWeekly.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
            setData(zoomedData);
        }
        setSelection({ startX: null, endX: null });
    };

    const handleZoomOut = () => {
        setData(performanceDataWeekly);
        setRotate(true);
        setTimeout(() => setRotate(false), 1000);
    };

    return (
        <MaxWidthWrapper className='pb-4 md:pt-4'>
            {loading ? (
                <div className='flex flex-col space-y-4'>
                    <div className='flex flex-col lg:grid lg:grid-cols-4 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                        <Card className='border-white w-full lg:col-span-1 animate-fade-left-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className='border-white w-full lg:col-span-1 animate-fade-in-down-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className='border-white w-full lg:col-span-2 animate-fade-right-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <Card className='border-white w-full animate-fade-bottom-up-slow'>
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
                        <Button className='text-white animate-fade-right-slow' asChild>
                            <Link href='/'>Buy BIT10 Token</Link>
                        </Button>
                    </div>

                    <div className='flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-4 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                        <Card className='border-white w-full lg:col-span-1 animate-fade-left-slow'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>Your Current Balance</div>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-3'>
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
                            </CardContent>
                        </Card>

                        <Card className='border-white w-full lg:col-span-1 animate-fade-in-down-slow'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10.DEFI Allocations</div>
                            </CardHeader>
                            <CardContent className='w-full h-64 select-none'>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <PieChart width={400} height={400}>
                                        <Pie
                                            dataKey='value'
                                            isAnimationActive={false}
                                            data={data02}
                                            cx='50%'
                                            cy='50%'
                                            innerRadius={90}
                                            outerRadius={115}
                                            fill='#8884d8'>
                                            {data02.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                            ))}
                                            <Label value='Allocation' position='center' className='text-white' />
                                        </Pie>
                                        <Tooltip content={<CustomPieChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className='border-white lg:col-span-2 animate-fade-right-slow'>
                            <CardHeader className='flex flex-col md:flex-row items-center justify-between'>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Performance</div>
                                <div className='flex flex-row space-x-2 items-center justify-center'>
                                    {activeTab === 'weekly' &&
                                        <TooltipProvider>
                                            <ShadcnTooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <RotateCcw className={`w-5 h-5 cursor-pointer transition-transform ${rotate ? 'animate-rotate360' : ''}`} onClick={handleZoomOut} />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Reset Zoom
                                                </TooltipContent>
                                            </ShadcnTooltip>
                                        </TooltipProvider>
                                    }
                                    <div className='relative flex flex-row justify-end bg-accent border px-2 py-1 rounded'>
                                        <div
                                            className={clsx(
                                                'absolute top-0 bottom-0 w-[45%] m-1 bg-primary rounded shadow-md transition-all duration-300 ease-in-out',
                                                activeTab === 'monthly' ? 'left-1' : 'left-[calc(50%-0.25rem)]'
                                            )}
                                        />
                                        <div onClick={() => handleTabClick('monthly')} className={`relative z-10 w-1/2 px-4 py-1 text-sm cursor-pointer text-center font-medium focus:outline-none ${activeTab === 'monthly' ? 'text-white' : 'text-gray-200'}`}>Monthly</div>
                                        <div onClick={() => handleTabClick('weekly')} className={`relative z-10 w-1/2 px-4 py-1 text-sm cursor-pointer text-center font-medium focus:outline-none ${activeTab === 'weekly' ? 'text-white' : 'text-gray-200'}`}>Weekly</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='w-full h-64 select-none'>
                                {activeTab === 'monthly' &&
                                    <ResponsiveContainer width='100%' height='100%'>
                                        <LineChart
                                            width={500}
                                            height={300}
                                            data={performanceDataMonthly}
                                            margin={{ top: 5, bottom: 5, right: 10 }} >
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis dataKey='month' padding={{ left: 5 }} />
                                            <YAxis />
                                            <Legend />
                                            <Tooltip content={<CustomTooltip active={false} payload={[]} payloadTitle={['BIT10.DEFI', 'ICP', 'STX', 'CFX', 'MAPO', 'RIF', 'SOV']} />} />
                                            <Line type='monotone' dataKey='bit10' name='BIT10.DEFI' stroke='#D5520E' activeDot={{ r: 8 }} />
                                            <Line type='monotone' dataKey='icp' name='ICP' stroke='#ff0066' />
                                            <Line type='monotone' dataKey='stx' name='STX' stroke='#ff8c1a' />
                                            <Line type='monotone' dataKey='cfx' name='CFX' stroke='#1a1aff' />
                                            <Line type='monotone' dataKey='mapo' name='MAPO' stroke='#ff1aff' />
                                            <Line type='monotone' dataKey='rif' name='RIF' stroke='#3385ff' />
                                            <Line type='monotone' dataKey='sov' name='SOV' stroke='#ffa366' />
                                        </LineChart>
                                    </ResponsiveContainer>
                                }
                                {activeTab === 'weekly' &&
                                    <ResponsiveContainer width='100%' height='100%'>
                                        <LineChart
                                            width={500}
                                            height={300}
                                            data={data}
                                            margin={{ top: 5, bottom: 5, right: 10 }}
                                            onMouseDown={handleMouseDown}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp} >
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis dataKey='week' padding={{ left: 5 }} />
                                            <YAxis />
                                            <Legend />
                                            <Tooltip content={<CustomTooltip active={false} payload={[]} payloadTitle={['BIT10.DEFI', 'ICP', 'STX', 'CFX', 'MAPO', 'RIF', 'SOV']} />} />
                                            <Line type='monotone' dataKey='bit10' name='BIT10.DEFI' stroke='#D5520E' activeDot={{ r: 8 }} />
                                            <Line type='monotone' dataKey='icp' name='ICP' stroke='#ff0066' animationDuration={500} />
                                            <Line type='monotone' dataKey='stx' name='STX' stroke='#ff8c1a' animationDuration={500} />
                                            <Line type='monotone' dataKey='cfx' name='CFX' stroke='#1a1aff' animationDuration={500} />
                                            <Line type='monotone' dataKey='mapo' name='MAPO' stroke='#ff1aff' animationDuration={500} />
                                            <Line type='monotone' dataKey='rif' name='RIF' stroke='#3385ff' animationDuration={500} />
                                            <Line type='monotone' dataKey='sov' name='SOV' stroke='#ffa366' animationDuration={500} />
                                            {selection.startX !== null && selection.endX !== null && (
                                                <ReferenceArea x1={selection.startX} x2={selection.endX} strokeOpacity={0.3} />
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                }
                            </CardContent>
                        </Card>
                    </div>

                    {recentActivityLoading ? (
                        <Card className='border-white animate-fade-bottom-up-slow'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className='border-white animate-fade-bottom-up-slow'>
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
        </MaxWidthWrapper>
    )
}
