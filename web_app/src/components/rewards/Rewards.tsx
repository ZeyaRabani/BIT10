import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { DollarSignIcon, WalletIcon, ClockIcon, Loader2Icon, TicketIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/cashback.did'
import { idlFactory as buyIDLFactory } from '@/lib/buy.did'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueries, type UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchICPTokenBalance, claimICPCashback } from './icp/icpRewardsModule'
import { fetchBaseTokenBalance, claimBaseCashback } from './base/baseRewardsModule'
import { fetchSolanaTokenBalance, claimSolanaCashback } from './solana/solanaRewardsModule'
import { fetchBSCTokenBalance, claimBSCCashback } from './bsc/bscRewardsModule'
import { formatCompactPercentNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import USDCImg from '@/assets/tokens/usdc.svg'
import ckUSDCImg from '@/assets/tokens/ckusdc.svg'
import Image, { type StaticImageData } from 'next/image'

interface Transaction {
    token_in_amount: string;
    transaction_type: string;
    token_in_address: string;
    token_out_address: string;
    token_in_tx_hash: string;
    network: string;
    swap_id: string;
    token_out_tx_hash: string;
    user_wallet_address: string;
    transaction_timestamp: string;
    token_in_usd_amount: string;
    token_out_amount: string;
}

interface CashbackHistoryItem {
    user_transaction_activity: string;
    token_out_address: string;
    network: string;
    token_out_tx_hash: string;
    user_wallet_address: string;
    transaction_timestamp: string;
    cashback_id: string;
    token_out_amount: string;
    token_out_usd_amount: string;
}

interface RaffleEntries {
    userTickets: number;
    totalTickets: number;
}

interface ChainConfig {
    address: string;
    chainName: string;
    currency: string;
}

type ChainType = 'icp' | 'base' | 'solana' | 'bsc';

interface CashbackStatus {
    status: 'Live' | 'Ended';
    text: string;
}

interface CashbackActor {
    get_cashback_available_time?: () => Promise<string>;
    get_last_cashback_available_time?: () => Promise<string>;
    get_cashback_start_time?: () => Promise<string>;
    get_eligible_raffle_entry?: () => Promise<{ Ok: Transaction[] } | []>;
    get_cashback_history_by_address?: (address: string) => Promise<CashbackHistoryItem[]>;
}

interface BuyActor {
    get_buy_history_by_address_and_chain?: (address: string, chain: string) => Promise<Transaction[]>;
    get_sell_history_by_address_and_chain?: (address: string, chain: string) => Promise<Transaction[]>;
}

const CONSTANTS = {
    HOST: 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io',
    CASHBACK_CANISTER_ID: '5fll2-liaaa-aaaap-qqlwa-cai',
    BUY_CANISTER_ID: '6phs7-6yaaa-aaaap-qpvoq-cai',
    MIN_BIT10_TOKENS: 0.9,
    REWARD_POOL_AMOUNT: 100,
    CASHBACK_PERCENTAGE: 0.05,
    ICP_DECIMALS: 100_000_000,
    REFETCH_INTERVAL: 30_000
} as const;

const CHAIN_CONFIGS: Record<ChainType, (params: { icpAddress?: string, evmAddress?: string, solanaAddress?: string }) => ChainConfig | null> = {
    icp: ({ icpAddress }) => icpAddress ? { address: icpAddress, chainName: 'ICP', currency: 'ckUSDC' } : null,
    base: ({ evmAddress }) => evmAddress ? { address: evmAddress, chainName: 'Base', currency: 'USDC' } : null,
    solana: ({ solanaAddress }) => solanaAddress ? { address: solanaAddress, chainName: 'Solana', currency: 'USDC' } : null,
    bsc: ({ evmAddress }) => evmAddress ? { address: evmAddress, chainName: 'Binance Smart Chain', currency: 'USDC', } : null
}

const TOKEN_CONFIGS = {
    icp: { defi: 'bin4j-cyaaa-aaaap-qh7tq-cai', top: 'g37b3-lqaaa-aaaap-qp4hq-cai' },
    base: { top: '0x2d309c7c5fbbf74372edfc25b10842a7237b92de' },
    solana: { top: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1' },
    bsc: { top: '0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9' },
} as const;

export default function Rewards() {
    const [claimCashback, setClaimCashback] = useState(false);
    const [availableCountdown, setAvailableCountdown] = useState('00d:00h:00m:00s');
    const [availableLastCountdown, setAvailableLastCountdown] = useState('00d:00h:00m:00s');
    const [isAvailableCountdownPassed, setIsAvailableCountdownPassed] = useState(false);
    const [isLastCountdownPassed, setIsLastCountdownPassed] = useState(false);

    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { connected: isSolanaConnected, publicKey } = useWallet();
    const wallet = useWallet();

    const agent = useMemo(() => new HttpAgent({ host: CONSTANTS.HOST }), []);

    const cashbackActor = useMemo(() =>
        Actor.createActor(idlFactory, { agent, canisterId: CONSTANTS.CASHBACK_CANISTER_ID }) as CashbackActor,
        [agent]
    );

    const buyActor = useMemo(() =>
        Actor.createActor(buyIDLFactory, { agent, canisterId: CONSTANTS.BUY_CANISTER_ID }) as BuyActor,
        [agent]
    );

    const parseBigIntSafe = useCallback((val: unknown): bigint => {
        try {
            if (typeof val === 'bigint') return val;
            if (typeof val === 'number' || typeof val === 'string') return BigInt(val);
            if (val != null && typeof val === 'object') {
                const toStringFn = (val as { toString?: unknown }).toString;
                if (typeof toStringFn === 'function') {
                    const toStr = (toStringFn as () => string).call(val);
                    if (typeof toStr === 'string' && toStr !== '[object Object]' && toStr !== '' && toStr !== 'undefined' && toStr !== 'null') {
                        return BigInt(toStr);
                    }
                };
            };
        } catch {
            toast.error('Error parsing bigint value.');
        };
        return BigInt(0);
    }, []);

    const getChainConfig = useCallback((): ChainConfig | null => {
        if (!chain) return null;
        const configFn = CHAIN_CONFIGS[chain as ChainType];
        return configFn?.({
            icpAddress: icpAddress ?? undefined,
            evmAddress: evmAddress ?? undefined,
            solanaAddress: wallet.publicKey?.toBase58(),
        });
    }, [chain, icpAddress, evmAddress, wallet.publicKey]);

    const fetchCashbackAvailableTime = useCallback(async () => {
        try {
            return (await cashbackActor.get_cashback_available_time?.()) ?? '0';
        } catch {
            toast.error('Error fetching cashback available time.');
            return '0';
        };
    }, [cashbackActor]);

    const fetchLastCashbackAvailableTime = useCallback(async () => {
        try {
            return (await cashbackActor.get_last_cashback_available_time?.()) ?? '0';
        } catch {
            toast.error('Error fetching last cashback available time.');
            return '0';
        };
    }, [cashbackActor]);

    const fetchCashbackStartTime = useCallback(async () => {
        try {
            const startTimeRaw = await cashbackActor.get_cashback_start_time?.();
            return startTimeRaw?.toString() ?? '0';
        } catch {
            toast.error('Error fetching cashback start time.');
            return '0';
        }
    }, [cashbackActor]);

    const filterValidTransactions = useCallback(
        (transactions: Transaction[]): Transaction[] => {
            return transactions.filter(
                (tx) => tx && tx.transaction_type !== 'Reverted'
            );
        }, []);

    const fetchRaffleEntries = useCallback(async (): Promise<RaffleEntries> => {
        try {
            const lastCashbackAvailableTimeRaw = (await cashbackActor.get_last_cashback_available_time?.()) ?? '0';

            const now = BigInt(Date.now()) * BigInt(1_000_000);
            const lastAvailableTime = parseBigIntSafe(lastCashbackAvailableTimeRaw);
            if (now > lastAvailableTime) {
                return { userTickets: 0, totalTickets: 0 }
            };

            const config = getChainConfig();
            if (!config?.address) {
                return { userTickets: 0, totalTickets: 0 };
            }

            const raffleEntriesResult = await cashbackActor.get_eligible_raffle_entry?.();

            if (!raffleEntriesResult || typeof raffleEntriesResult !== 'object' || !('Ok' in raffleEntriesResult)) {
                return { userTickets: 0, totalTickets: 0 };
            }

            const allEntries = raffleEntriesResult.Ok;
            const validEntries = filterValidTransactions(allEntries);

            const userEntries = validEntries.filter((tx) => tx.user_wallet_address === config.address && tx.network === config.chainName);

            return {
                userTickets: userEntries.length,
                totalTickets: validEntries.length
            };
        } catch {
            toast.error('Error fetching raffle entries.');
            return { userTickets: 0, totalTickets: 0 };
        };
    }, [cashbackActor, parseBigIntSafe, getChainConfig, filterValidTransactions]);

    const fetchCashbackAmount = useCallback(async (): Promise<string> => {
        try {
            const [cashbackStartTimeRaw, cashbackLastAvailableTimeRaw] = await Promise.all([
                cashbackActor.get_cashback_start_time?.() ?? '0',
                cashbackActor.get_last_cashback_available_time?.() ?? '0',
            ]);

            const now = BigInt(Date.now()) * BigInt(1_000_000);
            const lastAvailableTime = parseBigIntSafe(cashbackLastAvailableTimeRaw);

            const config = getChainConfig();

            if (now > lastAvailableTime || !config) {
                return (`0 ${chain === 'icp' ? 'ckUSDC' : 'USDC'}`);
            }

            const cashbackStartTime = parseBigIntSafe(cashbackStartTimeRaw);

            const [buyHistory, sellHistory] = await Promise.all([
                buyActor.get_buy_history_by_address_and_chain?.(config.address, config.chainName) ?? [],
                buyActor.get_sell_history_by_address_and_chain?.(config.address, config.chainName) ?? [],
            ]);

            const validBuyTransactions = filterValidTransactions(buyHistory);
            const validSellTransactions = filterValidTransactions(sellHistory);

            let totalTokenAmount = 0;

            [...validBuyTransactions, ...validSellTransactions].forEach(
                (tx) => {
                    if (BigInt(tx.transaction_timestamp) > cashbackStartTime) {
                        const amount = tx.transaction_type === 'Buy' ? parseFloat(tx.token_out_amount) : parseFloat(tx.token_in_amount);
                        totalTokenAmount += amount;
                    }
                }
            );

            if (totalTokenAmount < CONSTANTS.MIN_BIT10_TOKENS) {
                return (`0 ${config.currency}`);
            };

            const totalUSDAmount = validBuyTransactions.reduce(
                (sum, tx) => {
                    if (BigInt(tx.transaction_timestamp) > cashbackStartTime) {
                        return sum + parseFloat(tx.token_in_usd_amount);
                    }
                    return sum;
                }, 0
            );

            const cashbackAmount = (totalUSDAmount / 1.01) * CONSTANTS.CASHBACK_PERCENTAGE;
            return (`${cashbackAmount.toFixed(2)} ${config.currency}`);
        } catch {
            toast.error('Error fetching cashback amount.');
            return (`0 ${chain === 'icp' ? 'ckUSDC' : 'USDC'}`);
        }
    }, [cashbackActor, buyActor, parseBigIntSafe, getChainConfig, filterValidTransactions, chain]);

    const fetchCashbackHistory = useCallback(async (): Promise<CashbackHistoryItem[]> => {
        try {
            const userAddress = chain === 'icp' ? icpAddress : chain === 'solana' ? wallet.publicKey?.toBase58() : evmAddress;

            if (!userAddress) return [];

            return ((await cashbackActor.get_cashback_history_by_address?.(userAddress)) ?? []);
        } catch {
            toast.error('Failed to fetch cashback history.');
            return [];
        }
    }, [chain, icpAddress, evmAddress, wallet.publicKey, cashbackActor]);

    const rewardsQueriesConfig = useMemo((): UseQueryOptions<unknown, unknown, unknown, readonly unknown[]>[] => {
        const queries: UseQueryOptions<unknown, unknown, unknown, readonly unknown[]>[] = [
            {
                queryKey: ['cashbackAvailableTimeQuery'] as const,
                queryFn: fetchCashbackAvailableTime
            },
            {
                queryKey: ['cashbackLastAvailableTimeQuery'] as const,
                queryFn: fetchLastCashbackAvailableTime
            },
            {
                queryKey: ['cashbackStartTimeQuery'] as const,
                queryFn: fetchCashbackStartTime
            },
            {
                queryKey: ['cashbackAmountQuery'] as const,
                queryFn: fetchCashbackAmount,
                refetchInterval: CONSTANTS.REFETCH_INTERVAL
            },
            {
                queryKey: ['raffleEntriesQuery'] as const,
                queryFn: fetchRaffleEntries,
                refetchInterval: CONSTANTS.REFETCH_INTERVAL
            },
            {
                queryKey: ['cashbackHistoryQuery', chain, icpAddress, evmAddress, wallet?.publicKey?.toBase58()] as const,
                queryFn: fetchCashbackHistory,
                refetchInterval: CONSTANTS.REFETCH_INTERVAL
            }
        ];

        if (chain === 'icp' && isICPConnected && icpAddress) {
            queries.push(
                {
                    queryKey: ['bit10DEFIBalanceICP'] as const,
                    queryFn: (): Promise<bigint> => fetchICPTokenBalance({ canisterId: TOKEN_CONFIGS.icp.defi, address: icpAddress }) as Promise<bigint>
                },
                {
                    queryKey: ['bit10TOPBalanceICP'] as const,
                    queryFn: (): Promise<bigint> => fetchICPTokenBalance({ canisterId: TOKEN_CONFIGS.icp.top, address: icpAddress }) as Promise<bigint>
                }
            )
        }

        if (chain === 'base' && isEVMConnected && evmAddress) {
            queries.push({
                queryKey: ['bit10TOPBalanceBase'] as const,
                queryFn: () => fetchBaseTokenBalance({ tokenAddress: TOKEN_CONFIGS.base.top, address: evmAddress })
            });
        }

        if (chain === 'solana' && isSolanaConnected && publicKey) {
            queries.push({
                queryKey: ['bit10TOPBalanceSolana'] as const,
                queryFn: () => fetchSolanaTokenBalance({ tokenAddress: TOKEN_CONFIGS.solana.top, publicKey, decimals: 9 })
            });
        }

        if (chain === 'bsc' && isEVMConnected && evmAddress) {
            queries.push({
                queryKey: ['bit10TOPBalanceBSC'] as const,
                queryFn: () => fetchBSCTokenBalance({ tokenAddress: TOKEN_CONFIGS.bsc.top, address: evmAddress })
            });
        }

        return queries;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, isICPConnected, isEVMConnected, isSolanaConnected, icpAddress, evmAddress, publicKey, fetchCashbackAvailableTime, fetchLastCashbackAvailableTime, fetchCashbackStartTime, fetchCashbackAmount, fetchRaffleEntries, fetchCashbackHistory]);

    const rewardsQueries = useQueries({ queries: rewardsQueriesConfig });

    const isLoading = rewardsQueries.some((query) => query.isLoading) || rewardsQueries.some((query) => query.isFetching && !query.data);

    const cashbackAvailableTime = rewardsQueries[0]?.data as string;
    const cashbackLastAvailableTime = rewardsQueries[1]?.data as string;
    const cashbackStartTime = rewardsQueries[2]?.data as string;
    const cashbackAmount = rewardsQueries[3]?.data as string;
    const raffleEntries = rewardsQueries[4]?.data as | RaffleEntries | undefined;
    const cashbackHistory = rewardsQueries[5]?.data as | CashbackHistoryItem[] | undefined;

    let currentIndex = 6;
    const icpDEFIQueryIndex = chain === 'icp' && isICPConnected ? currentIndex : -1;
    if (chain === 'icp' && isICPConnected) currentIndex += 2;

    const baseQueryIndex = chain === 'base' && isEVMConnected ? currentIndex : -1;
    if (chain === 'base' && isEVMConnected) currentIndex++;

    const solanaQueryIndex = chain === 'solana' && isSolanaConnected && publicKey ? currentIndex : -1;
    if (chain === 'solana' && isSolanaConnected && publicKey) currentIndex++;

    const bscQueryIndex = chain === 'bsc' && isEVMConnected ? currentIndex : -1;

    const icpBIT10DEFITokenBalance = icpDEFIQueryIndex >= 0 ? (rewardsQueries[icpDEFIQueryIndex]?.data as bigint | undefined) : undefined;
    const icpBIT10TOPTokenBalance = icpDEFIQueryIndex >= 0 ? (rewardsQueries[icpDEFIQueryIndex + 1]?.data as | bigint | undefined) : undefined;

    const baseBIT10TOPTokenBalance = baseQueryIndex >= 0 ? (rewardsQueries[baseQueryIndex]?.data as string | undefined) : undefined;
    const solanaBIT10TOPTokenBalance = solanaQueryIndex >= 0 ? (rewardsQueries[solanaQueryIndex]?.data as string | undefined) : undefined;
    const bscBIT10TOPTokenBalance = bscQueryIndex >= 0 ? (rewardsQueries[bscQueryIndex]?.data as string | undefined) : undefined;

    const formatCountdown = useCallback(
        (nanosecondsStr: string): string => {
            if (!nanosecondsStr || nanosecondsStr === '0') return '00d:00h:00m:00s';
            try {
                const nanoseconds = BigInt(nanosecondsStr);
                const currentTimeNanoseconds = BigInt(Date.now()) * BigInt(1000000);
                if (nanoseconds <= currentTimeNanoseconds) return '00d:00h:00m:00s';
                const diffNanoseconds = nanoseconds - currentTimeNanoseconds;
                const diffSeconds = Number(diffNanoseconds / BigInt(1000000000));
                const days = Math.floor(diffSeconds / (24 * 60 * 60));
                const hours = Math.floor((diffSeconds % (24 * 60 * 60)) / (60 * 60));
                const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);
                const seconds = Math.floor(diffSeconds % 60);
                return `${days.toString().padStart(2, '0')}d:${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
            } catch {
                return '00d:00h:00m:00s';
            };
        },
        []
    );

    const checkIfCountdownPassed = useCallback(
        (nanosecondsStr: string): boolean => {
            if (!nanosecondsStr || nanosecondsStr === '0') return true;
            try {
                const nanoseconds = BigInt(nanosecondsStr);
                const currentTimeNanoseconds = BigInt(Date.now()) * BigInt(1000000);
                return nanoseconds <= currentTimeNanoseconds;
            } catch {
                return true;
            }
        },
        []
    );

    const formatEndedDate = useCallback((nanosecondsStr: string): string => {
        if (!nanosecondsStr || nanosecondsStr === '0') return '';
        try {
            const nanoseconds = BigInt(nanosecondsStr);
            const milliseconds = Number(nanoseconds / BigInt(1000000));
            const date = new Date(milliseconds);

            const day = date.getDate();
            const dayWithOrdinal = day + (['th', 'st', 'nd', 'rd'][day % 100 > 10 && day % 100 < 14 ? 0 : Math.min(day % 10, 3)] ?? 'th');

            const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return (`${dayWithOrdinal} ${month} ${year} ${hours}:${minutes}`);
        } catch {
            return '';
        }
    }, []);

    useEffect(() => {
        if (!cashbackAvailableTime && !cashbackLastAvailableTime) return;
        const updateCountdowns = () => {
            setAvailableCountdown(formatCountdown(cashbackAvailableTime));
            setAvailableLastCountdown(formatCountdown(cashbackLastAvailableTime));
            setIsAvailableCountdownPassed(checkIfCountdownPassed(cashbackAvailableTime));
            setIsLastCountdownPassed(checkIfCountdownPassed(cashbackLastAvailableTime));
        };
        updateCountdowns();
        const interval = setInterval(updateCountdowns, 1000);
        return () => clearInterval(interval);
    }, [cashbackAvailableTime, cashbackLastAvailableTime, formatCountdown, checkIfCountdownPassed]);

    const hasClaimedInCurrentRound = useMemo(() => {
        if (!cashbackHistory || !cashbackStartTime || !cashbackLastAvailableTime) return false;

        try {
            const startTime = BigInt(cashbackStartTime);
            const endTime = BigInt(cashbackLastAvailableTime);

            return cashbackHistory.some((record) => {
                const txTime = BigInt(record.transaction_timestamp);
                return txTime >= startTime && txTime <= endTime && record.cashback_id?.trim() !== '';
            });
        } catch {
            toast.error('Error checking cashback claim status.');
            return false;
        }
    }, [cashbackHistory, cashbackStartTime, cashbackLastAvailableTime]);

    const totalBIT10Tokens = useMemo(() => {
        if (chain === 'icp' && isICPConnected) {
            return ((Number(icpBIT10DEFITokenBalance ?? 0) + Number(icpBIT10TOPTokenBalance ?? 0)) / CONSTANTS.ICP_DECIMALS);
        } else if (chain === 'base' && isEVMConnected) {
            return Number(baseBIT10TOPTokenBalance ?? 0);
        } else if (chain === 'solana' && isSolanaConnected) {
            return Number(solanaBIT10TOPTokenBalance ?? 0);
        } else if (chain === 'bsc' && isEVMConnected) {
            return Number(bscBIT10TOPTokenBalance ?? 0);
        }
        return 0;
    }, [chain, isICPConnected, isEVMConnected, isSolanaConnected, icpBIT10DEFITokenBalance, icpBIT10TOPTokenBalance, baseBIT10TOPTokenBalance, solanaBIT10TOPTokenBalance, bscBIT10TOPTokenBalance])

    const claimReward = useCallback(async () => {
        try {
            setClaimCashback(true);
            if (chain === 'icp' && icpAddress) {
                await claimICPCashback({ walletAddress: icpAddress });
            } else if (chain === 'base' && evmAddress) {
                await claimBaseCashback({ walletAddress: evmAddress });
            } else if (chain === 'solana' && wallet.publicKey) {
                await claimSolanaCashback({ walletAddress: wallet.publicKey.toBase58() });
            } else if (chain === 'bsc' && evmAddress) {
                await claimBSCCashback({ walletAddress: evmAddress });
            }
        } catch {
            toast.error('An error occurred. Please try again!');
        } finally {
            setClaimCashback(false);
        }
    }, [chain, icpAddress, evmAddress, wallet.publicKey]);

    const getClaimStatusText = useCallback(() => {
        if (isLastCountdownPassed) {
            return 'Next cashback round starting soon...';
        }
        if (parseFloat(cashbackAmount) <= 0) {
            return 'No purchase made after cashback round started.';
        } else if (hasClaimedInCurrentRound) {
            return 'You have already claimed this round.';
        } else if (isAvailableCountdownPassed) {
            return `Claim before ${availableLastCountdown}`;
        } else {
            return `Ready to claim in ${availableCountdown}`;
        }
    }, [isLastCountdownPassed, cashbackAmount, hasClaimedInCurrentRound, isAvailableCountdownPassed, availableLastCountdown, availableCountdown]);

    const isClaimButtonDisabled = !chain || isLoading || claimCashback || totalBIT10Tokens <= CONSTANTS.MIN_BIT10_TOKENS || parseFloat(cashbackAmount) <= 0 || isLastCountdownPassed || !isAvailableCountdownPassed || hasClaimedInCurrentRound;

    const getClaimButtonText = useCallback(() => {
        if (!chain) return 'Connect your wallet to continue';
        if (isLoading) return 'Loading...';
        if (claimCashback) return 'Processing...';
        if (totalBIT10Tokens <= CONSTANTS.MIN_BIT10_TOKENS) return 'Not Eligible';
        if (!isAvailableCountdownPassed) return 'Not Ready to Claim';
        if (isLastCountdownPassed) return 'Round Starting Soon';
        if (hasClaimedInCurrentRound) return 'Already Claimed';
        return 'Claim Cashback';
    }, [chain, isLoading, claimCashback, totalBIT10Tokens, isAvailableCountdownPassed, isLastCountdownPassed, hasClaimedInCurrentRound]);

    const cashbackStatus = useMemo((): CashbackStatus => {
        if (isLastCountdownPassed) {
            return {
                status: 'Ended',
                text: `Ended on ${formatEndedDate(cashbackLastAvailableTime)}`,
            };
        }
        return {
            status: 'Live',
            text: `Ends in ${availableLastCountdown}`,
        };
    }, [isLastCountdownPassed, cashbackLastAvailableTime, availableLastCountdown, formatEndedDate]);

    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex flex-col items-center'>
                <motion.h1 className='text-2xl md:text-4xl font-semibold text-center text-golden' initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    Cashback & Reward Pool
                </motion.h1>
            </div>

            {isLoading ? (
                <div className='grid md:grid-cols-4 gap-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className='border-2 p-4 flex flex-col space-y-2'>
                            <Skeleton className='w-full h-28' />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className='grid md:grid-cols-4 gap-4'>
                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <WalletIcon strokeWidth={2.5} size='24' />
                            <span className='text-lg md:text-xl'>Your BIT10 Token Holdings</span>
                        </div>
                        <div className='text-4xl font-semibold'>
                            {formatCompactPercentNumber(totalBIT10Tokens)} BIT10.TOP
                        </div>
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <ClockIcon strokeWidth={2.5} size='24' />
                            <span className='text-lg md:text-xl'>Cashback Pending</span>
                        </div>
                        <div className='text-4xl font-semibold'>{cashbackAmount}</div>
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <DollarSignIcon strokeWidth={2.5} size='24' />
                            <span className='text-lg md:text-xl'>Current Reward Pool</span>
                        </div>
                        <div className='text-4xl font-semibold'>{CONSTANTS.REWARD_POOL_AMOUNT} {chain === 'icp' ? 'ckUSDC' : 'USDC'}</div>
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <TicketIcon strokeWidth={2.5} size='24' />
                            <span className='text-lg md:text-xl'>Your Reward Pool Tickets</span>
                        </div>
                        <div className='text-4xl font-semibold'>{raffleEntries?.userTickets ?? 0}</div>
                    </Card>
                </div>
            )}

            <div className='grid md:grid-cols-2 gap-4'>
                <div className='flex flex-col space-y-4'>
                    <Card className='border-2 p-4 flex flex-col space-y-4 items-center'>
                        <div className='flex flex-col md:flex-row items-center justify-between w-full space-y-2 md:space-y-0'>
                            <motion.div className='inline-flex p-[1.5px] rounded-full' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                <div className='px-3 py-1 rounded-full text-sm bg-card text-foreground font-medium min-w-fit'>
                                    {cashbackStatus.status}
                                </div>
                            </motion.div>

                            <motion.div className='inline-flex p-[1.5px] rounded-full' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                <div className='px-3 py-1 rounded-full text-sm bg-muted min-w-fit'>
                                    {cashbackStatus.text}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div className='text-xl md:text-3xl font-semibold text-center text-golden' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                            5% Cashback
                        </motion.div>

                        <Image src={(chain === 'icp' ? ckUSDCImg : USDCImg) as StaticImageData} alt='USDC' width={96} height={96} />

                        <div className='text-xl md:text-2xl'>{cashbackAmount}</div>

                        <motion.button onClick={claimReward} disabled={isClaimButtonDisabled} className='px-6 py-2 text-black font-semibold rounded-full border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed' style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                            {claimCashback && (
                                <Loader2Icon className='mr-2 animate-spin inline-block' size={15} />
                            )}
                            {getClaimButtonText()}
                        </motion.button>

                        <div className='text-center'>
                            {totalBIT10Tokens < CONSTANTS.MIN_BIT10_TOKENS ? (
                                <p className='text-center text-red-500'>Need &gt; {CONSTANTS.MIN_BIT10_TOKENS} BIT10.TOP for cashback.</p>
                            ) : (
                                <p>{getClaimStatusText()}</p>
                            )}
                        </div>
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-4'>
                        <div>
                            <h3 className='text-xl font-semibold'>Actions Required</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1'>
                                <li><b>Buy & Hold:</b> Buy and hold at least {CONSTANTS.MIN_BIT10_TOKENS} BIT10.TOP during the cashback round to earn 5% cashback. <br />
                                    <span className='text-gray-400'>Example: Buy & hold 2 BIT10.TOP → receive cashback equal to 5% of 2 BIT10.TOP.</span>
                                </li>
                                <li><b>Claim on Time:</b> Cashback must be claimed within 24 hours after the claim window opens.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Eligibility & Rules</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1'>
                                <li><b>Minimum Holding:</b> You must hold at least {CONSTANTS.MIN_BIT10_TOKENS} BIT10.TOP to qualify.</li>
                                <li><b>Cashback Basis:</b> Cashback is calculated only on tokens you purchased and did not sell.</li>
                                <li><b>Claim Window:</b> Cashback can be claimed after the round starts and before it ends.</li>
                                <li><b>Selling Tokens:</b> Only BIT10.TOP tokens you still hold during the cashback round are counted. Any tokens sold before or during the round do not earn cashback.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Examples</h3>
                            <ul className='list-disc pl-5 mt-1'>
                                <li>Buy 2 BIT10.TOP and hold through the cashback round → earn 5% cashback.</li>
                                <li>Buy 2 BIT10.TOP but sell 0.8 before the cashback round ends → 5% cashback is calculated only on 1.2 BIT10.TOP.</li>
                            </ul>
                        </div>
                    </Card>
                </div>

                <div className='flex flex-col space-y-4'>
                    <Card className='border-2 p-4 flex flex-col space-y-4 items-center'>
                        <div className='flex flex-col md:flex-row items-center justify-between w-full space-y-2 md:space-y-0'>
                            <motion.div className='inline-flex p-[1.5px] rounded-full' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                <div className='px-3 py-1 rounded-full text-sm bg-card text-foreground font-medium min-w-fit'>
                                    {cashbackStatus.status}
                                </div>
                            </motion.div>

                            <motion.div className='inline-flex p-[1.5px] rounded-full' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                <div className='px-3 py-1 rounded-full text-sm bg-muted min-w-fit'>
                                    {cashbackStatus.text}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div className='text-xl md:text-3xl font-semibold text-center text-golden' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                            Reward Pool
                        </motion.div>

                        <Image src={(chain === 'icp' ? ckUSDCImg : USDCImg) as StaticImageData} alt='USDC' width={96} height={96} />

                        <div className='text-xl md:text-2xl'>{CONSTANTS.REWARD_POOL_AMOUNT} {chain === 'icp' ? 'ckUSDC' : 'USDC'}</div>

                        <div className='flex flex-wrap justify-center gap-2'>
                            <Button variant='outline' className='bg-accent'>Your Tickets: {raffleEntries?.userTickets ?? 0}</Button>
                            <Button variant='outline' className='bg-accent'>Total Tickets Sold: {raffleEntries?.totalTickets ?? 0}</Button>
                            <Button variant='outline' className='bg-accent'>Win Chance: ~{formatCompactPercentNumber(raffleEntries && raffleEntries.totalTickets > 0 ? (raffleEntries.userTickets / raffleEntries.totalTickets) * 100 : 0)}%</Button>
                        </div>

                        {raffleEntries && raffleEntries.userTickets > 0 ? (
                            <p className='text-center text-primary'>You are automatically entered into the Reward Pool raffle!</p>
                        ) : (
                            <p className='text-center'>Purchase BIT10.TOP tokens to receive Reward Pool tickets.</p>
                        )}
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-4'>
                        <div>
                            <h3 className='text-xl font-semibold'>Actions Required</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1'>
                                <li><b>Buy:</b> Purchase BIT10.TOP tokens to receive Reward Pool tickets.</li>
                                <li><b>Auto-Entry:</b> Users are automatically entered into the Reward Pool raffle after purchase of BIT10.TOP tokens.</li>
                                <li><b>Tickets:</b> Amount of BIT10.TOP tokens purchased = amount of Reward Pool tickets.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Eligibility & Rules</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1'>
                                <li><b>Purchase Requirement:</b> Users must purchase BIT10.TOP tokens during cashback round to be eligible for Reward Pool tickets & raffle.</li>
                                <li><b>Ticket Allocation:</b> Tickets are awarded based on the amount of BIT10.TOP tokens purchased.</li>
                                <li><b>No Ticket Reduction on Selling:</b> Selling BIT10.TOP tokens does not reduce the amount of Reward Pool tickets earned.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Examples</h3>
                            <ul className='list-disc pl-5 mt-1'>
                                <li>Purchase 1 BIT10.TOP token = 1 Reward Pool ticket</li>
                                <li>Purchase 5 BIT10.TOP tokens = 5 Reward Pool tickets</li>
                            </ul>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
