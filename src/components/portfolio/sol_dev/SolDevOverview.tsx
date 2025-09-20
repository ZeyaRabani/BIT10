import React from 'react'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useQueries } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { formatAmount } from '@/lib/utils'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgeDollarSign, Waves, HandCoins, Banknote } from 'lucide-react'

export default function SolDevOverview() {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const wallet = useWallet();

    const formatAddress = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 4)}...${id.slice(-3)}`;
    };

    const fetchBIT10Balance = async (splMint: string, decimalPlaces: number) => {
        const tokenAddressPublicKey = new PublicKey(splMint);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const associatedTokenFrom = await getAssociatedTokenAddress(tokenAddressPublicKey, publicKey);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const fromAccount = await getAccount(connection, associatedTokenFrom);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const balance = ((parseFloat(fromAccount.amount.toString()) / 10 ** decimalPlaces).toFixed(4)).toString();

        return balance;
    };

    const fetchUserActiveLoansCount = async () => {
        return 0;
    };

    const fetchUserActiveTokensCount = async () => {
        return 0;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFIBalance'],
                queryFn: () => fetchBIT10Balance('5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K', 9)
            },
            {
                queryKey: ['userActiveLoansCount'],
                queryFn: () => fetchUserActiveLoansCount()
            },
            {
                queryKey: ['userActiveTokensCount'],
                queryFn: () => fetchUserActiveTokensCount()
            }
        ],
    });

    // ToDo: Remove Test BIT10.DEFI
    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10DEFITokenBalance = bit10Queries[0].data as number | undefined;
    const userActiveLoans = bit10Queries[1].data;
    const userActiveTokens = bit10Queries[2].data;

    const totalBIT10Tokens = (bit10DEFITokenBalance ?? 0);

    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between items-center'>
                <h1 className='text-center md:text-start text-3xl font-bold animate-fade-left-slow'>
                    Welcome back {wallet.publicKey ? formatAddress(wallet.publicKey.toString()) : 'Guest'}
                </h1>
                <Button className='animate-fade-right-slow' asChild>
                    <Link href='/buy'>Buy BIT10 Token</Link>
                </Button>
            </div>
            <TooltipProvider>
                {isLoading ? (
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Card className='flex flex-col h-full' key={index}>
                                <div className='p-2 space-y-2'>
                                    {['h-8 w-3/4', 'h-16'].map((classes, subIndex) => (
                                        <Skeleton key={subIndex} className={classes} />
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className='grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:grid-flow-row lg:grid-rows-auto lg:align-content-start w-full'>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger>
                                <Card className='flex flex-col h-full'>
                                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                        <CardTitle className='text-lg font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                            <p>BIT10 Tokens Owned</p>
                                        </CardTitle>
                                        <BadgeDollarSign />
                                    </CardHeader>
                                    <CardContent className='text-start text-2xl md:text-3xl font-bold'>
                                        {formatAmount(Number(totalBIT10Tokens))} BIT10
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center text-wrap'>
                                Your total holdings in the BIT10 index fund.
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={300}>
                            <TooltipTrigger>
                                <Card className='flex flex-col h-full'>
                                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                        <CardTitle className='text-lg font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                            <p>Liquidity Provided</p>
                                        </CardTitle>
                                        <Waves />
                                    </CardHeader>
                                    <CardContent className='text-start text-2xl md:text-3xl font-bold'>
                                        0 Pools
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center text-wrap'>
                                Assets you&apos;ve supplied to liquidity pools.
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={300}>
                            <TooltipTrigger>
                                <Card className='flex flex-col h-full'>
                                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                        <CardTitle className='text-lg font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                            <p>Active Loans</p>
                                        </CardTitle>
                                        <HandCoins />
                                    </CardHeader>
                                    <CardContent className='text-start text-2xl md:text-3xl font-bold'>
                                        {userActiveLoans} {Number(userActiveLoans) > 1 ? 'Loans' : 'Loan'}
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center text-wrap'>
                                Loans you&apos;ve given and are currently earning interest on.
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={300}>
                            <TooltipTrigger>
                                <Card className='flex flex-col h-full'>
                                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                        <CardTitle className='text-lg font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                            <p>Borrowed Amount</p>
                                        </CardTitle>
                                        <Banknote />
                                    </CardHeader>
                                    <CardContent className='text-start text-2xl md:text-3xl font-bold'>
                                        {userActiveTokens} {Number(userActiveTokens) > 1 ? 'Tokens' : 'Token'}
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center text-wrap'>
                                Total value you&apos;ve borrowed using your assets as collateral.
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </TooltipProvider>
        </div>
    )
}
