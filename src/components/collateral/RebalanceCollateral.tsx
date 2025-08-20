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
    bit10Data: CoinData[];
}

// temp
const bit10Allocation: WalletDataType[] = [
    { walletAddress: 'bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', explorerAddress: 'https://fractal.unisat.io/swap/assets/bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', bit10: ['Test BIT10.BRC20'] },
    { walletAddress: '0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', explorerAddress: 'https://sepolia.etherscan.io/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', bit10: ['Test BIT10.TOP'] },
    { walletAddress: 'bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', explorerAddress: 'https://mempool.space/testnet/address/tb1qdlpdtgc5vjww3e4pxjayamgru0cyjts7mnrdpe', bit10: ['Test BIT10.BRC20'], tokenId: ['1'] },
    { walletAddress: '0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', explorerAddress: 'https://sepolia.etherscan.io/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', bit10: ['Test BIT10.TOP'], tokenId: ['2'] },
    { walletAddress: 'r9tHXBk9VNDkM15muGHZDVB6Z7BGUVYGSP', explorerAddress: 'https://testnet.xrpl.org/accounts/r9tHXBk9VNDkM15muGHZDVB6Z7BGUVYGSP', bit10: ['Test BIT10.TOP'], tokenId: ['52'] },
    { walletAddress: '0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', explorerAddress: 'https://testnet.bscscan.com/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', bit10: ['Test BIT10.TOP'], tokenId: ['1839'] },
    { walletAddress: 'EVcodbVbJT9hk4iu9GHy3mzCCPEYewgv4CMJtki9mLtB', explorerAddress: 'https://explorer.solana.com/address/EVcodbVbJT9hk4iu9GHy3mzCCPEYewgv4CMJtki9mLtB?cluster=devnet', bit10: ['Test BIT10.TOP'], tokenId: ['5426'] },
    { walletAddress: '0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', explorerAddress: 'https://explorer-testnet.dogechain.dog/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', bit10: ['Test BIT10.TOP', 'Test BIT10.MEME'], tokenId: ['74'] },
    { walletAddress: '01884c76b749fb4980cf8556a414b74c994484a4253154bc2c310bb7e9d3c70add7c317b46d7226cad99dc86cfcff3f6443f2a840688652158', explorerAddress: 'https://preview.cardanoscan.io/address/01884c76b749fb4980cf8556a414b74c994484a4253154bc2c310bb7e9d3c70add7c317b46d7226cad99dc86cfcff3f6443f2a840688652158', bit10: ['Test BIT10.TOP'], tokenId: ['2010'] },
    { walletAddress: 'TMKh1gEjFu29grCJRFuDVaPKTWSDkTu1JZ', explorerAddress: 'https://nile.tronscan.org/#/address/TMKh1gEjFu29grCJRFuDVaPKTWSDkTu1JZ', bit10: ['Test BIT10.TOP'], tokenId: ['1958'] },
    { walletAddress: '0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', explorerAddress: 'https://sepolia.etherscan.io/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', bit10: ['Test BIT10.TOP'], tokenId: ['1975'] },
    { walletAddress: 'EVcodbVbJT9hk4iu9GHy3mzCCPEYewgv4CMJtki9mLtB', explorerAddress: 'https://explorer.solana.com/address/EVcodbVbJT9hk4iu9GHy3mzCCPEYewgv4CMJtki9mLtB?cluster=devnet', bit10: ['Test BIT10.MEME'] },


    { walletAddress: '0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', explorerAddress: 'https://sepolia.etherscan.io/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c', bit10: ['Test BIT10.MEME'], tokenId: ['5994', '24478', '23095', '10804', '28081'] },
];

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function RebalanceCollateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const fetchBit10Price = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        const data = await response.json() as Bit10Entry;
        return data;
    };

    const fetchBit10Tokens = async (tokenLatestRebalanceAPI: string) => {
        const response = await fetch(tokenLatestRebalanceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 Tokens. Please try again!');
        }

        const data = await response.json() as Bit10RebalanceEntry;
        return data;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBit10Price('bit10-latest-price-top')
            },
            {
                queryKey: ['bit10TOPTokenList'],
                queryFn: () => fetchBit10Tokens('bit10-latest-rebalance-top')
            },
            {
                queryKey: ['bit10MEMETokenPrice'],
                queryFn: () => fetchBit10Price('test-bit10-latest-price-meme')
            },
            {
                queryKey: ['bit10MEMETokenList'],
                queryFn: () => fetchBit10Tokens('test-bit10-latest-rebalance-meme')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPPrice = bit10Queries[0].data;
    const bit10TOPTokens = bit10Queries[1].data as {
        timestmpz: string,
        indexValue: number,
        priceOfTokenToBuy: number,
        newTokens: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        added: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        removed: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
        retained: { id: number, name: string, symbol: string, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[]
    };
    const bit10MEMEPrice = bit10Queries[2].data;
    const bit10MEMETokens = bit10Queries[3].data as {
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
            bit10Name: 'Test BIT10.TOP',
            bit10RebalanceHistory: 'top',
            bit10Token: {
                newTokens: bit10TOPTokens?.newTokens || [],
                priceOfTokenToBuy: bit10TOPTokens?.priceOfTokenToBuy || 0
            },
            bit10Price: bit10TOPPrice?.tokenPrice ?? 0,
            bit10Data: bit10TOPPrice?.data ?? []
        },
        {
            bit10Name: 'Test BIT10.MEME',
            bit10RebalanceHistory: 'meme',
            bit10Token: {
                newTokens: bit10MEMETokens?.newTokens || [],
                priceOfTokenToBuy: bit10MEMETokens?.priceOfTokenToBuy || 0
            },
            bit10Price: bit10MEMEPrice?.tokenPrice ?? 0,
            bit10Data: bit10MEMEPrice?.data ?? []
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
        const totalCollateral = calculateTotalCollateral(data.bit10Token.newTokens, data.bit10Data ?? []);
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

    const formatWallet = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 7)}.........${id.slice(-8)}`;
    };

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
                <div className='flex flex-col space-y-4 md:space-y-8'>
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
                                                    const foundCollateralPrice = data.bit10Data.find((collateral: { id: number }) =>
                                                        collateral.id.toString() === token.id.toString()
                                                    );
                                                    return (
                                                        <tr key={token.id} className='hover:bg-accent p-1 rounded'>
                                                            <td className='flex items-center space-x-1'>
                                                                <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                                                <span>{token.symbol}</span>
                                                                <span>({formatWallet(foundAllocation?.walletAddress)})</span>
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
