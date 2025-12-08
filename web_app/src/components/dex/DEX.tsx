import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import * as z from 'zod'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useEVMWallet } from '@/context/EVMWalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatAddress, formatCompactNumber, formatCompactPercentNumber } from '@/lib/utils'
import { Settings, MoveLeft, ChevronsUpDown, Loader2, Info, ArrowUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fetchICPTokenBalance, swapICPToken } from './icp/ICPDEXModule'
import { fetchBaseTokenBalance } from './base/BaseDEXModule'
import { fetchSolanaTokenBalance } from './solana/SolanaDEXModule'
import { fetchBSCTokenBalance } from './bsc/BSCDEXModule'
import { supportedToken, supportedPools } from './supportedToken'
import { cn } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel, FormDescription } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image, { type StaticImageData } from 'next/image'
import CKUSDCImg from '@/assets/tokens/ckusdc.svg'
import USDCImg from '@/assets/tokens/usdc.svg'
import ETHImg from '@/assets/tokens/eth.svg'
import SOLImg from '@/assets/tokens/sol.svg'
import ICPImg from '@/assets/tokens/icp.svg'
import BaseImg from '@/assets/wallet/base-logo.svg'
import BSCImg from '@/assets/wallet/bsc-logo.svg'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AnimatePresence, motion } from 'framer-motion'

interface TokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

const supportedChains = [
    { id: 'all', name: 'All', logo: null },
    { id: 'icp', name: 'ICP', logo: ICPImg as StaticImageData },
    { id: 'base', name: 'Base', logo: BaseImg as StaticImageData },
    { id: 'solana', name: 'Solana', logo: SOLImg as StaticImageData },
    { id: 'bsc', name: 'Binance Smart Chain', logo: BSCImg as StaticImageData },
]

const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.02 },
    },
};

const listItemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const FormSchema = z.object({
    slippage: z.preprocess(
        (val) => (val === '' ? undefined : Number(val)),
        z
            .number()
            .min(1, { message: 'Slippage must be greater than or equal to 1' })
            .max(12, { message: 'Slippage must be less than or equal to 12' })
    ),
    from_token: z.string({ required_error: 'Please select a token' }),
    from_amount: z
        .preprocess((val) => (val === '' ? undefined : Number(val)), z.number())
        .refine((val) => /^\d+(\.\d{1,6})?$/.test(val.toString()), {
            message: 'Amount must be a number with up to 6 decimal places',
        }),
    tick_out_wallet_address: z.string().optional(),
    to_token: z.string({ required_error: 'Please select the token' }),
    to_amount: z
        .preprocess((val) => (val === '' ? undefined : Number(val)), z.number())
        .refine((val) => /^\d+(\.\d{1,6})?$/.test(val.toString()), {
            message: 'Amount must be a number with up to 6 decimal places',
        }),
}).superRefine((data, ctx) => {
    const fromToken = supportedToken.find((t) => t.token_id === data.from_token);
    const toToken = supportedToken.find((t) => t.token_id === data.to_token);

    if (fromToken && toToken) {
        const isCrossChain = fromToken.chain !== toToken.chain;

        if (isCrossChain && (!data.tick_out_wallet_address || data.tick_out_wallet_address.trim() === '')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Recipient address is required for Cross chain swaps',
                path: ['tick_out_wallet_address'],
            });
        }
    }
});

export default function DEX() {
    const [swaping, setSwaping] = useState<boolean>(false);
    const [slippageDialogOpen, setSlippageDialogOpen] = useState(false);
    const [fromTokenChainFilter, setFromTokenChainFilter] = useState('all');
    const [toTokenChainFilter, setToTokenChainFilter] = useState('all');
    const [fromTokenDialogOpen, setFromTokenDialogOpen] = useState(false);
    const [fromTokenSearch, setFromTokenSearch] = useState('');
    const [toTokenDialogOpen, setToTokenDialogOpen] = useState(false);
    const [toTokenSearch, setToTokenSearch] = useState('');
    const [lastUpdatedField, setLastUpdatedField] = useState<'from_amount' | 'to_amount'>('from_amount');

    const { chain } = useChain();
    const { icpAddress } = useICPWallet();
    const { evmAddress } = useEVMWallet();

    const { publicKey } = useWallet();

    const filteredFromTokens = useMemo(() => {
        if (!fromTokenSearch && fromTokenChainFilter === 'all') return supportedToken

        const query = fromTokenSearch.toLowerCase().trim()
        let result = supportedToken

        if (fromTokenChainFilter !== 'all') {
            const chainName = supportedChains.find(c => c.id === fromTokenChainFilter)?.name
            if (chainName) {
                result = result.filter(token => token.chain === chainName)
            }
        }

        if (query) {
            result = result.filter(token =>
                token.label.toLowerCase().includes(query) ||
                token.value.toLowerCase().includes(query) ||
                token.address.toLowerCase().includes(query) ||
                token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
            )
        }

        return result
    }, [fromTokenSearch, fromTokenChainFilter]);

    const filteredToTokens = useMemo(() => {
        if (!toTokenSearch && toTokenChainFilter === 'all') return supportedToken

        const query = toTokenSearch.toLowerCase().trim()
        let result = supportedToken

        if (toTokenChainFilter !== 'all') {
            const chainName = supportedChains.find(c => c.id === toTokenChainFilter)?.name
            if (chainName) {
                result = result.filter(token => token.chain === chainName)
            }
        }

        if (query) {
            result = result.filter(token =>
                token.label.toLowerCase().includes(query) ||
                token.value.toLowerCase().includes(query) ||
                token.address.toLowerCase().includes(query) ||
                token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
            )
        }

        return result
    }, [toTokenSearch, toTokenChainFilter]);

    const handleFromTokenDialogOpen = (open: boolean) => {
        setFromTokenDialogOpen(open)
        if (open) {
            setFromTokenChainFilter('all')
            setFromTokenSearch('')
        }
    }

    const handleToTokenDialogOpen = (open: boolean) => {
        setToTokenDialogOpen(open)
        if (open) {
            setToTokenChainFilter('all')
            setToTokenSearch('')
        }
    }

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            slippage: 3,
            from_token: '8916',
            from_amount: 1,
            to_token: '3408_1839',
            to_amount: 3,
        },
    });

    useEffect(() => {
        const fromTokenId = form.watch('from_token');
        const toTokenId = form.watch('to_token');
        const fromAmount = form.watch('from_amount');

        if (fromTokenId && toTokenId && fromAmount > 0) {
            const newToAmount = calculateAmount('from_amount', fromAmount, fromTokenId, toTokenId);
            form.setValue('to_amount', newToAmount, { shouldValidate: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedFromToken = useMemo(() => {
        const fromTokenId = form.watch('from_token');
        return supportedToken.find((token) => token.token_id === fromTokenId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_token')]);

    const selectedToToken = useMemo(() => {
        const toTokenId = form.watch('to_token');
        return supportedToken.find((token) => token.token_id === toTokenId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('to_token')]);

    useEffect(() => {
        const fromTokenId = form.watch('from_token');
        const toTokenId = form.watch('to_token');
        const fromAmount = form.watch('from_amount');
        const toAmount = form.watch('to_amount');

        if (fromTokenId && toTokenId) {
            if (lastUpdatedField === 'from_amount' && fromAmount > 0) {
                const newToAmount = calculateAmount('from_amount', fromAmount, fromTokenId, toTokenId);
                form.setValue('to_amount', newToAmount, { shouldValidate: false });
            } else if (lastUpdatedField === 'to_amount' && toAmount > 0) {
                const newFromAmount = calculateAmount('to_amount', toAmount, fromTokenId, toTokenId);
                form.setValue('from_amount', newFromAmount, { shouldValidate: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('from_token'), form.watch('to_token')]);

    const fetchTokenPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as TokenPriceResponse;
        return data.data.amount;
    }, []);

    const payWithPriceQueries = useQueries({
        queries: [
            {
                queryKey: ['icpPrice'],
                queryFn: () => fetchTokenPrice('ICP'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['usdcPrice'],
                queryFn: () => fetchTokenPrice('USDC'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['ethPrice'],
                queryFn: () => fetchTokenPrice('ETH'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['solPrice'],
                queryFn: () => fetchTokenPrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['bnbPrice'],
                queryFn: () => fetchTokenPrice('BNB'),
                refetchInterval: 30000, // 30 sec.
            }
        ],
    });

    const icpAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
    const usdcAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);
    const ethAmount = useMemo(() => payWithPriceQueries[2].data, [payWithPriceQueries]);
    const solAmount = useMemo(() => payWithPriceQueries[3].data, [payWithPriceQueries]);
    const bnbAmount = useMemo(() => payWithPriceQueries[4].data, [payWithPriceQueries]);

    const getTokenAmount = (tokenLabel?: string): string => {
        switch (tokenLabel) {
            case 'ICP':
                return icpAmount ?? '0';
            case 'USDC':
            case 'ckUSDC':
                return usdcAmount ?? '0';
            case 'ETH':
                return ethAmount ?? '0';
            case 'SOL':
                return solAmount ?? '0';
            case 'BNB':
                return bnbAmount ?? '0';
            default:
                return '0';
        }
    };

    const selectedFromTokenPrice = getTokenAmount(selectedFromToken?.label);
    const selectedToTokenPrice = getTokenAmount(selectedToToken?.label);

    const getTokenImg = (tokenLabel?: string): StaticImageData => {
        switch (tokenLabel) {
            case 'ICP':
                return ICPImg as StaticImageData;
            case 'ckUSDC':
                return CKUSDCImg as StaticImageData;
            case 'USDC':
                return USDCImg as StaticImageData;
            case 'ETH':
                return ETHImg as StaticImageData;
            case 'SOL':
                return SOLImg as StaticImageData;
            case 'BNB':
                return BSCImg as StaticImageData;
            default:
                return ICPImg as StaticImageData;
        }
    };

    const selectedFromTokenImg = getTokenImg(selectedFromToken?.label);
    const selectedToTokenImg = getTokenImg(selectedToToken?.label);

    const getTokenChainImg = (tokenChain?: string): StaticImageData => {
        switch (tokenChain) {
            case 'ICP':
                return ICPImg as StaticImageData;
            case 'Base':
                return BaseImg as StaticImageData;
            case 'Solana':
                return SOLImg as StaticImageData;
            case 'Binance Smart Chain':
                return BSCImg as StaticImageData;
            default:
                return ICPImg as StaticImageData;
        }
    };

    const selectedFromTokenChainImg = getTokenChainImg(selectedFromToken?.chain);
    const selectedToTokenChainImg = getTokenChainImg(selectedToToken?.chain);

    const matchingPool = useMemo(() => {
        if (!selectedFromToken || !selectedToToken) return null;

        return (
            supportedPools.find(
                (pool) =>
                    (pool.token_a_token_id === selectedFromToken.token_id &&
                        pool.token_b_token_id === selectedToToken.token_id) ||
                    (pool.token_a_token_id === selectedToToken.token_id &&
                        pool.token_b_token_id === selectedFromToken.token_id)
            ) ?? null
        );
    }, [selectedFromToken, selectedToToken]);

    const fromBalanceQueries = useQueries({
        queries: [
            // For For ICP
            {
                queryKey: ['paymentTokenBalanceICPICP', icpAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp') return '0';
                    return fetchICPTokenBalance({ canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp',
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceICPckUSDC', icpAddress, chain],
                queryFn: () => {
                    if (!icpAddress || chain !== 'icp') return '0';
                    return fetchICPTokenBalance({ canisterId: 'xevnm-gaaaa-aaaar-qafnq-cai', principal: icpAddress });
                },
                enabled: !!icpAddress && chain === 'icp',
                refetchInterval: 30000, // 30 seconds
            },

            // For Base
            {
                queryKey: ['paymentTokenBalanceBaseETH', evmAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'base') return '0';
                    return fetchBaseTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000base', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'base',
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceBaseUSDC', evmAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'base') return '0';
                    return fetchBaseTokenBalance({ tokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'base',
                refetchInterval: 30000, // 30 seconds
            },

            // For Solana
            {
                queryKey: ['paymentTokenBalanceSolanaSOL', publicKey, chain],
                queryFn: () => {
                    if (!publicKey || chain !== 'solana') return '0';
                    return fetchSolanaTokenBalance({ tokenAddress: 'So11111111111111111111111111111111111111111', publicKey: publicKey });
                },
                enabled: !!publicKey && chain === 'solana',
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceSolanaUSDC', publicKey, chain],
                queryFn: () => {
                    if (!publicKey || chain !== 'solana') return '0';
                    return fetchSolanaTokenBalance({ tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', publicKey: publicKey });
                },
                enabled: !!publicKey && chain === 'solana',
                refetchInterval: 30000, // 30 seconds
            },

            // For BSC
            {
                queryKey: ['paymentTokenBalanceBSCBNB', evmAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'bsc') return '0';
                    return fetchBSCTokenBalance({ tokenAddress: '0x0000000000000000000000000000000000000000bnb', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'bsc',
                refetchInterval: 30000, // 30 seconds
            },
            {
                queryKey: ['paymentTokenBalanceBSCUSDC', evmAddress, chain],
                queryFn: () => {
                    if (!evmAddress || chain !== 'bsc') return '0';
                    return fetchBSCTokenBalance({ tokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', address: evmAddress });
                },
                enabled: !!evmAddress && chain === 'bsc',
                refetchInterval: 30000, // 30 seconds
            }
        ],
    });

    const fetchTokenBalance = useMemo(() => {
        if (!selectedFromToken) return '0';
        const sourceChain = selectedFromToken?.chain;

        // For ICP
        if (sourceChain === 'ICP' && chain === 'icp' && selectedFromToken.address === 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
            return fromBalanceQueries[0].data ?? '0';
        } else if (sourceChain === 'ICP' && chain === 'icp' && selectedFromToken.address === 'xevnm-gaaaa-aaaar-qafnq-cai') {
            return fromBalanceQueries[1].data ?? '0';
        }

        // For Base
        else if (sourceChain === 'Base' && selectedFromToken.address === '0x0000000000000000000000000000000000000000base') {
            return fromBalanceQueries[2].data ?? '0';
        } else if (sourceChain === 'Base' && selectedFromToken.address === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913') {
            return fromBalanceQueries[3].data ?? '0';
        }

        // For Solana
        else if (sourceChain === 'Solana' && selectedFromToken.address === 'So11111111111111111111111111111111111111111') {
            return fromBalanceQueries[2].data ?? '0';
        } else if (sourceChain === 'Solana' && selectedFromToken.address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
            return fromBalanceQueries[3].data ?? '0';
        }

        // For BSC
        else if (sourceChain === 'Binance Smart Chain' && selectedFromToken.address === '0x0000000000000000000000000000000000000000bnb') {
            return fromBalanceQueries[2].data ?? '0';
        } else if (sourceChain === 'Binance Smart Chain' && selectedFromToken.address === '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d') {
            return fromBalanceQueries[3].data ?? '0';
        }

        else {
            return '0';
        }
    }, [selectedFromToken, chain, fromBalanceQueries]);

    const handleReverseTokens = () => {
        const currentFromToken = form.getValues('from_token');
        const currentToToken = form.getValues('to_token');
        const currentFromAmount = form.getValues('from_amount');
        const currentToAmount = form.getValues('to_amount');

        form.setValue('from_token', currentToToken);
        form.setValue('to_token', currentFromToken);

        form.setValue('from_amount', currentToAmount);
        form.setValue('to_amount', currentFromAmount);

        setLastUpdatedField('from_amount');
    };

    const getTokenPrice = useCallback((tokenId: string) => {
        const token = supportedToken.find((t) => t.token_id === tokenId);
        if (!token) return 0;

        if (token.label === 'ICP') {
            return parseFloat(icpAmount ?? '0');
        } else if (token.label === 'USDC' || token.label === 'ckUSDC') {
            return parseFloat(usdcAmount ?? '0');
        } else if (token.label === 'ETH') {
            return parseFloat(ethAmount ?? '0');
        } else if (token.label === 'SOL') {
            return parseFloat(solAmount ?? '0');
        } else if (token.label === 'BNB') {
            return parseFloat(bnbAmount ?? '0');
        }
        return 0;
    }, [icpAmount, usdcAmount, ethAmount, solAmount, bnbAmount]);

    const isUpdatingAmount = useRef(false);
    const lastFromAmount = useRef<number | undefined>(undefined);
    const lastToAmount = useRef<number | undefined>(undefined);
    const watchedValues = form.watch();

    const calculateAmount = useCallback(
        (sourceField: 'from_amount' | 'to_amount', sourceValue: number, fromTokenId: string, toTokenId: string) => {
            if (!sourceValue || !fromTokenId || !toTokenId) return 1;

            const fromPrice = getTokenPrice(fromTokenId);
            const toPrice = getTokenPrice(toTokenId);

            if (fromPrice === 0 || toPrice === 0) return 1;

            if (sourceField === 'from_amount') {
                const toAmount = (sourceValue * fromPrice) / toPrice;
                return parseFloat(toAmount.toFixed(6));
            } else {
                const fromAmount = (sourceValue * toPrice) / fromPrice;
                return parseFloat(fromAmount.toFixed(6));
            }
        },
        [getTokenPrice]
    );

    useEffect(() => {
        const { from_amount, to_amount, from_token, to_token } = watchedValues;

        if (isUpdatingAmount.current) {
            isUpdatingAmount.current = false;
            return;
        }

        if (lastFromAmount.current !== from_amount || lastToAmount.current !== to_amount) {
            if (lastUpdatedField === 'from_amount' && from_amount && from_amount > 0) {
                const newToAmount = calculateAmount('from_amount', from_amount, from_token, to_token);
                if (newToAmount !== to_amount) {
                    isUpdatingAmount.current = true;
                    form.setValue('to_amount', newToAmount, { shouldValidate: false });
                }
            } else if (lastUpdatedField === 'to_amount' && to_amount && to_amount > 0) {
                const newFromAmount = calculateAmount('to_amount', to_amount, from_token, to_token);
                if (newFromAmount !== from_amount) {
                    isUpdatingAmount.current = true;
                    form.setValue('from_amount', newFromAmount, { shouldValidate: false });
                }
            }

            lastFromAmount.current = from_amount;
            lastToAmount.current = to_amount;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedValues.from_amount, watchedValues.to_amount, watchedValues.from_token, watchedValues.to_token,
        calculateAmount, lastUpdatedField, form]);

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            const isValid = await form.trigger();
            if (!isValid) return;

            setSwaping(true);

            const fromToken = selectedFromToken;
            const toToken = selectedToToken;

            if (chain === 'icp') {
                await swapICPToken({ values: values, fromToken: fromToken, toToken: toToken, matchingPool: matchingPool, icpAddress: icpAddress ?? 'Guest' });
            } else {
                toast.error('Unsupported chain');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred during the swap. Please try again!');
        } finally {
            setSwaping(false);
        }
    };

    const fromTokensourceChain = (): string | undefined => {
        const sourceChain = selectedFromToken?.chain;
        if (sourceChain === 'ICP') {
            return 'icp';
        }
        if (sourceChain === 'Base') {
            return 'base';
        }
        if (sourceChain === 'Solana') {
            return 'solana';
        }
        if (sourceChain === 'Binance Smart Chain') {
            return 'bsc';
        }
        else {
            return undefined;
        }
    };

    const fromTokenChain = fromTokensourceChain();

    // ToDo: temp.
    const swapDisabledConditions = chain === 'base' || chain === 'solana' || chain === 'bsc' || !chain || swaping || selectedFromToken?.token_id === selectedToToken?.token_id || !matchingPool || chain !== fromTokenChain || form.watch('from_amount') >= Number(fetchTokenBalance) || form.watch('from_amount') >= (Number(fetchTokenBalance) * 1.01) || form.watch('from_amount') <= 0 || form.watch('to_amount') <= 0;

    const getSwapMessage = (): string => {
        const fromAmount = Number(form.watch('from_amount'));
        const balance = Number(fetchTokenBalance);

        if (!chain) return 'Connect your wallet to continue';
        // ToDo: temp.
        if (chain === 'base' || chain === 'solana' || chain === 'bsc') return `DEX coming soon on ${chain === 'base' ? 'Base' : chain === 'solana' ? 'Solana' : 'Binance Smart Chain'}`;
        if (chain !== fromTokenChain) return `Connect wallet on ${selectedFromToken?.chain} to continue`;
        if (fromAmount >= balance || fromAmount >= balance * 1.01 && !swaping) return 'Your balance is too low for this transaction';
        if (selectedFromToken?.token_id === selectedToToken?.token_id) return 'Same pair cannot be swapped';
        if (!matchingPool) return 'Pool not found for selected pair';
        if (form.watch('from_amount') <= 0 || form.watch('to_amount') <= 0) return 'Amount too low';
        if (swaping) return 'Swapping...';
        return 'Swap';
    };

    const userAddress = useMemo(() => {
        if (chain === 'icp') {
            return icpAddress;
        }
        return undefined;
    }, [chain, icpAddress]);

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
        <div className='flex flex-col h-full items-center justify-center'>
            <Card className='border-none w-[300px] md:w-[560px] animate-fade-bottom-up'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                                <div>
                                    <Dialog open={slippageDialogOpen} onOpenChange={async (open) => {
                                        if (!open) {
                                            const valid = await form.trigger('slippage');
                                            if (!valid) {
                                                setSlippageDialogOpen(true);
                                            } else {
                                                setSlippageDialogOpen(false);
                                            }
                                        } else {
                                            setSlippageDialogOpen(true);
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Settings size={24} className='cursor-pointer' />
                                        </DialogTrigger>
                                        <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                            <DialogHeader>
                                                <DialogTitle className='tracking-wide flex flex-row items-center'>
                                                    <button
                                                        type='button'
                                                        onClick={async () => {
                                                            const valid = await form.trigger('slippage');
                                                            if (valid) {
                                                                setSlippageDialogOpen(false);
                                                            }
                                                        }}
                                                        className='mr-2'
                                                    >
                                                        <MoveLeft size={24} className='cursor-pointer' />
                                                    </button>
                                                    Slippage
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Allowed price difference during a swap. Higher slippage = higher success, but worse rates.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className='flex items-center gap-2 border-t-2 pt-2'>
                                                <div className='grid flex-1 gap-2'>
                                                    Slippage tolerance
                                                    <FormField
                                                        control={form.control}
                                                        name='slippage'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-2'>
                                                                        <div className='w-full'>
                                                                            <div className='w-full relative'>
                                                                                <Input
                                                                                    type='number'
                                                                                    className='border-muted pr-8'
                                                                                    placeholder='Set slippage'
                                                                                    {...field}
                                                                                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                                                />
                                                                                <span className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>%</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className='flex flex-row space-x-2 mt-2'>
                                                                            {[1, 2, 3].map((suggestion) => (
                                                                                <Button
                                                                                    key={suggestion}
                                                                                    variant={Number(field.value) === suggestion ? 'default' : 'outline'}
                                                                                    className='border-muted'
                                                                                    onClick={async () => {
                                                                                        field.onChange(suggestion);
                                                                                        await form.trigger('slippage');
                                                                                    }}
                                                                                >
                                                                                    {suggestion}%
                                                                                </Button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='flex flex-col space-y-2'>
                            <div className='relative flex flex-col items-center'>
                                <div className='bg-muted rounded-t-lg w-full px-4 py-2 flex flex-col space-y-2'>
                                    <div className='flex flex-row space-x-2 justify-between items-center'>
                                        <div>From</div>
                                        {
                                            chain &&
                                            <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row space-x-1 items-center justify-center border-muted-foreground'>
                                                <div className='font-light'>From</div>
                                                <div className='font-semibold'>{formatWalletAddress(userAddress ?? '')}</div>
                                            </Badge>
                                        }
                                    </div>
                                    {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.5'>
                                            <FormField
                                                control={form.control}
                                                name='from_amount'
                                                render={({ field }) => (
                                                    // <FormItem className='py-[1.5px] bg-blue-500'>
                                                    <FormItem className='py-[1.5px]'>
                                                        <FormControl>
                                                            <Input
                                                                type='number'
                                                                className='border-[#B4B3B3] border-2'
                                                                placeholder='From Amount'
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                    setLastUpdatedField('from_amount');
                                                                    field.onChange(value);
                                                                    const newToAmount = calculateAmount('from_amount', value, form.watch('from_token'), form.watch('to_token'));
                                                                    form.setValue('to_amount', newToAmount, { shouldValidate: false });
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {/* <div className='pt-[0.5px] text-center md:text-start bg-green-500'> */}
                                            <div className='pt-[0.5px] text-center md:text-start'>
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <div className='flex flex-row space-x-1 text-sm items-center justify-center md:justify-start pt-0.5'>
                                                                &asymp; ${selectedFromTokenPrice ? formatCompactPercentNumber((Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice)) * 1.01) : '0'}
                                                                <Info className='w-4 h-4 cursor-pointer ml-1 -mt-0.5' />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                                                            Price in {selectedFromToken?.label} + 1% Liquidity Provider fee <br />
                                                            $ {formatCompactPercentNumber(Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice))} + $ {formatCompactPercentNumber(0.01 * (Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice)))} = $ {formatCompactPercentNumber((Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice)) + (0.01 * (Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice))))}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                        <div className='flex flex-col space-y-0.5'>
                                            <FormField
                                                control={form.control}
                                                name='from_token'
                                                render={({ field }) => (
                                                    // <FormItem className='flex flex-row items-center justify-end bg-blue-500'>
                                                    <FormItem className='flex flex-row items-center justify-end'>
                                                        <FormControl>
                                                            <div className='w-full md:w-3/4 md:ml-auto'>
                                                                <Button
                                                                    type='button'
                                                                    variant='outline'
                                                                    className={cn('border-2 border-[#B4B3B3] rounded-full z-10 w-full flex justify-between py-5 pl-1 pr-1.5', !field.value && 'text-muted-foreground')}
                                                                    onClick={() => setFromTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? (() => {
                                                                            const token = supportedToken.find((t) => t.token_id === field.value);
                                                                            return token ?
                                                                                <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                    <div className='relative border border-[#B4B3B3] rounded-full bg-black'>
                                                                                        <Image src={selectedFromTokenImg} alt='From token' width={35} height={35} className='z-20' />
                                                                                        <Image src={selectedFromTokenChainImg} alt='From Chain' height={15} className='absolute -bottom-0.5 right-0 border border-[#B4B3B3] rounded-full bg-white' />
                                                                                    </div>
                                                                                    <div>
                                                                                        {token.label}
                                                                                    </div>
                                                                                </div>
                                                                                : 'Select token';
                                                                        })()
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={fromTokenDialogOpen} onOpenChange={handleFromTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select Token</DialogTitle>
                                                                        </DialogHeader>
                                                                        <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-wrap gap-2'>
                                                                            {supportedChains.map((chain) => (
                                                                                <TooltipProvider key={chain.id}>
                                                                                    <Tooltip delayDuration={300}>
                                                                                        <TooltipTrigger asChild>
                                                                                            <motion.div
                                                                                                className={cn(
                                                                                                    'h-12 w-12 p-2 flex items-center justify-center border-mute border-2 rounded-lg cursor-pointer',
                                                                                                    fromTokenChainFilter === chain.id
                                                                                                        ? 'bg-primary text-primary-foreground'
                                                                                                        : 'bg-background'
                                                                                                )}
                                                                                                onClick={() => setFromTokenChainFilter(chain.id)}
                                                                                                variants={listItemVariants}>
                                                                                                {chain.logo != null ?
                                                                                                    <Image src={chain.logo} alt={chain.name} width={30} height={30} /> : <>{chain.name}</>
                                                                                                }
                                                                                            </motion.div>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent className='text-center'>
                                                                                            {chain.name}
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            ))}
                                                                        </motion.div>
                                                                        <Input
                                                                            placeholder='Search tokens by address or token name'
                                                                            value={fromTokenSearch}
                                                                            onChange={(e) => setFromTokenSearch(e.target.value)}
                                                                            className='border-mute'
                                                                        />
                                                                        <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-col space-y-2 max-h-60 overflow-y-auto pr-1'>
                                                                            {filteredFromTokens.length === 0 ? (
                                                                                <motion.div variants={listItemVariants} className='text-center text-gray-500 py-4'>No token found.</motion.div>
                                                                            ) : (
                                                                                filteredFromTokens.map((token) => (
                                                                                    <motion.div key={token.token_id} variants={listItemVariants}>
                                                                                        <Button
                                                                                            variant='ghost'
                                                                                            className='flex flex-row items-center justify-between py-6 w-full px-1'
                                                                                            onClick={() => {
                                                                                                field.onChange(token.token_id);
                                                                                                setFromTokenDialogOpen(false);
                                                                                                setFromTokenSearch('');
                                                                                            }}
                                                                                        >
                                                                                            <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                                <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                                                                    <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                                </div>
                                                                                                <div className='flex flex-col items-start tracking-wide'>
                                                                                                    <div>{token.label} (on {token.chain})</div>
                                                                                                    <div>{formatAddress(token.address)}</div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <Badge variant='outline' className='hidden md:block border-muted-foreground'>
                                                                                                {token.token_type}
                                                                                            </Badge>
                                                                                        </Button>
                                                                                    </motion.div>
                                                                                ))
                                                                            )}
                                                                        </motion.div>
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
                                                {formatCompactNumber(Number(fetchTokenBalance))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button type='button' variant='ghost' size='sm' className='md:absolute top-1/2 -translate-y-1/2 z-10 rounded-full p-2 h-8 w-8 border-2 border-muted hover:bg-background group bg-background mt-2 md:mt-0' onClick={handleReverseTokens} disabled={swaping}>
                                    <ArrowUpDown className='h-8 w-8 transition-transform duration-700 group-hover:rotate-[180deg]' />
                                </Button>

                                <div className='bg-muted rounded-b-lg w-full px-4 py-2 flex flex-col space-y-2 -mt-6 md:mt-2'>
                                    <div className='flex flex-row space-x-2 justify-between items-center'>
                                        <div>To</div>
                                        {
                                            chain &&
                                            <Badge variant='outline' onClick={handleCopyAddress} className='cursor-pointer flex flex-row space-x-1 items-center justify-center border-muted-foreground'>
                                                <div className='font-light'>To</div>
                                                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                                {/* @ts-expect-error */}
                                                <div className='font-semibold'>{formatWalletAddress(matchingPool?.pair_type === 'Cross Chain' ? form.watch('tick_out_wallet_address') : (userAddress ?? ''))}</div>
                                            </Badge>
                                        }
                                    </div>
                                    {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.5'>
                                            <FormField
                                                control={form.control}
                                                name='to_amount'
                                                render={({ field }) => (
                                                    // <FormItem className='py-[1.5px] bg-blue-500'>
                                                    <FormItem className='py-[1.5px]'>
                                                        <FormControl>
                                                            <Input
                                                                type='number'
                                                                className='border-[#B4B3B3] border-2'
                                                                placeholder='To Amount'
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                    setLastUpdatedField('to_amount');
                                                                    field.onChange(value);
                                                                    const newFromAmount = calculateAmount('to_amount', value, form.watch('from_token'), form.watch('to_token'));
                                                                    form.setValue('from_amount', newFromAmount, { shouldValidate: false });
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {/* <div className='pt-[0.5px] text-center md:text-start bg-green-500'> */}
                                            <div className='pt-[0.5px] text-center md:text-start'>
                                                &asymp; ${formatCompactPercentNumber(Number(form.watch('to_amount')) * parseFloat(selectedToTokenPrice))}
                                            </div>
                                        </div>
                                        <div className='flex flex-col space-y-0.5'>
                                            <FormField
                                                control={form.control}
                                                name='to_token'
                                                render={({ field }) => (
                                                    // <FormItem className='flex flex-row items-center justify-end bg-blue-500'>
                                                    <FormItem className='flex flex-row items-center justify-end'>
                                                        <FormControl>
                                                            <div className='w-full md:w-3/4 md:ml-auto'>
                                                                <Button
                                                                    type='button'
                                                                    variant='outline'
                                                                    className={cn('border-2 border-[#B4B3B3] rounded-full z-10 w-full flex justify-between py-5 pl-1 pr-1.5', !field.value && 'text-muted-foreground')}
                                                                    onClick={() => setToTokenDialogOpen(true)}
                                                                >
                                                                    {field.value
                                                                        ? (() => {
                                                                            const token = supportedToken.find((t) => t.token_id === field.value);
                                                                            return token ?
                                                                                <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                    <div className='relative border border-[#B4B3B3] rounded-full bg-black'>
                                                                                        <Image src={selectedToTokenImg} alt='To token' width={35} height={35} className='z-20' />
                                                                                        <Image src={selectedToTokenChainImg} alt='To Chain' width={15} height={15} className='absolute -bottom-0.5 right-0 border border-[#B4B3B3] rounded-full bg-white' />
                                                                                    </div>
                                                                                    <div>
                                                                                        {token.label}
                                                                                    </div>
                                                                                </div>
                                                                                : 'Select token';
                                                                        })()
                                                                        : 'Select token'}
                                                                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                                </Button>
                                                                <Dialog open={toTokenDialogOpen} onOpenChange={handleToTokenDialogOpen}>
                                                                    <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Select Token</DialogTitle>
                                                                        </DialogHeader>

                                                                        <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-wrap gap-2'>
                                                                            {supportedChains.map((chain) => (
                                                                                <TooltipProvider key={chain.id}>
                                                                                    <Tooltip delayDuration={300}>
                                                                                        <TooltipTrigger asChild>
                                                                                            <motion.div
                                                                                                className={cn(
                                                                                                    'h-12 w-12 p-2 flex items-center justify-center border-mute border-2 rounded-lg cursor-pointer',
                                                                                                    toTokenChainFilter === chain.id
                                                                                                        ? 'bg-primary text-primary-foreground'
                                                                                                        : 'bg-background'
                                                                                                )}
                                                                                                onClick={() => setToTokenChainFilter(chain.id)}
                                                                                                variants={listItemVariants}>
                                                                                                {chain.logo != null ?
                                                                                                    <Image src={chain.logo} alt={chain.name} width={30} height={30} /> : <>{chain.name}</>
                                                                                                }
                                                                                            </motion.div>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent className='text-center'>
                                                                                            {chain.name}
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            ))}
                                                                        </motion.div>

                                                                        <Input
                                                                            placeholder='Search tokens by address or token name'
                                                                            value={toTokenSearch}
                                                                            onChange={(e) => setToTokenSearch(e.target.value)}
                                                                            className='border-mute'
                                                                        />
                                                                        <motion.div
                                                                            className='flex flex-col space-y-2 max-h-60 overflow-y-auto'
                                                                            initial='hidden'
                                                                            animate='show'
                                                                            exit='hidden'
                                                                            variants={listContainerVariants}
                                                                        >
                                                                            {filteredToTokens.length === 0 ? (
                                                                                <motion.div variants={listItemVariants} className='text-center text-gray-500 py-4'>No token found.</motion.div>
                                                                            ) : (
                                                                                filteredToTokens.map((token) => (
                                                                                    <motion.div key={token.token_id} variants={listItemVariants}>
                                                                                        <Button
                                                                                            variant='ghost'
                                                                                            className='flex flex-row items-center justify-between py-6 w-full'
                                                                                            onClick={() => {
                                                                                                field.onChange(token.token_id);
                                                                                                setToTokenDialogOpen(false);
                                                                                                setToTokenSearch('');
                                                                                            }}
                                                                                        >
                                                                                            <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                                <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                                                                    <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                                </div>
                                                                                                <div className='flex flex-col items-start tracking-wide'>
                                                                                                    <div>{token.label} (on {token.chain})</div>
                                                                                                    <div>{formatAddress(token.address)}</div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <Badge variant='outline' className='hidden md:block border-muted-foreground'>
                                                                                                {token.token_type}
                                                                                            </Badge>
                                                                                        </Button>
                                                                                    </motion.div>
                                                                                ))
                                                                            )}
                                                                        </motion.div>
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

                            <AnimatePresence>
                                {matchingPool?.pair_type === 'Cross Chain' && (
                                    <motion.div
                                        key='recipient'
                                        initial={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', paddingTop: 8, paddingBottom: 8 }}
                                        exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                        className='overflow-hidden px-1'
                                    >
                                        <FormField
                                            control={form.control}
                                            name='tick_out_wallet_address'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Recipient address</FormLabel>
                                                    <FormControl>
                                                        <Input className='border-muted' placeholder='Recipient wallet address' {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Recipient&apos;s wallet address on the chain you&apos;re swapping to
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Accordion type='single' collapsible>
                                <AccordionItem value='item-1' className='rounded-lg border-2 my-2 border-none bg-muted/50 px-4'>
                                    <AccordionTrigger className='hover:no-underline'><p>Summary</p></AccordionTrigger>
                                    <AccordionContent className='flex flex-col space-y-1 border-t-2 pt-4 tracking-wide'>
                                        <div className='flex flex-row items-center justify-between space-x-2 text-sm'>
                                            <div>Slippage</div>
                                            <div className='flex flex-row space-x-1 items-center'>
                                                <div>{form.watch('slippage')}%</div>
                                                <div>
                                                    <Settings className='size-3 align-middle relative bottom-[1px]' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Minimum receive</div>
                                            <div>{formatCompactNumber((form.watch('to_amount') || 0) * (1 - Number(form.watch('slippage') || 0) / 100))} {selectedToToken?.label}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Liquidity Provider fee</div>
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
                                                        A small fee paid to liquidity providers for facilitating token swaps
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Exchange Rate</div>
                                            <div>1 {selectedFromToken?.label} = {Number(selectedToTokenPrice) > 0 ? formatCompactNumber(Number(selectedFromTokenPrice) / Number(selectedToTokenPrice)) : '0'} {selectedToToken?.label}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Expected Time</div>
                                            <div>2-3 min.</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2 font-semibold tracking-wider'>
                                            <div>Expected Output</div>
                                            <div>{formatCompactNumber(Number(form.watch('to_amount')))} {selectedToToken?.label}</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {swaping && (
                                <motion.div className='text-center' initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
                                    Please keep this tab open until the swap is complete.
                                </motion.div>
                            )}

                            <Button className='w-full' disabled={swapDisabledConditions}>
                                {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                                {getSwapMessage()}
                            </Button>
                        </CardContent>
                    </form>
                </Form>
            </Card>
        </div>
    )
}
