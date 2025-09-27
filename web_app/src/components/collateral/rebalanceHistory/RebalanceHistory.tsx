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

type BIT10RebalanceEntry = {
    timestmpz: string;
    indexValue: number;
    priceOfTokenToBuy: number;
    newTokens: CoinSetData[];
    added: CoinSetData[];
    removed: CoinSetData[];
    retained: CoinSetData[];
};

type RebalanceTrade = {
    sellToken: string;
    sellAmount: number;
    buyToken: string;
    buyAmount: number;
    valueUSD: number;
};

export default function RebalanceHistory({ index_fund }: { index_fund: string }) {
    const pathname = usePathname();

    const fetchBit10RebalanceHistory = async (tokenRebalanceAPI: string) => {
        const response = await fetch(`/bit10-rebalance-history-${tokenRebalanceAPI}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json() as BIT10RebalanceEntry[];
        return data;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPRebalance'],
                queryFn: () => fetchBit10RebalanceHistory('top')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPRebalanceHistory = bit10Queries[0].data;

    const bit10Token = (): BIT10RebalanceEntry[] => {
        if (pathname === '/collateral/top') {
            return bit10TOPRebalanceHistory ?? [];
        } else {
            return [];
        }
    };

    const selectedBIT10Token = bit10Token();

    const calculateTotalCollateral = (tokens: CoinSetData[]) =>
        tokens?.reduce((sum, t) => sum + t.price * t.noOfTokens, 0) ?? 0;

    const calculateRebalanceTrades = (prevTokens: CoinSetData[], newTokens: CoinSetData[]): RebalanceTrade[] => {
        const trades: RebalanceTrade[] = [];

        const prevMap = new Map(prevTokens.map(t => [t.symbol, t]));
        const newMap = new Map(newTokens.map(t => [t.symbol, t]));

        const prevTotalValue = calculateTotalCollateral(prevTokens);
        const newTotalValue = calculateTotalCollateral(newTokens);

        const VALUE_TOLERANCE = 0.05; // 5% tolerance
        const isRebalanceOnly = Math.abs(newTotalValue - prevTotalValue) / prevTotalValue < VALUE_TOLERANCE;

        if (!isRebalanceOnly) {
            return [];
        }

        const tokenValueChanges = new Map<string, { valueChange: number; newPrice: number; prevPrice: number }>();

        newTokens.forEach(newToken => {
            const prevToken = prevMap.get(newToken.symbol);
            const prevValue = prevToken ? prevToken.noOfTokens * prevToken.price : 0;
            const newValue = newToken.noOfTokens * newToken.price;
            const valueChange = newValue - prevValue;

            tokenValueChanges.set(newToken.symbol, {
                valueChange,
                newPrice: newToken.price,
                prevPrice: prevToken?.price ?? newToken.price
            });
        });

        prevTokens.forEach(prevToken => {
            if (!newMap.has(prevToken.symbol)) {
                const valueChange = -(prevToken.noOfTokens * prevToken.price);
                tokenValueChanges.set(prevToken.symbol, {
                    valueChange,
                    newPrice: prevToken.price,
                    prevPrice: prevToken.price
                });
            }
        });

        const MIN_TRADE_VALUE = 0.00000000001; // Minimum $0.00000000001 USD trade value
        const tokensToBuy: Array<{ symbol: string; valueNeeded: number; price: number }> = [];
        const tokensToSell: Array<{ symbol: string; valueToSell: number; price: number }> = [];

        tokenValueChanges.forEach((data, symbol) => {
            const absValueChange = Math.abs(data.valueChange);
            if (absValueChange < MIN_TRADE_VALUE) return;

            if (data.valueChange > 0) {
                tokensToBuy.push({
                    symbol,
                    valueNeeded: data.valueChange,
                    price: data.newPrice
                });
            } else if (data.valueChange < 0) {
                tokensToSell.push({
                    symbol,
                    valueToSell: absValueChange,
                    price: data.prevPrice
                });
            }
        });

        let sellIndex = 0;
        let buyIndex = 0;
        let remainingSellValue = tokensToSell[sellIndex]?.valueToSell ?? 0;
        let remainingBuyValue = tokensToBuy[buyIndex]?.valueNeeded ?? 0;

        while (sellIndex < tokensToSell.length && buyIndex < tokensToBuy.length) {
            const sellToken = tokensToSell[sellIndex];
            const buyToken = tokensToBuy[buyIndex];

            if (remainingSellValue <= 0 || remainingSellValue < MIN_TRADE_VALUE) {
                sellIndex++;
                remainingSellValue = tokensToSell[sellIndex]?.valueToSell ?? 0;
                continue;
            }

            if (remainingBuyValue <= 0 || remainingBuyValue < MIN_TRADE_VALUE) {
                buyIndex++;
                remainingBuyValue = tokensToBuy[buyIndex]?.valueNeeded ?? 0;
                continue;
            }

            const tradeValueUSD = Math.min(remainingSellValue, remainingBuyValue);

            if (tradeValueUSD < MIN_TRADE_VALUE) {
                if (remainingSellValue < remainingBuyValue) {
                    sellIndex++;
                    remainingSellValue = tokensToSell[sellIndex]?.valueToSell ?? 0;
                } else {
                    buyIndex++;
                    remainingBuyValue = tokensToBuy[buyIndex]?.valueNeeded ?? 0;
                }
                continue;
            }

            // @ts-ignore
            const sellAmount = tradeValueUSD / sellToken.price;
            // @ts-ignore
            const buyAmount = tradeValueUSD / buyToken.price;

            const normalizedSellAmount = Math.abs(sellAmount) < 1e-10 ? 0 : Number(sellAmount.toFixed(10));
            const normalizedBuyAmount = Math.abs(buyAmount) < 1e-10 ? 0 : Number(buyAmount.toFixed(10));
            const normalizedValueUSD = Math.abs(tradeValueUSD) < 0.01 ? 0 : Number(tradeValueUSD.toFixed(2));

            if (normalizedSellAmount > 0 && normalizedBuyAmount > 0 && normalizedValueUSD > 0) {
                trades.push({
                    // @ts-ignore
                    sellToken: sellToken.symbol,
                    sellAmount: normalizedSellAmount,
                    // @ts-ignore
                    buyToken: buyToken.symbol,
                    buyAmount: normalizedBuyAmount,
                    valueUSD: normalizedValueUSD
                });
            }

            remainingSellValue = Math.max(0, remainingSellValue - tradeValueUSD);
            remainingBuyValue = Math.max(0, remainingBuyValue - tradeValueUSD);
        }

        return trades;
    };

    const analyzeRebalanceReason = (prevTokens: CoinSetData[], newTokens: CoinSetData[]): {
        hasChanges: boolean;
        reason: string;
        type: 'growth' | 'identical' | 'minimal' | 'rebalance';
    } => {
        const prevTotal = calculateTotalCollateral(prevTokens);
        const newTotal = calculateTotalCollateral(newTokens);
        const prevMap = new Map(prevTokens.map(t => [t.symbol, t]));
        // const newMap = new Map(newTokens.map(t => [t.symbol, t]));

        const prevSymbols = new Set(prevTokens.map(t => t.symbol));
        const newSymbols = new Set(newTokens.map(t => t.symbol));
        const sameTokens = prevSymbols.size === newSymbols.size && [...prevSymbols].every(s => newSymbols.has(s));

        if (!sameTokens) {
            return {
                hasChanges: true,
                reason: 'Token composition changed',
                type: 'rebalance'
            };
        }

        const IDENTICAL_TOLERANCE = 1e-8;
        const isIdentical = newTokens.every(newToken => {
            const prevToken = prevMap.get(newToken.symbol);
            if (!prevToken) return false;
            return Math.abs(newToken.noOfTokens - prevToken.noOfTokens) < IDENTICAL_TOLERANCE;
        });

        if (isIdentical) {
            return {
                hasChanges: false,
                reason: 'Allocations are identical',
                type: 'identical'
            };
        }

        const growthRatio = newTotal / prevTotal;
        const GROWTH_TOLERANCE = 0.02; // 2% tolerance

        if (growthRatio > 1.02) { // At least 2% growth
            const isProportionalGrowth = newTokens.every(newToken => {
                const prevToken = prevMap.get(newToken.symbol);
                if (!prevToken) return false;

                const expectedNewAmount = prevToken.noOfTokens * growthRatio;
                const actualRatio = newToken.noOfTokens / expectedNewAmount;
                return Math.abs(actualRatio - 1) < GROWTH_TOLERANCE;
            });

            if (isProportionalGrowth) {
                const growthPercent = ((growthRatio - 1) * 100).toFixed(1);
                return {
                    hasChanges: false,
                    reason: `All positions grew proportionally by ~${growthPercent}%`,
                    type: 'growth'
                };
            }
        }

        const MIN_MEANINGFUL_TRADE = 0.00000001;
        let totalTradeValue = 0;

        newTokens.forEach(newToken => {
            const prevToken = prevMap.get(newToken.symbol);
            if (prevToken) {
                const changeValue = Math.abs((newToken.noOfTokens - prevToken.noOfTokens) * newToken.price);
                totalTradeValue += changeValue;
            }
        });

        if (totalTradeValue < MIN_MEANINGFUL_TRADE) {
            return {
                hasChanges: false,
                reason: 'Changes are negligible (less than $0.01 total)',
                type: 'minimal'
            };
        }

        const ALLOCATION_TOLERANCE = 0.0000001; // 0.00001% tolerance
        const sameAllocations = newTokens.every(newToken => {
            const prevToken = prevMap.get(newToken.symbol);
            if (!prevToken) return false;

            const prevAllocation = (prevToken.noOfTokens * prevToken.price) / prevTotal;
            const newAllocation = (newToken.noOfTokens * newToken.price) / newTotal;
            return Math.abs(prevAllocation - newAllocation) < ALLOCATION_TOLERANCE;
        });

        if (sameAllocations) {
            return {
                hasChanges: false,
                reason: 'Only price updates - allocations unchanged',
                type: 'minimal'
            };
        }

        return {
            hasChanges: true,
            reason: 'Portfolio rebalancing required',
            type: 'rebalance'
        };
    };

    return (
        <div className='py-4 bg-transparent'>
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
            ) : selectedBIT10Token?.length === 0 ? (
                <InformationCard message='No rebalance information available for this BIT10 token' />
            ) : (
                <Card className='dark:border-white w-full bg-transparent'>
                    <CardContent className='flex flex-col space-y-4 py-4'>
                        <h1 className='text-xl md:text-2xl font-semibold uppercase'>BIT10.{index_fund}</h1>
                        <div className='space-y-8'>
                            {selectedBIT10Token.map((entry, index) => {
                                if (index === selectedBIT10Token.length - 1) {
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

                                const nextEntry = selectedBIT10Token[index + 1];
                                // @ts-ignore
                                const rebalanceTrades = calculateRebalanceTrades(nextEntry.newTokens, entry.newTokens);
                                // @ts-ignore
                                const rebalanceAnalysis = analyzeRebalanceReason(nextEntry.newTokens, entry.newTokens);

                                return (
                                    <div key={entry.timestmpz} className='border p-4 rounded-lg'>
                                        <p className='font-semibold text-lg'>Rebalance Date: {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className='text-lg'>Index Value: {formatAmount(entry.indexValue)} USD</p>
                                        <p className='text-lg'>Total Collateral: {formatAmount(calculateTotalCollateral(entry.newTokens))} USD</p>

                                        {/* <div className={`rounded-lg p-3 my-3 ${rebalanceAnalysis.type === 'growth'
                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                            : rebalanceAnalysis.type === 'identical' || rebalanceAnalysis.type === 'minimal'
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                                : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                                            }`}>
                                            <p className={`font-medium ${rebalanceAnalysis.type === 'growth'
                                                ? 'text-green-700 dark:text-green-300'
                                                : rebalanceAnalysis.type === 'identical' || rebalanceAnalysis.type === 'minimal'
                                                    ? 'text-blue-700 dark:text-blue-300'
                                                    : 'text-orange-700 dark:text-orange-300'
                                                }`}>
                                                {rebalanceAnalysis.type === 'growth' && '📈 '}
                                                {rebalanceAnalysis.type === 'identical' && '🔄 '}
                                                {rebalanceAnalysis.type === 'minimal' && '📊 '}
                                                {rebalanceAnalysis.type === 'rebalance' && '⚖️ '}
                                                {rebalanceAnalysis.reason}
                                            </p>
                                        </div> */}

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

                                        {/* Rebalance Trades Table or No Trades Message */}
                                        <div className='mt-6'>
                                            <h3 className='font-medium mb-3'>Rebalance Trades</h3>
                                            {rebalanceTrades.length > 0 ? (
                                                <Table className='border-collapse border'>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Sell Token</TableHead>
                                                            <TableHead>Sell Amount</TableHead>
                                                            <TableHead className='text-center'>→</TableHead>
                                                            <TableHead>Buy Token</TableHead>
                                                            <TableHead>Buy Amount</TableHead>
                                                            <TableHead>Value (USD)</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {rebalanceTrades.map((trade, tradeIndex) => (
                                                            <TableRow key={tradeIndex}>
                                                                <TableCell className='font-medium text-red-600 dark:text-red-400'>{trade.sellToken}</TableCell>
                                                                <TableCell>{formatAmount(trade.sellAmount)}</TableCell>
                                                                <TableCell className='text-center text-gray-500'>→</TableCell>
                                                                <TableCell className='font-medium text-green-600 dark:text-green-400'>{trade.buyToken}</TableCell>
                                                                <TableCell>{formatAmount(trade.buyAmount)}</TableCell>
                                                                <TableCell>${formatAmount(trade.valueUSD)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <div className={`border rounded-lg p-4 ${rebalanceAnalysis.type === 'rebalance'
                                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                    }`}>
                                                    <p className={`text-center ${rebalanceAnalysis.type === 'rebalance'
                                                        ? 'text-yellow-700 dark:text-yellow-300'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {rebalanceAnalysis.type === 'rebalance'
                                                            ? `⚠️ ${rebalanceAnalysis.reason} - but no significant trades calculated (amounts too small)`
                                                            : `No trades required - ${rebalanceAnalysis.reason.toLowerCase()}`
                                                        }
                                                    </p>
                                                </div>
                                            )}
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
