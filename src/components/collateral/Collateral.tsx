"use client"

import React, { useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { History, LoaderCircle, ExternalLink } from 'lucide-react'
// import { Actor, HttpAgent } from '@dfinity/agent'
// import { idlFactory } from '@/lib/oracle.did'

interface AllocationDataType {
    symbol: string;
    id?: number;
    address: string;
    totalCollateralToken: number;
    walletAddress: string;
}

// temp
const bit10Allocation: AllocationDataType[] = [
    { symbol: 'BTC', id: 1, address: 'tb1qdlp...............7mnrdpe', totalCollateralToken: 0.0002839045033265133, walletAddress: 'https://mempool.space/testnet/address/tb1qdlpdtgc5vjww3e4pxjayamgru0cyjts7mnrdpe' }, // wallet Xverse, chain BTC Testnet
    { symbol: 'ETH', id: 1027, address: '0x9685...............5f162c', totalCollateralToken: 0.00920807, walletAddress: 'https://sepolia.etherscan.io/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c' }, // wallet Metamask, chain Sepolia
    { symbol: 'XRP', id: 52, address: 'r9tHXBk...............UVYGSP', totalCollateralToken: 9.623, walletAddress: 'https://testnet.xrpl.org/accounts/r9tHXBk9VNDkM15muGHZDVB6Z7BGUVYGSP' }, // wallet Metamask snap, XRP Leger
    { symbol: 'SOL', id: 5426, address: 'EVcodb...............i9mLtB', totalCollateralToken: 0.1188, walletAddress: 'https://explorer.solana.com/address/EVcodbVbJT9hk4iu9GHy3mzCCPEYewgv4CMJtki9mLtB?cluster=devnet' }, // wallet Phantom, chain Devnet
    { symbol: 'BNB', id: 1839, address: '0x9685...............5f162c', totalCollateralToken: 0.04358, walletAddress: 'https://testnet.bscscan.com/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c' }, // wallet Metamask, chain Bsc Testnet
    { symbol: 'DOGE', id: 74, address: '0x9685...............5f162c', totalCollateralToken: 84.88, walletAddress: 'https://explorer-testnet.dogechain.dog/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c' }, //  wallet Metamask, chain Dogechain Testnet
    // Not working correctly, faucet: https://docs.cardano.org/cardano-testnets/tools/faucet
    { symbol: 'ADA', id: 2010, address: '01884c...............652158', totalCollateralToken: 30.35, walletAddress: 'https://preview.cardanoscan.io/address/01884c76b749fb4980cf8556a414b74c994484a4253154bc2c310bb7e9d3c70add7c317b46d7226cad99dc86cfcff3f6443f2a840688652158' }, // wallet Typhon Wallet and Eternl, chain
    { symbol: 'TRX', id: 1958, address: 'TMKh1g...............kTu1JZ', totalCollateralToken: 119.83, walletAddress: 'https://nile.tronscan.org/#/address/TMKh1gEjFu29grCJRFuDVaPKTWSDkTu1JZ' }, // walet Tronlink, chain TRON Nile Testnet
    { symbol: 'LINK', id: 1975, address: '0x9685...............5f162c', totalCollateralToken: 1.18, walletAddress: 'https://sepolia.etherscan.io/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c' }, // wallet Metamask, chain Sepolia
    { symbol: 'AVAX', id: 5805, address: '0x9685...............5f162c', totalCollateralToken: 0.839, walletAddress: 'https://subnets-test.avax.network/c-chain/address/0x9685777eb64579f14DC8a418Ae2f7f93C25f162c' }, // wallet Metamask, chain Avalanche Fuji Testnet
    // { symbol: 'XLM', id: 512, address: 'GALCJ2...............MXU4WB', totalCollateralToken: 10000, walletAddress: 'https://testnet.lumenscan.io/account/GALCJ2IKBLYPHWWFIBOM5UI37J4MRWPAD3AEUTFUB5QLBHOTVZMXU4WB' } // wallet Freighter, chain Stellar Testnet
];

// temp
const totalUSDCollateralTestBit10TOP = 300; // 30 USD each

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function Collateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const fetchBit10Price = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'test-bit10-top-latest-price') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = (data.tokenPrice ?? 0) / 1000;
        }
        return returnData;
    };

    const fetchBit10Tokens = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'test-bit10-top-latest-price') {
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
                queryKey: ['tbit10TOPTokenPrice'],
                queryFn: () => fetchBit10Price('test-bit10-top-latest-price')
            },
            {
                queryKey: ['tbit10TOPTokenList'],
                queryFn: () => fetchBit10Tokens('test-bit10-top-latest-price')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const tBit10TOPPrice = bit10Queries[0].data;
    const tBit10TOPTokens = bit10Queries[1].data as { id: number, name: string, symbol: string, price: number }[];
    
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

    const tBit10TOPChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tBit10TOPTokens?.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol,
                    color: color[index % color.length],
                }
            ]) ?? []
        )
    };

    const tBit10TOPPieChartData = tBit10TOPTokens?.map((token, index) => ({
        name: token.symbol,
        value: 100 / tBit10TOPTokens.length,
        fill: color[index % color.length],
    }));

    return (
        <div>
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
                    <CardContent className='flex flex-col space-y-4'>
                        <div>
                            <div className='flex flex-col md:flex-row items-center md:justify-between'>
                                <div className='text-2xl'>Test BIT10.TOP</div>
                                <Button>
                                    <History className='h-2 w-2 mr-1' />
                                    Rebalance History
                                </Button>
                            </div>
                            <div className='grid md:grid-cols-3 gap-4 items-center'>
                                <div className='flex-1'>
                                    <ChartContainer
                                        config={tBit10TOPChartConfig}
                                        className='aspect-square max-h-[300px]'
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Pie
                                                data={tBit10TOPPieChartData}
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
                                                                        Test BIT10.TOP
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
                                    <h1 className='text-2xl'>Test BIT10.TOP</h1>
                                    <div className='text-lg flex flex-1 flex-row items-center justify-start'>
                                        Total Collateral: {''}
                                        {bit10Allocation.reduce((total, allocation) => {
                                            const matchingData = tBit10TOPTokens.find((data) => data.symbol === allocation.symbol);
                                            if (matchingData) {
                                                return total + matchingData.price * allocation.totalCollateralToken;
                                            }
                                            return total;
                                        }, 0).toFixed(6)} USD

                                        {bit10Allocation.reduce((total, allocation) => {
                                            const matchingData = tBit10TOPTokens.find((data) => data.symbol === allocation.symbol);
                                            if (matchingData) {
                                                return total + matchingData.price * allocation.totalCollateralToken;
                                            }
                                            return total;
                                        }, 0) !== totalUSDCollateralTestBit10TOP && (
                                                <Badge className='ml-1 text-white' style={{
                                                    backgroundColor: bit10Allocation.reduce((total, allocation) => {
                                                        const matchingData = tBit10TOPTokens.find((data) => data.symbol === allocation.symbol);
                                                        if (matchingData) {
                                                            return total + matchingData.price * allocation.totalCollateralToken;
                                                        }
                                                        return total;
                                                    }, 0) > totalUSDCollateralTestBit10TOP ? 'green' : 'red'
                                                }}>
                                                    {`${bit10Allocation.reduce((total, allocation) => {
                                                        const matchingData = tBit10TOPTokens.find((data) => data.symbol === allocation.symbol);
                                                        if (matchingData) {
                                                            return total + matchingData.price * allocation.totalCollateralToken;
                                                        }
                                                        return total;
                                                    }, 0) > totalUSDCollateralTestBit10TOP ? '+ ' : ''}${((bit10Allocation.reduce((total, allocation) => {
                                                        const matchingData = tBit10TOPTokens.find((data) => data.symbol === allocation.symbol);
                                                        if (matchingData) {
                                                            return total + matchingData.price * allocation.totalCollateralToken;
                                                        }
                                                        return total;
                                                    }, 0) - totalUSDCollateralTestBit10TOP) / totalUSDCollateralTestBit10TOP * 100).toFixed(4)}%`}
                                                </Badge>
                                            )
                                        }
                                    </div>
                                    <h1 className='text-lg flex flex-row items-center'>Test BIT10.TOP Price: {tBit10TOPPrice ? tBit10TOPPrice.toFixed(4) : <LoaderCircle className='animate-spin ml-1 h-5 w-5' />} USD</h1>
                                    {/* <h1 className='text-lg'>Token Supply (100% Collateral Coverage): {bit10DEFITotalSupply} Test BIT10.TOP</h1> */}
                                    <table className='w-full table-auto text-lg'>
                                        <thead>
                                            <tr className='hover:bg-accent p-1 rounded'>
                                                <th className='text-left'>Collateral Token</th>
                                                <th className='text-left'>Total Collateral</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tBit10TOPTokens.map((token, index) => {
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
                                                                {(token && `${(token.price * allocation.totalCollateralToken).toFixed(2)} USD`) || 'N/A'}
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
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
