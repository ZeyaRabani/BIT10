"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10_btc.did'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

const chartConfig: ChartConfig = {
    'bit10DeFi': {
        label: 'BIT10.DEFI',
    },
}

export default function CurrentBalance() {
    const [loading, setLoading] = useState(true);
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [bit10DEFI, setBit10DEFI] = useState<bigint>(BigInt(0));
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
                    setLoading(false);
                }
            } else {
                setLoading(false);
                toast.error('An error occurred while fetching user portfolio. Please try again!');
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [principalId]);

    useEffect(() => {
        const fetchApiData = async () => {
            try {
                const response = await fetch('/api/bit10-defi-server');
                const data = await response.json() as { bit10_defi: { tokenPrice: number }[] };
                if (data.bit10_defi && data.bit10_defi.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    setTotalSum(data.bit10_defi[0].tokenPrice ?? 0);
                }
            } catch (error) {
                console.error('Error fetching data from API:', error);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchApiData();
    }, []);

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
        <div>
            { loading ? (
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
                                                                    y={(viewBox.cy ?? 0) + 24}
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
                )}
        </div>
    )
}
