import React from 'react'
import { useICPWallet } from '@/context/ICPWalletContext'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { toast } from 'sonner'
import { useQueries } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgeDollarSign, Waves, HandCoins, Banknote } from 'lucide-react'

export default function ICPOverview() {
    const { ICPAddress } = useICPWallet();

    const formatAddress = (id: string | undefined) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 4)}...${id.slice(-3)}`;
    };

    const fetchBit10Balance = async (canisterId: string) => {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        if (ICPAddress) {
            const account = {
                owner: Principal.fromText(ICPAddress),
                subaccount: [],
            };
            if (actor && actor.icrc1_balance_of) {
                try {
                    const balance = await actor.icrc1_balance_of(account);
                    return balance;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while fetching user portfolio. Please try again!');
                }
            } else {
                toast.error('An error occurred while fetching user portfolio. Please try again!');
                return 0n;
            }
        }
    }

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10DEFIBalance'],
                queryFn: () => fetchBit10Balance('hbs3g-xyaaa-aaaap-qhmna-cai')
            },
            {
                queryKey: ['bit10BRC20Balance'],
                queryFn: () => fetchBit10Balance('uv4pt-4qaaa-aaaap-qpuxa-cai')
            },
            {
                queryKey: ['bit10TOPBalance'],
                queryFn: () => fetchBit10Balance('wbckh-zqaaa-aaaap-qpuza-cai')
            },
            {
                queryKey: ['bit10MEMEBalance'],
                queryFn: () => fetchBit10Balance('yeoei-eiaaa-aaaap-qpvzq-cai')
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10DEFITokenBalance = bit10Queries[0].data as bigint | undefined;
    const bit10BRC20TokenBalance = bit10Queries[1].data as bigint | undefined;
    const bit10TOPTokenBalance = bit10Queries[2].data as bigint | undefined;
    const bit10MEMETokenBalance = bit10Queries[3].data as bigint | undefined;

    const totalBit10Tokens = Number((bit10DEFITokenBalance ?? 0n) + (bit10BRC20TokenBalance ?? 0n) + (bit10TOPTokenBalance ?? 0n) + (bit10MEMETokenBalance ?? 0n)) / 100000000;

    const formatTokenAmount = (value: number | null | undefined): string => {
        if (value === null || value === undefined || isNaN(value)) return '0';
        if (value === 0) return '0';
        const strValue = value.toFixed(10).replace(/\.?0+$/, '');
        const [integerPart, decimalPart = ''] = strValue.split('.');
        const formattedInteger = Number(integerPart).toLocaleString();

        if (!decimalPart) return formattedInteger || '0';

        const firstNonZeroIndex = decimalPart.search(/[1-9]/);

        if (firstNonZeroIndex === -1) return formattedInteger || '0';

        const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);

        return `${formattedInteger}.${trimmedDecimal}`;
    };

    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between items-center'>
                <h1 className='text-center md:text-start text-3xl font-bold animate-fade-left-slow'>
                    Welcome back {ICPAddress ? formatAddress(ICPAddress) : 'Guest'}
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
                                        {formatTokenAmount(totalBit10Tokens)} BIT10
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
                                        0 Loans
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center text-wrap'>
                                Loans you$apos;ve given and are currently earning interest on.
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
                                        0 Tokens
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
