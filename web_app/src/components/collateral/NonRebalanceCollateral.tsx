import React, { useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { LoaderCircle, ExternalLink } from 'lucide-react'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/oracle.did'

// temp
interface AllocationDataType {
    symbol: string;
    id?: number;
    address: string;
    totalCollateralToken: number;
    walletAddress: string;
}

// temp
const bit10Allocation: AllocationDataType[] = [
    { symbol: 'RIF', id: 3701, address: '0x0D15.......2735133E79', totalCollateralToken: 128, walletAddress: 'https://explorer.rootstock.io/address/0x0d15f7cad6f5e0ac652ff97ab5e0d92735133e79?__tab=tokens' },
    { symbol: 'STX', id: 4847, address: 'SP1P4R......KMG4WN3E55', totalCollateralToken: 9.043823, walletAddress: 'https://explorer.hiro.so/address/SP1P4R2AE3DHCFZ46ESYKG1KPDB340ZKMG4WN3E55?chain=mainnet' },
    { symbol: 'MAPO', id: 4956, address: '0x0D15.......2735133E79', totalCollateralToken: 1700.59274203, walletAddress: 'https://etherscan.io/address/0x0D15F7cad6f5e0AC652FF97aB5e0d92735133E79' },
    { symbol: 'CFX', id: 7334, address: '0x9f9........dbc3fac035', totalCollateralToken: 98.996, walletAddress: 'https://evm.confluxscan.io/address/0x9f9019bb3f15f48e93a9dcef56dd56dbc3fac035' },
    { symbol: 'SOV', id: 8669, address: '0x0D15.......2735133E79', totalCollateralToken: 31.09031792, walletAddress: 'https://etherscan.io/address/0x0D15F7cad6f5e0AC652FF97aB5e0d92735133E79' },
    { symbol: 'ICP', id: 8916, address: '60a182a......547cc70480', totalCollateralToken: 1.63, walletAddress: 'https://dashboard.internetcomputer.org/account/60a182a30efd8324fea20cdc0e97527c07894d68967423b7d1caaf547cc70480' }
];

// temp
const totalUSDCollateralB1010DEFI = 78;

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function NonRebalanceCollateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const fetchBit10Price = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'bit10-latest-price-defi') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = data.tokenPrice ?? 0;
        }
        return returnData;
    };

    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
    const canisterId = 'fg5vt-paaaa-aaaap-qhhra-cai';

    const agent = new HttpAgent({ host });
    const actor = Actor.createActor(idlFactory, { agent, canisterId });

    const fetchBit10DEFISupply = async () => {
        const totalSupply = actor.bit10_defi_total_supply_of_token_available ? await actor.bit10_defi_total_supply_of_token_available() : undefined;

        if (!totalSupply) {
            toast.error('Error fetching BIT10 supply. Please try again!');
        }

        if (totalSupply && typeof totalSupply === 'bigint') {
            const scaledTotalSupply = Number(totalSupply) / 100000000;
            return scaledTotalSupply;
        } else {
            return 0;
        }
    }

    const fetchBit10Tokens = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'bit10-latest-price-defi') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = data.data ?? 0;
        } else {
            returnData = 0;
        }
        return returnData;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFITokenPrice'],
                queryFn: () => fetchBit10Price('bit10-latest-price-defi')
            },
            {
                queryKey: ['bit10DEFITokenTotalSupply'],
                queryFn: () => fetchBit10DEFISupply()
            },
            {
                queryKey: ['bit10DEFITokenList'],
                queryFn: () => fetchBit10Tokens('bit10-latest-price-defi')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10DEFIPrice = bit10Queries[0].data;
    const bit10DEFITotalSupply = bit10Queries[1].data;
    const bit10DEFITokens = bit10Queries[2].data as { id: number, name: string, symbol: string, price: number }[];

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

    const bit10DEFIChartConfig: ChartConfig = {
        ...Object.fromEntries(
            bit10DEFITokens?.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol,
                    color: color[index % color.length],
                }
            ]) ?? []
        )
    };

    const bit10DEFIPieChartData = bit10DEFITokens?.map((token, index) => ({
        name: token.symbol,
        value: 100 / bit10DEFITokens.length,
        fill: color[index % color.length],
    }));

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
                <div className='w-full lg:col-span-1 animate-fade-left-slow'>
                    <div className='flex flex-col space-y-4 md:space-y-8'>
                        <div>
                            <div className='text-2xl'>BIT10.DEFI</div>
                            <div className='grid md:grid-cols-3 gap-4 items-center'>
                                <div className='flex-1'>
                                    <ChartContainer
                                        config={bit10DEFIChartConfig}
                                        className='aspect-square max-h-[300px]'
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Pie
                                                data={bit10DEFIPieChartData}
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
                                    <div className='text-lg flex flex-1 flex-row items-center justify-start'>
                                        Total Collateral: {''}
                                        {bit10Allocation.reduce((total, allocation) => {
                                            const matchingData = bit10DEFITokens.find((data) => data.symbol === allocation.symbol);
                                            if (matchingData) {
                                                return total + matchingData.price * allocation.totalCollateralToken;
                                            }
                                            return total;
                                        }, 0).toFixed(6)} USD

                                        {bit10Allocation.reduce((total, allocation) => {
                                            const matchingData = bit10DEFITokens.find((data) => data.symbol === allocation.symbol);
                                            if (matchingData) {
                                                return total + matchingData.price * allocation.totalCollateralToken;
                                            }
                                            return total;
                                        }, 0) !== totalUSDCollateralB1010DEFI && (
                                                <Badge className='ml-1 text-white' style={{
                                                    backgroundColor: bit10Allocation.reduce((total, allocation) => {
                                                        const matchingData = bit10DEFITokens.find((data) => data.symbol === allocation.symbol);
                                                        if (matchingData) {
                                                            return total + matchingData.price * allocation.totalCollateralToken;
                                                        }
                                                        return total;
                                                    }, 0) > totalUSDCollateralB1010DEFI ? 'green' : 'red'
                                                }}>
                                                    {`${bit10Allocation.reduce((total, allocation) => {
                                                        const matchingData = bit10DEFITokens.find((data) => data.symbol === allocation.symbol);
                                                        if (matchingData) {
                                                            return total + matchingData.price * allocation.totalCollateralToken;
                                                        }
                                                        return total;
                                                    }, 0) > totalUSDCollateralB1010DEFI ? '+ ' : ''}${((bit10Allocation.reduce((total, allocation) => {
                                                        const matchingData = bit10DEFITokens.find((data) => data.symbol === allocation.symbol);
                                                        if (matchingData) {
                                                            return total + matchingData.price * allocation.totalCollateralToken;
                                                        }
                                                        return total;
                                                    }, 0) - totalUSDCollateralB1010DEFI) / totalUSDCollateralB1010DEFI * 100).toFixed(4)}%`}
                                                </Badge>
                                            )
                                        }
                                    </div>
                                    <h1 className='text-lg flex flex-row items-center'>BIT10.DEFI Price: {bit10DEFIPrice ? bit10DEFIPrice.toFixed(4) : <LoaderCircle className='animate-spin ml-1 h-5 w-5' />} USD</h1>
                                    <h1 className='text-lg'>Token Supply (100% Collateral Coverage): {bit10DEFITotalSupply} BIT10.DEFI</h1>
                                    <table className='w-full table-auto text-lg'>
                                        <thead>
                                            <tr className='p-1 rounded'>
                                                <th className='text-left'>Collateral Token</th>
                                                <th className='text-left'>Total Collateral</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bit10DEFITokens.map((token, index) => {
                                                const allocation = bit10Allocation.find((alloc) => alloc.id === token.id);
                                                return (
                                                    allocation && (
                                                        <tr key={allocation.id} className='hover:bg-accent p-1 rounded'>
                                                            <td className='flex items-center space-x-1'>
                                                                <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                                                <span>{allocation.symbol}</span>
                                                                <span>({allocation.address})</span>
                                                                <a href={allocation.walletAddress} target='_blank' rel='noopener noreferrer'>
                                                                    <ExternalLink size={16} className='text-primary' />
                                                                </a>
                                                            </td>
                                                            <td>
                                                                {(token && `${(token.price * allocation.totalCollateralToken).toFixed(2)} USD`) || 'Price not available'}
                                                            </td>
                                                        </tr>
                                                    )
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
