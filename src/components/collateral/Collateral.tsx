"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10_btc.did'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { bit10Allocation } from '@/data/bit10TokenAllocation'
import { ExternalLink } from 'lucide-react'

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

export default function Collateral() {
    // const [loading, setLoading] = useState(true);
    const [bit10DEFI, setBit10DEFI] = useState<bigint>(BigInt(0));
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [coinbaseData, setCoinbaseData] = useState<number[]>([]);
    const [coinMarketCapData, setCoinMarketCapData] = useState<number[]>([]);
    const [totalSum, setTotalSum] = useState<number>(0);

    const { principalId } = useWallet();

    // BIT10.DEFI Canister
    const canisterId = 'bin4j-cyaaa-aaaap-qh7tq-cai';
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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const balance = await actor.icrc1_balance_of(account);
                    setBit10DEFI(balance as bigint);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while fetching user portfolio. Please try again!');
                } finally {
                    // setLoading(false);
                }
            } else {
                // setLoading(false);
                toast.error('An error occurred while fetching user portfolio. Please try again!');
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const data = await response.json();
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
                    return parseFloat(data.data.amount);
                });
                const result = await Promise.all(coinbaseRequests);
                setCoinbaseData(result);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        const fetchCoinMarketCapData = async () => {
            try {
                const response = await fetch('/coinmarketcap')
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const data = await response.json();

                const prices = [
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    data.data.CFX[0].quote.USD.price, data.data.SOV[0].quote.USD.price, data.data.RIF[0].quote.USD.price
                ];

                setCoinMarketCapData(prices);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchCoinbaseData();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
        // setLoading(false);
    }, [coinbaseData, coinMarketCapData]);

    useEffect(() => {
        const fetchCoinbaseData = async () => {
            const assets = ['STX', 'MAPO', 'ICP'];
            try {
                const coinbaseRequests = assets.map(async (asset) => {
                    const response = await fetch(`https://api.coinbase.com/v2/prices/${asset}-USD/buy`);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const data = await response.json();
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    return parseFloat(data.data.amount);
                });
                const result = await Promise.all(coinbaseRequests);
                setCoinbaseData(result);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        const fetchCoinMarketCapData = async () => {
            try {
                const response = await fetch('/coinmarketcap')
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const data = await response.json();

                const prices = [
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    data.data.CFX[0].quote.USD.price, data.data.SOV[0].quote.USD.price, data.data.RIF[0].quote.USD.price
                ];

                setCoinMarketCapData(prices);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchCoinbaseData();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
        // setLoading(false);
    }, [coinbaseData, coinMarketCapData]);

    const formatBit10DEFI = (amount: bigint) => {
        const num = Number(amount) / 100000000;
        const rounded = num.toFixed(5);
        return rounded.replace(/\.?0+$/, '');
    };

    return (
        <div className='py-4'>
            <Card className='dark:border-white w-full lg:col-span-1 animate-fade-in-down-slow'>
                <CardHeader>
                    <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Collateral</div>
                </CardHeader>
                <CardContent>
                    <div className='text-2xl'>BIT10.DEFI</div>
                    <div className='grid md:grid-cols-3 gap-4 items-center'>
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
                        <div className='flex w-full flex-col space-y-3 col-span-2'>
                            <h1 className='text-2xl'>BIT10.DEFI</h1>
                            <table className='w-full table-auto'>
                                <thead>
                                    <tr className='hover:bg-accent p-1 rounded'>
                                        <th className='text-left'>Collateral Token</th>
                                        <th className='text-left'>Total Collateral</th>
                                        <th className='text-left'>Your Collateral</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bit10Allocation.map(({ name, address, totalCollateral, fill }) => (
                                        <tr key={name} className='hover:bg-accent p-1 rounded'>
                                            <td className='flex items-center space-x-1'>
                                                <div className='w-3 h-3 rounded' style={{ backgroundColor: fill }}></div>
                                                <span>{name}</span>
                                                <span>({address})</span>
                                                <a href='https://dashboard.internetcomputer.org/account/60a182a30efd8324fea20cdc0e97527c07894d68967423b7d1caaf547cc70480' target='_blank'>
                                                    <ExternalLink size={16} className='text-primary' />
                                                </a>
                                            </td>
                                            <td>{totalCollateral} USD</td>
                                            <td>{((Number(formatBit10DEFI(bit10DEFI)) * totalSum) / 6).toFixed(9)} USD</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
