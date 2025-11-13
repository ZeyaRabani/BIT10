import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchICPBIT10Balance } from './icp/ICPPortfolioModule'
import { fetchBaseBIT10Balance } from './base/BasePortfolioModule'
import { fetchSolanaBIT10Balance } from './solana/SolanaPortfolioModule'
import { fetchBSCBIT10Balance } from './bsc/BSCPortfolioModule'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { formatCompactNumber } from '@/lib/utils'

const bit10TokenName = ['BIT10.TOP'];

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

export default function BalanceAndAllocation() {
    const [selectedAllocationToken, setSelectedAllocationToken] = useState('BIT10.TOP');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { connected: isSolanaConnected, publicKey } = useWallet();

    const fetchBIT10Tokens = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'bit10-latest-price-top') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = data.data ?? 0;
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenList'],
                queryFn: () => fetchBIT10Tokens('bit10-latest-price-top')
            },
            {
                queryKey: ['bit10DEFIBalanceICP'],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                queryFn: () => fetchICPBIT10Balance({ canisterId: 'bin4j-cyaaa-aaaap-qh7tq-cai', address: icpAddress })
            },
            {
                queryKey: ['bit10TOPBalanceICP'],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                queryFn: () => fetchICPBIT10Balance({ canisterId: 'g37b3-lqaaa-aaaap-qp4hq-cai', address: icpAddress })
            },
            {
                queryKey: ['bit10TOPBalanceBase'],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                queryFn: () => fetchBaseBIT10Balance({ tokenAddress: '0x2d309c7c5fbbf74372edfc25b10842a7237b92de', address: evmAddress })
            },
            {
                queryKey: ['bit10TOPBalanceSolana'],
                queryFn: () => {
                    if (!publicKey || chain !== 'solana') return '0';
                    return fetchSolanaBIT10Balance({ tokenAddress: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', publicKey: publicKey, decimals: 9 })
                }
            },
            {
                queryKey: ['bit10TOPBalanceBSC'],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                queryFn: () => fetchBSCBIT10Balance({ tokenAddress: '0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9', address: evmAddress })
            },
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPTokens = bit10Queries[0].data as { id: number, name: string, symbol: string, marketCap: number, price: number }[] | undefined;
    const bit10TOPPrice = Array.isArray(bit10TOPTokens) ? (bit10TOPTokens.reduce((sum, token) => sum + token.marketCap, 0) / 25_000_000_000_000) * 100 : 0;
    const icpBIT10DEFIokenBalance = bit10Queries[1].data as bigint | undefined;
    const icpBIT10TOPTokenBalance = bit10Queries[2].data!;
    const baseBIT10TOPTokenBalance = bit10Queries[3].data!;
    const solanaBIT10TOPTokenBalance = bit10Queries[4].data!;
    const bscBIT10TOPTokenBalance = bit10Queries[5].data!;

    const totalTokens = () => {
        if (chain === 'icp' && isICPConnected) {
            const total = Number(icpBIT10DEFIokenBalance!) + Number(icpBIT10TOPTokenBalance);
            return (total / 100000000);
        } else if (chain === 'base' && isEVMConnected) {
            const total = Number(baseBIT10TOPTokenBalance);
            return total;
        } else if (chain === 'solana' && isSolanaConnected) {
            const total = Number(solanaBIT10TOPTokenBalance);
            return total;
        } else if (chain === 'bsc' && isEVMConnected) {
            const total = Number(bscBIT10TOPTokenBalance);
            return total;
        } else {
            return 0;
        }
    };

    const totalBIT10Tokens = totalTokens();

    const selectedBIT10Token = () => {
        if (selectedAllocationToken === 'BIT10.TOP') {
            return bit10TOPTokens;
        } else {
            return null;
        }
    };

    const rawTokens = selectedBIT10Token();
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

    const bit10DEFI = () => {
        if (chain === 'icp' && isICPConnected) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return (Number(icpBIT10DEFIokenBalance) / 100000000);
        } else {
            return 0;
        }
    };

    const bit10DEFITokenBalance = bit10DEFI();

    const bit10TOP = () => {
        if (chain === 'icp' && isICPConnected) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return (Number(icpBIT10TOPTokenBalance) / 100000000);
        } else if (chain === 'base' && isEVMConnected) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Number(baseBIT10TOPTokenBalance);
        } else if (chain === 'solana' && isSolanaConnected) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Number(solanaBIT10TOPTokenBalance);
        } else if (chain === 'bsc' && isEVMConnected) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Number(bscBIT10TOPTokenBalance);
        } else {
            return 0;
        }
    };

    const bit10TOPTokenBalance = bit10TOP();

    const tokenData = [
        {
            token: 'BIT10.DEFI',
            balance: `${formatCompactNumber(Number(bit10DEFITokenBalance))}`
        },
        {
            token: 'BIT10.TOP',
            balance: `${formatCompactNumber(Number(bit10TOPTokenBalance))}`
        }
    ];

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
        Number(totalBIT10Tokens) == 0
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
            tokens.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol,
                    color: color[index % color.length],
                }
            ])
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
                    <Card className='border-muted w-full lg:col-span-1 animate-fade-left-slow bg-transparent'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-10 w-3/4', 'h-44'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='border-muted w-full lg:col-span-1 animate-fade-right-slow bg-transparent'>
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
                    <Card className='border-muted w-full lg:col-span-1 animate-fade-left-slow bg-transparent'>
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
                                        {Number(formatCompactNumber(Number(totalBIT10Tokens))) > 0 && (
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
                                                                    {formatCompactNumber(Number(totalBIT10Tokens))}
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
                                    <p className='text-3xl font-semibold'>{formatCompactNumber(Number(totalBIT10Tokens))} BIT10</p>
                                </div>
                                <div className='flex w-full flex-col space-y-3'>
                                    <h1 className='text-xl md:text-2xl font-semibold'>Portfolio Holdings</h1>
                                    <div className='flex flex-col space-y-1 py-1'>
                                        <div className='flex flex-row justify-between items-center px-2'>
                                            <div>Token Name</div>
                                            <div>No. of Tokens</div>
                                        </div>
                                        {Number(formatCompactNumber(Number(totalBIT10Tokens))) == 0 ? (
                                            <div className='text-center'>You currently own no BIT10 tokens</div>
                                        ) : (
                                            <>
                                                {tokenData
                                                    .filter((token) => {
                                                        if (token.token !== 'BIT10.DEFI') return true;
                                                        return chain === 'icp';
                                                    })
                                                    .map((token, index) => {
                                                        const isTopToken = token.token === 'BIT10.TOP';
                                                        const tokenValue = isTopToken
                                                            ? (parseFloat(token.balance) * bit10TOPPrice).toFixed(2) + ' USD'
                                                            : '';

                                                        return (
                                                            <div key={index} className='flex flex-row justify-between items-center hover:bg-accent py-1 px-2 rounded'>
                                                                <div className='flex flex-row items-center space-x-1'>
                                                                    <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                                                    <div>{token.token}</div>
                                                                </div>
                                                                <div className='flex flex-row space-x-1 items-end'>
                                                                    <div>{token.balance}</div>
                                                                    {isTopToken && bit10TOPPrice > 0 && (<div className='hidden md:block'>({tokenValue}) </div>)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='border-muted w-full lg:col-span-1 animate-fade-right-slow bg-transparent'>
                        <CardHeader className='flex flex-col md:flex-row items-center md:justify-between'>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Allocations</div>
                            <Select onValueChange={setSelectedAllocationToken} defaultValue={selectedAllocationToken}>
                                <SelectTrigger className='w-[180px] dark:border-muted'>
                                    <SelectValue placeholder='Select Token' />
                                </SelectTrigger>
                                <SelectContent className='dark:border-muted'>
                                    {bit10TokenName.map((token) => (
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
                                            <div>{formatCompactNumber((token.marketCap / totalMarketCap) * 100)} %</div>
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
