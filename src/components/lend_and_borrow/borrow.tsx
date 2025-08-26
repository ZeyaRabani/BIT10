import React, { useState, useMemo, useCallback } from 'react'
import type { LendAndBorrorTableDataType } from '@/components/ui/data-table-lend-and-borrow'
import { useChain } from '@/context/ChainContext'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import * as z from 'zod'
import { useQueries } from '@tanstack/react-query'
import Image, { type StaticImageData } from 'next/image'
import BIT10Img from '@/assets/swap/bit10.svg'
import ICPImg from '@/assets/swap/icp.svg'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useICPWallet } from '@/context/ICPWalletContext'
import { fetchICPTokenBalance, createICPBorrowTransaction } from './icp/ICPLendandBorrowModule'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { formatAmount, formatAddress } from '@/lib/utils'

interface TokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
}

const supportedToken = [
    // ICP tokens (ICRC)
    {
        label: 'Test BIT10.TOP',
        value: 'Test BIT10.TOP',
        img: BIT10Img as StaticImageData,
        address: 'wbckh-zqaaa-aaaap-qpuza-cai',
        chain: 'ICP',
        token_type: 'ICRC1',
        slug: ['icp', 'top 10 crypto']
    }
]

const supportedChains = [
    { id: 'all', name: 'All', logo: null },
    { id: 'icp', name: 'ICP', logo: ICPImg as StaticImageData }
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

export default function Borrow({ item }: { item: LendAndBorrorTableDataType }) {
    const [borrowing, setBorrowing] = useState<boolean>(false);
    const [collateralTokenChainFilter, setCollateralTokenChainFilter] = useState('all');
    const [collateralTokenDialogOpen, setCollateralTokenDialogOpen] = useState(false);
    const [collateralTokenSearch, setCollateralTokenSearch] = useState('');

    const { chain } = useChain();
    const { ICPAddress } = useICPWallet();

    const FormSchema = z.object({
        collateral_token: z.string({ required_error: 'Please select a collateral token' }),
        collateral_amount: z
            .preprocess((val) => (val === '' ? undefined : Number(val)), z.number())
            .refine((val) => /^\d+(\.\d{1,6})?$/.test(val.toString()), {
                message: 'Amount must be a number with up to 6 decimal places',
            }),
        borrow_amount: z
            .preprocess((val) => (val === '' ? undefined : Number(val)), z.number())
            .refine((val) => /^\d+(\.\d{1,6})?$/.test(val.toString()), {
                message: 'Amount must be a number with up to 6 decimal places',
            }),
        borrow_wallet_address: z.string().optional()
    }).superRefine((data, ctx) => {
        const collateralToken = supportedToken.find((t) => t.address === data.collateral_token);
        if (collateralToken) {
            const isCrossChain = chain !== borrowingTokenChain;
            if (isCrossChain && (!data.borrow_wallet_address || data.borrow_wallet_address.trim() === '')) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Recipient address is required when borrowing on a different chain',
                    path: ['borrow_wallet_address'],
                });
            }
        }
    });

    const filteredCollateralTokens = useMemo(() => {
        if (!collateralTokenSearch && collateralTokenChainFilter === 'all') return supportedToken;

        const query = collateralTokenSearch.toLowerCase().trim();
        let result = supportedToken;

        if (collateralTokenChainFilter !== 'all') {
            const chainName = supportedChains.find(c => c.id === collateralTokenChainFilter)?.name;
            if (chainName) {
                result = result.filter(token => token.chain === chainName);
            }
        };

        if (query) {
            result = result.filter(token =>
                token.label.toLowerCase().includes(query) ||
                token.value.toLowerCase().includes(query) ||
                token.address.toLowerCase().includes(query) ||
                token.slug?.some((slug: string) => slug.toLowerCase().includes(query))
            )
        };

        return result;
    }, [collateralTokenSearch, collateralTokenChainFilter]);

    const handleCollateralTokenDialogOpen = (open: boolean) => {
        setCollateralTokenDialogOpen(open);
        if (open) {
            setCollateralTokenChainFilter('all');
            setCollateralTokenSearch('');
        }
    };

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            collateral_token: 'wbckh-zqaaa-aaaap-qpuza-cai',
            collateral_amount: 0.02,
            borrow_amount: 0.01
        },
    });

    const selectedCollateralToken = useMemo(() => {
        const collateralTokenAddress = form.watch('collateral_token');
        return supportedToken.find((token) => token.address === collateralTokenAddress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch('collateral_token')]);

    const fetchBIT10Price = useCallback(async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        const data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> };
        return data.tokenPrice ?? 0;
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

    const bit10TOPPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);

    const fetchTokenPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as TokenPriceResponse;
        return data.data.amount;
    }, []);

    const borrowTokenPriceQueries = useQueries({
        queries: [
            {
                queryKey: ['usdcPrice'],
                queryFn: () => fetchTokenPrice('USDC'),
                refetchInterval: 30000, // 30 sec.
            }
        ],
    });

    const usdcAmount = useMemo(() => borrowTokenPriceQueries[0].data, [borrowTokenPriceQueries]);

    const bit10TokenPrice = (): number => {
        const bit10Token = form.watch('collateral_token');
        if (bit10Token === 'wbckh-zqaaa-aaaap-qpuza-cai') {
            return bit10TOPPrice ?? 0;
        } else {
            return 0;
        }
    };

    const selectedBIT10CollateralTokenPrice = bit10TokenPrice();

    const collateralTokenImg = (tokenLabel?: string): StaticImageData => {
        switch (tokenLabel) {
            case 'Test BIT10.TOP':
                return BIT10Img as StaticImageData;
            default:
                return BIT10Img as StaticImageData;
        }
    };

    const selectedCollateralTokenImg = collateralTokenImg(selectedCollateralToken?.label);

    const collateralBalanceQueries = useQueries({
        queries: [
            // For ICP
            {
                queryKey: ['bit10TOPBalance', ICPAddress, 'wbckh-zqaaa-aaaap-qpuza-cai'],
                queryFn: () => {
                    if (!ICPAddress || chain !== 'icp') return '0';
                    return fetchICPTokenBalance('wbckh-zqaaa-aaaap-qpuza-cai', ICPAddress);
                },
                enabled: !!ICPAddress && chain === 'icp',
                refetchInterval: 10000, // 10 seconds
            }
        ],
    });

    const collateralTokenBalance = useMemo(() => {
        if (!chain) return 0;

        // For ICP
        if (item.token_chain === 'ICP' && chain === 'icp' && selectedCollateralToken?.address === 'wbckh-zqaaa-aaaap-qpuza-cai') {
            return collateralBalanceQueries[0].data ?? 0;
        }
        else {
            return 0;
        }
    }, [chain, collateralBalanceQueries, item.token_chain, selectedCollateralToken?.address]);

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            const isValid = await form.trigger();
            if (!isValid) return;

            setBorrowing(true);

            if (chain === 'icp' && ICPAddress) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                await createICPBorrowTransaction({ address: ICPAddress, values: values, collateralChain: selectedCollateralToken?.chain });
            } else {
                toast.error('Unsupported chain');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred during the swap. Please try again!');
        } finally {
            setBorrowing(false);
        }
    };

    const borrowingTokenSourceChain = (): string | undefined => {
        const sourceChain = item.token_chain;
        if (sourceChain === 'ICP') {
            return 'icp';
        }
        else {
            return undefined;
        }
    };

    const borrowingTokenChain = borrowingTokenSourceChain();

    const isCrossChain = useMemo(() => {
        return chain !== borrowingTokenChain;
    }, [chain, borrowingTokenChain]);

    const borrowDisabledConditions = !chain || chain !== borrowingTokenChain || borrowing || form.watch('collateral_amount') >= Number(collateralTokenBalance) * (parseFloat(item.ltv) / 100) || form.watch('collateral_amount') >= Number(collateralTokenBalance) || form.watch('collateral_amount') <= 0;

    const getBorrowMessage = (): string => {
        const borrowingAmount = Number(form.watch('collateral_amount'));
        const collateralbalance = Number(collateralTokenBalance);

        if (!chain) return 'Connect your wallet to continue';
        // ToDo: Temp, remove this when supported
        if (item.token_chain !== 'ICP') return `Borrowing will be available on ${item.token_chain} soon`;
        if (chain !== borrowingTokenChain) return `Connect wallet on ${item.token_chain} to continue`;
        if (borrowingAmount >= collateralbalance * (parseFloat(item.ltv) / 100)) return `You cannot borrow an amount too close to your collateral's value`;
        if (borrowingAmount >= collateralbalance) return 'Your collateral balance is too low for borrowing';
        if (borrowingAmount <= 0) return 'Amount too low';
        if (borrowing) return 'Borrowing...';
        return 'Borrow';
    };

    return (
        <Dialog>
            <DialogTrigger>
                <Button>Borrow Token</Button>
            </DialogTrigger>
            <DialogContent className='max-w-[90vw] md:max-w-lg'>
                <DialogHeader>
                    <DialogTitle>Borrow Token</DialogTitle>
                    <DialogDescription>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                                <div className='flex flex-col space-y-2 pt-2'>
                                    <FormField
                                        control={form.control}
                                        name='collateral_token'
                                        render={({ field }) => (
                                            <FormItem className='w-full'>
                                                <FormLabel>Select BIT10 Collateral</FormLabel>
                                                <FormControl>
                                                    <div>
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            className={cn('border-2 dark:border-[#B4B3B3] rounded z-10 w-full flex justify-between', !field.value && 'text-muted-foreground')}
                                                            onClick={() => setCollateralTokenDialogOpen(true)}
                                                        >
                                                            {field.value
                                                                ? (() => {
                                                                    const token = supportedToken.find((t) => t.address === field.value);
                                                                    return token ?
                                                                        <div className='flex flex-row space-x-2 items-center'>
                                                                            <Image src={selectedCollateralTokenImg} alt='From' height={25} className='pr-1' />
                                                                            {token.label} (on {token.chain})
                                                                        </div>
                                                                        : 'Select token';
                                                                })()
                                                                : 'Select token'}
                                                            <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                                                        </Button>
                                                        <Dialog open={collateralTokenDialogOpen} onOpenChange={handleCollateralTokenDialogOpen}>
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
                                                                                            'h-12 w-12 p-2 flex items-center justify-center dark:border-white border-2 rounded-lg cursor-pointer',
                                                                                            collateralTokenChainFilter === chain.id
                                                                                                ? 'bg-primary text-primary-foreground'
                                                                                                : 'bg-background'
                                                                                        )}
                                                                                        onClick={() => setCollateralTokenChainFilter(chain.id)}
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
                                                                    value={collateralTokenSearch}
                                                                    onChange={(e) => setCollateralTokenSearch(e.target.value)}
                                                                    className='dark:border-white'
                                                                />
                                                                <motion.div initial='hidden' animate='show' exit='hidden' variants={listContainerVariants} className='flex flex-col space-y-2 max-h-60 overflow-y-auto'>
                                                                    {filteredCollateralTokens.length === 0 ? (
                                                                        <motion.div variants={listItemVariants} className='text-center text-gray-500 py-4'>No token found.</motion.div>
                                                                    ) : (
                                                                        filteredCollateralTokens.map((token) => (
                                                                            <motion.div key={token.address} variants={listItemVariants}>
                                                                                <Button
                                                                                    variant='ghost'
                                                                                    className='flex flex-row items-center justify-between py-6 w-full'
                                                                                    onClick={() => {
                                                                                        field.onChange(token.address);
                                                                                        setCollateralTokenDialogOpen(false);
                                                                                        setCollateralTokenSearch('');
                                                                                    }}
                                                                                >
                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                        <div className='hidden md:block'>
                                                                                            <Image src={token.img} alt={token.label} height={35} />
                                                                                        </div>
                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                            <div>{token.label} (on {token.chain})</div>
                                                                                            <div>{formatAddress(token.address)}</div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <Badge variant='outline' className='hidden md:block'>
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

                                    <FormField
                                        control={form.control}
                                        name='collateral_amount'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Collateral Amount</FormLabel>
                                                <FormControl>
                                                    <Input className='dark:border-white' placeholder='Collateral amount' {...field} type='number' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='borrow_amount'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Borrow Amount</FormLabel>
                                                <FormControl>
                                                    <Input className='dark:border-white' placeholder='Borrow amount' {...field} type='number' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {isCrossChain && (
                                        <div className='overflow-hidden'>
                                            <FormField
                                                control={form.control}
                                                name='borrow_wallet_address'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Receiver Address</FormLabel>
                                                        <FormControl>
                                                            <Input className='dark:border-white' placeholder='Receiver wallet address' {...field} type='number' />
                                                        </FormControl>
                                                        <FormDescription>Enter the wallet address where you want to receive the borrowed tokens</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                    <div className='bg-blue-200 flex flex-col space-y-1 rounded border-2 border-blue-600 text-black p-2'>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Borrowed Token</div>
                                            <div>{item.token_name} (on {item.token_chain})</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Current LTV</div>
                                            <div>{item.ltv}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Interest Rate/APY</div>
                                            <div>{item.apy}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Exchange Rate</div>
                                            <div>1 {selectedCollateralToken?.label} = {Number(selectedBIT10CollateralTokenPrice) > 0 ? formatAmount(Number(selectedBIT10CollateralTokenPrice) / Number(usdcAmount)) : '0'} {item.token_name}</div>
                                        </div>
                                        <div className='flex flex-row items-center justify-between space-x-2'>
                                            <div>Available Liquidity</div>
                                            <div>{item.available_liquidity} {item.token_name}</div>
                                        </div>
                                    </div>

                                    <div>
                                        If you fail to repay the loan with interest on time, your collateral will be liquidated.
                                    </div>

                                    <Button className='w-full rounded-lg' disabled={borrowDisabledConditions}>
                                        {borrowing && <Loader2 className='animate-spin mr-2' size={15} />}
                                        {getBorrowMessage()}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog >
    )
}
