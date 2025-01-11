"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

const bit10Tokens = ['BIT10.DEFI', 'BIT10.BRC20'];

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function BalanceAndAllocation() {
    const [selectedAllocationToken, setSelectedAllocationToken] = useState('BIT10.DEFI');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const { principalId } = useWallet();

    const formatPrincipalId = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 4)}...${id.slice(-3)}`;
    };

    const fetchBit10Balance = async (canisterId: string) => {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        if (principalId) {
            const account = {
                owner: Principal.fromText(principalId),
                subaccount: [],
            };
            if (actor && actor.icrc1_balance_of) {
                try {
                    const balance = await actor.icrc1_balance_of(account);
                    return balance;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while fetching user portfolio. Please try again!');
                }
            } else {
                toast.error('An error occurred while fetching user portfolio. Please try again!');
                return 0n;
            }
        }
    }

    const fetchBit10Tokens = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'bit10-defi-latest-price') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = data.data ?? 0;
        } else if (tokenPriceAPI === 'bit10-brc20-latest-price') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = data.data ?? 0;
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFITokenList'],
                queryFn: () => fetchBit10Tokens('bit10-defi-latest-price')
            },
            {
                queryKey: ['bit10BRC20TokenList'],
                queryFn: () => fetchBit10Tokens('bit10-brc20-latest-price')
            },
            {
                queryKey: ['bit10DEFIBalance'],
                queryFn: () => fetchBit10Balance('bin4j-cyaaa-aaaap-qh7tq-cai')
            },
            {
                queryKey: ['bit10BRC20Balance'],
                queryFn: () => fetchBit10Balance('7bi3r-piaaa-aaaap-qpnrq-cai')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10DEFITokens = bit10Queries[0].data as { id: number, name: string, symbol: string, price: number }[] | undefined;
    const bit10BRC20Tokens = bit10Queries[1].data as { id: number, name: string, symbol: string, price: number }[] | undefined;
    const bit10DEFITokenBalance = bit10Queries[2].data as bigint | undefined;
    const bit10BRC20TokenBalance = bit10Queries[3].data as bigint | undefined;

    const totalBit10Tokens = (bit10DEFITokenBalance ?? 0n) + (bit10BRC20TokenBalance ?? 0n);

    const selectedBit10Token = () => {
        if (selectedAllocationToken === 'BIT10.DEFI') {
            return bit10DEFITokens;
        } else if (selectedAllocationToken === 'BIT10.BRC20') {
            return bit10BRC20Tokens;
        } else {
            return null;
        }
    };

    const tokens = selectedBit10Token();

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

    const formatBit10DEFI = (amount: number) => {
        const num = Number(amount) / 100000000;
        const rounded = num.toFixed(5);
        return rounded.replace(/\.?0+$/, '');
    };

    const tokenData = [
        {
            token: 'BIT10.DEFI',
            balance: `${formatBit10DEFI(Number(bit10DEFITokenBalance))}`
        },
        {
            token: 'BIT10.BRC20',
            balance: `${formatBit10DEFI(Number(bit10BRC20TokenBalance))}`
        }
    ]

    const bit10BalanceChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokenData.map((token, index) => [
                token.token,
                {
                    label: token.token,
                    color: color[index % color.length],
                }
            ]) || []
        )
    };

    const bit10BalancePieChartData =
        Number(formatBit10DEFI(Number(totalBit10Tokens))) == 0
            ?
            [{ name: 'No Data', value: 1, fill: '#ebebe0' }]
            :
            tokenData.filter((token) => Number(token.balance) > 0).map((token, index) => ({
                name: token.token,
                value: Number(token.balance),
                fill: color[index % color.length],
            }));

    const bit10AllocationChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokens?.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol,
                    color: color[index % color.length],
                }
            ]) ?? []
        )
    };

    const bit10AllocationPieChartData = tokens?.map((token, index) => ({
        name: token.symbol,
        value: (100 / tokens.length) - 0.01, // 0.01% is kept in reserve
        fill: color[index % color.length],
    }));

    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between items-center'>
                <h1 className='text-center md:text-start text-3xl font-bold animate-fade-left-slow'>Welcome back {formatPrincipalId(principalId)}</h1>
                <Button className='animate-fade-right-slow' asChild>
                    <Link href='/swap'>Buy BIT10 Token</Link>
                </Button>
            </div>

            {isLoading ? (
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
                    <Card className='dark:border-white w-full lg:col-span-1 animate-fade-right-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className='flex flex-col lg:grid lg:grid-cols-2 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                    <Card className='dark:border-white w-full lg:col-span-1 animate-fade-left-slow'>
                        <CardHeader>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>Your Current Balance</div>
                        </CardHeader>
                        <CardContent className='grid md:grid-cols-2 gap-4 items-center'>
                            <div className='flex-1 pb-0'>
                                <ChartContainer
                                    config={bit10BalanceChartConfig}
                                    className='aspect-square max-h-[300px]'
                                >
                                    <PieChart>
                                        {Number(formatBit10DEFI(Number(totalBit10Tokens))) > 0 && (
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                        )}
                                        <Pie
                                            data={bit10BalancePieChartData}
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
                                                                    className='fill-foreground text-3xl font-bold'
                                                                >
                                                                    {formatBit10DEFI(Number(totalBit10Tokens))}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy ?? 0) + 24}
                                                                    className='fill-muted-foreground'
                                                                >
                                                                    BIT10 Balance
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
                                    <p className='text-3xl font-semibold'>{formatBit10DEFI(Number(totalBit10Tokens))} BIT10</p>
                                </div>
                                {/* {Number(formatBit10DEFI(bit10DEFI)) > 0 && (
                                    <div>
                                        <p className='text-xl font-semibold'>~ $ {(Number(formatBit10DEFI(bit10DEFI)) * totalSum).toFixed(9)}</p>
                                    </div>
                                )} */}
                                <div className='flex w-full flex-col space-y-3'>
                                    <h1 className='text-xl md:text-2xl font-semibold'>Portfolio Holdings</h1>
                                    <div className='flex flex-col space-y-1 py-1'>
                                        <div className='flex flex-row justify-between items-center px-2'>
                                            <div>Token Name</div>
                                            <div>No. of Tokens</div>
                                        </div>
                                        {Number(formatBit10DEFI(Number(totalBit10Tokens))) == 0 ? (
                                            <div className='text-center'>You currently own no BIT10 tokens</div>
                                        ) : (
                                            <>
                                                {tokenData.map((token, index) => (
                                                    <div key={index} className='flex flex-row justify-between items-center hover:bg-accent py-1 px-2 rounded'>
                                                        <div className='flex flex-row items-center space-x-1'>
                                                            <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                                            <div>{token.token}</div>
                                                        </div>
                                                        <div>{token.balance}</div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='dark:border-white w-full lg:col-span-1 animate-fade-right-slow'>
                        <CardHeader className='flex flex-col md:flex-row items-center md:justify-between'>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Allocations</div>
                            <Select onValueChange={setSelectedAllocationToken} defaultValue={selectedAllocationToken}>
                                <SelectTrigger className='w-[180px] dark:border-white'>
                                    <SelectValue placeholder='Select Token' />
                                </SelectTrigger>
                                <SelectContent>
                                    {bit10Tokens.map((token) => (
                                        <SelectItem key={token} value={token}>
                                            {token}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className='grid md:grid-cols-2 gap-4 items-center'>
                            <div className='flex-1'>
                                <ChartContainer
                                    config={bit10AllocationChartConfig}
                                    className='aspect-square max-h-[300px]'
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel />}
                                        />
                                        <Pie
                                            data={bit10AllocationPieChartData}
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
                                                                    {selectedAllocationToken}
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
                            <div className='flex w-full flex-col space-y-3'>
                                <h1 className='text-2xl'>{selectedAllocationToken} Allocations</h1>
                                <div className='flex flex-col'>
                                    {tokens?.map((token, index) => (
                                        <div key={index} className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'>
                                            <div className='flex flex-row items-center space-x-1'>
                                                <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                                <div>{token.symbol}</div>
                                            </div>
                                            <div>{((100 / tokens.length) - 0.01).toFixed(3)} %</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
