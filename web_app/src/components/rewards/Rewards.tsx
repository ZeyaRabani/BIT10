import React, { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { DollarSignIcon, WalletIcon, ClockIcon, GiftIcon, Loader2Icon, XIcon, BanknoteIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/cashback.did'
import { idlFactory as buyIDLFactory } from '@/lib/buy.did'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchICPTokenBalance, claimICPCashback } from './icp/icpRewardsModule'
import { fetchBaseTokenBalance, claimBaseCashback } from './base/baseRewardsModule'
import { fetchSolanaTokenBalance, claimSolanaCashback } from './solana/solanaRewardsModule'
import { fetchBSCTokenBalance, claimBSCCashback } from './bsc/bscRewardsModule'
import { formatCompactNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const cashbackAvailableTime = await actor.get_cashback_available_time();
            return cashbackAvailableTime;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching cashback available time. Please try again!');
            return 0;
        }
    };

    const fetchLastCashbackAvailableTime = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const lastCashbackAvailableTime = await actor.get_last_cashback_available_time();
            return lastCashbackAvailableTime;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching last cashback available time. Please try again!');
            return 0;
        }
    };

    const fetchCashbackAmount = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const cashbackStartTimeRaw = await actor.get_cashback_start_time();
            const cashbackStartTime = BigInt(typeof cashbackStartTimeRaw === 'bigint' ? cashbackStartTimeRaw.toString() : cashbackStartTimeRaw?.toString() ?? '0');

            const chainConfigs: Record<ChainType, ChainConfig | undefined> = {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                icp: { address: icpAddress, chainName: 'ICP', currency: 'ckUSDC' },
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                base: { address: evmAddress, chainName: 'Base', currency: 'USDC' },
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                solana: { address: wallet.publicKey?.toBase58(), chainName: 'Solana', currency: 'USDC' },
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                bsc: { address: evmAddress, chainName: 'Binance Smart Chain', currency: 'USDC' },
            };

            const config = chainConfigs[chain! as ChainType];

            if (!config) {
                return '0 USDC';
            }

            const [buyHistory, sellHistory] = await Promise.all([
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                actor2.get_buy_history_by_address_and_chain(config.address, config.chainName),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                actor2.get_sell_history_by_address_and_chain(config.address, config.chainName),
            ]);

            const filterValidTransactions = (transactions: Transaction[]) =>
                transactions.filter(tx => tx.transaction_type !== 'Reverted');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const validBuyTransactions = filterValidTransactions(buyHistory);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const validSellTransactions = filterValidTransactions(sellHistory);

            let totalTokenAmount = 0;

            [...validBuyTransactions, ...validSellTransactions].forEach(tx => {
                if (BigInt(tx.transaction_timestamp) > cashbackStartTime) {
                    const amount = tx.transaction_type === 'Buy'
                        ? parseFloat(tx.token_out_amount)
                        : parseFloat(tx.token_in_amount);
                    totalTokenAmount += amount;
                }
            });

            if (totalTokenAmount < 0.9) {
                return `0 ${config.currency}`;
            }

            let totalUSDAmount = 0;
            validBuyTransactions.forEach(tx => {
                if (BigInt(tx.transaction_timestamp) > cashbackStartTime) {
                    totalUSDAmount += parseFloat(tx.token_in_usd_amount);
                }
            });

            const cashbackAmount = (totalUSDAmount / 1.01) * 0.05;
            return `${cashbackAmount.toFixed(2)} ${config.currency}`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Error fetching cashback amount. Please try again!');
            return '0 USDC';
        }
    };

    const rewardsQueriesConfig = useMemo(() => {
        const queries = [
            {
                queryKey: ['cashbackAvailableTimeQuery'],
                queryFn: () => fetchCashbackAvailableTime()
            },
            {
                queryKey: ['cashbackLastAvailableTimeQuery'],
                queryFn: () => fetchLastCashbackAvailableTime()
            },
            {
                queryKey: ['cashbackAmountQuery'],
                queryFn: () => fetchCashbackAmount(),
                refetchInterval: 30000, // 30 sec.
            }
        ];

        // For ICP
        if (chain === 'icp' && isICPConnected) {
            queries.push(
                {
                    queryKey: ['bit10DEFIBalanceICP'],
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    queryFn: () => fetchICPTokenBalance({ canisterId: 'bin4j-cyaaa-aaaap-qh7tq-cai', address: icpAddress })
                },
                {
                    queryKey: ['bit10TOPBalanceICP'],
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    queryFn: () => fetchICPTokenBalance({ canisterId: 'g37b3-lqaaa-aaaap-qp4hq-cai', address: icpAddress })
                }
            );
        }

        // For Base
        if (chain === 'base' && isEVMConnected) {
            queries.push({
                queryKey: ['bit10TOPBalanceBase'],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                queryFn: () => fetchBaseTokenBalance({ tokenAddress: '0x2d309c7c5fbbf74372edfc25b10842a7237b92de', address: evmAddress })
            });
        }

        // For Solana
        if (chain === 'solana' && isSolanaConnected && publicKey) {
            queries.push({
                queryKey: ['bit10TOPBalanceSolana'],
                queryFn: () => fetchSolanaTokenBalance({ tokenAddress: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', publicKey: publicKey, decimals: 9 })
            });
        }

        // For BSC
        if (chain === 'bsc' && isEVMConnected) {
            queries.push({
                queryKey: ['bit10TOPBalanceBSC'],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                queryFn: () => fetchBSCTokenBalance({ tokenAddress: '0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9', address: evmAddress })
            });
        }

        return queries;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, isICPConnected, isEVMConnected, isSolanaConnected, icpAddress, evmAddress, publicKey]);

    const rewardsQueries = useQueries({
        queries: rewardsQueriesConfig
    });

    const isLoading = rewardsQueries.some(query => query.isLoading);

    const cashbackAvailableTime = rewardsQueries[0]?.data as string;
    const cashbackLastAvailableTime = rewardsQueries[1]?.data as string;
    const cashbackAmount = rewardsQueries[2]?.data as string;

    let currentIndex = 3;

    // For ICP
    const icpDEFIQueryIndex = chain === 'icp' && isICPConnected ? currentIndex : -1;
    if (chain === 'icp' && isICPConnected) currentIndex += 2; // ICP has 2 queries

    // For Base
    const baseQueryIndex = chain === 'base' && isEVMConnected ? currentIndex : -1;
    if (chain === 'base' && isEVMConnected) currentIndex++;

    // For Solana
    const solanaQueryIndex = chain === 'solana' && isSolanaConnected && publicKey ? currentIndex : -1;
    if (chain === 'solana' && isSolanaConnected && publicKey) currentIndex++;

    // For BSC
    const bscQueryIndex = chain === 'bsc' && isEVMConnected ? currentIndex : -1;

    const icpBIT10DEFITokenBalance = icpDEFIQueryIndex >= 0 ? rewardsQueries[icpDEFIQueryIndex]?.data as bigint | undefined : undefined;
    const icpBIT10TOPTokenBalance = icpDEFIQueryIndex >= 0 ? rewardsQueries[icpDEFIQueryIndex + 1]?.data as bigint | undefined : undefined;
    const baseBIT10TOPTokenBalance = baseQueryIndex >= 0 ? rewardsQueries[baseQueryIndex]?.data as string | undefined : undefined;
    const solanaBIT10TOPTokenBalance = solanaQueryIndex >= 0 ? rewardsQueries[solanaQueryIndex]?.data as string | undefined : undefined;
    const bscBIT10TOPTokenBalance = bscQueryIndex >= 0 ? rewardsQueries[bscQueryIndex]?.data as string | undefined : undefined;

    const formatCountdown = (nanosecondsStr: string): string => {
        if (!nanosecondsStr || nanosecondsStr === '0') {
            return '00d:00h:00m:00s';
        }

        try {
            const nanoseconds = BigInt(nanosecondsStr);
            const currentTimeNanoseconds = BigInt(Date.now()) * BigInt(1000000);

            if (nanoseconds <= currentTimeNanoseconds) {
                return '00d:00h:00m:00s';
            }

            const diffNanoseconds = nanoseconds - currentTimeNanoseconds;
            const diffSeconds = Number(diffNanoseconds / BigInt(1000000000));

            const days = Math.floor(diffSeconds / (24 * 60 * 60));
            const hours = Math.floor((diffSeconds % (24 * 60 * 60)) / (60 * 60));
            const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);
            const seconds = Math.floor(diffSeconds % 60);

            return `${days.toString().padStart(2, '0')}d:${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return '00d:00h:00m:00s';
        }
    };

    const checkIfCountdownPassed = (nanosecondsStr: string): boolean => {
        if (!nanosecondsStr || nanosecondsStr === '0') {
            return true;
        }

        try {
            const nanoseconds = BigInt(nanosecondsStr);
            const currentTimeNanoseconds = BigInt(Date.now()) * BigInt(1000000);
            return nanoseconds <= currentTimeNanoseconds;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return true;
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

        const interval = setInterval(() => {
            updateCountdowns();
        }, 1000);

        return () => clearInterval(interval);
    }, [cashbackAvailableTime, cashbackLastAvailableTime]);

    const totalTokens = () => {
        if (chain === 'icp' && isICPConnected) {
            const total = Number(icpBIT10DEFITokenBalance!) + Number(icpBIT10TOPTokenBalance);
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

    const claimICPReward = async () => {
        try {
            setClaimCashback(true);
            if (chain === 'icp' && icpAddress) {
                await claimICPCashback({ walletAddress: icpAddress })
            }
            if (chain === 'base' && evmAddress) {
                await claimBaseCashback({ walletAddress: evmAddress })
            }
            if (chain === 'solana' && wallet.publicKey?.toBase58()) {
                await claimSolanaCashback({ walletAddress: wallet.publicKey?.toBase58() })
            }
            if (chain === 'bsc' && evmAddress) {
                await claimBSCCashback({ walletAddress: evmAddress })
            }
            setClaimCashback(false);
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
            throw error;
        }
    };

    const getClaimStatusText = () => {
        if (isLastCountdownPassed) {
            return 'Next cashback round starting soon...';
        }
        if (parseFloat(cashbackAmount) <= 0) {
            return 'No purchase made after cashback round started.';
        }
        else if (isAvailableCountdownPassed) {
            return `Claim before ${availableLastCountdown}`;
        } else {
            return `Ready to claim in ${availableCountdown}`;
        }
    };

    // ToDo: temp.
    const isClaimButtonDisabled = chain === 'base' || chain === 'solana' || chain === 'bsc' || !chain || isLoading || totalBIT10Tokens <= 0.9 || parseFloat(cashbackAmount) <= 0 || isLastCountdownPassed || !isAvailableCountdownPassed;

    const getClaimButtonText = () => {
        if (!chain) return 'Connect your wallet to continue';
        // ToDo: temp.
        if (chain === 'base' || chain === 'solana' || chain === 'bsc') {
            const chainNames: Record<string, string> = {
                base: 'Base',
                solana: 'Solana',
                bsc: 'Binance Smart Chain'
            };
            return `Selling coming soon on ${chainNames[chain]}`;
        }
        if (isLoading) return 'Loading...';
        if (totalBIT10Tokens <= 0.9) return 'Not Eligible';
        if (isLastCountdownPassed) return 'Round Starting Soon';
        if (!isAvailableCountdownPassed) return 'Not Ready to Claim';
        return 'Claim Cashback';
    };

    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex flex-col items-center'>
                <div className='text-2xl md:text-4xl font-semibold text-center'>Cashback Rewards & Weekly Raffle</div>
            </div>

            {isLoading ?
                <div className='grid md:grid-cols-3 gap-4'>
                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <Skeleton className='w-full h-28' />
                    </Card>
                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <Skeleton className='w-full h-28' />
                    </Card>
                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <Skeleton className='w-full h-28' />
                    </Card>
                </div> :
                <div className='grid md:grid-cols-3 gap-4'>
                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <div><DollarSignIcon strokeWidth={2.5} size='24' /></div>
                            <div className='text-lg md:text-xl'>Weekly Raffle Prize Pool</div>
                        </div>
                        <div className='text-4xl font-semibold'>
                            100 USDC
                        </div>
                    </Card>
                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <div><WalletIcon strokeWidth={2.5} size='24' /></div>
                            <div className='text-lg md:text-xl'>Your BIT10 holdings</div>
                        </div>
                        <div className='text-4xl font-semibold'>
                            {formatCompactNumber(totalBIT10Tokens)} BIT10
                        </div>
                    </Card>
                    <Card className='border-2 p-4 flex flex-col space-y-2'>
                        <div className='flex flex-row space-x-1 items-center justify-start'>
                            <div><ClockIcon strokeWidth={2.5} size='24' /></div>
                            <div className='text-lg md:text-xl'>Cashback Pending</div>
                        </div>
                        <div className='text-4xl font-semibold'>
                            {cashbackAmount}
                        </div>
                    </Card>
                </div>
            }

            <div className='grid md:grid-cols-2 gap-4'>
                <Card className='border-2 p-4 flex flex-col space-y-4'>
                    <div className='flex flex-row space-x-1 items-center justify-center'>
                        <div> <BanknoteIcon strokeWidth={2.5} size='24' /></div>
                        <div className='text-lg md:text-xl'>Claim 5% Cashback</div>
                    </div>
                    <div className='flex items-center justify-center'>
                        <Button disabled={isClaimButtonDisabled} onClick={claimICPReward}>
                            {claimCashback && <Loader2Icon className='animate-spin mr-2' size={15} />}
                            {getClaimButtonText()}
                        </Button>
                    </div>
                    <p className='text-muted-foreground text-center'>
                        {totalBIT10Tokens < 0.9 ? (
                            <div className='flex flex-row space-x-1 items-start bg-red-500'>
                                <div><XIcon size='18' className='text-red-500' /></div>
                                <div>Not eligible. Need more than 0.9 BIT10 for cashback.</div>
                            </div>
                        ) : (
                            <div>{getClaimStatusText()}</div>
                        )
                        }
                    </p>
                    <div>
                        <div className='text-xl font-semibold'>Eligibility and Rules</div>
                        <div className='flex flex-col space-y-2'>
                            <div><b>Minimum Holding Requirement</b>: You must hold at least 0.9 BIT10 tokens to get cashback.</div>
                            <div><b>Buy and Hold Condition</b>: You only earn cashback on BIT10 tokens that you buy and keep during the cashback round.</div>
                            <div><b>Claiming Cashback</b>: You can claim your cashback after the Cashback Period starts and before it ends</div>
                            <div><b>Buy and Sell Transactions</b>: If you buy BIT10 and later sell some, you&apos;ll only get cashback for the tokens you still hold-not the ones you sold.</div>
                        </div>
                    </div>
                </Card>

                <Card className='border-2 p-4 flex flex-col space-y-4'>
                    <div className='flex flex-row space-x-1 justify-center'>
                        <div> <GiftIcon strokeWidth={2.5} size='24' /></div>
                        <div className='text-lg md:text-xl'>Weekly Raffle</div>
                    </div>
                    <div className='flex justify-center'>
                        <Button disabled>
                            Enter Raffle
                        </Button>
                    </div>
                    <p className='text-muted-foreground text-center'>
                        Coming soon..
                    </p>
                </Card>
            </div>
        </div>
    )
}
