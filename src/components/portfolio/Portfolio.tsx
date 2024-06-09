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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

interface PerformanceDataType {
    month: string;
    bit10: number;
    icp: number;
    stx: number;
    cfx: number;
    mapo: number;
    rif: number;
    sov: number;
}

const performanceData: PerformanceDataType[] = [
    {
        month: 'Jan',
        bit10: 2.6336,
        icp: 13.31,
        stx: 1.5031,
        cfx: 0.1946,
        mapo: 0.03223,
        rif: 0.1324,
        sov: 0.6291
    },
    {
        month: 'Feb',
        bit10: 2.4960,
        icp: 11.47,
        stx: 1.5023,
        cfx: 0.2176,
        mapo: 0.02824,
        rif: 0.1285,
        sov: 1.6293
    },
    {
        month: 'Mar',
        bit10: 2.9788,
        icp: 12.6,
        stx: 2.8964,
        cfx: 0.2574,
        mapo: 0.03493,
        rif: 0.2104,
        sov: 1.8727
    },
    {
        month: 'Apr',
        bit10: 4.2093,
        icp: 18.78,
        stx: 3.6695,
        cfx: 0.4698,
        mapo: 0.03509,
        rif: 0.2872,
        sov: 2.0141
    },
    {
        month: 'May',
        bit10: 2.8778,
        icp: 12.86,
        stx: 2.1584,
        cfx: 0.2165,
        mapo: 0.01875,
        rif: 0.1763,
        sov: 1.827
    },
    {
        month: 'June',
        bit10: 2.5609,
        icp: 11.85,
        stx: 1.8295,
        cfx: 0.2144,
        mapo: 0.01323,
        rif: 0.1624,
        sov: 1.2961
    },
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
    const [recentActivityLoading, setRecentActivityLoading] = useState(true);
    const [portfolioData, setPortfolioData] = useState<PortfolioTableDataType[]>([]);

    const { paymentAddress } = useWallet();

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
                toast.error('Error fetching Bit10 price. Please try again!');
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
                toast.error('Error fetching Bit10 price. Please try again!');
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
            if (paymentAddress) {
                try {
                    const result = await userPortfolioDetails({ paymentAddress: paymentAddress });
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

        const fetchSignUpData = async () => {
            if (paymentAddress) {
                const result = await userRecentActivity({ paymentAddress: paymentAddress });
                setPortfolioData(result as PortfolioTableDataType[]);
                setRecentActivityLoading(false);
                if (result === 'Error fetching user recent activity') {
                    toast.error('An error occurred while fetching user recent activity. Please try again!');
                    setRecentActivityLoading(false);
                }
            }
        };

        fetchSignUpData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const CustomTooltip = ({ active, payload, label, payloadTitle }: { active: boolean, payload: any[], label?: string, payloadTitle: string[] }) => {
        if (active && payload && payload.length) {
            const colorClasses = ['text-[#ff0066]', 'text-[#ff8c1a]', 'text-[#1a1aff]', 'text-[#ff1aff]', 'text-[#3385ff]', 'text-[#ffa366]'];
            return (
                <div className='bg-white px-2 rounded'>
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

    return (
        <MaxWidthWrapper className='py-4'>
            {loading ? (
                <div className='flex flex-col space-y-4'>
                    <div className='flex flex-col lg:flex lg:flex-row space-y-2 lg:space-y-0 space-x-0 lg:space-x-4'>
                        <Card className='border-white w-full'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className='border-white w-full'>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
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
                        <h1 className='text-3xl font-bold'>Welcome back</h1>
                        <Button className='text-white' asChild>
                            <Link href='/'>Buy & Sell</Link>
                        </Button>
                    </div>
                    <div className='flex flex-col lg:flex lg:flex-row space-y-2 lg:space-y-0 space-x-0 lg:space-x-4'>
                        <Card className='border-white w-full'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>Your Current Balance</div>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-3'>
                                <TooltipProvider>
                                    <ShadcnTooltip delayDuration={300}>
                                        <div className='flex flex-row items-center justify-start space-x-2'>
                                            <TooltipTrigger asChild>
                                                <div className='flex flex-row items-end space-x-2'>
                                                    <p className='text-4xl font-semibold'>{totalPurchaseBit10Token} Bit10</p>
                                                    <p className='text-xl font-semibold'>~ $ {(totalPurchaseBit10Token * totalSum).toFixed(2)}</p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className={totalPurchaseBit10Token === 0 ? 'hidden' : 'block'}>
                                                <p>Bit10 Token Current Value: $ {(totalPurchaseBit10Token * totalSum).toFixed(4)}</p>
                                                <p>Initial Investment in Bit10 Tokens: ${totalPurchaseUSD.toFixed(4)}</p>
                                            </TooltipContent>
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
                                    </ShadcnTooltip>
                                </TooltipProvider>
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
                        
                        <Card className='border-white w-full'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>Bit10 performance</div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width='100%' height={210}>
                                    <LineChart
                                        width={500}
                                        height={300}
                                        data={performanceData}
                                        margin={{ top: 5, right: 15, left: 8, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray='3 3' />
                                        <XAxis dataKey='month' padding={{ left: 20, right: 20 }} />
                                        <YAxis />
                                        <Legend />
                                        <Tooltip content={<CustomTooltip active={false} payload={[]} payloadTitle={['Bit10.DeFi', 'ICP', 'STX', 'CFX', 'MAPO', 'RIF', 'SOV']} />} />
                                        <Line type='monotone' dataKey='bit10' name='Bit10.DeFi' stroke='#D5520E' activeDot={{ r: 8 }} />
                                        <Line type='monotone' dataKey='icp' name='ICP' stroke='#ff0066' />
                                        <Line type='monotone' dataKey='stx' name='STX' stroke='#ff8c1a' />
                                        <Line type='monotone' dataKey='cfx' name='CFX' stroke='#1a1aff' />
                                        <Line type='monotone' dataKey='mapo' name='MAPO' stroke='#ff1aff' />
                                        <Line type='monotone' dataKey='rif' name='RIF' stroke='#3385ff' />
                                        <Line type='monotone' dataKey='sov' name='SOV' stroke='#ffa366' />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {recentActivityLoading ? (
                        <Card>
                            <CardContent>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className='relative border-white'>
                            <CardHeader>
                                <div className='text-2xl md:text-4xl text-center md:text-start'>Your recent activity</div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={portfolioTableColumns}
                                    data={portfolioData}
                                    userSearchColumn='bit10_token_name'
                                    inputPlaceHolder='Search by Bit10 token name'
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </MaxWidthWrapper>
    )
}
