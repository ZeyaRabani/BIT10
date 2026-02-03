import { useState, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { bit10WalletAllocation } from '@/actions/dbActions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Label, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HistoryIcon, DollarSignIcon, CoinsIcon, TrendingUpIcon, ShieldIcon, ExternalLinkIcon } from 'lucide-react';
import { formatCompactPercentNumber, formatAddress } from '@/lib/utils';

interface WalletDataType {
    walletAddress: string;
    explorerAddress: string;
    bit10: string[];
    tokenId?: string[];
}

type BIT10Entry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

type CoinData = {
    id: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
    noOfTokens?: number;
    chain?: string;
    marketCap?: number;
    price: number;
};

type BIT10RebalanceEntry = {
    timestmpz: string;
    indexValue: number;
    priceOfTokenToBuy: number;
    newTokens: CoinData[];
    added: CoinData[];
    removed: CoinData[];
    retained: CoinData[];
};

interface RebalanceData {
    bit10Name: string;
    bit10RebalanceHistory: string;
    bit10TotalCollateral: number;
    bit10Price: number;
    bit10CurrentPrice: number;
    bit10Supply: number;
    bit10Data: CoinData[];
}

const DEFAULT_WALLET = {
    walletAddress: '0x7f7307d895f1242e969a58893ac8594efc8ce6e2',
    explorerAddress: 'https://bscscan.com/address/0x7f7307d895f1242e969a58893ac8594efc8ce6e2#asset-tokens'
};

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

export default function Collateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const fetchBIT10RebalanceHistory = async (tokenRebalanceAPI: string) => {
        try {
            const response = await fetch(`/bit10-rebalance-history-${tokenRebalanceAPI}`);

            if (!response.ok) {
                return [];
            }

            const data = await response.json() as BIT10RebalanceEntry[];
            return data[0];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occured processing your request. Please try again later!')
        }
    };

    const fetchBIT10Price = async (tokenPriceAPI: string) => {
        try {
            const response = await fetch(`bit10-latest-price-${tokenPriceAPI}`);

            if (!response.ok) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }

            const data = await response.json() as BIT10Entry;
            return data.tokenPrice;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occured processing your request. Please try again later!')
        }
    };

    const fetchBIT10Wallets = async () => {
        try {
            const response = await bit10WalletAllocation();

            if (response === 'Error fetching wallet allocations') {
                toast.info('Error fetching wallet allocations. Please try again!');
            }

            return response;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occured processing your request. Please try again later!')
        }
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenTotalSupply'],
                queryFn: () => fetchBIT10RebalanceHistory('top')
            },
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBIT10Price('top'),
                refetchInterval: 180000, // 30 min.
            },
            {
                queryKey: ['bit10WalletAllocations'],
                queryFn: () => fetchBIT10Wallets()
            },
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPRebalanceData = bit10Queries[0].data;
    const bit10TOPCurrentPrice = bit10Queries[1].data;
    const bit10Allocation = bit10Queries[2].data as WalletDataType[] || [];

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

    const initialBIT10RebalanceData: RebalanceData[] = [
        {
            bit10Name: 'BIT10.TOP',
            bit10RebalanceHistory: 'top',
            bit10TotalCollateral: bit10TOPRebalanceData && 'priceOfTokenToBuy' in bit10TOPRebalanceData ? (bit10TOPRebalanceData).priceOfTokenToBuy : 0,
            bit10Price: bit10TOPRebalanceData && 'indexValue' in bit10TOPRebalanceData ? (bit10TOPRebalanceData).indexValue : 0,
            bit10CurrentPrice: bit10TOPCurrentPrice ?? 0,
            bit10Supply: bit10TOPRebalanceData && 'priceOfTokenToBuy' in bit10TOPRebalanceData && 'indexValue' in bit10TOPRebalanceData ? (bit10TOPRebalanceData).priceOfTokenToBuy / (bit10TOPRebalanceData).indexValue : 0,
            bit10Data: bit10TOPRebalanceData && 'newTokens' in bit10TOPRebalanceData ? bit10TOPRebalanceData?.newTokens : []
        }
    ];

    const generateChartConfig = (tokens: CoinData[]) => {
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

    const generatePieChartData = (tokens: CoinData[]) => {
        if (!tokens || tokens.length === 0) return [];

        const totalMarketCap = tokens.reduce((sum, token) => sum + (token.marketCap ?? 0), 0);

        return tokens.map((token, index) => ({
            name: token.symbol,
            value: totalMarketCap === 0 ? 0 : parseFloat((((token.marketCap ?? 0) / totalMarketCap) * 100).toFixed(2)),
            fill: color[index % color.length],
        }));
    };

    const bit10RebalanceData = initialBIT10RebalanceData.map(data => {
        const tokenName = data.bit10Name;
        const tokenLink = data.bit10RebalanceHistory;
        const totalCollateral = data.bit10TotalCollateral;
        const tokenPrice = data.bit10Price;
        const tokenCurrentPrice = data.bit10CurrentPrice;
        const percentChange = tokenPrice && tokenPrice !== 0 ? ((tokenCurrentPrice - tokenPrice) / tokenPrice) * 100 : 0;
        const tokenSupply = data.bit10Supply;
        const chartConfig = generateChartConfig(data.bit10Data);
        const pieChartData = generatePieChartData(data.bit10Data);
        const tokenData = data.bit10Data;

        return { ...data, tokenName, tokenLink, totalCollateral, tokenPrice, tokenCurrentPrice, percentChange, tokenSupply, chartConfig, pieChartData, tokenData };
    });

    return (
        <Card className='bg-transparent'>
            <CardHeader>
                <div className='text-2xl md:text-4xl text-center md:text-start font-semibold'>BIT10 Collateral</div>
                <div className='text-lg md:text-xl text-center md:text-start text-muted-foreground'>View the assets backing BIT10 tokens</div>
            </CardHeader>
            <CardContent className='flex flex-col space-y-4 md:space-y-8'>
                {isLoading ? (
                    <div className='flex flex-col h-full space-y-2'>
                        <div className='flex flex-col md:flex-row space-y-2 items-center justify-center md:justify-between md:space-y-0'>
                            {['h-8 w-28', 'h-8 w-28'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            <Card className='p-3 flex flex-col space-y-2'>
                                {['h-24 w-full'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </Card>
                            <Card className='p-3 flex flex-col space-y-2'>
                                {['h-24 w-full'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </Card>
                            <Card className='p-3 flex flex-col space-y-2'>
                                {['h-24 w-full'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </Card>
                            <Card className='p-3 flex flex-col space-y-2'>
                                {['h-24 w-full'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </Card>
                        </div>
                        <div className='grid md:grid-cols-3 gap-4 items-center'>
                            {['h-56 w-full col-span-1', 'h-56 w-full col-span-2'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        {bit10RebalanceData.map((data, index) => (
                            <div key={index} className='flex flex-col h-full space-y-2'>
                                <div className='flex flex-col md:flex-row space-y-2 items-center justify-center md:justify-between md:space-y-0'>
                                    <div className='text-2xl font-semibold'>{data.bit10Name}</div>
                                    <Button asChild>
                                        <Link href={`/collateral/${data.bit10RebalanceHistory}`}>
                                            <HistoryIcon size='16' />
                                            Rebalance History
                                        </Link>
                                    </Button>
                                </div>
                                <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                                    <Card className='border-2 p-3'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><DollarSignIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>Total Collateral</div>
                                        </div>
                                        <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                            <div className='text-4xl font-semibold'>${formatCompactPercentNumber(data.totalCollateral)}</div>
                                        </div>
                                    </Card>

                                    <Card className='border-2 p-3'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><CoinsIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>{data.bit10Name} Price</div>
                                        </div>
                                        <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                            <div className='text-4xl font-semibold'>${formatCompactPercentNumber(data.tokenCurrentPrice)}</div>
                                            <div className={`pb-0.5 ${data.percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {data.percentChange > 0 ? '+' : ''}{data.percentChange.toFixed(2)}%
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className='border-2 p-3'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><TrendingUpIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>Total Supply</div>
                                        </div>
                                        <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                            <div className='text-4xl font-semibold'>{formatCompactPercentNumber(data.tokenSupply)}</div>
                                        </div>
                                    </Card>

                                    <Card className='border-2 p-3'>
                                        <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                            <div><ShieldIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                            <div className='text-lg'>Coverage Ratio</div>
                                        </div>
                                        <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                            <div className='text-4xl font-semibold'>110%</div>
                                            <div className='pb-0.5 text-green-500'>Over-collateralized</div>
                                        </div>
                                    </Card>
                                </div>
                                <div className='grid md:grid-cols-3 gap-4 items-center'>
                                    <div className='flex-1'>
                                        <ChartContainer
                                            config={data.chartConfig}
                                            className='aspect-square max-h-75'
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
                                                {data.tokenData.map((token, index) => {
                                                    const foundAllocation = bit10Allocation.find(allocation => allocation.tokenId?.includes(token.id)) ?? DEFAULT_WALLET;
                                                    return (
                                                        <tr key={token.id} className='hover:bg-accent p-1 rounded'>
                                                            <td className='flex items-center space-x-1'>
                                                                <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }} />
                                                                <span className='uppercase'>{token.symbol}</span>
                                                                <span>({formatAddress(foundAllocation.walletAddress)})</span>
                                                                <a href={foundAllocation?.explorerAddress} target='_blank' rel='noopener noreferrer'>
                                                                    <ExternalLinkIcon size={16} className='text-primary' />
                                                                </a>
                                                            </td>
                                                            <td>
                                                                {token.price && token.noOfTokens
                                                                    ? `${formatCompactPercentNumber(token.price * token.noOfTokens)} USD`
                                                                    : 'Price not available'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
