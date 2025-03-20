"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import InformationCard from '@/components/InformationCard'
import { useQueries } from '@tanstack/react-query'
// import { toast } from 'sonner'
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

export default function RebalanceHistory({ index_fund }: { index_fund: string }) {
    const pathname = usePathname();

    const fetchBit10RebalanceHistory = async (tokenRebalanceAPI: string) => {
        const response = await fetch(`/bit10-rebalance-history-${tokenRebalanceAPI}`);

        if (!response.ok) {
            // toast.error('Error fetching BIT10 Rebalance History. Please try again!');
            return [];
        }

        const data = await response.json() as Bit10RebalanceEntry[];
        return data;
    };

    const fetchTestBit10RebalanceHistory = async (tokenRebalanceAPI: string) => {
        const response = await fetch(`/test-bit10-rebalance-history-${tokenRebalanceAPI.split('-').pop()}`);

        if (!response.ok) {
            // toast.error('Error fetching BIT10 Rebalance History. Please try again!');
            return [];
        }

        const data = await response.json() as Bit10RebalanceEntry[];
        return data;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10BRC20Rebalance'],
                queryFn: () => fetchBit10RebalanceHistory('brc20')
            },
            {
                queryKey: ['bit10TOPRebalance'],
                queryFn: () => fetchTestBit10RebalanceHistory('top')
            },
            {
                queryKey: ['bit10MEMERebalance'],
                queryFn: () => fetchTestBit10RebalanceHistory('meme')
            },
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10BRC20RebalanceHistory = bit10Queries[0].data;
    const bit10TOPRebalanceHistory = bit10Queries[1].data;
    const bit10MEMERebalanceHistory = bit10Queries[2].data;

    const bit10Token = (): Bit10RebalanceEntry[] => {
        if (pathname === '/collateral/brc20') {
            return bit10BRC20RebalanceHistory ?? [];
        } else if (pathname === '/collateral/top') {
            return bit10TOPRebalanceHistory ?? [];
        } else if (pathname === '/collateral/meme') {
            return bit10MEMERebalanceHistory ?? [];
        } else {
            return [];
        }
    };

    const selectedBit10Token = bit10Token();

    const formatTokenAmount = (value: number): string => {
        if (value === 0) return '0';

        const strValue = value.toFixed(10).replace(/\.?0+$/, '');
        const [integerPart, decimalPart = ''] = strValue.split('.');

        if (!decimalPart) return integerPart ?? '0';

        const firstNonZeroIndex = decimalPart.search(/[1-9]/);

        if (firstNonZeroIndex === -1) return integerPart ?? '0';

        const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);

        return `${integerPart}.${trimmedDecimal}`;
    };

    return (
        <>
            {selectedBit10Token?.length === 0 ?
                <InformationCard message='No rebalance information available for this BIT10 token' /> :
                <div className='py-4'>
                    <Card className='dark:border-white w-full'>
                        {isLoading ? (
                            <CardContent className='w-full animate-fade-left-slow'>
                                <div className='flex flex-col h-full space-y-2 pt-8'>
                                    {['h-12 w-28', 'h-72'].map((classes, index) => (
                                        <Skeleton key={index} className={classes} />
                                    ))}
                                </div>
                            </CardContent>
                        ) : (
                            <CardContent className='flex flex-col space-y-4 py-4'>
                                <h1 className='text-xl md:text-2xl font-semibold uppercase'>BIT10.{index_fund}</h1>
                                {selectedBit10Token?.map((rebalance, index) => (
                                    <div key={index} className='text-lg border p-2 md:p-4 py-6 rounded-md flex flex-col space-y-3'>
                                        <p className='font-semibold'>Rebalance Date: {new Date(rebalance.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p>Index Value: {rebalance.indexValue.toFixed(4)} USD</p>
                                        <p>Total Collateral: {(rebalance.priceOfTokenToBuy * rebalance.newTokens.length).toFixed(4)} USD</p>
                                        <div>
                                            <h1>New Tokens</h1>
                                            <div className='grid place-items-center w-full'>
                                                <Table className='border-collapse border'>
                                                    <TableHeader>
                                                        <TableRow className='text-left'>
                                                            <TableHead>Token</TableHead>
                                                            <TableHead>Price (in USD)</TableHead>
                                                            <TableHead>No. of Tokens</TableHead>
                                                            <TableHead>Total Price (in USD)</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {rebalance.newTokens.map((token, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className='font-medium'>{token.name} ({token.symbol})</TableCell>
                                                                <TableCell>{formatTokenAmount(token.price)}</TableCell>
                                                                <TableCell>{formatTokenAmount(token.noOfTokens)}</TableCell>
                                                                <TableCell>{formatTokenAmount(token.price * token.noOfTokens)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>

                                        <div>
                                            <h1>Added Tokens</h1>
                                            {rebalance.added.length === 0 ? (
                                                <p className='text-sm text-muted-foreground'>No token added</p>
                                            ) : (
                                                <div className='grid place-items-center w-full'>
                                                    <Table className='border-collapse border'>
                                                        <TableHeader>
                                                            <TableRow className='text-left'>
                                                                <TableHead>Token</TableHead>
                                                                <TableHead>Price (in USD)</TableHead>
                                                                <TableHead>No. of Tokens</TableHead>
                                                                <TableHead>Total Price (in USD)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {rebalance.added.map((token, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell className='font-medium'>{token.name} ({token.symbol})</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.price)}</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.noOfTokens)}</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.price * token.noOfTokens)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h1>Removed Tokens</h1>
                                            {rebalance.removed.length === 0 ? (
                                                <p className='text-sm text-muted-foreground'>No token removed</p>
                                            ) : (
                                                <div className='grid place-items-center w-full'>
                                                    <Table className='border-collapse border'>
                                                        <TableHeader>
                                                            <TableRow className='text-left'>
                                                                <TableHead>Token</TableHead>
                                                                <TableHead>Price (in USD)</TableHead>
                                                                <TableHead>No. of Tokens</TableHead>
                                                                <TableHead>Total Price (in USD)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {rebalance.removed.map((token, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell className='font-medium'>{token.name} ({token.symbol})</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.price)}</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.noOfTokens)}</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.price * token.noOfTokens)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h1>Retained Tokens</h1>
                                            {rebalance.retained.length === 0 ? (
                                                <p className='text-sm text-muted-foreground'>No token retained</p>
                                            ) : (
                                                <div className='grid place-items-center w-full'>
                                                    <Table className='border-collapse border'>
                                                        <TableHeader>
                                                            <TableRow className='text-left'>
                                                                <TableHead>Token</TableHead>
                                                                <TableHead>Price (in USD)</TableHead>
                                                                <TableHead>No. of Tokens</TableHead>
                                                                <TableHead>Total Price (in USD)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {rebalance.retained.map((token, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell className='font-medium'>{token.name} ({token.symbol})</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.price)}</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.noOfTokens)}</TableCell>
                                                                    <TableCell>{formatTokenAmount(token.price * token.noOfTokens)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </CardContent>
                        )}
                    </Card>
                </div>
            }
        </>
    )
}
