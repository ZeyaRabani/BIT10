import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card'
import * as z from 'zod'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueries } from '@tanstack/react-query'
import { whitelistedAddress } from '@/actions/dbActions'
import { toast } from 'sonner'
import { formatAddress, formatCompactNumber } from '@/lib/utils'
import { ChevronsUpDown, Loader2, Info, ArrowUpDown } from 'lucide-react'
import AnimatedBackground from '@/components/ui/animated-background'
import { CartesianGrid, XAxis, YAxis, LineChart, Line, Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buyPayTokensICP, buyReceiveTokensICP, fetchICPTokenBalance, buyICPBIT10Token } from '../icp/ICPBuyModule'
import { buyPayTokensBase, buyReceiveTokensBase, fetchBaseTokenBalance, buyBaseBIT10Token } from '../base/BaseBuyModule'
import { buyPayTokensSolana, buyReceiveTokensSolana, fetchSolanaTokenBalance, buySolanaBIT10Token } from '../solana/SolanaBuyModule'
import { buyPayTokensBSC, buyReceiveTokensBSC, fetchBSCTokenBalance, buyBSCBIT10Token } from '../bsc/BSCBuyModule'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TransactionProgressDialog, type TransactionStep } from '../TransactionProgressDialog'

interface WhitelistedPrincipal {
    userPrincipalId: string;
}

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
};

const tabs = ['30D', '60D', '1Y', '3Y'];

type BIT10Entry = {
    date: string;
    bit10Top: string;
    btc: string;
    sp500: string;
};

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

const bit10Amount = ['1', '2'];

const FormSchema = z.object({
    payment_token: z.string({
        required_error: 'Please select a payment token',
    }),
    receive_amount: z.string({
        required_error: 'Please select the number of BIT10 tokens to receive',
    }),
    receive_token: z.string({
        required_error: 'Please select the BIT10 token to receive',
    })
});

export default function NewBuyModule() {
    const [activeTab, setActiveTab] = useState('3Y');
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [buying, setBuying] = useState<boolean>(false);
    const [paymentTokenDialogOpen, setPaymentTokenDialogOpen] = useState(false);
    const [paymentTokenSearch, setPaymentTokenSearch] = useState('');
    const [payingTokenAddress, setPayingTokenAddress] = useState<string>('');
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState(false);
    const [receiveTokenSearch, setReceiveTokenSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [icpTransactionSteps, setICPTransactionSteps] = useState<TransactionStep[]>([
        {
            title: 'Allow the canister',
            description: 'Waiting for canister allowance...',
            status: 'pending'
        },
        {
            title: 'Confirm transaction',
            description: 'Allow the transaction on your wallet to proceed',
            status: 'pending'
        },
        {
            title: 'Process approval',
            description: 'Approval was successful! Proceeding with transfer...',
            status: 'pending'
        },
        {
            title: 'Complete transfer',
            description: 'Finalizing token swap...',
            status: 'pending'
        }
    ]);

    const { chain } = useChain();
    const { icpAddress } = useICPWallet();
    const { evmAddress } = useEVMWallet();

    const { publicKey } = useWallet();
    const wallet = useWallet();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(50);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const fetchWhitelistedAddress = async () => {
        try {
            const result = await whitelistedAddress();
            return result;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while fetching whitelisted users. Please try again!');
            return [];
        }
    };

    const fetchBIT10Preformance = async () => {
        try {
            const response = await fetch(`bit10-comparison-data-3`);

            if (!response.ok) {
                toast.error('Error fetching BIT10 Performance. Please try again!');
                return null;
            }

            const data = await response.json() as { bit10_top: BIT10Entry[] };
            return { bit10_top: data.bit10_top.reverse() };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Network error. Please try again!');
            return null;
        }
    };

    const gatedMainnetQueries = useQueries({
        queries: [
            {
                queryKey: ['whitelistedUserPrincipalIds'],
                queryFn: () => fetchWhitelistedAddress(),
            },
            {
                queryKey: ['bit10TOPTokenPreformance10Y'],
                queryFn: () => fetchBIT10Preformance()
            }
        ],
    });

    const isLoading = gatedMainnetQueries.some(query => query.isLoading);
    const whitelistedPrincipal = gatedMainnetQueries[0]?.data ?? [];
    const bit10TOPPreformance10Y = gatedMainnetQueries[1].data?.bit10_top ?? [];

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

    const isApproved = (whitelistedPrincipal as WhitelistedPrincipal[]).some(
        (item) => item.userPrincipalId.toLocaleLowerCase() === userAddress?.toLocaleLowerCase()
    );

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    const fetchBIT10Price = useCallback(async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        const data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: string, name: string, symbol: string, price: number }> };
        return data ?? [];
    }, []);

    const bit10PriceQueries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-top'),
                refetchInterval: 1800000,
            }
        ],
    });

    const bit10TOPPrice = useMemo(() => bit10PriceQueries[0]?.data?.tokenPrice, [bit10PriceQueries]);
    const bit10TOPTokens = useMemo(() => bit10PriceQueries[0]?.data?.data as { id: string, name: string, symbol: string, marketCap: number, price: number }[] | undefined, [bit10PriceQueries]);

    const getBIT10Performance = (data: BIT10Entry[], range: string) => {
        if (!data || data.length === 0) {
            return [];
        }

        const latestEntry = data[data.length - 1];
        if (!latestEntry) {
            return [];
        }
        const latestDate = new Date(latestEntry.date);

        let startDate: Date;

        switch (range) {
            case '30D':
                startDate = new Date(latestDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '60D':
                startDate = new Date(latestDate.getTime() - 60 * 24 * 60 * 60 * 1000);
                break;
            case '1Y':
                startDate = new Date(latestDate);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case '3Y':
                startDate = new Date(latestDate);
                startDate.setFullYear(startDate.getFullYear() - 3);
                break;
            default:
                return [];
        }

        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= latestDate;
        });

        return filteredData;
    };

    const fetchPayWithPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as BuyingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const payWithPriceQueries = useQueries({
        queries: [
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
            },
            {
                queryKey: ['solPrice'],
                queryFn: () => fetchPayWithPrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            },
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
        ],
    });

    const icpAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
    const btcAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);
    const ethAmount = useMemo(() => payWithPriceQueries[2].data, [payWithPriceQueries]);
    const solAmount = useMemo(() => payWithPriceQueries[3].data, [payWithPriceQueries]);
    const bnbAmount = useMemo(() => payWithPriceQueries[4].data, [payWithPriceQueries]);
    const usdcAmount = useMemo(() => payWithPriceQueries[5].data, [payWithPriceQueries]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            payment_token: 'Ethereum',
            receive_amount: '1',
            receive_token: 'BIT10.TOP'
        },
    });

    const bit10TokenName = useMemo(() => {
        if (form.watch('receive_token') == 'BIT10.TOP') {
            return 'BIT10.TOP';
        }
        return 'BIT10.TOP';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('receive_token')]);

    const selectedBIT10Token30D = () => {
        if (bit10TokenName === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '30D');
        } else {
            return null;
        }
    };

    const tokens30D = selectedBIT10Token30D();

    const selectedBIT10Token60D = () => {
        if (bit10TokenName === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '60D');
        } else {
            return null;
        }
    };

    const tokens60D = selectedBIT10Token60D();

    const selectedBIT10Token1Y = () => {
        if (bit10TokenName === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '1Y');
        } else {
            return null;
        }
    };

    const tokens1Y = selectedBIT10Token1Y();

    const selectedBIT10Token3Y = () => {
        if (bit10TokenName === 'BIT10.TOP') {
            return getBIT10Performance(bit10TOPPreformance10Y, '3Y');
        } else {
            return null;
        }
    };

    const tokens3Y = selectedBIT10Token3Y();

    const bit10PreformanceTokenDataName = () => {
        if (bit10TokenName === 'BIT10.TOP') {
            return 'bit10TOP';
        } else {
            return 'bit10';
        }
    };

    const tokenDataName = bit10PreformanceTokenDataName();

    const bit10PreformanceTokenName = () => {
        if (bit10TokenName === 'BIT10.TOP') {
            return {
                name: 'bit10TOP',
                indexFundName: 'BIT10.TOP'
            };
        } else {
            return {
                name: 'bit10',
                indexFundName: 'BIT10'
            };
        }
    };

    const tokenName = bit10PreformanceTokenName();

    const bit10PreformanceChartConfig: ChartConfig = {
        [tokenName.name]: {
            label: tokenName.indexFundName,
        }
    };

    const bit10Preformance30DChartData = tokens30D?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    const bit10Preformance60DChartData = tokens60D?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    const bit10Preformance1YChartData = tokens1Y?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    const bit10Preformance3YChartData = tokens3Y?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Top).toFixed(4)),
        };
    });

    const selectedBIT10Token = () => {
        if (bit10TokenName === 'BIT10.TOP') {
            return bit10TOPTokens;
        } else {
            return null;
        }
    };

    const rawTokens = selectedBIT10Token();
    const tokens = (Array.isArray(rawTokens) ? rawTokens : []) as { name: string, symbol: string; marketCap: number }[];

    const bit10AllocationChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokens.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol,
                    color: color[index % color.length],
                }
            ])
        )
    };

    const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);

    const bit10AllocationPieChartData = tokens.map((token, index) => ({
        name: token.symbol,
        value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(4)),
        fill: color[index % color.length],
    }));

    const selectedBIT10TokenPrice = useMemo(() => {
        const receiveToken = form.watch('receive_token');
        if (receiveToken === 'BIT10.TOP') {
            return Number(bit10TOPPrice) || 0;
        }
        return 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('receive_token'), bit10TOPPrice]);

    const payingTokenPrice = useMemo(() => {
        // ICP
        if (chain === 'icp') {
            if (payingTokenAddress === 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
                return icpAmount ?? 0;
            } else if (payingTokenAddress === 'mxzaz-hqaaa-aaaar-qaada-cai') {
                return btcAmount ?? 0;
            } else if (payingTokenAddress === 'ss2fx-dyaaa-aaaar-qacoq-cai') {
                return ethAmount ?? 0;
            }
        }

        // Base
        if (chain === 'base' || chain === undefined) {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000b') {
                return ethAmount ?? 0;
            }
        }

        // Solana
        if (chain === 'solana' || chain === undefined) {
            if (payingTokenAddress === 'So11111111111111111111111111111111111111111') {
                return solAmount ?? 0;
            }
        }

        // BSC
        if (chain === 'bsc') {
            if (payingTokenAddress === '0x0000000000000000000000000000000000000000bnb') {
                return bnbAmount ?? 0;
            } else if (payingTokenAddress === '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d') {
                return usdcAmount ?? 0;
            }
        }

        return 0;
    }, [chain, payingTokenAddress, icpAmount, btcAmount, ethAmount, solAmount, bnbAmount, usdcAmount]);

    const fromBalanceQueries = useQueries({
        queries: [
            // For ICP
            {
                queryKey: ['paymentTokenBalanceICP', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceckBTC', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'mxzaz-hqaaa-aaaar-qaada-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceckETH', icpAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp' || !payingTokenAddress) return '0';
                    return fetchICPTokenBalance({ canisterId: 'ss2fx-dyaaa-aaaar-qacoq-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },

            // For Base
            {
                queryKey: ['paymentTokenBalanceBaseETH', evmAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'base' || !payingTokenAddress) return '0';
                    return fetchBaseTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000b', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'base' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },

            // For Solana
            {
                queryKey: ['paymentTokenBalanceSolanaSOL', publicKey, payingTokenAddress, chain],
                queryFn: () => {
                    if (!publicKey || chain !== 'solana' || !payingTokenAddress) return '0';
                    return fetchSolanaTokenBalance({ tokenAddress: 'So11111111111111111111111111111111111111111', publicKey: publicKey });
                },
                enabled: !!publicKey && chain === 'solana' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },

            // For BSC
            {
                queryKey: ['paymentTokenBalanceBSCBNB', evmAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'bsc' || !payingTokenAddress) return '0';
                    return fetchBSCTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000bnb', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'bsc' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceBSCUSDC', evmAddress, payingTokenAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'bsc' || !payingTokenAddress) return '0';
                    return fetchBSCTokenBalance({ tokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'bsc' && !!payingTokenAddress,
                refetchInterval: 30000, // 30 seconds
            }
        ],
    });

    const payingTokenBalance = useMemo(() => {
        if (payingTokenAddress == 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
            return fromBalanceQueries[0].data;
        } else if (payingTokenAddress == 'mxzaz-hqaaa-aaaar-qaada-cai') {
            return fromBalanceQueries[1].data;
        } else if (payingTokenAddress == 'ss2fx-dyaaa-aaaar-qacoq-cai') {
            return fromBalanceQueries[2].data;
        } else if (payingTokenAddress == '0x0000000000000000000000000000000000000000b') {
            return fromBalanceQueries[3].data;
        } else if (payingTokenAddress == 'So11111111111111111111111111111111111111111') {
            return fromBalanceQueries[4].data;
        } else if (payingTokenAddress == '0x0000000000000000000000000000000000000000bnb') {
            return fromBalanceQueries[5].data;
        } else if (payingTokenAddress == '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d') {
            return fromBalanceQueries[6].data;
        }
        return '0';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromBalanceQueries, payingTokenAddress, chain]);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const fromAmount = Number((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01);
    const balance = Number(payingTokenBalance);

    // ToDo: Update this
    const buyDisabledConditions = !chain || !isApproved || buying
    // || fromAmount >= balance || fromAmount >= balance * 1.01 || balance <= 0 || fromAmount <= 0 || Number(form.watch('receive_amount')) <= 0;

    const getBuyMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        if (!isApproved) return 'Access Restricted';
        if (buying) return 'Buying...';
        if (fromAmount >= balance || fromAmount >= balance * 1.01 && !buying) return 'Your balance is too low for this transaction';
        if (fromAmount <= 0 || Number(form.watch('receive_amount')) <= 0) return 'Amount too low';
        return 'Buy';
    };

    const currentPaymentTokens = useMemo(() => {
        if (chain === 'icp') {
            return buyPayTokensICP;
        } else if (chain === 'base') {
            return buyPayTokensBase;
        } else if (chain === 'solana') {
            return buyPayTokensSolana;
        } else if (chain === 'bsc') {
            return buyPayTokensBSC;
        } else {
            return buyPayTokensBase;
        }
    }, [chain]);

    const currentBIT10Tokens = useMemo(() => {
        if (chain === 'icp') {
            return buyReceiveTokensICP;
        } else if (chain === 'base') {
            return buyReceiveTokensBase;
        } else if (chain === 'solana') {
            return buyReceiveTokensSolana;
        } else if (chain === 'bsc') {
            return buyReceiveTokensBSC;
        } else {
            return buyReceiveTokensBase;
        }
    }, [chain]);

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setBuying(true);
            setIsDialogOpen(true);

            const selectedPaymentToken = currentPaymentTokens.find(
                (token) => token.value === values.payment_token
            );

            const selectedReceiveToken = currentBIT10Tokens.find(
                (token) => token.value === values.receive_token
            );

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (!selectedBIT10TokenPrice || !payingTokenPrice || isNaN(selectedBIT10TokenPrice) || isNaN(payingTokenPrice) || payingTokenPrice <= 0) {
                toast.error('Price data unavailable.');
                return;
            }

            const rawTokenInAmount = ((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01); // 1% Management fee
            const tokenInAmount = isNaN(rawTokenInAmount) ? 0 : Number(rawTokenInAmount);

            if (chain === 'icp') {
                // ToDo: Use the first one
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // await buyICPBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount, icpAddress: icpAddress!, onStepUpdate: (updatedSteps) => { setICPTransactionSteps(updatedSteps) } });
                await buyICPBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount, icpAddress: icpAddress! });
            } else if (chain === 'base') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyBaseBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount.toString(), baseAddress: evmAddress! });
            } else if (chain === 'solana') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                await buySolanaBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount.toString(), solanaAddress: wallet.publicKey?.toBase58(), wallet: wallet });
            } else if (chain === 'bsc') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await buyBSCBIT10Token({ tokenInAddress: selectedPaymentToken?.address, tokenOutAddress: selectedReceiveToken?.address, tokenOutAmount: values.receive_amount, tokenInAmount: tokenInAmount.toString(), bscAddress: evmAddress! });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setBuying(false);
        }
    }

    // async function onSubmit(values: z.infer<typeof FormSchema>) {
    //     setIsDialogOpen(true);

    //     try {
    //         await buyICPBIT10Token({
    //             tokenInAddress: 'ryjl3-tyaaa-aaaaa-aaaba-cai', // ICP address
    //             tokenOutAddress: 'g37b3-lqaaa-aaaap-qp4hq-cai', // BIT10.TOP address
    //             tokenOutAmount: '10',
    //             tokenInAmount: 15, // 10 * 1.5
    //             icpAddress: 'your-principal-id',
    //             onStepUpdate: (updatedSteps) => {
    //                 setICPTransactionSteps(updatedSteps);
    //             }
    //         });
    //     } catch (error) {
    //         // Error is handled in the transaction steps UI
    //         console.error('Transaction failed:', error);
    //     }
    // };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        // Reset steps for next transaction
        setICPTransactionSteps([
            {
                title: 'Allow the canister',
                description: 'Waiting for canister allowance...',
                status: 'pending'
            },
            {
                title: 'Confirm transaction',
                description: 'Allow the transaction on your wallet to proceed',
                status: 'pending'
            },
            {
                title: 'Process approval',
                description: 'Approval was successful! Proceeding with transfer...',
                status: 'pending'
            },
            {
                title: 'Complete transfer',
                description: 'Finalizing token swap...',
                status: 'pending'
            }
        ]);
    };

    const filteredPaymentTokens = useMemo(() => {
        const query = paymentTokenSearch.toLowerCase();
        return currentPaymentTokens.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query) ||
            token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentTokenSearch, chain]);

    const filteredReceiveTokens = useMemo(() => {
        const query = receiveTokenSearch.toLowerCase();
        return currentBIT10Tokens.filter(token =>
            token.label.toLowerCase().includes(query) ||
            token.value.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveTokenSearch, chain]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payingTokenImg = useMemo(() => {
        const currentToken = form.watch('payment_token');
        const token = currentPaymentTokens.find(t => t.value === currentToken);
        return token?.img ?? BIT10Img as StaticImageData;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('payment_token'), currentPaymentTokens]);

    useEffect(() => {
        if (currentPaymentTokens.length > 0) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            form.setValue('payment_token', currentPaymentTokens[0].value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, currentPaymentTokens]);

    useEffect(() => {
        const currentToken = form.watch('payment_token');
        const token = currentPaymentTokens.find(t => t.value === currentToken);
        if (token) {
            setPayingTokenAddress(token.address);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('payment_token'), currentPaymentTokens]);

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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch(err => {
                toast.error('Failed to copy wallet address.')
            });
    };

    return (
        <>
            {isLoading ? (
                <div className='flex flex-col-reverse space-y-2 md:space-y-0 lg:grid lg:grid-cols-5 gap-4'>
                    <div className='flex flex-col space-y-2 lg:space-y-4 lg:col-span-3'>
                        <Card className='border-none animate-fade-left bg-gray-200 dark:bg-[#1c1717]'>
                            <CardHeader>
                                <CardTitle className='flex flex-row space-x-2 items-center justify-between'>
                                    <Skeleton className='bg-muted rounded-md w-16 h-12' />
                                    <Skeleton className='bg-muted rounded-md w-36 h-8' />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='bg-muted rounded-md w-full h-52' />
                            </CardContent>
                        </Card>

                        <Card className='border-none animate-fade-left bg-gray-200 dark:bg-[#1c1717]'>
                            <CardHeader>
                                <CardTitle>
                                    <Skeleton className='bg-muted rounded-md w-16 h-8' />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='bg-muted rounded-md w-full h-52' />
                            </CardContent>
                        </Card>
                    </div>

                    <div className='md:col-span-2'>
                        <Card className='border-none animate-fade-right bg-gray-200 dark:bg-[#1c1717] flex flex-col space-y-2'>
                            <CardHeader>
                                <CardTitle>Buy BIT10</CardTitle>
                            </CardHeader>
                            <CardContent className='flex flex-col space-y-2'>
                                <Skeleton className='bg-muted rounded-md w-full h-32' />
                                <Skeleton className='bg-muted rounded-md w-full h-32' />
                                <Skeleton className='bg-muted rounded-md w-full h-14' />
                                <Skeleton className='bg-muted rounded-md w-full h-12' />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className='flex flex-col-reverse space-y-2 md:space-y-0 lg:grid lg:grid-cols-5 gap-4'>
                    <div className='flex flex-col space-y-2 lg:space-y-4 lg:col-span-3'>
                        <Card className='border-none animate-fade-left bg-gray-200 dark:bg-[#1c1717]'>
                            <CardHeader>
                                <CardTitle className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:items-center md:justify-between'>
                                    <div className='md:text-3xl'>${(selectedBIT10TokenPrice).toFixed(2)}</div>
                                    <div className='relative flex flex-row space-x-2 items-center justify-center border border-muted rounded-md px-2 py-1.5'>
                                        <AnimatedBackground
                                            defaultValue='3Y'
                                            className='rounded bg-primary'
                                            transition={{
                                                ease: 'easeInOut',
                                                duration: 0.2,
                                            }}
                                            onValueChange={(newActiveId) => handleTabChange(newActiveId)}
                                        >
                                            {tabs.map((label, index) => (
                                                <button
                                                    key={index}
                                                    data-id={label}
                                                    type='button'
                                                    className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] text-sm font-light ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </AnimatedBackground>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className='select-none -ml-12 md:-ml-8'>
                                    {
                                        activeTab === '30D' &&
                                        <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                            <LineChart accessibilityLayer data={bit10Preformance30DChartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey='day'
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                                    stroke='#ffffff'
                                                />
                                                <YAxis
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickCount={3}
                                                    stroke='#ffffff'
                                                />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ChartContainer>
                                    }
                                    {
                                        activeTab === '60D' &&
                                        <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                            <LineChart accessibilityLayer data={bit10Preformance60DChartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey='day'
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                                    stroke='#ffffff'
                                                />
                                                <YAxis
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickCount={3}
                                                    stroke='#ffffff'
                                                />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ChartContainer>
                                    }
                                    {
                                        activeTab === '1Y' &&
                                        <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                            <LineChart accessibilityLayer data={bit10Preformance1YChartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey='day'
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                                    stroke='#ffffff'
                                                />
                                                <YAxis
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickCount={3}
                                                    stroke='#ffffff'
                                                />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ChartContainer>
                                    }
                                    {
                                        activeTab === '3Y' &&
                                        <ChartContainer config={bit10PreformanceChartConfig} className='max-h-[300px] w-full'>
                                            <LineChart accessibilityLayer data={bit10Preformance3YChartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey='day'
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                                    stroke='#ffffff'
                                                />
                                                <YAxis
                                                    tickLine={true}
                                                    axisLine={true}
                                                    tickMargin={8}
                                                    tickCount={3}
                                                    stroke='#ffffff'
                                                />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ChartContainer>
                                    }
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='border-none animate-fade-left bg-gray-200 dark:bg-[#1c1717]'>
                            <CardHeader>
                                <CardTitle className='md:text-3xl'>
                                    Allocation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='grid md:grid-cols-5 items-center'>
                                <div className='md:col-span-2'>
                                    <div className='flex-1'>
                                        <ChartContainer
                                            config={bit10AllocationChartConfig}
                                            className='aspect-square max-h-[300px]'
                                        >
                                            <PieChart>
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel />}
                                                />
                                                <Pie
                                                    data={bit10AllocationPieChartData}
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
                                                                            {bit10TokenName}
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
                                </div>
                                <div className='md:col-span-3'>
                                    <div className='grid md:gap-x-6'>
                                        {tokens?.sort((a, b) => b.marketCap - a.marketCap).map((token, index) => (
                                            <div
                                                key={index}
                                                className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'
                                            >
                                                <div className='flex flex-row items-center space-x-1'>
                                                    <div
                                                        className='w-3 h-3 rounded'
                                                        style={{ backgroundColor: color[index % color.length] }}
                                                    ></div>
                                                    <div>{token.name} ({token.symbol})</div>
                                                </div>
                                                <div>{((token.marketCap / totalMarketCap) * 100).toFixed(1)} %</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className='md:col-span-2'>
                        <Card className='border-none animate-fade-right bg-gray-200 dark:bg-[#1c1717]'>
                            <CardHeader>
                                <CardTitle>Buy</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off' className='flex flex-col space-y-2'>
                                        <div className='relative flex flex-col items-center'>
                                            <div className='bg-muted rounded-t-lg w-full px-4 py-2 flex flex-col space-y-2'>
                                                <div className='flex flex-row space-x-2 justify-between items-center'>
                                                    <div>You Pay</div>
                                                    {
                                                        chain &&
                                                        <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row space-x-1 items-center justify-center'>
                                                            <div className='font-light'>From</div>
                                                            <div className='font-semibold'>{formatWalletAddress(userAddress ?? '')}</div>
                                                        </Badge>
                                                    }
                                                </div>
                                                {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                                <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        {/* <div className='text-4xl text-center md:text-start text-wrap pt-[3px] bg-blue-500'> */}
                                                        <div className='text-4xl text-center md:text-start text-wrap pt-[3px]'>
                                                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                                            {/* @ts-expect-error */}
                                                            {selectedBIT10TokenPrice ? formatCompactNumber((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.01) : '0'}
                                                        </div>
                                                        {/* <div className='pt-[0.5px] text-center md:text-start bg-green-500'> */}
                                                        <div className='pt-[0.5px] text-center md:text-start'>
                                                            <div className='flex flex-row space-x-1 text-sm items-center justify-center md:justify-start pt-0.5'>
                                                                &asymp; ${selectedBIT10TokenPrice ? formatCompactNumber((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(4))) * 1.01) : '0'}
                                                                <TooltipProvider>
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Info className='w-4 h-4 cursor-pointer ml-1 -mt-0.5' />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                                            Price in {form.watch('payment_token')} + 1% Management fee <br />
                                                                            $ {formatCompactNumber(parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? 'N/A'))} + $ {formatCompactNumber(0.01 * (parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0')))} = $ {formatCompactNumber((parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0')) + (0.01 * (parseFloat(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice?.toFixed(4) ?? '0'))))}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='payment_token'
                                                            render={({ field }) => (
                                                                // <FormItem className='flex flex-row items-center justify-end bg-blue-500'>
                                                                <FormItem className='flex flex-row items-center justify-end'>
                                                                    <FormControl>
                                                                        <div className='w-full md:w-3/4 md:ml-auto'>
                                                                            <Button type='button' variant='outline' className={cn('border-2 dark:border-[#B4B3B3] z-10 w-full flex justify-between py-5 pl-1 pr-1.5', !field.value && 'text-muted-foreground')} onClick={() => setPaymentTokenDialogOpen(true)}>
                                                                                {field.value
                                                                                    ?
                                                                                    <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                        <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                            <Image src={payingTokenImg} alt={form.watch('payment_token')} width={35} height={35} className='z-20' />
                                                                                        </div>
                                                                                        <div>
                                                                                            {currentPaymentTokens.find((t) => t.value === field.value)?.label}
                                                                                        </div>
                                                                                    </div>
                                                                                    : 'Select token'}
                                                                                <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                            </Button>
                                                                            <Dialog open={paymentTokenDialogOpen} onOpenChange={setPaymentTokenDialogOpen}>
                                                                                <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                                    <DialogHeader>
                                                                                        <DialogTitle>Select Payment Token</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    <Input
                                                                                        placeholder='Search tokens'
                                                                                        value={paymentTokenSearch}
                                                                                        onChange={(e) => setPaymentTokenSearch(e.target.value)}
                                                                                        className='dark:border-[#B4B3B3]'
                                                                                    />
                                                                                    <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                                        {filteredPaymentTokens.length === 0 ? (
                                                                                            <div className='text-center text-gray-500 py-4'>No token found.</div>
                                                                                        ) : (
                                                                                            filteredPaymentTokens.map((token) => (
                                                                                                <Button
                                                                                                    key={token.value}
                                                                                                    variant='ghost'
                                                                                                    className='flex flex-row items-center justify-between py-6 px-2'
                                                                                                    onClick={() => {
                                                                                                        field.onChange(token.value);
                                                                                                        setPaymentTokenDialogOpen(false);
                                                                                                        setPaymentTokenSearch('');
                                                                                                    }}
                                                                                                >
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
                                                                                                        <Badge variant='outline'>{token.tokenType}</Badge>
                                                                                                    </div>
                                                                                                </Button>
                                                                                            ))
                                                                                        )}
                                                                                    </div>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        {/* <div className='text-sm text-center md:text-end pt-0.5 bg-green-500'> */}
                                                        <div className='text-sm text-center md:text-end pt-0.5'>
                                                            {formatCompactNumber(Number(payingTokenBalance))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ToDo: Update this and add functionality for buy and sell */}
                                            <Button type='button' variant='ghost' size='sm' className='md:absolute top-1/2 -translate-y-1/2 z-10 p-2 h-8 w-8 border-2 border-muted hover:bg-background group bg-background mt-2 md:mt-0' disabled={buying}>
                                                <ArrowUpDown className='h-8 w-8 transition-transform duration-700 group-hover:rotate-[180deg]' />
                                            </Button>

                                            <div className='bg-muted rounded-b-lg w-full px-4 py-2 flex flex-col space-y-2 -mt-6 md:mt-2'>
                                                <div className='flex flex-row space-x-2 justify-between items-center'>
                                                    <div>You Receive</div>
                                                    {
                                                        chain &&
                                                        <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row space-x-1 items-center justify-center'>
                                                            <div className='font-light'>To</div>
                                                            <div className='font-semibold'>{formatWalletAddress(userAddress ?? '')}</div>
                                                        </Badge>
                                                    }
                                                </div>
                                                {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                                <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='receive_amount'
                                                            render={({ field }) => (
                                                                // <FormItem className='pt-px pb-[1.5px] bg-blue-500'>
                                                                <FormItem className='pt-px pb-[1.5px]'>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className='border-2 dark:border-[#B4B3B3] bg-background! md:w-3/4'>
                                                                                <SelectValue placeholder='Select number of tokens' />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {bit10Amount.map((number) => (
                                                                                <SelectItem key={number} value={number}>
                                                                                    {number}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        {/* <div className='text-center md:text-start bg-green-500'> */}
                                                        <div className='text-center md:text-start'>
                                                            <div> &asymp; ${formatCompactNumber((parseInt(form.watch('receive_amount')) * parseFloat(selectedBIT10TokenPrice.toFixed(4))))}</div>
                                                        </div>
                                                    </div>
                                                    <div className='flex flex-col space-y-0.5'>
                                                        <FormField
                                                            control={form.control}
                                                            name='receive_token'
                                                            render={({ field }) => (
                                                                // <FormItem className='bg-blue-500'>
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <div className='w-full md:w-3/4 md:ml-auto'>
                                                                            <Button type='button' variant='outline' className={cn('border-2 dark:border-[#B4B3B3] z-10 w-full flex justify-between py-5 pl-1 pr-1.5', !field.value && 'text-muted-foreground')} onClick={() => setReceiveTokenDialogOpen(true)}>
                                                                                {field.value
                                                                                    ?
                                                                                    <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                        <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                            <Image src={BIT10Img as StaticImageData} alt='BIT10' width={35} height={35} className='z-20' />
                                                                                        </div>
                                                                                        <div>
                                                                                            {currentBIT10Tokens.find((t) => t.value === field.value)?.label}
                                                                                        </div>
                                                                                    </div>
                                                                                    : 'Select token'}
                                                                                <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                            </Button>
                                                                            <Dialog open={receiveTokenDialogOpen} onOpenChange={setReceiveTokenDialogOpen}>
                                                                                <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                                    <DialogHeader>
                                                                                        <DialogTitle>Select Receive Token</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    <Input
                                                                                        placeholder='Search tokens'
                                                                                        value={receiveTokenSearch}
                                                                                        onChange={(e) => setReceiveTokenSearch(e.target.value)}
                                                                                        className='dark:border-[#B4B3B3]'
                                                                                    />
                                                                                    <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                                        {filteredReceiveTokens.length === 0 ? (
                                                                                            <div className='text-center text-gray-500 py-4'>No token found.</div>
                                                                                        ) : (
                                                                                            filteredReceiveTokens.map((token) => (
                                                                                                <Button
                                                                                                    key={token.value}
                                                                                                    variant='ghost'
                                                                                                    className='flex flex-row items-center justify-between py-6 px-2'
                                                                                                    onClick={() => {
                                                                                                        field.onChange(token.value);
                                                                                                        setReceiveTokenDialogOpen(false);
                                                                                                        setReceiveTokenSearch('');
                                                                                                    }}
                                                                                                >
                                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-black p-0.5'>
                                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} />
                                                                                                        </div>
                                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                                            <div>{token.label}</div>
                                                                                                            <div>{formatAddress(token.address)}</div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <Badge variant='outline'>{token.tokenType}</Badge>
                                                                                                    </div>
                                                                                                </Button>
                                                                                            ))
                                                                                        )}
                                                                                    </div>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Accordion type='single' collapsible>
                                            <AccordionItem value='item-1' className='rounded-lg border-2 my-2 border-none bg-muted/50 px-4'>
                                                <AccordionTrigger className='hover:no-underline'><p>Summary</p></AccordionTrigger>
                                                <AccordionContent className='flex flex-col space-y-1 border-t-2 pt-4 tracking-wide'>
                                                    <div className='flex flex-row items-center justify-between space-x-2'>
                                                        <div>Management Fee</div>
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <div className='flex flex-row space-x-1 items-center'>
                                                                        <div>1%</div>
                                                                        <div>
                                                                            <Info className='size-3 align-middle relative bottom-[1px]' />
                                                                        </div>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                                    The Management Fee covers the cost of managing and rebalancing the token
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <div className='flex flex-row items-center justify-between space-x-2'>
                                                        <div>Exchange Rate</div>
                                                        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                                        {/* @ts-expect-error */}
                                                        <div>1 {form.watch('payment_token')} = {selectedBIT10TokenPrice > 0 ? formatCompactNumber(parseFloat(payingTokenPrice) / selectedBIT10TokenPrice) : '0'} {form.watch('receive_token')}</div>
                                                    </div>
                                                    <div className='flex flex-row items-center justify-between space-x-2'>
                                                        <div>Expected Time</div>
                                                        <div>1-2 min.</div>
                                                    </div>
                                                    <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                                        <div>Expected Output</div>
                                                        <div>{formatCompactNumber(parseFloat(form.watch('receive_amount')))} {form.watch('receive_token')}</div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>

                                        {chain && !isApproved && (
                                            <div className='border-muted border rounded-lg flex flex-col items-center space-y-2 px-2 py-4 text-center'>
                                                <div>The Buy BIT10 page is gated for mainnet access. Your Wallet Address needs to be approved first to use the Buy BIT10 feature.</div>
                                                <div>For access, please contact <a href='https://x.com/bit10startup' className='text-primary underline'>@bit10startup</a> on Twitter/X.</div>
                                            </div>
                                        )}

                                        <Button className='w-full rounded-lg' disabled={buyDisabledConditions}>
                                            {buying && <Loader2 className='animate-spin mr-2' size={15} />}
                                            {getBuyMessage()}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ToDo: Try adding this to the module page */}
            <TransactionProgressDialog
                open={isDialogOpen}
                steps={icpTransactionSteps}
                onClose={handleCloseDialog}
            />
        </>
    )
}
