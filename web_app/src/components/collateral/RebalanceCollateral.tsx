import React, { useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { History, ExternalLink } from 'lucide-react'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/oracle.did'

// temp
interface WalletDataType {
    walletAddress: string;
    explorerAddress: string;
    bit10: string[];
    tokenId?: string[];
}

type CoinData = {
    id: number;
    name: string;
    symbol: string;
    tokenAddress?: string;
    chain?: string;
    price: number;
};

type Bit10Entry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

type CoinSetData = {
    id: number;
    name: string;
    symbol: string;
    tokenAddress?: string;
    chain?: string;
    noOfTokens: number;
    price: number;
};

type Bit10RebalanceEntry = {
    timestmpz: string;
    indexValue: number;
    priceOfTokenToBuy: number;
    newTokens: CoinSetData[];
    added: CoinSetData[];
    removed: CoinSetData[];
    retained: CoinSetData[];
};

interface RebalanceData {
    bit10Name: string;
    bit10RebalanceHistory: string;
    bit10Token: {
        newTokens: CoinSetData[];
        priceOfTokenToBuy: number;
    };
    bit10Price: number;
    bit10Supply: number;
    bit10Data: CoinData[];
}

// temp
const bit10Allocation: WalletDataType[] = [
    { walletAddress: 'bc1pkjd3.....aqgc55hy', explorerAddress: 'https://fractal.unisat.io/swap/assets/bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', bit10: ['BIT10.BRC20'] },
    // { walletAddress: 'bc1pkjd3.....aqgc55hyll', explorerAddress: 'https://fractal.unisat.io/swap/assets/bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', bit10: ['BIT10.TOP'] },
    // { walletAddress: 'bc1pkjd3.....aqgc55hyll2', explorerAddress: 'https://fractal.unisat.io/swap/assets/bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', bit10: ['BIT10.TOP'], tokenId: ['25028'] },
];

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function RebalanceCollateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const fetchBit10Price = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'bit10-latest-price-brc20') {
            data = await response.json() as Bit10Entry;
            returnData = data;
        }
        return returnData;
    };

    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
    const canisterId = 'fg5vt-paaaa-aaaap-qhhra-cai';

    const agent = new HttpAgent({ host });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const actor = Actor.createActor(idlFactory, { agent, canisterId });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fetchBit10Supply = async (bit10Token: string) => {
        // let totalSupply;
        // if (bit10Token === 'bit10-brc20') {
        //     const totalSupply = actor.bit10_brc20_total_supply_of_token_available ? await actor.bit10_brc20_total_supply_of_token_available() : undefined;
        //     return totalSupply
        // } else if (bit10Token === 'bit10-top') {
        //     const totalSupply = actor.bit10_top_total_supply_of_token_available ? await actor.bit10_top_total_supply_of_token_available() : undefined;
        //     return totalSupply
        // }

        // if (!totalSupply) {
        //     toast.error('Error fetching BIT10 supply. Please try again!');
        // }

        // if (totalSupply && typeof totalSupply === 'bigint') {
        //     const scaledTotalSupply = Number(totalSupply) / 100000000;
        //     return scaledTotalSupply;
        // } else {
        //     return 0;
        // }

        return 0;
    }

    const fetchBit10Tokens = async (tokenLatestRebalanceAPI: string) => {
        const response = await fetch(tokenLatestRebalanceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 Tokens. Please try again!');
        }

        let data;
        let returnData;
        if (tokenLatestRebalanceAPI === 'bit10-latest-rebalance-brc20') {
            data = await response.json() as Bit10RebalanceEntry;
            returnData = data;
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10BRC20TokenPrice'],
                queryFn: () => fetchBit10Price('bit10-latest-price-brc20')
            },
            {
                queryKey: ['bit10BRC20TokenTotalSupply'],
                queryFn: () => fetchBit10Supply('bit10-brc20')
            },
            {
                queryKey: ['bit10BRC20TokenList'],
                queryFn: () => fetchBit10Tokens('bit10-latest-rebalance-brc20')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10BRC20Price = bit10Queries[0].data;
    const bit10BRC20TotalSupply = bit10Queries[1].data;
    const bit10BRC20Tokens = bit10Queries[2].data as {
        timestmpz: string,
        indexValue: number,
        priceOfTokenToBuy: number,
        newTokens: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        added: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        removed: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        retained: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[]
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(50);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const calculateTotalCollateral = (tokens: CoinSetData[], priceData: CoinData[]) => {
        return tokens?.reduce((sum, token) => {
            const foundCollateralPrice = priceData?.find(collateral => collateral.id === token.id);
            return foundCollateralPrice ? sum + (token.noOfTokens * foundCollateralPrice.price) : sum;
        }, 0) ?? 0;
    };

    const calculateTargetValue = (priceOfTokenToBuy: number, numTokens: number) => {
        return (priceOfTokenToBuy ?? 0) * (numTokens ?? 0);
    };

    const initialBit10RebalanceData: RebalanceData[] = [
        {
            bit10Name: 'BIT10.BRC20',
            bit10RebalanceHistory: 'brc20',
            bit10Token: {
                newTokens: bit10BRC20Tokens?.newTokens || [],
                priceOfTokenToBuy: bit10BRC20Tokens?.priceOfTokenToBuy || 0
            },
            bit10Price: bit10BRC20Price?.tokenPrice ?? 0,
            bit10Supply: bit10BRC20TotalSupply ?? 0,
            bit10Data: bit10BRC20Price?.data ?? []
        }
    ];

    const generateChartConfig = (tokens: CoinSetData[]) => {
        return {
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
    };

    const generatePieChartData = (tokens: CoinSetData[]) => {
        return tokens?.map((token, index) => ({
            name: token.symbol,
            value: 100 / (tokens?.length || 1),
            fill: color[index % color.length],
        })) || [];
    };

    const bit10RebalanceData = initialBit10RebalanceData.map(data => {
        const totalCollateral = calculateTotalCollateral(data.bit10Token.newTokens, bit10BRC20Price?.data ?? []);
        const targetValue = calculateTargetValue(data.bit10Token.priceOfTokenToBuy, data.bit10Token.newTokens.length);
        const percentChange = targetValue !== 0
            ? ((totalCollateral - targetValue) / targetValue) * 100
            : 0;
        const chartConfig = generateChartConfig(data.bit10Token.newTokens);
        const pieChartData = generatePieChartData(data.bit10Token.newTokens);

        return {
            ...data,
            totalCollateral,
            targetValue,
            percentChange,
            chartConfig,
            pieChartData
        };
    });

    return (
        <div>
            {isLoading ? (
                <div className='w-full animate-fade-left-slow'>
                    <div className='flex flex-col h-full space-y-2 pt-8'>
                        {['h-12 w-28', 'h-72'].map((classes, index) => (
                            <Skeleton key={index} className={classes} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className='flex flex-col space-y-4'>
                    {
                        bit10RebalanceData.map((data, index) => (
                            <div key={index} className='animate-fade-left-slow'>
                                <div className='flex flex-col md:flex-row space-y-2 justify-center md:justify-between md:space-y-0'>
                                    <div className='text-2xl'>{data.bit10Name}</div>
                                    <Button asChild>
                                        <Link href={`/collateral/${data.bit10RebalanceHistory}`}>
                                            <History />
                                            Rebalance History
                                        </Link>
                                    </Button>
                                </div>
                                <div className='grid md:grid-cols-3 gap-4 items-center'>
                                    <div className='flex-1'>
                                        <ChartContainer
                                            config={data.chartConfig}
                                            className='aspect-square max-h-[300px]'
                                        >
                                            <PieChart>
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel />}
                                                />
                                                <Pie
                                                    data={data.pieChartData}
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
                                        <h1 className='text-2xl'>{data.bit10Name}</h1>
                                        <div className='text-lg flex flex-1 flex-row items-center justify-start'>
                                            Total Collateral: {''}
                                            {data.totalCollateral.toFixed(4)} USD
                                            <Badge className='ml-1 text-white' style={{
                                                backgroundColor: data.percentChange > 0 ? 'green' : 'red'
                                            }}>
                                                {data.percentChange.toFixed(4)} %
                                            </Badge>
                                        </div>
                                        <h1 className='text-lg flex flex-row items-center'>{data.bit10Name} Price: {data.bit10Price.toFixed(4)} USD</h1>
                                        <h1 className='text-lg'>Token Supply (100% Collateral Coverage): {data.bit10Supply} {data.bit10Name}</h1>

                                        <table className='w-full table-auto text-lg'>
                                            <thead>
                                                <tr className='p-1 rounded'>
                                                    <th className='text-left'>Collateral Token</th>
                                                    <th className='text-left'>Total Collateral</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.bit10Token.newTokens.map((token, index) => {
                                                    const bit10Token = `${data.bit10Name}`
                                                    const foundAllocation = bit10Allocation.find(allocation =>
                                                        allocation.tokenId?.includes(token.id.toString())
                                                    ) ?? bit10Allocation.find(allocation =>
                                                        !allocation.tokenId && allocation.bit10.includes(bit10Token)
                                                    );
                                                    const foundCollateralPrice = data.bit10Token.newTokens.find((collateral: { id: number }) =>
                                                        collateral.id.toString() === token.id.toString()
                                                    );
                                                    return (
                                                        <tr key={token.id} className='hover:bg-accent p-1 rounded'>
                                                            <td className='flex items-center space-x-1'>
                                                                <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                                                <span>{token.symbol}</span>
                                                                <span>({foundAllocation?.walletAddress})</span>
                                                                <a href={foundAllocation?.explorerAddress} target='_blank' rel='noopener noreferrer'>
                                                                    <ExternalLink size={16} className='text-primary' />
                                                                </a>
                                                            </td>
                                                            <td>
                                                                {foundCollateralPrice ? `${(token.noOfTokens * foundCollateralPrice?.price).toFixed(4)} USD` : 'Price not available'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    )
}
