/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import InformationCard from '@/components/InformationCard'
import { useQueries } from '@tanstack/react-query'
import { formatAmount } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

const RebalanceSwapsTable = ({
    initialTokens,
    rebalanceTokens,
    nextEntryTokens,
    formatAmount
}: {
    initialTokens: CoinSetData[],
    rebalanceTokens: CoinSetData[],
    nextEntryTokens?: CoinSetData[],
    formatAmount: (value: number) => string
}) => {
    if (!initialTokens?.length || !rebalanceTokens?.length) return null;

    const initialMap = new Map(initialTokens.map(token => [token.symbol, token]));
    const rebalanceMap = new Map(rebalanceTokens.map(token => [token.symbol, token]));

    const sellSwaps: Array<{
        symbol: string;
        name: string;
        price: number;
        difference: number;
        value: number;
        action: string;
    }> = [];

    const buySwaps: Array<{
        symbol: string;
        name: string;
        price: number;
        difference: number;
        value: number;
        action: string;
    }> = [];

    for (const [symbol, initialToken] of initialMap) {
        const rebalanceToken = rebalanceMap.get(symbol);

        if (rebalanceToken) {
            const diff = rebalanceToken.noOfTokens - initialToken.noOfTokens;
            const threshold = 0.00001;

            if (Math.abs(diff) > threshold) {
                const swap = {
                    symbol,
                    name: initialToken.name,
                    price: rebalanceToken.price,
                    difference: Math.abs(diff),
                    value: Math.abs(diff) * rebalanceToken.price,
                    action: diff > 0 ? 'BUY' : 'SELL'
                };
                if (diff > 0) {
                    buySwaps.push(swap);
                } else {
                    sellSwaps.push(swap);
                }
            }
        } else {
            sellSwaps.push({
                symbol,
                name: initialToken.name,
                price: initialToken.price,
                difference: initialToken.noOfTokens,
                value: initialToken.noOfTokens * initialToken.price,
                action: 'SELL'
            });
        }
    }

    for (const [symbol, rebalanceToken] of rebalanceMap) {
        if (!initialMap.has(symbol)) {
            buySwaps.push({
                symbol,
                name: rebalanceToken.name,
                price: rebalanceToken.price,
                difference: rebalanceToken.noOfTokens,
                value: rebalanceToken.noOfTokens * rebalanceToken.price,
                action: 'BUY'
            });
        }
    }

    sellSwaps.sort((a, b) => b.value - a.value);
    buySwaps.sort((a, b) => b.value - a.value);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const swapPairs: Array<{ from: any; to: any; valueUSD: number; fromAmount: number; toAmount: number; }> = [];

    let sellIdx = 0;
    let buyIdx = 0;
    let remainingSellValue = sellSwaps[0]?.value ?? 0;
    let remainingSellTokens = sellSwaps[0]?.difference ?? 0;

    while (sellIdx < sellSwaps.length && buyIdx < buySwaps.length) {
        const currentSell = sellSwaps[sellIdx];
        const currentBuy = buySwaps[buyIdx];
        // @ts-expect-error
        const buyValue = currentBuy.value;

        if (remainingSellValue >= buyValue) {
            // @ts-expect-error
            const sellTokenAmount = (buyValue / currentSell.price);
            swapPairs.push({
                from: currentSell,
                to: currentBuy,
                valueUSD: buyValue,
                fromAmount: sellTokenAmount,
                // @ts-expect-error
                toAmount: currentBuy.difference
            });

            remainingSellValue -= buyValue;
            remainingSellTokens -= sellTokenAmount;
            buyIdx++;

            if (remainingSellValue < 0.01) {
                sellIdx++;
                remainingSellValue = sellSwaps[sellIdx]?.value ?? 0;
                remainingSellTokens = sellSwaps[sellIdx]?.difference ?? 0;
            }
        } else if (remainingSellValue > 0) {
            // @ts-expect-error
            const partialBuyTokens = (remainingSellValue / currentBuy.price);
            swapPairs.push({
                from: currentSell,
                to: currentBuy,
                valueUSD: remainingSellValue,
                fromAmount: remainingSellTokens,
                toAmount: partialBuyTokens
            });

            // @ts-expect-error
            buySwaps[buyIdx] = {
                ...currentBuy,
                // @ts-expect-error
                difference: currentBuy.difference - partialBuyTokens,
                // @ts-expect-error
                value: currentBuy.value - remainingSellValue
            };

            sellIdx++;
            remainingSellValue = sellSwaps[sellIdx]?.value ?? 0;
            remainingSellTokens = sellSwaps[sellIdx]?.difference ?? 0;
        } else {
            sellIdx++;
            remainingSellValue = sellSwaps[sellIdx]?.value ?? 0;
            remainingSellTokens = sellSwaps[sellIdx]?.difference ?? 0;
        }
    }

    if (swapPairs.length === 0) {
        if (sellSwaps.length === 0 && buySwaps.length > 0) {
            return (
                <div className='my-4 w-full'>
                    <h2 className='text-xl font-semibold mb-4'>Rebalance Trades</h2>
                    <p className='text-yellow-600 mb-2'>Portfolio value increased - all positions grew proportionally:</p>
                    <Table className='border-collapse border'>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Token</TableHead>
                                <TableHead className='text-right'>Additional Amount</TableHead>
                                <TableHead className='text-right'>Value Added (USD)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {buySwaps.map((swap, index) => (
                                <TableRow key={index}>
                                    <TableCell className='text-green-600'>
                                        {swap.name} ({swap.symbol})
                                    </TableCell>
                                    <TableCell className='text-right text-green-600'>
                                        +{formatAmount(swap.difference)}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        ${formatAmount(swap.value)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            );
        } else if (buySwaps.length === 0 && sellSwaps.length > 0 && nextEntryTokens) {
            const nextTokenMap = new Map(nextEntryTokens.map(t => [t.symbol, t]));

            const reductions = rebalanceTokens
                .map(token => {
                    const prev = nextTokenMap.get(token.symbol);
                    if (!prev) return null;

                    const diffTokens = prev.noOfTokens - token.noOfTokens;
                    if (diffTokens <= 0) return null;

                    return {
                        name: token.name,
                        symbol: token.symbol,
                        difference: diffTokens,
                        value: diffTokens * prev.price,
                    };
                })
                .filter(Boolean) as Array<{ name: string; symbol: string; difference: number; value: number }>;

            return (
                <div className='my-4 w-full'>
                    <h2 className='text-xl font-semibold mb-4'>Rebalance Trades</h2>
                    <p className='text-red-600 mb-2'>Portfolio value decreased - all positions reduced proportionally:</p>
                    <Table className='border-collapse border'>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Token</TableHead>
                                <TableHead className='text-right'>Reduced Amount</TableHead>
                                <TableHead className='text-right'>Value Removed (USD)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reductions.map((reduction, index) => (
                                <TableRow key={index}>
                                    <TableCell className='text-red-600'>
                                        {reduction.name} ({reduction.symbol})
                                    </TableCell>
                                    <TableCell className='text-right text-red-600'>
                                        -{formatAmount(reduction.difference)}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        ${formatAmount(reduction.value)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            );
        } else {
            return (
                <div className='my-4 w-full'>
                    <h2 className='text-xl font-semibold mb-4'>Rebalance Trades</h2>
                    <p className='text-gray-500'>No trades required - allocations are identical.</p>
                </div>
            );
        }
    }

    return (
        <div className='my-4 w-full'>
            <h2 className='text-xl font-semibold mb-4'>Rebalance Trades</h2>
            <Table className='border-collapse border'>
                <TableHeader>
                    <TableRow>
                        <TableHead className='text-left'>Sell Token</TableHead>
                        <TableHead className='text-right'>Sell Amount</TableHead>
                        <TableHead className='text-center'>→</TableHead>
                        <TableHead className='text-left'>Buy Token</TableHead>
                        <TableHead className='text-right'>Buy Amount</TableHead>
                        <TableHead className='text-right'>Value (USD)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {swapPairs.map((pair, index) => (
                        <TableRow key={index}>
                            <TableCell className='text-red-600'>
                                {pair.from.name} ({pair.from.symbol})
                            </TableCell>
                            <TableCell className='text-right text-red-600'>
                                {formatAmount(pair.fromAmount)}
                            </TableCell>
                            <TableCell className='text-center'>→</TableCell>
                            <TableCell className='text-green-600'>
                                {pair.to.name} ({pair.to.symbol})
                            </TableCell>
                            <TableCell className='text-right text-green-600'>
                                {formatAmount(pair.toAmount)}
                            </TableCell>
                            <TableCell className='text-right'>
                                ${formatAmount(pair.valueUSD)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default function RebalanceHistory({ index_fund }: { index_fund: string }) {
    const pathname = usePathname();

    const fetchBit10RebalanceHistory = async (tokenRebalanceAPI: string) => {
        const response = await fetch(`/bit10-rebalance-history-${tokenRebalanceAPI}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json() as Bit10RebalanceEntry[];
        return data;
    };

    const fetchTestBit10RebalanceHistory = async (tokenRebalanceAPI: string) => {
        const response = await fetch(`/test-bit10-rebalance-history-${tokenRebalanceAPI.split('-').pop()}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json() as Bit10RebalanceEntry[];
        return data;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPRebalance'],
                queryFn: () => fetchBit10RebalanceHistory('top')
            },
            {
                queryKey: ['bit10MEMERebalance'],
                queryFn: () => fetchTestBit10RebalanceHistory('meme')
            },
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPRebalanceHistory = bit10Queries[0].data;
    const bit10MEMERebalanceHistory = bit10Queries[1].data;

    const bit10Token = (): Bit10RebalanceEntry[] => {
        if (pathname === '/collateral/top') {
            return bit10TOPRebalanceHistory ?? [];
        } else if (pathname === '/collateral/meme') {
            return bit10MEMERebalanceHistory ?? [];
        } else {
            return [];
        }
    };

    const selectedBit10Token = bit10Token();

    const calculateTotalCollateral = (tokens: CoinSetData[]) =>
        tokens?.reduce((sum, t) => sum + t.price * t.noOfTokens, 0) ?? 0;

    return (
        <div className='py-4'>
            {isLoading ? (
                <Card className='dark:border-white w-full'>
                    <CardContent className='w-full animate-fade-left-slow'>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-12 w-28', 'h-72'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : selectedBit10Token?.length === 0 ? (
                <InformationCard message='No rebalance information available for this BIT10 token' />
            ) : (
                <Card className='dark:border-white w-full'>
                    <CardContent className='flex flex-col space-y-4 py-4'>
                        <h1 className='text-xl md:text-2xl font-semibold uppercase'>BIT10.{index_fund}</h1>
                        <div className='space-y-8'>
                            {selectedBit10Token.map((entry, index) => {
                                if (index === selectedBit10Token.length - 1) {
                                    return (
                                        <div key={entry.timestmpz} className='border p-4 rounded-lg'>
                                            <p className='font-semibold text-lg'>Rebalance Date: {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className='text-lg'>Index Value: {formatAmount(entry.indexValue)} USD</p>
                                            <p className='text-lg'>Total Collateral: {formatAmount(calculateTotalCollateral(entry.newTokens))} USD</p>
                                            <h3 className='font-medium my-2'>
                                                Allocation (Effective {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                            </h3>
                                            <div className='grid grid-cols-1 gap-4'>
                                                <Table className='border-collapse border'>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Symbol</TableHead>
                                                            <TableHead>Price</TableHead>
                                                            <TableHead>Tokens</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {entry.newTokens.map((token) => (
                                                            <TableRow key={token.id}>
                                                                <TableCell>{token.symbol}</TableCell>
                                                                <TableCell>${formatAmount(token.price)}</TableCell>
                                                                <TableCell>{formatAmount(token.noOfTokens)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    );
                                }

                                const nextEntry = selectedBit10Token[index + 1];
                                return (
                                    <div key={entry.timestmpz} className='border p-4 rounded-lg'>
                                        <p className='font-semibold text-lg'>Rebalance Date: {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className='text-lg'>Index Value: {formatAmount(entry.indexValue)} USD</p>
                                        <p className='text-lg'>Total Collateral: {formatAmount(calculateTotalCollateral(entry.newTokens))} USD</p>
                                        <div className='flex justify-between my-2'>
                                            <h3 className='font-medium'>
                                                {/* @ts-ignore */}
                                                Previous Allocation (as of {new Date(nextEntry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                            </h3>
                                            <h3 className='font-medium'>
                                                New Allocation (Effective {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                            </h3>
                                        </div>
                                        <div className='grid md:grid-cols-2 gap-4'>
                                            <Table className='border-collapse border'>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Symbol</TableHead>
                                                        <TableHead>Price</TableHead>
                                                        <TableHead>Tokens</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {/* @ts-ignore */}
                                                    {nextEntry.newTokens.map((token) => (
                                                        <TableRow key={token.id}>
                                                            <TableCell>{token.symbol}</TableCell>
                                                            <TableCell>${formatAmount(token.price)}</TableCell>
                                                            <TableCell>{formatAmount(token.noOfTokens)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <Table className='border-collapse border'>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Symbol</TableHead>
                                                        <TableHead>Price</TableHead>
                                                        <TableHead>Tokens</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {entry.newTokens.map((token) => (
                                                        <TableRow key={token.id}>
                                                            <TableCell>{token.symbol}</TableCell>
                                                            <TableCell>${formatAmount(token.price)}</TableCell>
                                                            <TableCell>{formatAmount(token.noOfTokens)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div>
                                            <RebalanceSwapsTable
                                                // @ts-ignore
                                                initialTokens={nextEntry.newTokens}
                                                rebalanceTokens={entry.newTokens}
                                                formatAmount={formatAmount}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
