/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/oracle.did'
import { bit10Allocation } from '@/data/bit10TokenAllocation'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TokenData {
    id: string;
    symbol: string;
    quote: {
        USD: {
            price: number;
        };
    };
}

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

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function Collateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [filteredData, setFilteredData] = useState<TokenData[]>([]);
    const [totalCollateralSum, setTotalCollateralSum] = useState(0);
    const [bit10defiPrice, setBIT10defiPrice] = useState(0);
    const [bit10DEFITokenSupply, setBit10DEFITokenSupply] = useState<string>('0');
    const [bit10BRC20TokenData, setBIT10BRC20TokenData] = useState([]);
    const [bit10brc20Price, setBIT10brc20Price] = useState(0);

    const canisterId = 'fg5vt-paaaa-aaaap-qhhra-cai';
    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';

    const totalUSDCollateralBITDEFI = 78;

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

    const agent = new HttpAgent({ host });
    const actor = Actor.createActor(idlFactory, { agent, canisterId });

    useEffect(() => {
        const fetchTotalSupply = async () => {
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const totalSupply = await actor.bit10_defi_total_supply_of_token_available();
                if (totalSupply && typeof totalSupply === 'bigint') {
                    const scaledTotalSupply = BigInt(totalSupply) / BigInt(100000000);
                    setBit10DEFITokenSupply(scaledTotalSupply.toLocaleString());
                } else {
                    console.error("Invalid type for totalSupply:", typeof totalSupply);
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                console.error("Error fetching total supply:", error);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchTotalSupply();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchApiData = async () => {
            try {
                const response = await fetch('/api/bit10-brc20-server');
                if (!response.ok) {
                    throw new Error(`Failed to fetch from bit10-brc20-server: ${response.statusText}`);
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const data = await response.json();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (data.bit10_brc20 && data.bit10_brc20.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    setBIT10brc20Price(data.bit10_brc20[0].tokenPrice)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    setBIT10BRC20TokenData(data.bit10_brc20[0].data);
                } else {
                    console.warn('No data found for bit10_brc20');
                }
            } catch (error) {
                console.error('Error fetching data from API:', error);
            }
        };

        fetchApiData().catch((err) =>
            console.error('Unexpected error in fetchApiData:', err)
        );
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, isLoading } = useQuery({
        queryKey: ['defi-price'],
        queryFn: async () => {
            const response = await fetch('/api/bit10-defi-price');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result = await response.json();

            const matchingEntries: Record<string, TokenData> = {};
            let sum = 0;
            let priceSum = 0;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            Object.entries(result.data).forEach(([key, tokenArray]): void => {
                const allocation = bit10Allocation.find(item => item.name === key);
                if (allocation) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                    const matchingEntry = (tokenArray as TokenData[]).find((entry: TokenData) => Number(entry.id) === Number(allocation.id));
                    if (matchingEntry) {
                        matchingEntries[key] = matchingEntry;
                        sum += matchingEntry.quote.USD.price * (allocation.totalCollateralToken ? allocation.totalCollateralToken : 0);
                        priceSum += matchingEntry.quote.USD.price;
                    }
                }
            });

            const tokenCount = Object.keys(matchingEntries).length;
            setBIT10defiPrice(tokenCount > 0 ? priceSum / tokenCount : 0);
            setTotalCollateralSum(sum);
            setFilteredData(Object.values(matchingEntries));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return result.data as Record<string, TokenData[]>;
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bit10brc20ChartConfig: ChartConfig = {
        ...Object.fromEntries(
            bit10BRC20TokenData.map((token: { symbol: string }) => [
                token.symbol,
                {
                    label: token.symbol,
                    // @ts-ignore
                    color: color[bit10BRC20TokenData.indexOf(token) % color.length],
                }
            ])
        )
    };

    const pieChartData = bit10BRC20TokenData.map((token, index) => ({
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: token.symbol,
        value: (100 / bit10BRC20TokenData.length),
        fill: color[index % color.length],
    }));


    return (
        <div className="py-4">
            {isLoading ? (
                <Card className='dark:border-white w-full animate-fade-left-slow'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-12 w-28', 'h-72'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='dark:border-white w-full lg:col-span-1 animate-fade-in-down-slow'>
                    <CardHeader>
                        <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Collateral</div>
                    </CardHeader>
                    <CardContent className='flex flex-col space-y-2'>
                        <div>
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
                                    <div className='text-xl'>
                                        <div className='flex flex-1 flex-row items-center justify-start'>
                                            Total Collateral: {totalCollateralSum.toFixed(2)} USD
                                            {totalCollateralSum !== totalUSDCollateralBITDEFI && (
                                                <Badge className='ml-1 text-white' style={{ backgroundColor: totalCollateralSum > totalUSDCollateralBITDEFI ? 'green' : 'red' }}>
                                                    {`${totalCollateralSum > totalUSDCollateralBITDEFI ? '+ ' : '- '}${((totalCollateralSum - totalUSDCollateralBITDEFI) / totalUSDCollateralBITDEFI * 100).toFixed(4)}%`}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <h1 className='text-lg'>BIT10.DEFI Price: {bit10defiPrice.toFixed(4)} USD</h1>
                                    <p className='text-lg'>Token Supply (100% Collateral Coverage): {bit10DEFITokenSupply} BIT10.DEFI</p>
                                    <table className='w-full table-auto text-lg'>
                                        <thead>
                                            <tr className='hover:bg-accent p-1 rounded'>
                                                <th className='text-left'>Collateral Token</th>
                                                <th className='text-left'>Total Collateral</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.map((entry: TokenData) => {
                                                const allocation = bit10Allocation.find(item => item.name === entry.symbol);
                                                const totalCollateralToken = allocation?.totalCollateralToken ?? '0';
                                                const fillColor = allocation?.fill ?? '#000';
                                                const address = allocation?.address ?? '#000';
                                                const walletAddress = allocation?.walletAddress ?? '#000';

                                                return (
                                                    <tr key={entry.id} className='hover:bg-accent p-1 rounded'>
                                                        <td className='flex items-center space-x-1'>
                                                            <div className='w-3 h-3 rounded' style={{ backgroundColor: fillColor }}></div>
                                                            <span>{entry.symbol}</span>
                                                            <span>({address})</span>
                                                            <a href={walletAddress} target='_blank'>
                                                                <ExternalLink size={16} className='text-primary' />
                                                            </a>
                                                        </td>
                                                        <td>{(entry.quote.USD.price * Number(totalCollateralToken)).toFixed(6)} USD</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className='text-2xl'>BIT10.BRC20</div>
                            <div className='grid md:grid-cols-3 gap-4 items-center'>
                                <div className='flex-1'>
                                    <ChartContainer
                                        config={bit10brc20ChartConfig}
                                        className='aspect-square max-h-[300px]'
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Pie
                                                data={pieChartData}
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
                                                                        BIT10.BRC20
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
                                    <h1 className='text-2xl'>BIT10.BRC20</h1>
                                    <div className='text-xl'>
                                        <div className='flex flex-1 flex-row items-center justify-start'>
                                            Total Collateral:
                                        </div>
                                    </div>
                                    {/* @ts-ignore */}
                                    <h1 className='text-lg'>BIT10.BRC20 Price: {bit10brc20Price.toFixed(4)} USD</h1>
                                    <p className='text-lg'>Token Supply (100% Collateral Coverage):</p>
                                    <table className='w-full table-auto text-lg'>
                                        <thead>
                                            <tr className='hover:bg-accent p-1 rounded'>
                                                <th className='text-left'>Collateral Token</th>
                                                <th className='text-left'>Total Collateral</th>
                                            </tr>
                                        </thead>
                                        <tbody>

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div >
    );
}
