import { useState, useMemo, useCallback, useEffect } from 'react';
import * as z from 'zod';
import { useChain } from '@/context/ChainContext';
import { useICPWallet } from '@/context/ICPWalletContext';
import { useEVMWallet } from '@/context/EVMWalletContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatAddress, formatCompactNumber, formatCompactPercentNumber } from '@/lib/utils';
import { ChevronsUpDownIcon, Loader2Icon, InfoIcon, ArrowUpDownIcon, WalletIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { useForm, useStore } from '@tanstack/react-form';
import { CHAIN_REGISTRY } from '@/chains/chain.registry';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import TokenDetails from './TokenDetails';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { cn } from '@/lib/utils';
import { Field, FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import VerifyTransaction from './VerifyTransaction';

interface BuyModuleProps {
    onSwitchToSell: () => void;
}

type BIT10PriceData = {
    timestmpz: string;
    tokenPrice: number;
    data: Array<{ id: string; name: string; symbol: string; price: number; marketCap?: number }>;
};

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
};

interface TokenField {
    handleChange: (value: string) => void;
};

interface TransactionStep {
    title: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    description?: string;
    error?: string;
};

const FormSchema = z.object({
    payment_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        message: 'Please enter the number of tokens for payment',
    })
        .positive('The amount must be a positive number')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    payment_token: z.string({
        required_error: 'Please select a payment token',
    }),
    receive_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        message: 'Please enter the number of BIT10 tokens you wish to buy',
    })
        .positive('The amount must be a positive number')
        .min(0.001, 'Minimum amount should be 0.001')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    receive_token: z.string({
        required_error: 'Please select the BIT10 token to receive',
    })
});

export default function BuyModule({ onSwitchToSell }: BuyModuleProps) {
    const [buying, setBuying] = useState<boolean>(false);
    const [paymentTokenDialogOpen, setPaymentTokenDialogOpen] = useState<boolean>(false);
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState<boolean>(false);
    const [paymentTokenSearch, setPaymentTokenSearch] = useState<string>('');
    const [receiveTokenSearch, setReceiveTokenSearch] = useState<string>('');
    const [lastEditedField, setLastEditedField] = useState<'payment' | 'receive'>('payment');
    const [transactionDialogOpen, setTransactionDialogOpen] = useState<boolean>(false);
    const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);

    const { chain } = useChain();
    const { icpAddress } = useICPWallet();
    const { evmAddress } = useEVMWallet();

    const { publicKey } = useWallet();
    const wallet = useWallet();

    const userAddress = useMemo(() => {
        if (chain == 'icp') {
            return icpAddress;
        } else if (chain == 'base' || chain == 'bsc') {
            return evmAddress;
        } else if (chain == 'solana') {
            return wallet.publicKey?.toBase58();
        }
        return undefined;
    }, [icpAddress, evmAddress, wallet, chain]);

    const fetchBIT10Price = useCallback(async (tokenPriceAPI: string) => {
        try {
            const response = await fetch(tokenPriceAPI);

            if (!response.ok) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }

            const data = await response.json() as BIT10PriceData;
            return data ?? [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occured getting the price of BIT10 token.')
            return [];
        }
    }, []);

    const bit10PriceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-top'),
                refetchInterval: 1800000, // 30 min.
            }
        ]

        return queries;
    }, [fetchBIT10Price]);

    const bit10Queries = useQueries({ queries: bit10PriceQueries });
    const bit10TOPPrice = useMemo(() => {
        const response = bit10Queries[0]?.data as BIT10PriceData | undefined;
        return response?.tokenPrice ?? 0;
    }, [bit10Queries]);

    const bit10TOPTokens = useMemo(() => {
        const response = bit10Queries[0]?.data as BIT10PriceData | undefined;
        return (
            response?.data?.map(token => ({
                ...token,
                marketCap: typeof token.marketCap === 'number' ? token.marketCap : 0,
            })) ?? []
        );
    }, [bit10Queries]);

    const fetchPayWithPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as BuyingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const payWithPriceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        if (chain === 'icp') {
            queries.push(
                {
                    queryKey: ['icpPrice'],
                    queryFn: () => fetchPayWithPrice('ICP'),
                    refetchInterval: 30000, // 30 sec.
                },
                {
                    queryKey: ['btcPrice'],
                    queryFn: () => fetchPayWithPrice('BTC'),
                    refetchInterval: 30000, // 30 sec.
                },
                {
                    queryKey: ['ethPrice'],
                    queryFn: () => fetchPayWithPrice('ETH'),
                    refetchInterval: 30000, // 30 sec.
                }
            )
        }

        if (chain === 'base' || chain === undefined) {
            queries.push(
                {
                    queryKey: ['ethPrice'],
                    queryFn: () => fetchPayWithPrice('ETH'),
                    refetchInterval: 30000, // 30 sec.
                }
            )
        }

        if (chain === 'solana') {
            queries.push(
                {
                    queryKey: ['solPrice'],
                    queryFn: () => fetchPayWithPrice('SOL'),
                    refetchInterval: 30000, // 30 sec.
                }
            )
        }

        if (chain === 'bsc') {
            queries.push(
                {
                    queryKey: ['bnbPrice'],
                    queryFn: () => fetchPayWithPrice('BNB'),
                    refetchInterval: 30000, // 30 sec.
                },
                {
                    queryKey: ['usdcPrice'],
                    queryFn: () => fetchPayWithPrice('USDC'),
                    refetchInterval: 30000, // 30 sec.
                }
            )
        }

        return queries;
    }, [chain, fetchPayWithPrice]);

    const payQueries = useQueries({ queries: payWithPriceQueries });
    let currentIndex = 0;

    // As ICP has 3 queries
    const icpPayWithQueryIndex = chain === 'icp' ? currentIndex : -1;
    if (chain === 'icp') currentIndex += 3;

    const basePayWithQueryIndex = (chain === 'base' || chain === undefined) ? currentIndex : -1;
    if (chain === 'base' || chain === undefined) currentIndex += 1;

    const solanaPayWithQueryIndex = chain === 'solana' ? currentIndex : -1;
    if (chain === 'solana') currentIndex += 1;

    const bscPayWithQueryIndex = chain === 'bsc' ? currentIndex : -1;
    if (chain === 'bsc') currentIndex += 2;

    const icpICPAmount = useMemo(() => payQueries[icpPayWithQueryIndex]?.data, [icpPayWithQueryIndex, payQueries]);
    const icpCKBTCAmount = useMemo(() => payQueries[icpPayWithQueryIndex + 1]?.data, [icpPayWithQueryIndex, payQueries]);
    const icpCKETHAmount = useMemo(() => payQueries[icpPayWithQueryIndex + 2]?.data, [icpPayWithQueryIndex, payQueries]);
    const baseETHAmount = useMemo(() => payQueries[basePayWithQueryIndex]?.data, [basePayWithQueryIndex, payQueries]);
    const solanaSOLAmount = useMemo(() => payQueries[solanaPayWithQueryIndex]?.data, [solanaPayWithQueryIndex, payQueries]);
    const bscBNBAmount = useMemo(() => payQueries[bscPayWithQueryIndex]?.data, [bscPayWithQueryIndex, payQueries]);
    const bscUSDCAmount = useMemo(() => payQueries[bscPayWithQueryIndex + 1]?.data, [bscPayWithQueryIndex, payQueries]);

    const defaultPaymentToken = useMemo(() => {
        if (chain === 'icp') {
            return 'ICP';
        } else if (chain === 'base') {
            return 'Ethereum';
        } else if (chain === 'solana') {
            return 'Solana';
        } else if (chain === 'bsc') {
            return 'BNB';
        }
        return 'Ethereum';
    }, [chain]);

    const form = useForm({
        defaultValues: {
            payment_amount: 0.001,
            payment_token: defaultPaymentToken,
            receive_amount: 1,
            receive_token: 'BIT10.TOP'
        },
        validators: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            onSubmit: FormSchema,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value)
        },
    });

    useEffect(() => {
        form.reset();
        form.setFieldValue('payment_amount', 0.001);
        form.setFieldValue('payment_token', defaultPaymentToken);
        form.setFieldValue('receive_amount', 1);
        form.setFieldValue('receive_token', 'BIT10.TOP');
        setLastEditedField('payment');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, defaultPaymentToken]);

    const formWatchPaymentAmount = useStore(form.store, (state) => state.values.payment_amount);
    const formWatchPaymentToken = useStore(form.store, (state) => state.values.payment_token);
    const formWatchReceiveAmount = useStore(form.store, (state) => state.values.receive_amount);
    const formWatchReceiveToken = useStore(form.store, (state) => state.values.receive_token);

    const selectedBIT10Tokens = useMemo(() => {
        const receiveToken = formWatchReceiveToken;
        if (receiveToken === 'BIT10.TOP') {
            return bit10TOPTokens ?? [];
        }
        return [];
    }, [formWatchReceiveToken, bit10TOPTokens]);

    const selectedBIT10TokenPrice = useMemo(() => {
        const receiveToken = formWatchReceiveToken;
        if (receiveToken === 'BIT10.TOP') {
            return Number(bit10TOPPrice) || 0;
        }
        return 0;
    }, [formWatchReceiveToken, bit10TOPPrice]);

    const balanceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        if (chain === 'icp' && icpAddress) {
            queries.push(
                {
                    queryKey: ['paymentTokenBalanceICPICP', icpAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.icp.fetchTokenBalance({ canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai', address: icpAddress }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['paymentTokenBalanceICPCKBTC', icpAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.icp.fetchTokenBalance({ canisterId: 'mxzaz-hqaaa-aaaar-qaada-cai', address: icpAddress }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['paymentTokenBalanceICPCKETH', icpAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.icp.fetchTokenBalance({ canisterId: 'ss2fx-dyaaa-aaaar-qacoq-cai', address: icpAddress }),
                    refetchInterval: 30000,
                }
            );
        }

        if (chain === 'base' && evmAddress) {
            queries.push({
                queryKey: ['paymentTokenBalanceBaseETH', evmAddress, chain],
                queryFn: () => CHAIN_REGISTRY.base.fetchTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000b', address: evmAddress }),
                refetchInterval: 30000,
            });
        }

        if (chain === 'solana' && publicKey) {
            queries.push({
                queryKey: ['paymentTokenBalanceSolanaSOL', publicKey, chain],
                queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'So11111111111111111111111111111111111111111', publicKey: publicKey }),
                refetchInterval: 30000,
            });
        }

        if (chain === 'bsc' && evmAddress) {
            queries.push(
                {
                    queryKey: ['paymentTokenBalanceBSCBNB', evmAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.bsc.fetchTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000bnb', address: evmAddress }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['paymentTokenBalanceBSCUSDC', evmAddress, chain],
                    queryFn: () => CHAIN_REGISTRY.bsc.fetchTokenBalance({ tokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', address: evmAddress }),
                    refetchInterval: 30000,
                }
            );
        }

        return queries;
    }, [chain, evmAddress, icpAddress, publicKey]);

    const allBalanceQueries = useQueries({ queries: balanceQueries });

    let currentBalanceIndex = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const balanceIndices: Record<string, number> = {};

    if (chain === 'icp') {
        balanceIndices.icpICP = currentBalanceIndex++;
        balanceIndices.icpCKBTC = currentBalanceIndex++;
        balanceIndices.icpCKETH = currentBalanceIndex++;
    } else if (chain === 'base') {
        balanceIndices.baseETH = currentBalanceIndex++;
    } else if (chain === 'solana') {
        balanceIndices.solanaSOL = currentBalanceIndex++;
    } else if (chain === 'bsc') {
        balanceIndices.bscBNB = currentBalanceIndex++;
        balanceIndices.bscUSDC = currentBalanceIndex++;
    }

    const currentPaymentTokens = useMemo(() => {
        if (chain === 'icp') {
            return CHAIN_REGISTRY.icp.buyPayTokens;
        } else if (chain === 'base' || chain === undefined) {
            return CHAIN_REGISTRY.base.buyPayTokens;
        } else if (chain === 'solana') {
            return CHAIN_REGISTRY.solana.buyPayTokens;
        } else if (chain === 'bsc') {
            return CHAIN_REGISTRY.bsc.buyPayTokens;
        } else {
            return CHAIN_REGISTRY.base.buyPayTokens;
        }
    }, [chain]);

    const payingTokenAddress = useMemo(() => {
        const selectedToken = currentPaymentTokens.find(token => token.value === formWatchPaymentToken);
        return selectedToken?.address ?? '';
    }, [currentPaymentTokens, formWatchPaymentToken]);

    const payingTokenPrice = useMemo(() => {
        if (chain === 'icp') {
            if (payingTokenAddress === 'ryjl3-tyaaa-aaaaa-aaaba-cai') return Number(icpICPAmount) || 0;
            if (payingTokenAddress === 'mxzaz-hqaaa-aaaar-qaada-cai') return Number(icpCKBTCAmount) || 0;
            if (payingTokenAddress === 'ss2fx-dyaaa-aaaar-qacoq-cai') return Number(icpCKETHAmount) || 0;
        }
        if (chain === 'base' || chain === undefined) {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000b') return Number(baseETHAmount) || 0;
        }
        if (chain === 'solana') {
            if (payingTokenAddress === 'So11111111111111111111111111111111111111111') return Number(solanaSOLAmount) || 0;
        }
        if (chain === 'bsc') {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000bnb') return Number(bscBNBAmount) || 0;
            if (payingTokenAddress === '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d') return Number(bscUSDCAmount) || 0;
        }
        return 0;
    }, [baseETHAmount, bscBNBAmount, bscUSDCAmount, chain, icpCKBTCAmount, icpCKETHAmount, icpICPAmount, payingTokenAddress, solanaSOLAmount]);

    const payingTokenBalance = useMemo(() => {
        if (chain === 'icp') {
            if (payingTokenAddress === 'ryjl3-tyaaa-aaaaa-aaaba-cai' && balanceIndices.icpICP !== undefined) {
                return allBalanceQueries[balanceIndices.icpICP]?.data ?? 0;
            }
            if (payingTokenAddress === 'mxzaz-hqaaa-aaaar-qaada-cai' && balanceIndices.icpCKBTC !== undefined) {
                return allBalanceQueries[balanceIndices.icpCKBTC]?.data ?? 0;
            }
            if (payingTokenAddress === 'ss2fx-dyaaa-aaaar-qacoq-cai' && balanceIndices.icpCKETH !== undefined) {
                return allBalanceQueries[balanceIndices.icpCKETH]?.data ?? 0;
            }
        } else if (chain === 'base') {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000b' && balanceIndices.baseETH !== undefined) {
                return allBalanceQueries[balanceIndices.baseETH]?.data ?? 0;
            }
        } else if (chain === 'solana') {
            if (payingTokenAddress === 'So11111111111111111111111111111111111111111' && balanceIndices.solanaSOL !== undefined) {
                return allBalanceQueries[balanceIndices.solanaSOL]?.data ?? 0;
            }
        } else if (chain === 'bsc') {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000bnb' && balanceIndices.bscBNB !== undefined) {
                return allBalanceQueries[balanceIndices.bscBNB]?.data ?? 0;
            }
            if (payingTokenAddress === '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' && balanceIndices.bscUSDC !== undefined) {
                return allBalanceQueries[balanceIndices.bscUSDC]?.data ?? 0;
            }
        }
        return 0;
    }, [allBalanceQueries, balanceIndices, chain, payingTokenAddress]);

    const currentBIT10Tokens = useMemo(() => {
        if (chain === 'icp') {
            return CHAIN_REGISTRY.icp.buyReceiveTokens;
        } else if (chain === 'base' || chain === undefined) {
            return CHAIN_REGISTRY.base.buyReceiveTokens;
        } else if (chain === 'solana') {
            return CHAIN_REGISTRY.solana.buyReceiveTokens;
        } else if (chain === 'bsc') {
            return CHAIN_REGISTRY.bsc.buyReceiveTokens;
        } else {
            return CHAIN_REGISTRY.base.buyReceiveTokens;
        }
    }, [chain]);

    const receivingTokenAddress = useMemo(() => {
        const selectedToken = currentBIT10Tokens.find(token => token.value === formWatchReceiveToken);
        const address = selectedToken?.address ?? '';
        return address;
    }, [currentBIT10Tokens, formWatchReceiveToken]);

    const selectedPaymentTokenData = useMemo(() => {
        return currentPaymentTokens.find(token => token.value === formWatchPaymentToken);
    }, [currentPaymentTokens, formWatchPaymentToken]);

    const selectedReceiveTokenData = useMemo(() => {
        return currentBIT10Tokens.find(token => token.value === formWatchReceiveToken);
    }, [currentBIT10Tokens, formWatchReceiveToken]);

    const filteredPaymentTokens = useMemo(() => {
        if (!paymentTokenSearch.trim()) {
            return currentPaymentTokens;
        }

        const searchLower = paymentTokenSearch.toLowerCase();
        return currentPaymentTokens.filter(token =>
            token.label.toLowerCase().includes(searchLower) ||
            token.value.toLowerCase().includes(searchLower) ||
            token.address.toLowerCase().includes(searchLower) ||
            token.tokenType.toLowerCase().includes(searchLower)
        );
    }, [currentPaymentTokens, paymentTokenSearch]);

    const filteredReceiveTokens = useMemo(() => {
        if (!receiveTokenSearch.trim()) {
            return currentBIT10Tokens;
        }

        const searchLower = receiveTokenSearch.toLowerCase();
        return currentBIT10Tokens.filter(token =>
            token.label.toLowerCase().includes(searchLower) ||
            token.value.toLowerCase().includes(searchLower) ||
            token.address.toLowerCase().includes(searchLower) ||
            token.tokenType.toLowerCase().includes(searchLower)
        );
    }, [currentBIT10Tokens, receiveTokenSearch]);

    const exchangeRate = useMemo(() => {
        const payPrice = Number(payingTokenPrice);
        const receivePrice = Number(selectedBIT10TokenPrice);
        if (payPrice === 0 || receivePrice === 0) return 0;
        return payPrice / receivePrice;
    }, [payingTokenPrice, selectedBIT10TokenPrice]);

    const PLATFORM_FEE = 1.005;

    const paymentUsdValue = useMemo(() => {
        return Number(formWatchPaymentAmount) * Number(payingTokenPrice);
    }, [formWatchPaymentAmount, payingTokenPrice]);

    const receiveUsdValue = useMemo(() => {
        return Number(formWatchReceiveAmount) * Number(selectedBIT10TokenPrice);
    }, [formWatchReceiveAmount, selectedBIT10TokenPrice]);

    useEffect(() => {
        if (lastEditedField === 'payment') {
            const payPrice = Number(payingTokenPrice);
            const receivePrice = Number(selectedBIT10TokenPrice);

            if (payPrice > 0 && receivePrice > 0) {
                const calculatedReceiveAmount = (Number(formWatchPaymentAmount) * payPrice) / (receivePrice * PLATFORM_FEE);
                const roundedAmount = Math.floor(calculatedReceiveAmount * 100000000) / 100000000;

                form.setFieldValue('receive_amount', roundedAmount);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formWatchPaymentAmount, formWatchPaymentToken, payingTokenPrice, selectedBIT10TokenPrice, lastEditedField, chain]);

    useEffect(() => {
        if (lastEditedField === 'receive') {
            const payPrice = Number(payingTokenPrice);
            const receivePrice = Number(selectedBIT10TokenPrice);

            if (payPrice > 0 && receivePrice > 0) {
                const calculatedPaymentAmount = (Number(formWatchReceiveAmount) * receivePrice * PLATFORM_FEE) / payPrice;
                const roundedAmount = Math.floor(calculatedPaymentAmount * 100000000) / 100000000;

                form.setFieldValue('payment_amount', roundedAmount);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formWatchReceiveAmount, formWatchReceiveToken, payingTokenPrice, selectedBIT10TokenPrice, lastEditedField, chain]);

    const handlePaymentTokenSelect = (tokenValue: string, field: TokenField) => {
        field.handleChange(tokenValue);
        setPaymentTokenDialogOpen(false);
        setLastEditedField('payment');
    };

    const handleReceiveTokenSelect = (tokenValue: string, field: TokenField) => {
        field.handleChange(tokenValue);
        setReceiveTokenDialogOpen(false);
        setLastEditedField('receive');
    };

    const updateTransactionStep = (stepIndex: number, updates: Partial<TransactionStep>) => {
        setTransactionSteps(prev => {
            const newSteps = [...prev];
            const existing = newSteps[stepIndex];
            if (!existing) return newSteps;
            newSteps[stepIndex] = {
                title: updates.title ?? existing.title,
                status: updates.status ?? existing.status,
                description: updates.description ?? existing.description,
                error: updates.error ?? existing.error,
            };
            return newSteps;
        });
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setBuying(true);
            setTransactionDialogOpen(true);

            if (chain === 'icp') {
                setTransactionSteps([
                    { title: 'Allow Canisters', status: 'processing' },
                    { title: 'Approve Token Spending', status: 'pending' },
                    { title: 'Swap Tokens', status: 'pending' }
                ]);

                await CHAIN_REGISTRY.icp.buyBIT10Token({
                    tokenInAmount: values.payment_amount.toString(),
                    tokenInAddress: payingTokenAddress,
                    tokenOutAmount: values.receive_amount.toString(),
                    tokenOutAddress: receivingTokenAddress,
                    onStepUpdate: updateTransactionStep
                });
            } else if (chain === 'base') {
                setTransactionSteps([
                    { title: 'Approve Transaction', status: 'processing' },
                    { title: 'Confirm on Blockchain', status: 'pending' },
                    { title: 'Execute Swap', status: 'pending' },
                    { title: 'Confirming Transaction', status: 'pending' },
                    { title: 'Validating Transaction', status: 'pending' }
                ]);

                await CHAIN_REGISTRY.base.buyBIT10Token({
                    tokenInAmount: values.payment_amount.toString(),
                    tokenInAddress: payingTokenAddress,
                    tokenOutAmount: values.receive_amount.toString(),
                    tokenOutAddress: receivingTokenAddress,
                    walletAddress: evmAddress!,
                    onStepUpdate: updateTransactionStep
                });
            } else if (chain === 'solana') {
                setTransactionSteps([
                    { title: 'Prepare Wallet & Approve Transaction', status: 'processing' },
                    { title: 'Confirm on Solana', status: 'pending' },
                    { title: 'Execute Swap', status: 'pending' },
                    { title: 'Confirming Transaction', status: 'pending' },
                    { title: 'Validating Transaction', status: 'pending' }
                ]);

                await CHAIN_REGISTRY.solana.buyBIT10Token({
                    tokenInAmount: values.payment_amount.toString(),
                    tokenInAddress: payingTokenAddress,
                    tokenOutAmount: values.receive_amount.toString(),
                    tokenOutAddress: receivingTokenAddress,
                    walletAddress: wallet.publicKey ? wallet.publicKey?.toBase58() : '',
                    wallet: wallet,
                    onStepUpdate: updateTransactionStep
                });
            } else if (chain === 'bsc') {
                setTransactionSteps([
                    { title: 'Approve Transaction', status: 'processing' },
                    { title: 'Confirm on Blockchain', status: 'pending' },
                    { title: 'Execute Swap', status: 'pending' },
                    { title: 'Confirming Transaction', status: 'pending' },
                    { title: 'Validating Transaction', status: 'pending' }
                ]);

                await CHAIN_REGISTRY.bsc.buyBIT10Token({
                    tokenInAmount: values.payment_amount.toString(),
                    tokenInAddress: payingTokenAddress,
                    tokenOutAmount: values.receive_amount.toString(),
                    tokenOutAddress: receivingTokenAddress,
                    walletAddress: evmAddress!,
                    onStepUpdate: updateTransactionStep
                });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setBuying(false);
        }
    }

    const formatWalletAddress = (id: string) => {
        if (!id) return '';
        if (id.length <= 7) return id;
        return `${id.slice(0, 6)}....${id.slice(-4)}`;
    };

    const handleCopyAddress = () => {
        if (!userAddress) return;

        navigator.clipboard.writeText(userAddress)
            .then(() => {
                toast.info('Wallet address copied to clipboard.');
            })
            .catch(() => {
                toast.error('Failed to copy wallet address.')
            });
    };

    const fromAmount = Number((formWatchReceiveAmount * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / Number(payingTokenPrice) * PLATFORM_FEE);
    const balance = Number(payingTokenBalance);

    const buyDisabledConditions = !chain || buying || fromAmount >= balance || fromAmount >= balance * PLATFORM_FEE || balance <= 0 || fromAmount <= 0 || Number(formWatchReceiveAmount) <= 0;

    const getBuyMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        if (buying) return 'Buying...';
        if (fromAmount >= balance || fromAmount >= balance * PLATFORM_FEE && !buying) return 'Balance too low to cover transfer and gas fees';
        if (fromAmount <= 0 || Number(formWatchReceiveAmount) <= 0) return 'Amount too low';
        return 'Buy';
    };

    const canCloseDialog = useMemo(() => {
        if (transactionSteps.length === 0) return false;

        const hasError = transactionSteps.some(step => step.status === 'error');
        if (hasError) return true;

        const allCompleted = transactionSteps.every(step => step.status === 'success');
        if (allCompleted) return true;

        return false;
    }, [transactionSteps]);

    const getStepIcon = (status: TransactionStep['status']) => {
        switch (status) {
            case 'processing':
                return <Loader2Icon className='animate-spin text-blue-500' size={20} />;
            case 'success':
                return <CheckCircle2Icon className='text-green-500' size={20} />;
            case 'error':
                return <XCircleIcon className='text-red-500' size={20} />;
            default:
                return <div className='w-5 h-5 rounded-full border-2 border-muted-foreground' />;
        }
    };

    return (
        <div className='flex flex-col-reverse lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4'>
            <div className='lg:col-span-2 xl:col-span-3'>
                <TokenDetails token_price={selectedBIT10TokenPrice} token_name={formWatchReceiveToken} token_list={selectedBIT10Tokens} />
            </div>

            <div className='lg:col-span-2 xl:col-span-2'>
                <Card className='border-none animate-fade-right'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle>Buy</CardTitle>
                        <div className='relative flex flex-row space-x-2 items-center justify-center border rounded-full px-2 py-1.5'>
                            <AnimatedBackground defaultValue='Buy' className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={onSwitchToSell}>
                                <button type='button' data-id={'Buy'} className='inline-flex px-2 cursor-pointer items-center justify-center text-center transition-transform active:scale-[0.98] text-sm font-light'>
                                    Buy
                                </button>
                                <button type='button' data-id={'Sell'} className='inline-flex px-2 cursor-pointer items-center justify-center text-center transition-transform active:scale-[0.98] text-sm font-light'>
                                    Sell
                                </button>
                            </AnimatedBackground>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form autoComplete='off' className='flex flex-col space-y-2'
                            onSubmit={async (e) => {
                                e.preventDefault()
                                await form.handleSubmit()
                            }}
                        >
                            <div className='relative flex flex-col items-center'>
                                <div className='bg-muted rounded-t-2xl w-full px-4 py-2 flex flex-col space-y-2'>
                                    <div className='flex flex-row space-x-2 justify-between items-center'>
                                        <div>You Pay</div>
                                        {
                                            chain &&
                                            <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row items-center justify-center border-muted-foreground'>
                                                <div className='font-light'>From</div>
                                                <div className='font-semibold'>{formatWalletAddress(userAddress ?? '')}</div>
                                            </Badge>
                                        }
                                    </div>
                                    {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.75'>
                                            <form.Field name='payment_amount'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        // <Field className='bg-blue-500'>
                                                        <Field>
                                                            <Input type='number' step='any' min='0' placeholder='0.00' className='w-full md:max-w-3/4 border-2 border-[#B4B3B3] py-5 text-xl!'
                                                                value={field.state.value || 0}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const parsed = value === '' ? 0 : Number(value);
                                                                    field.handleChange(parsed);
                                                                    setLastEditedField('payment');
                                                                }} />
                                                            {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                        </Field>
                                                    );
                                                }}
                                            </form.Field>
                                            {/* <div className='pt-[0.5px] text-center md:text-start bg-green-500'> */}
                                            <div className='pt-[0.5px] text-center md:text-start'>
                                                <div className='flex flex-row space-x-1 text-sm items-center justify-center md:justify-start pt-0.5'>
                                                    &asymp; ${formatCompactNumber(paymentUsdValue)}
                                                    <TooltipProvider>
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <InfoIcon className='w-4 h-4 cursor-pointer ml-1 -mt-0.5' />
                                                            </TooltipTrigger>
                                                            <TooltipContent className='max-w-[18rem] md:max-w-104 text-center'>
                                                                Price of {formWatchPaymentToken} (in USD) + 0.5% Management fee <br />
                                                                $ {formatCompactPercentNumber(paymentUsdValue / 1.005)} + $ {formatCompactPercentNumber(paymentUsdValue - (paymentUsdValue / 1.005))} = $ {formatCompactPercentNumber(paymentUsdValue)}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex flex-col space-y-0.5'>
                                            <form.Field name='payment_token'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <>
                                                            {/* <Field className='flex flex-row items-center justify-end bg-blue-500'> */}
                                                            <Field className='flex flex-row items-center justify-end'>
                                                                <div className='w-full md:max-w-3/4 md:ml-auto'>
                                                                    <Button type='button' variant='outline' className={cn('border-2 border-[#B4B3B3] z-10 w-full flex justify-between py-5! pl-1! pr-1.5!', !selectedPaymentTokenData?.label && 'text-muted-foreground')} onClick={() => setPaymentTokenDialogOpen(true)}>
                                                                        {selectedPaymentTokenData
                                                                            ?
                                                                            <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                    <Image src={selectedPaymentTokenData.img} alt={selectedPaymentTokenData.label} width={35} height={35} className='z-20' />
                                                                                </div>
                                                                                <div>
                                                                                    {selectedPaymentTokenData?.label ?? formWatchPaymentToken}
                                                                                </div>
                                                                            </div>
                                                                            : 'Select token'}
                                                                        <ChevronsUpDownIcon className='h-4 w-4 shrink-0 opacity-50' />
                                                                    </Button>
                                                                </div>
                                                                {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                            </Field>

                                                            <Dialog open={paymentTokenDialogOpen} onOpenChange={setPaymentTokenDialogOpen}>
                                                                <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md' onPointerDownOutside={() => setPaymentTokenDialogOpen(false)} onEscapeKeyDown={() => setPaymentTokenDialogOpen(false)}>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Select Payment Token</DialogTitle>
                                                                    </DialogHeader>

                                                                    <div className='flex flex-col space-y-2'>
                                                                        <Input placeholder='Search tokens' value={paymentTokenSearch} onChange={(e) => setPaymentTokenSearch(e.target.value)} className='w-full' />
                                                                    </div>

                                                                    <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                        {filteredPaymentTokens.length > 0 ? (
                                                                            filteredPaymentTokens.map((token) => (
                                                                                <Button key={token.value} type='button' variant={formWatchPaymentToken === token.value ? 'outline' : 'ghost'} onClick={() => handlePaymentTokenSelect(token.value, field)} className='flex flex-row items-center justify-between py-6 px-2'>
                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                        </div>
                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                            <div>{token.label}</div>
                                                                                            <div>{formatAddress(token.address)}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Badge variant='outline' className='border-muted-foreground'>{token.tokenType}</Badge>
                                                                                    </div>
                                                                                </Button>
                                                                            ))
                                                                        ) : (
                                                                            <div className='text-center text-muted-foreground py-8'>
                                                                                No tokens found matching {paymentTokenSearch}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    );
                                                }}
                                            </form.Field>
                                            {/* <div className='flex flex-row items-center justify-center md:justify-end text-sm pt-0.5 bg-green-500'> */}
                                            <div className='flex flex-row items-center justify-center md:justify-end text-sm pt-0.5'
                                                onClick={() => {
                                                    const gasFee = selectedPaymentTokenData?.gasFee ?? 0;
                                                    const maxAmount = Math.max(0, Number(payingTokenBalance) - (2 * gasFee));
                                                    const roundedAmount = Math.floor(maxAmount * 100000000) / 100000000;
                                                    form.setFieldValue('payment_amount', roundedAmount);
                                                    setLastEditedField('payment');
                                                }}>
                                                <WalletIcon size='16' className='mr-1 cursor-pointer' />
                                                {formatCompactNumber(Number(payingTokenBalance))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button type='button' variant='ghost' size='sm' className='md:absolute top-1/2 -translate-y-1/2 z-10 p-2 h-8 w-8 border-2 border-muted hover:bg-background group bg-background mt-2 md:mt-0' onClick={onSwitchToSell} disabled={buying}>
                                    <ArrowUpDownIcon className='size-4 transition-transform duration-700 group-hover:rotate-180' />
                                </Button>

                                <div className='bg-muted rounded-b-2xl w-full px-4 py-2 flex flex-col space-y-2 -mt-6 md:mt-2'>
                                    <div className='flex flex-row space-x-2 justify-between items-center'>
                                        <div>You Receive</div>
                                        {
                                            chain &&
                                            <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row items-center justify-center border-muted-foreground'>
                                                <div className='font-light'>To</div>
                                                <div className='font-semibold'>{formatWalletAddress(userAddress ?? '')}</div>
                                            </Badge>
                                        }
                                    </div>
                                    {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.75'>
                                            <form.Field name='receive_amount'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        // <Field className='bg-blue-500'>
                                                        <Field>
                                                            <Input type='number' step='any' min='0' placeholder='0.00' className='w-full md:max-w-3/4 border-2 border-[#B4B3B3] py-5 text-xl!' value={field.state.value || 0}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const parsed = value === '' ? 0 : Number(value);
                                                                    field.handleChange(parsed);
                                                                    setLastEditedField('receive');
                                                                }} />
                                                            {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                        </Field>
                                                    );
                                                }}
                                            </form.Field>
                                            {/* <div className='text-center md:text-start bg-green-500'> */}
                                            <div className='text-center md:text-start'>
                                                &asymp; ${formatCompactPercentNumber(receiveUsdValue)}
                                            </div>
                                        </div>
                                        <div className='flex flex-col space-y-0.5'>
                                            <form.Field name='receive_token'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <>
                                                            {/* <Field className='flex flex-row items-center justify-end bg-blue-500'> */}
                                                            <Field className='flex flex-row items-center justify-end'>
                                                                <div className='w-full md:max-w-3/4 md:ml-auto'>
                                                                    <Button type='button' variant='outline' className={cn('border-2 border-[#B4B3B3] z-10 w-full flex justify-between py-5! pl-1! pr-1.5!', !selectedReceiveTokenData?.label && 'text-muted-foreground')} onClick={() => setReceiveTokenDialogOpen(true)}>
                                                                        {selectedReceiveTokenData
                                                                            ?
                                                                            <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                    <Image src={selectedReceiveTokenData.img} alt={selectedReceiveTokenData.label} width={35} height={35} className='z-20' />
                                                                                </div>
                                                                                <div>
                                                                                    {selectedReceiveTokenData?.label ?? formWatchReceiveToken}
                                                                                </div>
                                                                            </div>
                                                                            : 'Select token'}
                                                                        <ChevronsUpDownIcon className='h-4 w-4 shrink-0 opacity-50' />
                                                                    </Button>
                                                                </div>
                                                                {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                            </Field>

                                                            <Dialog open={receiveTokenDialogOpen} onOpenChange={setReceiveTokenDialogOpen}>
                                                                <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md' onPointerDownOutside={() => setReceiveTokenDialogOpen(false)} onEscapeKeyDown={() => setReceiveTokenDialogOpen(false)}>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Select Receive Token</DialogTitle>
                                                                    </DialogHeader>

                                                                    <div className='flex flex-col space-y-2'>
                                                                        <Input placeholder='Search tokens' value={receiveTokenSearch} onChange={(e) => setReceiveTokenSearch(e.target.value)} className='w-full' />
                                                                    </div>

                                                                    <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                        {filteredReceiveTokens.length > 0 ? (
                                                                            filteredReceiveTokens.map((token) => (
                                                                                <Button key={token.value} type='button' variant={formWatchReceiveToken === token.value ? 'outline' : 'ghost'} onClick={() => handleReceiveTokenSelect(token.value, field)} className='flex flex-row items-center justify-between py-6 px-2'>
                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                        </div>
                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                            <div>{token.label}</div>
                                                                                            <div>{formatAddress(token.address)}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Badge variant='outline' className='border-muted-foreground'>{token.tokenType}</Badge>
                                                                                    </div>
                                                                                </Button>
                                                                            ))
                                                                        ) : (
                                                                            <div className='text-center text-muted-foreground py-8'>
                                                                                No tokens found matching {receiveTokenSearch}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    );
                                                }}
                                            </form.Field>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-2xl px-4 py-2 bg-muted flex flex-col space-y-1 text-sm'>
                                <div className='font-medium text-lg'>Summary</div>
                                <div className='h-0.5 w-full bg-muted-foreground rounded-full' />
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2'>
                                    <div>Exchange Rate</div>
                                    <div>1 {selectedPaymentTokenData?.label} &asymp; {formatCompactNumber(exchangeRate)} {selectedReceiveTokenData?.label}</div>
                                </div>
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2'>
                                    <div>Expected Time</div>
                                    <div>1-2 min.</div>
                                </div>
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2'>
                                    <div>Management Fee</div>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <div className='flex flex-row space-x-1 items-center'>
                                                    <div>0.5%</div>
                                                    <div>
                                                        <InfoIcon className='size-3 align-middle relative bottom-px cursor-pointer' />
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className='max-w-[18rem] md:max-w-104 text-center'>
                                                The Management Fee covers the cost of managing and rebalancing the token
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2 font-semibold tracking-wider'>
                                    <div>Expected Output</div>
                                    <div>{formatCompactNumber(formWatchReceiveAmount)} {selectedReceiveTokenData?.label}</div>
                                </div>
                            </div>

                            {/* ToDo: Update this for Rewards */}
                            {/* <div className='py-2'>
                                <motion.div className='p-[1.5px] rounded-2xl' animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                    <div className='relative rounded-2xl px-4 py-2 bg-muted flex flex-col space-y-1'>
                                        <motion.div className='absolute -top-3 right-3 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-black' style={{ background: 'linear-gradient(270deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 300%' }} animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                                            Limited time
                                        </motion.div>
                                        <div className='flex flex-row items-center justify-between'>
                                            <div className='flex flex-row items-center space-x-1'>
                                                <div>Estimated 5% Cashback</div>
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <InfoIcon className='size-3 align-middle relative cursor-pointer' />
                                                        </TooltipTrigger>
                                                        <TooltipContent className='max-w-[18rem] md:max-w-104 text-center'>
                                                            Approximate {chain === 'icp' ? 'ckUSDC' : 'USDC'} you&apos;ll receive based on the amount of tokens purchased.
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div>0 {chain === 'icp' ? 'ckUSDC' : 'USDC'}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between'>
                                            <div className='flex flex-row items-center space-x-1'>
                                                <div>Reward Pool Entries</div>
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <InfoIcon className='size-3 align-middle relative cursor-pointer' />
                                                        </TooltipTrigger>
                                                        <TooltipContent className='max-w-[18rem] md:max-w-104 text-center'>
                                                            Each token you buy counts as one entry into the Reward Pool raffle.
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div>1 Ticket(s)</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div> */}

                            <Button disabled={buyDisabledConditions} type='submit'>
                                {buying && <Loader2Icon className='animate-spin mr-2' size={15} />}
                                {getBuyMessage()}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className='w-fit animate-fade-right'>
                    <VerifyTransaction mode='buy' />
                </div>
            </div>

            <Dialog open={transactionDialogOpen} onOpenChange={(open) => { if (canCloseDialog || !open) { setTransactionDialogOpen(open); } }}>
                <DialogContent className='sm:max-w-md' onPointerDownOutside={(e) => {
                    if (!canCloseDialog) e.preventDefault();
                }} onEscapeKeyDown={(e) => {
                    if (!canCloseDialog) e.preventDefault();
                }}>
                    <DialogHeader>
                        <DialogTitle>Transaction Progress</DialogTitle>
                    </DialogHeader>
                    <div className='flex flex-col space-y-4 py-4'>
                        {transactionSteps.map((step, index) => (
                            <div key={index} className='flex flex-col space-y-2'>
                                <div className='flex flex-row items-start space-x-3'>
                                    <div className='pt-0.5'>
                                        {getStepIcon(step.status)}
                                    </div>
                                    <div className='flex-1'>
                                        <div className='font-medium'>{step.title}</div>
                                        {step.description && (
                                            <div className='text-sm text-muted-foreground mt-1'>
                                                {step.description}
                                            </div>
                                        )}
                                        {step.error && (
                                            <div className='text-sm text-red-500 mt-1'>
                                                {step.error}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {canCloseDialog && (
                        <div className='flex justify-end'>
                            <Button onClick={() => setTransactionDialogOpen(false)}>
                                Close
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
