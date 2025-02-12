"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import * as z from 'zod'
import { useWallet } from '@/context/WalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
// import AnimatedBackground from '@/components/ui/animated-background'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Info, ArrowUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import CkBTCImg from '@/assets/swap/ckBTC.png'
import CkETHImg from '@/assets/swap/ckETH.png'
import ICPImg from '@/assets/swap/ICP.png'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import BIT10Img from '@/assets/swap/bit10.svg'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { idlFactory as idlFactory2 } from '@/lib/swap.did'
import crypto from 'crypto'
import { newTokenSwap } from '@/actions/dbActions'

interface BuyingTokenPriceResponse {
  data: {
    amount: string;
    base: string;
    currency: string;
  };
}

// type ActorType = {
//   icrc1_transfer: (args: {
//     to: { owner: Principal; subaccount: [] };
//     memo: [];
//     fee: [];
//     from_subaccount: [];
//     created_at_time: [];
//     amount: bigint;
//   }) => Promise<{ Ok?: number; Err?: { InsufficientFunds?: null } }>;
// };

type ICRC2ActorType = {
  icrc2_approve: (args: {
    spender: { owner: Principal; subaccount: [] };
    fee: [];
    memo: [];
    from_subaccount: [];
    created_at_time: [];
    amount: bigint;
    expected_allowance: [];
    expires_at: [bigint];
  }) => Promise<{ Ok?: number; Err?: { InsufficientFunds?: null } }>;
};

type Mode = 'swap' | 'mint';

// const tabs = ['Quick Swap', 'Advanced Trading']

const paymentMethod = [
  'ckBTC',
  'ckETH',
  'ICP'
]

const bit10Amount = [
  '1',
  '2',
  '3',
  '4',
  '5'
]

const bit10Token = [
  'BIT10.DEFI',
  // 'BIT10.BRC20'
]

const mintReciveToken = [
  'ICP'
]

const FormSchema = z.object({
  payment_method: z.string({
    required_error: 'Please select a payment method',
  }),
  bit10_amount: z.string({
    required_error: 'Please select the number of BIT10 tokens to receive',
  }),
  bit10_token: z.string({
    required_error: 'Please select the BIT10 token to receive',
  }),
  minting_bit10_amount: z.preprocess((value) => parseFloat(value as string), z.number({
    required_error: 'Please enter the number of BIT10 tokens you wish to transfer',
  })
    .positive('The amount must be a positive number')
    .min(0.03, 'Minimum amount should be 0.03')
    .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
  minting_bit10_token: z.string({
    required_error: 'Please select the BIT10 token to mint',
  }),
  recieving_token: z.string({
    required_error: 'Please select the token to recieve after mint'
  })
})

export default function SwapModule() {
  // const [activeTab, setActiveTab] = useState('Quick Swap');
  const [processing, setProcessing] = useState<boolean>(false);
  const [isMintMode, setIsMintMode] = useState<Mode>('swap');

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isConnected, principalId } = useWallet();

  useEffect(() => {
    const roleParam = searchParams.get('mode') as Mode | null;
    if (roleParam) {
      setIsMintMode(roleParam);
    }
  }, [searchParams]);

  const handleModeClick = () => {
    setIsMintMode(prev => prev === 'swap' ? 'mint' : 'swap');
    const search = isMintMode === 'swap' ? 'mint' : 'swap';
    router.push(`${pathname}?mode=${search}`);
  };

  // const handleTabChange = (label: string | null) => {
  //   if (label) {
  //     setActiveTab(label)
  //   }
  // }

  const fetchBit10Price = useCallback(async (tokenPriceAPI: string) => {
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
        queryKey: ['bit10DEFITokenPrice'],
        queryFn: () => fetchBit10Price('bit10-latest-price-defi'),
        refetchInterval: 1800000, // 30 min.
      },
      // {
      //   queryKey: ['bit10BRC20TokenPrice'],
      //   queryFn: () => fetchBit10Price('bit10-latest-price-brc20'),
      //   refetchInterval: 1800000,
      // },
    ],
  });

  const isLoading = useMemo(() => bit10PriceQueries.some(query => query.isLoading), [bit10PriceQueries]);
  const bit10DEFIPrice = useMemo(() => bit10PriceQueries[0].data, [bit10PriceQueries]);
  // const bit10BRC20Price = useMemo(() => bit10PriceQueries[1].data, [bit10PriceQueries]);

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
        queryKey: ['btcPrice'],
        queryFn: () => fetchPayWithPrice('BTC'),
        refetchInterval: 10000, // 10 sec.
      },
      {
        queryKey: ['ethPrice'],
        queryFn: () => fetchPayWithPrice('ETH'),
        refetchInterval: 10000,
      },
      {
        queryKey: ['icpPrice'],
        queryFn: () => fetchPayWithPrice('ICP'),
        refetchInterval: 10000,
      },
    ],
  });

  const btcAmount = useMemo(() => payWithPriceQueries[0].data, [payWithPriceQueries]);
  const ethAmount = useMemo(() => payWithPriceQueries[1].data, [payWithPriceQueries]);
  const icpAmount = useMemo(() => payWithPriceQueries[2].data, [payWithPriceQueries]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      payment_method: 'ckBTC',
      bit10_amount: '1',
      bit10_token: 'BIT10.DEFI',
      minting_bit10_amount: 0.03,
      minting_bit10_token: 'BIT10.DEFI',
      recieving_token: 'ICP'
    },
  });

  const payWithTokenImg = (): StaticImageData => {
    const paymentMethod = form.watch('payment_method');
    if (paymentMethod === 'ICP') {
      return ICPImg;
    } else if (paymentMethod === 'ckBTC') {
      return CkBTCImg;
    } else if (paymentMethod === 'ckETH') {
      return CkETHImg;
    } else {
      return CkBTCImg;
    }
  };

  const payingTokenImg = payWithTokenImg();

  const payWithTokenPrice = (): string => {
    const paymentMethod = form.watch('payment_method');
    if (paymentMethod === 'ICP') {
      return icpAmount ?? '0';
    } else if (paymentMethod === 'ckBTC') {
      return btcAmount ?? '0';
    } else if (paymentMethod === 'ckETH') {
      return ethAmount ?? '0';
    } else {
      return '0';
    }
  };

  const payingTokenPrice = payWithTokenPrice();

  const bit10TokenPrice = (): number => {
    const bit10Token = form.watch('bit10_token');
    if (bit10Token === 'BIT10.DEFI') {
      return bit10DEFIPrice ?? 0;
    }
    // else if (bit10Token === 'BIT10.BRC20') {
    //   return bit10BRC20Price ?? 0;
    // } 
    else {
      return 0;
    }
  };

  const selectedBit10TokenPrice = bit10TokenPrice();

  const mintingBit10TokenPrice = (): number => {
    const bit10Token = form.watch('minting_bit10_token');
    if (bit10Token === 'BIT10.DEFI') {
      return bit10DEFIPrice ?? 0;
    }
    // else if (bit10Token === 'BIT10.BRC20') {
    //   return bit10BRC20Price ?? 0;
    // } 
    else {
      return 0;
    }
  };

  const selectedMintingBit10TokenPrice = mintingBit10TokenPrice();

  const MintRecievingImg = (): StaticImageData => {
    const paymentMethod = form.watch('recieving_token');
    if (paymentMethod === 'ICP') {
      return ICPImg;
    } else {
      return ICPImg;
    }
  };

  const recievingTokenImg = MintRecievingImg();

  const MintRecieveTokenPrice = (): string => {
    const paymentMethod = form.watch('recieving_token');
    if (paymentMethod === 'ICP') {
      return icpAmount ?? '0';
    } else if (paymentMethod === 'ckBTC') {
      return btcAmount ?? '0';
    } else if (paymentMethod === 'ckETH') {
      return ethAmount ?? '0';
    } else {
      return '0';
    }
  };

  const recieveingTokenPrice = MintRecieveTokenPrice();

  const bit10TokenSwapBtn = (): string => {
    if (isMintMode === 'mint') {
      return 'Revese Swap';
    } else {
      return 'Swap';
    }
  }

  const bit10TokenSwapBtnMessage = bit10TokenSwapBtn();

  const bit10TokenProcessingBtn = (): string => {
    if (isMintMode === 'mint') {
      return 'Revese Swapping';
    } else {
      return 'Swapping';
    }
  }

  const bit10TokenProcessingBtnMessage = bit10TokenProcessingBtn();

  const swapDisabledConditions = !isConnected || processing || !btcAmount || !ethAmount || !icpAmount || payingTokenPrice === '0' || selectedBit10TokenPrice === 0 || selectedMintingBit10TokenPrice === 0 || recieveingTokenPrice === '0'

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      setProcessing(true);

      const ckBTCLegerCanisterId = 'mxzaz-hqaaa-aaaar-qaada-cai';
      const ckETHLegerCanisterId = 'ss2fx-dyaaa-aaaar-qacoq-cai';
      const ICPLegerCanisterId = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
      const bit10DEFICanisterId = 'bin4j-cyaaa-aaaap-qh7tq-cai';
      const bit10BRC20CanisterId = '7bi3r-piaaa-aaaap-qpnrq-cai';
      const swapCanisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

      if (isMintMode === 'mint') {
        const hasAllowed = await window.ic.plug.requestConnect({
          whitelist: [bit10DEFICanisterId, bit10BRC20CanisterId, swapCanisterId]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed && bit10Amount) {
          toast.info('Allow the transaction on your wallet to proceed.');

          let selectedCanisterId;

          if (values.minting_bit10_token === 'BIT10.DEFI') {
            selectedCanisterId = bit10DEFICanisterId;
          }
          // else if (values.minting_bit10_token === 'BIT10.BRC20') {
          //   selectedCanisterId = bit10BRC20CanisterId;
          // } 
          else {
            throw new Error('Invalid payment method');
          }

          const actor = await window.ic.plug.createActor({
            canisterId: selectedCanisterId,
            interfaceFactory: idlFactory,
          }) as ICRC2ActorType;

          const mintingAmount = ((values.minting_bit10_amount * 1.03) + 0.03).toFixed(8);
          const amount = Math.round(parseFloat(mintingAmount) * 100000000).toString();
          const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

          const args = {
            spender: {
              owner: Principal.fromText(swapCanisterId),
              subaccount: [] as []
            },
            fee: [] as [],
            memo: [] as [],
            from_subaccount: [] as [],
            created_at_time: [] as [],
            amount: BigInt(amount),
            expected_allowance: [] as [],
            expires_at: [time] as [bigint],
          }

          const approve = await actor.icrc2_approve(args);

          if (approve.Ok) {
            toast.success('Approval was successful! Proceeding with transfer...');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const actor2 = await window.ic.plug.createActor({
              canisterId: swapCanisterId,
              interfaceFactory: idlFactory2,
            });

            const tickInAmount = Math.round(parseFloat(values.minting_bit10_amount.toString()) * 100000000).toString();

            const args2 = {
              tick_in_name: values.minting_bit10_token,
              tick_in_amount: Number(tickInAmount),
              tick_out_name: values.recieving_token
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const transfer = await actor2.mb_reverse_swap(args2);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (transfer.Ok) {
              const uuid = crypto.randomBytes(16).toString('hex');
              const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
              const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              const principal = Principal.fromUint8Array(transfer.Ok.user_principal_id._arr);
              const textualRepresentation = principal.toText();

              const formatTimestamp = (nanoseconds: string): string => {
                const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                const date = new Date(Number(milliseconds));

                return date.toISOString().replace('T', ' ').replace('Z', '+00');
              };

              const result = await newTokenSwap({
                newTokenSwapId: newTokenSwapId,
                principalId: textualRepresentation,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tickInName: transfer.Ok.tick_in_name,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInAmount: transfer.Ok.tick_in_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInUSDAmount: transfer.Ok.tick_in_usd_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInTxBlock: transfer.Ok.tick_in_tx_block.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutName: transfer.Ok.tick_out_name,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutAmount: transfer.Ok.tick_out_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutTxBlock: transfer.Ok.tick_out_tx_block.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                transactionType: transfer.Ok.transaction_type as 'Swap' | 'Reverse Swap',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                network: transfer.Ok.network,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
              });

              await fetch('/bit10-token-request', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  newTokenSwapId: newTokenSwapId,
                  principalId: principalId,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                  tickOutName: transfer.Ok.tick_out_name,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                  tickOutAmount: transfer.Ok.tick_out_amount.toString(),
                  transactionTimestamp: new Date().toISOString(),
                }),
              });

              if (result === 'Token swap successfully') {
                toast.success('Token reverse swap was successful!');
              } else {
                toast.error('An error occurred while processing your request. Please try again!');
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            } else if (transfer.Err) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const errorMessage = String(transfer.Err);
              if (errorMessage.includes('Insufficient balance')) {
                toast.error('Insufficient funds');
              } else {
                toast.error('An error occurred while processing your request. Please try again!');
              }
            } else {
              toast.error('An error occurred while processing your request. Please try again!');
            }
          } else {
            toast.error('Approval failed.');
          }
        }
      } else {
        const hasAllowed = await window.ic.plug.requestConnect({
          whitelist: [ckBTCLegerCanisterId, ckETHLegerCanisterId, ICPLegerCanisterId, swapCanisterId]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed && btcAmount && ethAmount && icpAmount) {
          toast.info('Allow the transaction on your wallet to proceed.');

          let selectedCanisterId;

          if (values.payment_method === 'ckBTC') {
            selectedCanisterId = ckBTCLegerCanisterId;
          } else if (values.payment_method === 'ckETH') {
            selectedCanisterId = ckETHLegerCanisterId;
          } else if (values.payment_method === 'ICP') {
            selectedCanisterId = ICPLegerCanisterId;
          } else {
            throw new Error('Invalid payment method');
          }

          const actor = await window.ic.plug.createActor({
            canisterId: selectedCanisterId,
            interfaceFactory: idlFactory,
          }) as ICRC2ActorType;

          let selectedAmount;

          if (values.payment_method === 'ckBTC') {
            selectedAmount = ((parseFloat(values.bit10_amount) * selectedBit10TokenPrice) / parseFloat(btcAmount) * 2); // More in case of sudden price change
          } else if (values.payment_method === 'ckETH') {
            selectedAmount = ((parseFloat(values.bit10_amount) * selectedBit10TokenPrice) / parseFloat(ethAmount) * 2);
          } else if (values.payment_method === 'ICP') {
            selectedAmount = ((parseFloat(values.bit10_amount) * selectedBit10TokenPrice) / parseFloat(icpAmount) * 2);
          } else {
            throw new Error('Invalid payment method');
          }

          const price = selectedAmount;
          const amount = Math.round(price * 100000000).toFixed(0);
          const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

          const args = {
            spender: {
              owner: Principal.fromText(swapCanisterId),
              subaccount: [] as []
            },
            fee: [] as [],
            memo: [] as [],
            from_subaccount: [] as [],
            created_at_time: [] as [],
            amount: BigInt(amount),
            expected_allowance: [] as [],
            expires_at: [time] as [bigint],
          }

          const approve = await actor.icrc2_approve(args);

          if (approve.Ok) {
            toast.success('Approval was successful! Proceeding with transfer...');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const actor2 = await window.ic.plug.createActor({
              canisterId: swapCanisterId,
              interfaceFactory: idlFactory2,
            });

            const args2 = {
              tick_in_name: values.payment_method,
              tick_out_name: values.bit10_token,
              tick_out_amount: Number(values.bit10_amount)
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const transfer = await actor2.mb_swap(args2);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (transfer.Ok) {
              const uuid = crypto.randomBytes(16).toString('hex');
              const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
              const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              const principal = Principal.fromUint8Array(transfer.Ok.user_principal_id._arr);
              const textualRepresentation = principal.toText();

              const formatTimestamp = (nanoseconds: string): string => {
                const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                const date = new Date(Number(milliseconds));

                return date.toISOString().replace('T', ' ').replace('Z', '+00');
              };

              const result = await newTokenSwap({
                newTokenSwapId: newTokenSwapId,
                principalId: textualRepresentation,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tickInName: transfer.Ok.tick_in_name,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInAmount: transfer.Ok.tick_in_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInUSDAmount: transfer.Ok.tick_in_usd_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInTxBlock: transfer.Ok.tick_in_tx_block.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutName: transfer.Ok.tick_out_name,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutAmount: transfer.Ok.tick_out_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutTxBlock: transfer.Ok.tick_out_tx_block.toString(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                transactionType: transfer.Ok.transaction_type as 'Swap' | 'Reverse Swap',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                network: transfer.Ok.network,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
              });

              await fetch('/bit10-token-request', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  newTokenSwapId: newTokenSwapId,
                  principalId: principalId,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                  tickOutName: transfer.Ok.tick_out_name,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                  tickOutAmount: transfer.Ok.tick_out_amount.toString(),
                  transactionTimestamp: new Date().toISOString(),
                }),
              });

              if (result === 'Token swap successfully') {
                toast.success('Token swap was successful!');
              } else {
                toast.error('An error occurred while processing your request. Please try again!');
              }

              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            } else if (transfer.Err) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const errorMessage = String(transfer.Err);
              if (errorMessage.includes('Insufficient balance')) {
                toast.error('Insufficient funds');
              } else {
                toast.error('An error occurred while processing your request. Please try again!');
              }
            } else {
              toast.error('An error occurred while processing your request. Please try again!');
            }
          } else {
            toast.error('Approval failed.');
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setProcessing(false);
      toast.error('An error occurred while processing your request. Please try again!');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <MaxWidthWrapper>
      {/* <div className='grid place-content-center'>
        <div className='relative flex flex-row space-x-2 items-center justify-center border rounded px-2 py-1'>
          <AnimatedBackground
            defaultValue='Quick Swap'
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
                className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}
              >
                {label}
              </button>
            ))}
          </AnimatedBackground>
        </div>
      </div>

      {activeTab === 'Quick Swap' && <div> Quick Swap </div>}
      {activeTab === 'Advanced Trading' && <div> Advanced Trading </div>} */}

      <div className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
        {isLoading ? (
          <Card className='w-[300px] md:w-[500px] px-2 pt-6 animate-fade-bottom-up'>
            <CardContent className='flex flex-col space-y-2'>
              {['h-24', 'h-32', 'h-32', 'h-12'].map((classes, index) => (
                <Skeleton key={index} className={classes} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className='w-[300px] md:w-[500px] animate-fade-bottom-up'>
            <CardHeader>
              <CardTitle className='flex flex-row items-center justify-between'>
                <div>{isMintMode === 'mint' ? 'Revese Swap' : 'Swap'}</div>
              </CardTitle>
              <CardDescription>BIT10 exchange</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                <CardContent className='flex flex-col'>
                  {isMintMode === 'mint' ? (
                    <div className='rounded-lg border-2 py-4 px-6 z-[1]'>
                      <p>Spent</p>
                      <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                        <div className='w-full'>
                          <FormField
                            control={form.control}
                            name='minting_bit10_amount'
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder='BIT10 Tokens to Mint' className='dark:border-white' />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className='grid grid-cols-5 items-center'>
                          <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                            <FormField
                              control={form.control}
                              name='minting_bit10_token'
                              render={({ field }) => (
                                <FormItem className='w-full px-2'>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className='border-none focus:border-none px-8 md:px-2 outline-none'>
                                        <SelectValue placeholder='Select BIT10 token' />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {bit10Token.map((name, index) => (
                                        <SelectItem key={index} value={name}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className='col-span-1 -ml-6 z-20'>
                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                            <Image src={BIT10Img} alt='BIT10' width={75} height={75} className='z-20' />
                          </div>
                        </div>
                      </div>
                      <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div className='flex flex-row space-x-1'>
                                {form.watch('minting_bit10_amount') * 1.01} {form.watch('minting_bit10_token')}
                                {/* $ {(form.watch('minting_bit10_amount') * parseFloat(selectedMintingBit10TokenPrice.toFixed(8)) * 1.01).toFixed(8)} */}
                                <Info className='w-5 h-5 cursor-pointer ml-1' />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                              Spent amount + 1% Minting fee <br />
                              {form.watch('minting_bit10_amount')} + {0.01 * form.watch('minting_bit10_amount')} = {form.watch('minting_bit10_amount') * 1.01}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div>
                          1 {form.watch('minting_bit10_token')} = $ {selectedMintingBit10TokenPrice.toFixed(8)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='rounded-lg border-2 py-4 px-6 z-[1]'>
                      <p>Spent</p>
                      <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                        <div className='text-4xl text-center md:text-start'>
                          {selectedBit10TokenPrice ? ((parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.03).toFixed(6) : '0'}
                        </div>

                        <div className='grid grid-cols-5 items-center'>
                          <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                            <FormField
                              control={form.control}
                              name='payment_method'
                              render={({ field }) => (
                                <FormItem className='w-full px-2'>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className='border-none focus:border-none px-8 md:px-2 outline-none'>
                                        <SelectValue placeholder='Select payment method' />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {paymentMethod.map((name, index) => (
                                        <SelectItem key={index} value={name}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className='col-span-1 -ml-6 z-20'>
                            <Image src={payingTokenImg} alt={form.watch('payment_method')} width={75} height={75} className='z-20 border-2 rounded-full bg-white' />
                          </div>
                        </div>
                      </div>
                      <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div className='flex flex-row space-x-1'>
                                $ {selectedBit10TokenPrice ? ((parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))) * 1.03).toFixed(4) : '0'}
                                <Info className='w-5 h-5 cursor-pointer ml-1' />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                              Spent amount + 3% Platform fee <br />
                              $ {(parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? 'N/A'))} + $ {0.03 * (parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0'))} = $ {(parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')) + (0.03 * (parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')))}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div>
                          1 {form.watch('payment_method')} = $ {payingTokenPrice}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className='grid place-items-center z-[2]'>
                    <ArrowUpDown className='h-10 w-10 p-2 border rounded-full -mt-4 bg-background cursor-pointer' onClick={() => handleModeClick()} />
                  </div>

                  {isMintMode === 'mint' ? (
                    <div className='rounded-lg border-2 py-4 px-6 -mt-4 z-[1]'>
                      <p>Receive</p>
                      <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                        <div className='text-4xl text-center md:text-start'>
                          {((selectedMintingBit10TokenPrice * form.watch('minting_bit10_amount')) / parseFloat(recieveingTokenPrice)).toFixed(8)}
                        </div>
                        <div className='grid grid-cols-5 items-center'>
                          <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                            <FormField
                              control={form.control}
                              name='recieving_token'
                              render={({ field }) => (
                                <FormItem className='w-full px-2'>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className='border-none focus:border-none px-8 md:px-2 outline-none'>
                                        <SelectValue placeholder='Select payment method' />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {mintReciveToken.map((name, index) => (
                                        <SelectItem key={index} value={name}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className='col-span-1 -ml-6 z-20'>
                            <Image src={recievingTokenImg} alt={form.watch('recieving_token')} width={75} height={75} className='z-20 border-2 rounded-full bg-white' />
                          </div>
                        </div>
                      </div>
                      <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                        <div>$ {(form.watch('minting_bit10_amount') * parseFloat(recieveingTokenPrice)).toFixed(8)}</div>
                        <div>
                          1 {form.watch('recieving_token')} = $ {parseFloat(recieveingTokenPrice).toFixed(8)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='rounded-lg border-2 py-4 px-6 -mt-4 z-[1]'>
                      <p>Receive</p>
                      <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                        <div className='w-full md:w-3/4'>
                          <FormField
                            control={form.control}
                            name='bit10_amount'
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className='dark:border-white'>
                                      <SelectValue placeholder='Select number of tokens' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {bit10Amount.map((number, index) => (
                                      <SelectItem key={index} value={number}>
                                        {number}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className='grid grid-cols-5 items-center'>
                          <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                            <FormField
                              control={form.control}
                              name='bit10_token'
                              render={({ field }) => (
                                <FormItem className='w-full px-2'>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className='border-none focus:border-none px-8 md:px-2 outline-none'>
                                        <SelectValue placeholder='Select BIT10 token' />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {bit10Token.map((name, index) => (
                                        <SelectItem key={index} value={name}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className='col-span-1 -ml-6 z-20'>
                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                            <Image src={BIT10Img} alt='BIT10' width={75} height={75} className='z-20' />
                          </div>
                        </div>
                      </div>

                      <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                        <div>$ {(parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))).toFixed(4)}</div>
                        <div>
                          1 {form.watch('bit10_token')} = $ {selectedBit10TokenPrice.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className='flex flex-row space-x-2 w-full items-center'>
                  <Button className='w-full' disabled={swapDisabledConditions}>
                    {processing && <Loader2 className='animate-spin mr-2' size={15} />}
                    {processing ? `${bit10TokenProcessingBtnMessage}...` : bit10TokenSwapBtnMessage}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}
      </div>

    </MaxWidthWrapper>
  )
}
