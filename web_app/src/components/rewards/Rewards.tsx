import React, { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { DollarSignIcon, WalletIcon, ClockIcon, Loader2Icon, XIcon, TicketIcon } from 'lucide-react'
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

interface ChainConfig {
    address: string;
    chainName: string;
    currency: string;
}

type ChainType = 'icp' | 'base' | 'solana' | 'bsc';

export default function Rewards() {
    const [claimCashback, setClaimCashback] = useState<boolean>(false);
    const [availableCountdown, setAvailableCountdown] = useState<string>('00d:00h:00m:00s');
    const [availableLastCountdown, setAvailableLastCountdown] = useState<string>('00d:00h:00m:00s');
    const [isAvailableCountdownPassed, setIsAvailableCountdownPassed] = useState<boolean>(false);
    const [isLastCountdownPassed, setIsLastCountdownPassed] = useState<boolean>(false);

    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { connected: isSolanaConnected, publicKey } = useWallet();
    const wallet = useWallet();

    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
    const canisterId = '5fll2-liaaa-aaaap-qqlwa-cai';
    const buyCanisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';
    const agent = new HttpAgent({ host });
    const actor = Actor.createActor(idlFactory, { agent, canisterId });
    const actor2 = Actor.createActor(buyIDLFactory, { agent, canisterId: buyCanisterId });

    const fetchCashbackAvailableTime = async () => {
        try {
            const cashbackAvailableTime = await actor.get_cashback_available_time?.();
            return cashbackAvailableTime ?? '0';
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching cashback available time. Please try again!');
            return '0';
        }
    };

    const fetchLastCashbackAvailableTime = async () => {
        try {
            const lastCashbackAvailableTime = await actor.get_last_cashback_available_time?.();
            return lastCashbackAvailableTime ?? '0';
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching last cashback available time. Please try again!');
            return '0';
        }
    };

    const fetchCashbackStartTime = async () => {
        try {
            const startTimeRaw = await actor.get_cashback_start_time?.();
            return startTimeRaw?.toString() ?? '0';
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching cashback start time. Please try again!');
            return '0';
        }
    };

    const fetchRaffleEntries = async () => {
        try {
            const lastCashbackAvailableTimeRaw = await actor.get_last_cashback_available_time?.() ?? '0';

            const now = BigInt(Date.now()) * BigInt(1_000_000); // nanoseconds
            const lastAvailableTime = parseBigIntSafe(lastCashbackAvailableTimeRaw);
            if (now > lastAvailableTime) {
                return { userTickets: 0, totalTickets: 0 }; // Round ended, no tickets
            }

            const chainConfigs: Record<ChainType, ChainConfig | undefined> = {
                icp: { address: icpAddress ?? '', chainName: 'ICP', currency: 'ckUSDC' },
                base: { address: evmAddress ?? '', chainName: 'Base', currency: 'USDC' },
                solana: { address: wallet.publicKey?.toBase58() ?? '', chainName: 'Solana', currency: 'USDC' },
                bsc: { address: evmAddress ?? '', chainName: 'Binance Smart Chain', currency: 'USDC' },
            };

            const config = chainConfigs[chain! as ChainType];
            if (!config?.address) {
                return { userTickets: 0, totalTickets: 0 };
            }

            const raffleEntriesResult = await actor.get_eligible_raffle_entry?.();

            if (!raffleEntriesResult || typeof raffleEntriesResult !== 'object' || !('Ok' in raffleEntriesResult)) {
                return { userTickets: 0, totalTickets: 0 };
            }

            const allEntries = raffleEntriesResult.Ok as Transaction[];

            const filterValidTransactions = (transactions: Transaction[]): Transaction[] => {
                return transactions.filter(tx => tx && tx.transaction_type !== 'Reverted');
            };

            const validEntries = filterValidTransactions(allEntries);

            const userEntries = validEntries.filter(
                tx => tx.user_wallet_address === config.address && tx.network === config.chainName
            );

            return {
                userTickets: userEntries.length,
                totalTickets: validEntries.length
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching raffle entries. Please try again.');
            return { userTickets: 0, totalTickets: 0 };
        }
    };

    const parseBigIntSafe = (val: unknown): bigint => {
        try {
            if (typeof val === 'bigint') return val;
            if (typeof val === 'number' || typeof val === 'string') return BigInt(val);
            if (val != null && typeof val === 'object') {
                const toStringFn = (val as { toString?: unknown }).toString;
                if (typeof toStringFn === 'function') {
                    const toStr = (toStringFn as () => string).call(val);
                    if (
                        typeof toStr === 'string' &&
                        toStr !== '[object Object]' &&
                        toStr !== '' &&
                        toStr !== 'undefined' &&
                        toStr !== 'null'
                    ) {
                        return BigInt(toStr);
                    }
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error parsing bigint value.');
        }
        return BigInt(0);
    };

    const fetchCashbackAmount = async () => {
        try {
            const cashbackStartTimeRaw = await actor.get_cashback_start_time?.() ?? '0';
            const cashbackLastAvailableTimeRaw = await actor.get_last_cashback_available_time?.() ?? '0';

            const now = BigInt(Date.now()) * BigInt(1_000_000);
            const lastAvailableTime = parseBigIntSafe(cashbackLastAvailableTimeRaw);
            if (now > lastAvailableTime) {
                return `0 ${chain === 'icp' ? 'ckUSDC' : 'USDC'}`;
            }

            const cashbackStartTime = parseBigIntSafe(cashbackStartTimeRaw);

            const chainConfigs: Record<ChainType, ChainConfig | undefined> = {
                icp: { address: icpAddress ?? '', chainName: 'ICP', currency: 'ckUSDC' },
                base: { address: evmAddress ?? '', chainName: 'Base', currency: 'USDC' },
                solana: { address: wallet.publicKey?.toBase58() ?? '', chainName: 'Solana', currency: 'USDC' },
                bsc: { address: evmAddress ?? '', chainName: 'Binance Smart Chain', currency: 'USDC' },
            };

            const config = chainConfigs[chain! as ChainType];

            if (!config) {
                return `0 ${chain === 'icp' ? 'ckUSDC' : 'USDC'}`;
            }

            const [buyHistory, sellHistory] = await Promise.all([
                actor2.get_buy_history_by_address_and_chain?.(config.address, config.chainName) ?? [],
                actor2.get_sell_history_by_address_and_chain?.(config.address, config.chainName) ?? [],
            ]);

            const filterValidTransactions = (transactions: unknown): Transaction[] => {
                if (!Array.isArray(transactions)) return [];
                return (transactions as Transaction[]).filter(
                    tx => tx && tx.transaction_type !== 'Reverted'
                );
            };

            const validBuyTransactions = filterValidTransactions(buyHistory);
            const validSellTransactions = filterValidTransactions(sellHistory);

            let totalTokenAmount = 0;

            [...validBuyTransactions, ...validSellTransactions].forEach((tx) => {
                if (BigInt(tx.transaction_timestamp) > cashbackStartTime) {
                    const amount =
                        tx.transaction_type === 'Buy'
                            ? parseFloat(tx.token_out_amount)
                            : parseFloat(tx.token_in_amount);
                    totalTokenAmount += amount;
                }
            });

            if (totalTokenAmount < 0.9) {
                return `0 ${config.currency}`;
            }

            let totalUSDAmount = 0;
            validBuyTransactions.forEach((tx) => {
                if (BigInt(tx.transaction_timestamp) > cashbackStartTime) {
                    totalUSDAmount += parseFloat(tx.token_in_usd_amount);
                }
            });

            const cashbackAmount = (totalUSDAmount / 1.01) * 0.05;
            return `${cashbackAmount.toFixed(2)} ${config.currency}`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching cashback amount. Please try again!');
            return `0 ${chain === 'icp' ? 'ckUSDC' : 'USDC'}`;
        }
    };

    const fetchCashbackHistory = async () => {
        try {
            if (!icpAddress && !evmAddress && !(wallet.publicKey?.toBase58())) return [];

            const userAddress = (chain === 'icp' ? icpAddress : chain === 'solana' ? wallet.publicKey?.toBase58() : evmAddress) ?? '';

            if (!userAddress) return [];

            const result = await actor.get_cashback_history_by_address?.(userAddress);

            return result;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Failed to fetch cashback history.');
            return [];
        }
    };

    const rewardsQueriesConfig = useMemo((): UseQueryOptions<unknown, unknown, unknown, readonly unknown[]>[] => {
        const queries = [
            {
                queryKey: ['cashbackAvailableTimeQuery'],
                queryFn: () => fetchCashbackAvailableTime(),
            },
            {
                queryKey: ['cashbackLastAvailableTimeQuery'],
                queryFn: () => fetchLastCashbackAvailableTime(),
            },
            {
                queryKey: ['cashbackStartTimeQuery'],
                queryFn: () => fetchCashbackStartTime(),
            },
            {
                queryKey: ['cashbackAmountQuery'],
                queryFn: () => fetchCashbackAmount(),
                refetchInterval: 30000,
            },
            {
                queryKey: ['raffleEntriesQuery'],
                queryFn: () => fetchRaffleEntries(),
                refetchInterval: 30000,
            },
            {
                queryKey: ['cashbackHistoryQuery', chain, icpAddress, evmAddress, wallet?.publicKey?.toBase58()],
                queryFn: () => fetchCashbackHistory(),
                refetchInterval: 30000,
            }
        ];

        if (chain === 'icp' && isICPConnected) {
            queries.push({
                queryKey: ['bit10DEFIBalanceICP'],
                queryFn: (): Promise<bigint> =>
                    fetchICPTokenBalance({ canisterId: 'bin4j-cyaaa-aaaap-qh7tq-cai', address: icpAddress ?? '' }) as Promise<bigint>,
            });
            queries.push({
                queryKey: ['bit10TOPBalanceICP'],
                queryFn: (): Promise<bigint> =>
                    fetchICPTokenBalance({ canisterId: 'g37b3-lqaaa-aaaap-qp4hq-cai', address: icpAddress ?? '' }) as Promise<bigint>,
            });
        }

        if (chain === 'base' && isEVMConnected) {
            queries.push({
                queryKey: ['bit10TOPBalanceBase'],
                queryFn: () =>
                    fetchBaseTokenBalance({ tokenAddress: '0x2d309c7c5fbbf74372edfc25b10842a7237b92de', address: evmAddress ?? '' }),
            });
        }

        if (chain === 'solana' && isSolanaConnected && publicKey) {
            queries.push({
                queryKey: ['bit10TOPBalanceSolana'],
                queryFn: () =>
                    fetchSolanaTokenBalance({ tokenAddress: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', publicKey: publicKey, decimals: 9 }),
            });
        }

        if (chain === 'bsc' && isEVMConnected) {
            queries.push({
                queryKey: ['bit10TOPBalanceBSC'],
                queryFn: () =>
                    fetchBSCTokenBalance({ tokenAddress: '0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9', address: evmAddress ?? '' }),
            });
        }

        return queries;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, isICPConnected, isEVMConnected, isSolanaConnected, icpAddress, evmAddress, publicKey]);

    const rewardsQueries = useQueries({
        queries: rewardsQueriesConfig,
    });

    const isLoading = rewardsQueries.some(query => query.isLoading);

    const cashbackAvailableTime = rewardsQueries[0]?.data as string;
    const cashbackLastAvailableTime = rewardsQueries[1]?.data as string;
    const cashbackStartTime = rewardsQueries[2]?.data as string;
    const cashbackAmount = rewardsQueries[3]?.data as string;
    const raffleEntries = rewardsQueries[4]?.data as { userTickets: number; totalTickets: number } | undefined;
    const cashbackHistory = rewardsQueries[5]?.data as CashbackHistoryItem[] | undefined;

    let currentIndex = 6;
    const icpDEFIQueryIndex = chain === 'icp' && isICPConnected ? currentIndex : -1;
    if (chain === 'icp' && isICPConnected) currentIndex += 2;

    const baseQueryIndex = chain === 'base' && isEVMConnected ? currentIndex : -1;
    if (chain === 'base' && isEVMConnected) currentIndex++;

    const solanaQueryIndex = chain === 'solana' && isSolanaConnected && publicKey ? currentIndex : -1;
    if (chain === 'solana' && isSolanaConnected && publicKey) currentIndex++;

    const bscQueryIndex = chain === 'bsc' && isEVMConnected ? currentIndex : -1;

    const icpBIT10DEFITokenBalance = icpDEFIQueryIndex >= 0 ? (rewardsQueries[icpDEFIQueryIndex]?.data as bigint | undefined) : undefined;
    const icpBIT10TOPTokenBalance = icpDEFIQueryIndex >= 0 ? (rewardsQueries[icpDEFIQueryIndex + 1]?.data as bigint | undefined) : undefined;

    const baseBIT10TOPTokenBalance = baseQueryIndex >= 0 ? (rewardsQueries[baseQueryIndex]?.data as string | undefined) : undefined;
    const solanaBIT10TOPTokenBalance = solanaQueryIndex >= 0 ? (rewardsQueries[solanaQueryIndex]?.data as string | undefined) : undefined;
    const bscBIT10TOPTokenBalance = bscQueryIndex >= 0 ? (rewardsQueries[bscQueryIndex]?.data as string | undefined) : undefined;

    const formatCountdown = (nanosecondsStr: string): string => {
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
            return `${days.toString().padStart(2, '0')}d:${hours
                .toString()
                .padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m:${seconds
                    .toString()
                    .padStart(2, '0')}s`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return '00d:00h:00m:00s';
        }
    };

    const checkIfCountdownPassed = (nanosecondsStr: string): boolean => {
        if (!nanosecondsStr || nanosecondsStr === '0') return true;
        try {
            const nanoseconds = BigInt(nanosecondsStr);
            const currentTimeNanoseconds = BigInt(Date.now()) * BigInt(1000000);
            return nanoseconds <= currentTimeNanoseconds;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return true;
        }
    };

    const formatEndedDate = (nanosecondsStr: string): string => {
        if (!nanosecondsStr || nanosecondsStr === '0') return '';
        try {
            const nanoseconds = BigInt(nanosecondsStr);
            const milliseconds = Number(nanoseconds / BigInt(1000000));
            const date = new Date(milliseconds);

            const day = date.getDate();
            const dayWithOrdinal = day + (['th', 'st', 'nd', 'rd'][(day % 100 > 10 && day % 100 < 14) ? 0 : Math.min(day % 10, 3)] ?? 'th');

            const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return `${dayWithOrdinal} ${month} ${year} ${hours}:${minutes}`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return '';
        }
    };

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
    }, [cashbackAvailableTime, cashbackLastAvailableTime]);

    const hasClaimedInCurrentRound = useMemo(() => {
        if (!cashbackHistory || !cashbackStartTime || !cashbackLastAvailableTime) return false;

        try {
            const startTime = BigInt(cashbackStartTime);
            const endTime = BigInt(cashbackLastAvailableTime);

            return cashbackHistory.some((record) => {
                const txTime = BigInt(record.transaction_timestamp);
                return txTime >= startTime && txTime <= endTime && record.cashback_id?.trim() !== '';
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error checking cashback claim status. Please try again!');
            return false;
        }
    }, [cashbackHistory, cashbackStartTime, cashbackLastAvailableTime]);

    const totalTokens = () => {
        if (chain === 'icp' && isICPConnected) {
            return ((Number(icpBIT10DEFITokenBalance!) + Number(icpBIT10TOPTokenBalance!)) / 100000000);
        } else if (chain === 'base' && isEVMConnected) {
            return Number(baseBIT10TOPTokenBalance);
        } else if (chain === 'solana' && isSolanaConnected) {
            return Number(solanaBIT10TOPTokenBalance);
        } else if (chain === 'bsc' && isEVMConnected) {
            return Number(bscBIT10TOPTokenBalance);
        }
        return 0;
    };

    const totalBIT10Tokens = totalTokens();

    const claimReward = async () => {
        try {
            setClaimCashback(true);
            if (chain === 'icp' && icpAddress) {
                await claimICPCashback({ walletAddress: icpAddress });
            }
            if (chain === 'base' && evmAddress) {
                await claimBaseCashback({ walletAddress: evmAddress });
            }
            if (chain === 'solana' && wallet.publicKey?.toBase58()) {
                await claimSolanaCashback({ walletAddress: wallet.publicKey.toBase58() });
            }
            if (chain === 'bsc' && evmAddress) {
                await claimBSCCashback({ walletAddress: evmAddress });
            }
            setClaimCashback(false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
            setClaimCashback(false);
        }
    };

    const getClaimStatusText = () => {
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
    };

    const isClaimButtonDisabled = !chain || isLoading || claimCashback || totalBIT10Tokens <= 0.9 || parseFloat(cashbackAmount) <= 0 || isLastCountdownPassed || !isAvailableCountdownPassed || hasClaimedInCurrentRound;

    const getClaimButtonText = () => {
        if (!chain) return 'Connect your wallet to continue';
        if (isLoading) return 'Loading...';
        if (claimCashback) return 'Processing...';
        if (totalBIT10Tokens <= 0.9) return 'Not Eligible';
        if (!isAvailableCountdownPassed) return 'Not Ready to Claim';
        if (isLastCountdownPassed) return 'Round Starting Soon';
        if (hasClaimedInCurrentRound) return 'Already Claimed';
        return 'Claim Cashback';
    };

    const getCashbackStatus = () => {
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
    };

    const cashbackStatus = getCashbackStatus();

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
                        <div className='text-4xl font-semibold'>100 {chain == 'icp' ? 'ckUSC' : 'USDC'}</div>
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <TicketIcon strokeWidth={2.5} size='24' />
                            <span className='text-lg md:text-xl'>Your Reward Pool Tickets</span>
                        </div>
                        <div className='text-4xl font-semibold'>{raffleEntries?.userTickets}</div>
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

                        <motion.button onClick={claimReward} disabled={isClaimButtonDisabled} className='px-6 py-2 text-black font-semibold rounded-full border-none outline-none' style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                            {claimCashback && (
                                <Loader2Icon className='mr-2 animate-spin inline-block' size={15} />
                            )}
                            {getClaimButtonText()}
                        </motion.button>

                        <div className='text-center'>
                            {totalBIT10Tokens < 0.9 ? (
                                <div className='flex flex-row items-center justify-center space-x-1 text-red-500'>
                                    <XIcon size={18} />
                                    <span>Need &gt; 0.9 BIT10.TOP for cashback.</span>
                                </div>
                            ) : (
                                <p>{getClaimStatusText()}</p>
                            )}
                        </div>
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-4'>
                        <div>
                            <h3 className='text-xl font-semibold'>Actions Required</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1 text-sm'>
                                {/* <li><b>Buy and Hold:</b> Keep ≥0.9 BIT10.TOP during round.</li>
                                <li><b>Claim:</b> Do it within 24h after window opens.</li> */}
                                <li><b>Buy & Hold (5% Cashback):</b> Hold at least 0.9 BIT10.TOP during the cashback round to earn 5% cashback. <br />
                                    <span className='text-gray-400'>
                                        Example: Hold 2 BIT10.TOP → receive cashback equal to 5% of 2 BIT10.TOP.
                                    </span>
                                </li>
                                <li><b>Claim on Time:</b> Cashback must be claimed within 24 hours after the claim window opens.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Eligibility & Rules</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1 text-sm'>
                                {/* <li><b>Holding:</b> Min 0.9 BIT10.TOP required.</li>
                                <li><b>Earnings:</b> Based on buys held-not sold.</li>
                                <li><b>Claim Window:</b> After start and before end.</li>
                                <li><b>Selling:</b> Only tokens you still hold count.</li> */}
                                <li><b>Minimum Holding:</b> You must hold at least 0.9 BIT10.TOP to qualify.</li>
                                <li><b>Cashback Basis:</b> Cashback is calculated only on tokens you purchased and did not sell.</li>
                                <li><b>Claim Window:</b> Cashback can be claimed after the round starts and before it ends.</li>
                                <li><b>Selling Tokens:</b> Only BIT10.TOP tokens you still hold during the cashback round are counted. Any tokens sold before or during the round do not earn cashback.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Example</h3>
                            <ul className='list-disc pl-5 mt-1 text-sm'>
                                {/* <li>Buy 1.5 BIT10.TOP → Hold → Get cashback.</li>
                                <li>Sell part before claim? Only remainder earns.</li> */}
                                <li>Buy 1.5 BIT10.TOP and hold through the cashback round → earn 5% cashback.</li>
                                <li>Buy 2 BIT10.TOP but sell 0.8 before the cashback round ends → cashback is calculated only on 1.2 BIT10.TOP.</li>
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

                            <motion.div className='inline-flex p-[1.5px] rounded-full' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'], }} style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                <div className='px-3 py-1 rounded-full text-sm bg-muted min-w-fit'>
                                    {cashbackStatus.text}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div className='text-xl md:text-3xl font-semibold text-center text-golden' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                            Reward Pool
                        </motion.div>

                        <Image src={(chain === 'icp' ? ckUSDCImg : USDCImg) as StaticImageData} alt='USDC' width={96} height={96} />

                        <div className='text-xl md:text-2xl'>
                            100 {chain === 'icp' ? 'ckUSDC' : 'USDC'}
                        </div>

                        <div className='flex flex-wrap justify-center gap-2'>
                            <Button variant='outline' className='bg-accent'>Your Tickets: {raffleEntries?.userTickets}</Button>
                            <Button variant='outline' className='bg-accent'>Total Tickets Sold: {raffleEntries?.totalTickets}</Button>
                            <Button variant='outline' className='bg-accent'>Win Chance: ~{formatCompactPercentNumber((raffleEntries && raffleEntries?.totalTickets > 0 ? raffleEntries?.userTickets / raffleEntries?.totalTickets : 0) * 100)}%</Button>
                        </div>

                        <p className='text-center'>
                            No action needed - automatically entered!
                        </p>
                    </Card>

                    <Card className='border-2 p-4 flex flex-col space-y-4'>
                        <div>
                            <h3 className='text-xl font-semibold'>Actions Required</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1 text-sm'>
                                {/* <li><b>Buy:</b> Purchase BIT10 tokens to receive raffle tickets.</li>
                                <li><b>Auto-Entry:</b> Users are automatically entered into the raffle after purchase.</li>
                                <li><b>Tickets:</b> Number of BIT10 tokens bought = number of raffle tickets.</li> */}
                                <li><b>Buy:</b> Purchase BIT10.TOP tokens to receive Reward Pool tickets.</li>
                                <li><b>Auto-Entry:</b> Users are automatically entered into the Reward Pool raffle after purchase of BIT10.TOP tokens.</li>
                                <li><b>Tickets:</b> Amount of BIT10.TOP tokens purchased = amount of Reward Pool tickets.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Eligibility & Rules</h3>
                            <ul className='list-disc pl-5 mt-1 space-y-1 text-sm'>
                                {/* <li><b>Purchase Requirement:</b> Users must buy BIT10 tokens to be eligible.</li>
                                <li><b>Ticket Allocation:</b> Tickets are awarded based on the number of tokens purchased.</li>
                                <li><b>No Reduction on Sell:</b> Selling tokens does not reduce the number of raffle tickets earned.</li> */}
                                <li><b>Purchase Requirement:</b> Users must purchase BIT10.TOP tokens during cashback round to be eligible for Reward Pool tickets & raffle.</li>
                                <li><b>Ticket Allocation:</b> Tickets are awarded based on the amount of BIT10.TOP tokens purchased.</li>
                                <li><b>No Ticket Reduction on Selling:</b> Selling BIT10.TOP tokens does not reduce the amount of Reward Pool tickets earned.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl font-semibold'>Example</h3>
                            <ul className='list-disc pl-5 mt-1 text-sm'>
                                {/* <li>You earn tickets per qualified buy transaction.</li>
                                <li>More transactions = more chances to win.</li> */}
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
