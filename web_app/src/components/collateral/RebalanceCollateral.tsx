import React, { useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card } from '@/components/ui/card'
import { HistoryIcon, DollarSignIcon, CoinsIcon, TrendingUpIcon, ShieldIcon, ExternalLinkIcon } from 'lucide-react'
import { formatCompactPercentNumber, formatAddress } from '@/lib/utils'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/buy.did'

// temp
interface WalletDataType {
    walletAddress: string;
    explorerAddress: string;
    bit10: string[];
    tokenId?: string[];
}

type CoinData = {
    id: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
    chain?: string;
    price: number;
};

type BIT10Entry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

type CoinSetData = {
    id: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
    marketCap: number;
    chain?: string;
    noOfTokens: number;
    price: number;
};

type BIT10RebalanceEntry = {
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

// ToDo: (temp. placeholder)
const bit10Allocation: WalletDataType[] = [
    { walletAddress: 'bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', explorerAddress: 'https://fractal.unisat.io/swap/assets/bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', bit10: ['BIT10.TOP'] },

    { walletAddress: '0x8b78d7ecf27c8799f19ed4ecbee75cde66f925f1', explorerAddress: 'https://etherscan.io/address/0x8b78d7ecf27c8799f19ed4ecbee75cde66f925f1', bit10: ['BIT10.TOP'], tokenId: ['ethereum', 'chainlink', 'leo-token'] },
    { walletAddress: 'bc1qfqh8ca6a48k2phn4ctqutetapydm5t79edlnqh', explorerAddress: 'https://mempool.space/address/bc1qfqh8ca6a48k2phn4ctqutetapydm5t79edlnqh', bit10: ['BIT10.TOP'], tokenId: ['bitcoin'] },
    { walletAddress: '0x7F7307d895f1242E969a58893ac8594EfC8Ce6E2', explorerAddress: 'https://bscscan.com/address/0x7F7307d895f1242E969a58893ac8594EfC8Ce6E2', bit10: ['BIT10.TOP'], tokenId: ['ripple', 'binancecoin', 'dogecoin', 'cardano', 'zcash', 'bitcoin-cash'] },
    { walletAddress: 'KHTRyohhTPK69EjYapKSZGTNGvv5EnwxAAgJ7CN1STn', explorerAddress: 'https://explorer.solana.com/address/KHTRyohhTPK69EjYapKSZGTNGvv5EnwxAAgJ7CN1STn', bit10: ['BIT10.TOP'], tokenId: ['solana'] },
    { walletAddress: 'TXHicWyMh8pBryemgawayVztrxVx75dtzb', explorerAddress: 'https://tronscan.org/#/address/TXHicWyMh8pBryemgawayVztrxVx75dtzb', bit10: ['BIT10.TOP'], tokenId: ['tron'] },
    { walletAddress: '0x545a402305d54bf34b588c169b51c24f8d1b4c01', explorerAddress: 'https://app.hyperliquid.xyz/explorer/address/0x545a402305d54bf34b588c169b51c24f8d1b4c01', bit10: ['BIT10.TOP'], tokenId: ['hyperliquid'] },
    { walletAddress: '0x50a478a78d2534b0845c8407e48e8cef743ef100c454471c3142744f06811324', explorerAddress: 'https://suiscan.xyz/mainnet/account/0x50a478a78d2534b0845c8407e48e8cef743ef100c454471c3142744f06811324', bit10: ['BIT10.TOP'], tokenId: ['sui'] },
    { walletAddress: 'GDPIOLDAMS6FEVXXITYJR2UQEKN7Y27QUATSMYN5PPM6NJLB7RVOIMFP', explorerAddress: 'https://stellar.expert/explorer/public/account/GDPIOLDAMS6FEVXXITYJR2UQEKN7Y27QUATSMYN5PPM6NJLB7RVOIMFP', bit10: ['BIT10.TOP'], tokenId: ['stellar'] },
];

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

export default function RebalanceCollateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const fetchBIT10Price = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        const data = await response.json() as BIT10Entry;
        return data;
    };

    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
    const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

    const agent = new HttpAgent({ host });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const actor = Actor.createActor(idlFactory, { agent, canisterId });

    const fetchBIT10Supply = async (bit10Token: string) => {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const bit10_Supply = await actor.bit10_token();

            let totalSupply = 0;

            if (bit10Token === 'bit10-top') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const topEntry = bit10_Supply.tokens.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (token: [string, any]) => token[0].startsWith('BIT10.TOP')
                );

                if (topEntry) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    totalSupply = parseFloat(topEntry[1].total_supply);
                }
            }

            if (totalSupply === 0) {
                toast.error('Error fetching BIT10 supply. Please try again!');
                return 0;
            }

            return totalSupply;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching BIT10 supply. Please try again!');
            return 0;
        }
    };

    const fetchBIT10Tokens = async (tokenLatestRebalanceAPI: string) => {
        const response = await fetch(tokenLatestRebalanceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 Tokens. Please try again!');
        }

        const data = await response.json() as BIT10RebalanceEntry;
        return data;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-top')
            },
            {
                queryKey: ['bit10TOPTokenTotalSupply'],
                queryFn: () => fetchBIT10Supply('bit10-top')
            },
            {
                queryKey: ['bit10TOPTokenList'],
                queryFn: () => fetchBIT10Tokens('bit10-latest-rebalance-top')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPPrice = bit10Queries[0].data;
    const bit10TOPTotalSupply = bit10Queries[1].data;
    const bit10TOPTokens = bit10Queries[2].data as {
        timestmpz: string,
        indexValue: number,
        priceOfTokenToBuy: number,
        newTokens: { id: string, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        added: { id: string, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        removed: { id: string, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        retained: { id: string, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[]
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
        if (!tokens?.length) return 0;
        return tokens.reduce((sum, token) => {
            const foundCollateralPrice = priceData?.find(
                (collateral) => collateral.id.toString() === token.id.toString()
            );
            const value = foundCollateralPrice ? (token.noOfTokens ?? 0) * (foundCollateralPrice.price ?? 0) : 0;
            return sum + value;
        }, 0);
    };

    const initialBIT10RebalanceData: RebalanceData[] = [
        {
            bit10Name: 'BIT10.TOP',
            bit10RebalanceHistory: 'top',
            bit10Token: {
                newTokens: bit10TOPTokens?.newTokens || [],
                priceOfTokenToBuy: bit10TOPTokens?.priceOfTokenToBuy || 0
            },
            bit10Price: bit10TOPPrice?.tokenPrice ?? 0,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            bit10Supply: bit10TOPTotalSupply ?? 0,
            bit10Data: bit10TOPPrice?.data ?? []
        }
    ];

    const generateChartConfig = (tokens: CoinSetData[]) => {
        return {
            ...Object.fromEntries(
                tokens?.map((token, index) => [
                    token.symbol,
                    {
                        label: token.symbol.toLocaleUpperCase(),
                        color: color[index % color.length],
                    }
                ]) ?? []
            )
        };
    };

    const generatePieChartData = (tokens: CoinSetData[]) => {
        if (!tokens || tokens.length === 0) return [];

        const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);

        return tokens.map((token, index) => ({
            name: token.symbol,
            value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(2)),
            fill: color[index % color.length],
        }));
    };

    const bit10RebalanceData = initialBIT10RebalanceData.map(data => {
        const totalCollateral = calculateTotalCollateral(data.bit10Token.newTokens, data.bit10Data ?? []);
        const targetValue = data.bit10Token.priceOfTokenToBuy;
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
        <div className='bg-transparent'>
            {isLoading ? (
                <div className='w-full animate-fade-left-slow'>
                    <div className='flex flex-col h-full space-y-2 pt-8'>
                        {['h-12 w-28', 'h-44', 'h-72'].map((classes, index) => (
                            <Skeleton key={index} className={classes} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className='flex flex-col space-y-4 md:space-y-8'>
                    {
                        bit10RebalanceData.map((data, index) => (
                            <div key={index} className='animate-fade-left-slow flex flex-col space-y-2'>
                                <div className='flex flex-col md:flex-row space-y-2 items-center justify-center md:justify-between md:space-y-0'>
                                    <div className='text-2xl font-semibold'>{data.bit10Name}</div>
                                    <Button asChild>
                                        <Link href={`/collateral/${data.bit10RebalanceHistory}`}>
                                            <HistoryIcon />
                                            Rebalance History
                                        </Link>
                                    </Button>
                                </div>
                                <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                                    <Card className='border-2 border-muted p-3 flex flex-col space-y-2'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><DollarSignIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>Total Collateral</div>
                                        </div>
                                        <div className='flex flex-row items-end justify-start space-x-2'>
                                            <div className='text-4xl font-semibold'>${formatCompactPercentNumber(data.targetValue)}</div>
                                            <div className={`${data.percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {data.percentChange > 0 ? '+' : ''}{data.percentChange.toFixed(2)}%
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className='border-2 border-muted p-3 flex flex-col space-y-2'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><CoinsIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>{data.bit10Name} Price</div>
                                        </div>
                                        <div className='text-4xl font-semibold'>${formatCompactPercentNumber(data.bit10Price)}</div>
                                    </Card>
                                    <Card className='border-2 border-muted p-3 flex flex-col space-y-2'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><TrendingUpIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>Total Supply</div>
                                        </div>
                                        <div className='text-4xl font-semibold'>{formatCompactPercentNumber(data.bit10Supply)}</div>
                                    </Card>
                                    <Card className='border-2 border-muted p-3 flex flex-col space-y-2'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><ShieldIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>Coverage Ratio</div>
                                        </div>
                                        <div className='flex flex-row items-end justify-start space-x-2'>
                                            <div className='text-4xl font-semibold'>110%</div>
                                            <div className='text-green-500'>Over-collateralized</div>
                                        </div>
                                    </Card>
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
                                                                            {data.bit10Name}
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
                                        <table className='w-full table-auto text-lg'>
                                            <thead>
                                                <tr className='p-1 rounded'>
                                                    <th className='text-left'>Collateral Token</th>
                                                    <th className='text-left'>Total Collateral</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.bit10Token.newTokens
                                                    .map((token, index) => {
                                                        const bit10Token = `${data.bit10Name}`;
                                                        const foundAllocation = bit10Allocation.find(allocation =>
                                                            allocation.tokenId?.includes(token.id.toString())
                                                        ) ?? bit10Allocation.find(allocation =>
                                                            !allocation.tokenId && allocation.bit10.includes(bit10Token)
                                                        );

                                                        const foundCollateralPrice = data.bit10Data.find(
                                                            (collateral: { id: string }) =>
                                                                collateral.id.toString() === token.id.toString()
                                                        );

                                                        const totalCollateral = foundCollateralPrice
                                                            ? token.noOfTokens * foundCollateralPrice.price
                                                            : 0;

                                                        return {
                                                            token,
                                                            foundAllocation,
                                                            foundCollateralPrice,
                                                            totalCollateral,
                                                            index,
                                                        };
                                                    })
                                                    .sort((a, b) => b.totalCollateral - a.totalCollateral)
                                                    .map(({ token, foundAllocation, foundCollateralPrice, totalCollateral, index }) => (
                                                        <tr key={token.id} className='hover:bg-accent p-1 rounded'>
                                                            <td className='flex items-center space-x-1'>
                                                                <div
                                                                    className='w-3 h-3 rounded'
                                                                    style={{ backgroundColor: color[index % color.length] }}
                                                                ></div>
                                                                <span className='uppercase'>{token.symbol}</span>
                                                                <span>({formatAddress(foundAllocation?.walletAddress ?? '')})</span>
                                                                <a
                                                                    href={foundAllocation?.explorerAddress}
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                >
                                                                    <ExternalLinkIcon size={16} className='text-primary' />
                                                                </a>
                                                            </td>
                                                            <td>
                                                                {foundCollateralPrice
                                                                    ? `${formatCompactPercentNumber(totalCollateral)} USD`
                                                                    : 'Price not available'}
                                                            </td>
                                                        </tr>
                                                    ))}
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
