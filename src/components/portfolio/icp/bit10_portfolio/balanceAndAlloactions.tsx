import React, { useState, useEffect } from 'react'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { formatAmount } from '@/lib/utils'

const bit10Tokens = ['Test BIT10.TOP', 'Test BIT10.MEME'];

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function BalanceAndAlloactions() {
    const [selectedAllocationToken, setSelectedAllocationToken] = useState('Test BIT10.TOP');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const { icpAddress } = useICPWallet();

    const fetchBIT10Balance = async (canisterId: string) => {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        if (icpAddress) {
            const account = {
                owner: Principal.fromText(icpAddress),
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
        if (tokenPriceAPI === 'bit10-latest-price-top') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = data.data ?? 0;
        } else if (tokenPriceAPI === 'test-bit10-latest-price-meme') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, tokenAddress: string, chain: string; symbol: string, price: number }> }
            returnData = data.data ?? 0;
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenList'],
                queryFn: () => fetchBit10Tokens('bit10-latest-price-top')
            },
            {
                queryKey: ['bit10MEMETokenList'],
                queryFn: () => fetchBit10Tokens('test-bit10-latest-price-meme')
            },
            {
                queryKey: ['bit10TOPBalance'],
                queryFn: () => fetchBIT10Balance('wbckh-zqaaa-aaaap-qpuza-cai')
            },
            {
                queryKey: ['bit10MEMEBalance'],
                queryFn: () => fetchBIT10Balance('yeoei-eiaaa-aaaap-qpvzq-cai')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPTokens = bit10Queries[0].data as { id: number, name: string, symbol: string, marketCap: number, price: number }[] | undefined;
    const bit10MEMETokens = bit10Queries[1].data as { id: number, name: string, symbol: string, marketCap: number, tokenAddress: string, chain: string; price: number }[] | undefined;
    const bit10TOPTokenBalance = bit10Queries[2].data as bigint | undefined;
    const bit10MEMETokenBalance = bit10Queries[3].data as bigint | undefined;

    const toBigInt = (v: unknown) => {
        if (typeof v === 'bigint') return v;
        if (typeof v === 'number') return BigInt(Math.trunc(v));
        if (typeof v === 'string') return BigInt((v.split?.('.')?.[0]) ?? '0');
        return 0n;
    };

    const totalRaw = toBigInt(bit10TOPTokenBalance) + toBigInt(bit10MEMETokenBalance);
    const totalBIT10Tokens = Number(totalRaw);

    const selectedBit10Token = () => {
        if (selectedAllocationToken === 'Test BIT10.TOP') {
            return bit10TOPTokens;
        } else if (selectedAllocationToken === 'Test BIT10.MEME') {
            return bit10MEMETokens;
        } else {
            return null;
        }
    };

    const rawTokens = selectedBit10Token();
    const tokens = (Array.isArray(rawTokens) ? rawTokens : []) as { symbol: string; marketCap: number }[];

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

    const formatBit10 = (amount: number) => {
        const num = Number(amount) / 100000000;
        const rounded = num.toFixed(5);
        return rounded.replace(/\.?0+$/, '');
    };

    const tokenData = [
        {
            token: 'Test BIT10.TOP',
            balance: `${formatBit10(Number(bit10TOPTokenBalance))}`
        },
        {
            token: 'Test BIT10.MEME',
            balance: `${formatBit10(Number(bit10MEMETokenBalance))}`
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
        Number(formatBit10(Number(totalBIT10Tokens))) == 0
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

    const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);

    const bit10AllocationPieChartData = tokens.map((token, index) => ({
        name: token.symbol,
        value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(4)),
        fill: color[index % color.length],
    }));

    return (
        <div>
            {isLoading ? (
                <div className='flex flex-col lg:grid lg:grid-cols-2 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                    <Card className='dark:border-white w-full lg:col-span-1 animate-fade-left-slow bg-transparent'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='dark:border-white w-full lg:col-span-1 animate-fade-right-slow bg-transparent'>
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
                    <Card className='dark:border-white w-full lg:col-span-1 animate-fade-left-slow bg-transparent'>
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
                                        {Number(formatBit10(Number(totalBIT10Tokens))) > 0 && (
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
                                                                    {formatBit10(Number(totalBIT10Tokens))}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy ?? 0) + 24}
                                                                    className='fill-muted-foreground'
                                                                >
                                                                    tBIT10 Balance
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
                                    <p className='text-3xl font-semibold'>{formatBit10(Number(totalBIT10Tokens))} Test BIT10</p>
                                </div>
                                <div className='flex w-full flex-col space-y-3'>
                                    <h1 className='text-xl md:text-2xl font-semibold'>Portfolio Holdings</h1>
                                    <div className='flex flex-col space-y-1 py-1'>
                                        <div className='flex flex-row justify-between items-center px-2'>
                                            <div>Token Name</div>
                                            <div>No. of Tokens</div>
                                        </div>
                                        {Number(formatBit10(Number(totalBIT10Tokens))) == 0 ? (
                                            <div className='text-center'>You currently own no Test BIT10 tokens</div>
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
                    <Card className='dark:border-white w-full lg:col-span-1 animate-fade-right-slow bg-transparent'>
                        <CardHeader className='flex flex-col md:flex-row items-center md:justify-between'>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>Test BIT10 Allocations</div>
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
                                    {tokens?.sort((a, b) => b.marketCap - a.marketCap).map((token, index) => (
                                        <div
                                            key={index}
                                            className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'
                                        >
                                            <div className='flex flex-row items-center space-x-1'>
                                                <div
                                                    className='w-3 h-3 rounded'
                                                    style={{ backgroundColor: color[index % color.length] }}
                                                ></div>
                                                <div>{token.symbol}</div>
                                            </div>
                                            <div>{formatAmount((token.marketCap / totalMarketCap) * 100)} %</div>
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
