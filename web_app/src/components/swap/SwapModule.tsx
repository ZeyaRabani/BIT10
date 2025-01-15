"use client"

import React, { useState } from 'react'
import * as z from 'zod'
import { useWallet } from '@/context/WalletContext'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
// import AnimatedBackground from '@/components/ui/animated-background'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
import CkBTCImg from '@/assets/swap/ckBTC.png'
import CkETHImg from '@/assets/swap/ckETH.png'
import ICPImg from '@/assets/swap/ICP.png'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import BIT10Img from '@/assets/swap/bit10.svg'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import crypto from 'crypto'
import { newTokenSwap } from '@/actions/dbActions'

interface BuyingTokenPriceResponse {
  data: {
    amount: string;
    base: string;
    currency: string;
  };
}

type ActorType = {
  icrc1_transfer: (args: {
    to: { owner: Principal; subaccount: [] };
    memo: [];
    fee: [];
    from_subaccount: [];
    created_at_time: [];
    amount: bigint;
  }) => Promise<{ Ok?: number; Err?: { InsufficientFunds?: null } }>;
};

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
  'BIT10.BRC20'
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
})

export default function SwapModule() {
  // const [activeTab, setActiveTab] = useState('Quick Swap');
  const [swaping, setSwaping] = useState<boolean>(false);

  const { isConnected, principalId } = useWallet();

  // const handleTabChange = (label: string | null) => {
  //   if (label) {
  //     setActiveTab(label)
  //   }
  // }

  const fetchBit10Price = async (tokenPriceAPI: string) => {
    const response = await fetch(tokenPriceAPI);

    if (!response.ok) {
      toast.error('Error fetching BIT10 price. Please try again!');
    }

    let data;
    let returnData;
    if (tokenPriceAPI === 'bit10-defi-latest-price') {
      data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
      returnData = data.tokenPrice ?? 0;
    } else if (tokenPriceAPI === 'bit10-brc20-latest-price') {
      data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
      returnData = data.tokenPrice ?? 0;
    }
    return returnData;
  };

  const bit10PriceQueries = useQueries({
    queries: [
      {
        queryKey: ['bit10DEFITokenPrice'],
        queryFn: () => fetchBit10Price('bit10-defi-latest-price'),
        refetchInterval: 1800000, // 30 min.
      },
      {
        queryKey: ['bit10BRC20TokenPrice'],
        queryFn: () => fetchBit10Price('bit10-brc20-latest-price'),
        refetchInterval: 1800000,
      },
    ],
  });

  const isLoading = bit10PriceQueries.some(query => query.isLoading);
  const bit10DEFIPrice = bit10PriceQueries[0].data;
  const bit10BRC20Price = bit10PriceQueries[1].data;

  const fetchPayWithPrice = async (currency: string) => {
    const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
    if (!response.ok) {
      toast.error(`Error fetching ${currency} price. Please try again!`);
    }
    const data = await response.json() as BuyingTokenPriceResponse;
    return data.data.amount;
  };

  const payWithPriceQueries = useQueries({
    queries: [
      {
        queryKey: ['btcPrice'],
        queryFn: () => fetchPayWithPrice('BTC'),
        refetchInterval: 10000, // 10 src.
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

  const btcAmount = payWithPriceQueries[0].data;
  const ethAmount = payWithPriceQueries[1].data;
  const icpAmount = payWithPriceQueries[2].data;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      payment_method: 'ckBTC',
      bit10_amount: '1',
      bit10_token: 'BIT10.DEFI'
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
    } else if (bit10Token === 'BIT10.BRC20') {
      return bit10BRC20Price ?? 0;
    } else {
      return 0;
    }
  };

  const selectedBit10TokenPrice = bit10TokenPrice();

  const swapDisabledConditions = !isConnected || swaping || !btcAmount || !ethAmount || !icpAmount || payingTokenPrice == '0' || selectedBit10TokenPrice == 0

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      setSwaping(true);
      // const bit10BTCCanisterId = 'eegan-kqaaa-aaaap-qhmgq-cai'
      const ckBTCLegerCanisterId = 'mxzaz-hqaaa-aaaar-qaada-cai';
      const ckETHLegerCanisterId = 'ss2fx-dyaaa-aaaar-qacoq-cai';
      const ICPLegerCanisterId = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
      const bit10DEFICanisterId = 'bin4j-cyaaa-aaaap-qh7tq-cai';
      const bit10BRC20CanisterId = '7bi3r-piaaa-aaaap-qpnrq-cai';

      const hasAllowed = await window.ic.plug.requestConnect({
        whitelist: [ckBTCLegerCanisterId, ckETHLegerCanisterId, ICPLegerCanisterId, bit10DEFICanisterId, bit10BRC20CanisterId]
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (hasAllowed && btcAmount && ethAmount && icpAmount) {
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
        }) as ActorType;

        const receiverckBTCAccountId = 'vhpiq-6dprt-6vc5j-xtzl5-dw2aj-mqzmy-5c2lo-xxmj7-5sivk-vwax6-5qe';
        const recieverckETHAccountId = 'vhpiq-6dprt-6vc5j-xtzl5-dw2aj-mqzmy-5c2lo-xxmj7-5sivk-vwax6-5qe';
        const recieverICPAccountId = 'vhpiq-6dprt-6vc5j-xtzl5-dw2aj-mqzmy-5c2lo-xxmj7-5sivk-vwax6-5qe';

        let selectedRecieverAccountId;
        let selectedAmount;

        if (values.payment_method === 'ckBTC') {
          selectedRecieverAccountId = receiverckBTCAccountId;
          selectedAmount = ((parseInt(values.bit10_amount) * selectedBit10TokenPrice) / parseFloat(btcAmount));
        } else if (values.payment_method === 'ckETH') {
          selectedRecieverAccountId = recieverckETHAccountId;
          selectedAmount = ((parseInt(values.bit10_amount) * selectedBit10TokenPrice) / parseFloat(ethAmount));
        } else if (values.payment_method === 'ICP') {
          selectedRecieverAccountId = recieverICPAccountId;
          selectedAmount = ((parseInt(values.bit10_amount) * selectedBit10TokenPrice) / parseFloat(icpAmount));
        } else {
          throw new Error('Invalid payment method');
        }

        const price = selectedAmount;
        const amount = Math.round(price * 100000000).toFixed(0);

        const args = {
          to: {
            owner: Principal.fromText(selectedRecieverAccountId),
            subaccount: [] as []
          },
          memo: [] as [],
          fee: [] as [],
          from_subaccount: [] as [],
          created_at_time: [] as [],
          amount: BigInt(amount)
        }

        const transfer = await actor.icrc1_transfer(args);
        if (transfer.Ok && principalId) {
          const uuid = crypto.randomBytes(16).toString('hex');
          const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
          const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

          const result = await newTokenSwap({
            newTokenSwapId: newTokenSwapId,
            principalId: principalId,
            paymentAmount: selectedAmount.toString(),
            paymentName: values.payment_method,
            paymentAmountUSD: (parseInt(values.bit10_amount) * selectedBit10TokenPrice).toString(),
            bit10tokenQuantity: (values.bit10_amount).toString(),
            bit10tokenName: values.bit10_token,
            transactionIndex: transfer.Ok.toString()
          });

          await fetch('/bit10-token-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              newTokenSwapId: newTokenSwapId,
              principalId: principalId,
              bit10tokenQuantity: (values.bit10_amount).toString(),
              bit10tokenName: values.bit10_token,
              bit10tokenBoughtAt: new Date().toISOString(),
            }),
          });

          if (result === 'Token swap added successfully') {
            toast.success('Token swap was successful!');
          } else {
            toast.error('An error occurred while processing your request. Please try again!');
          }
        } else if (transfer.Err?.InsufficientFunds) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Transfer failed.');
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setSwaping(false);
      toast.error('An error occurred while processing your request. Please try again!');
    } finally {
      setSwaping(false);
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
                <div>Swap</div>
              </CardTitle>
              <CardDescription>BIT10 exchange</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
                <CardContent className='flex flex-col space-y-2'>
                  <div className='rounded-lg border-2 py-2 px-6'>
                    <p>Pay with</p>
                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                      <div className='text-4xl text-center md:text-start'>
                        {selectedBit10TokenPrice ? ((parseInt(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(6))) / parseFloat(payingTokenPrice) * 1.03).toFixed(6) : '0'}
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
                                    {paymentMethod.map((name) => (
                                      <SelectItem key={name} value={name}>
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
                              $ {selectedBit10TokenPrice ? ((parseInt(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))) * 1.03).toFixed(4) : '0'}
                              <Info className='w-5 h-5 cursor-pointer ml-1' />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-[18rem] md:max-w-[26rem] text-center'>
                            Price in {form.watch('payment_method')} + 3% Platform fee <br />
                            $ {(parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? 'N/A'))} + $ {0.03 * (parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0'))} = $ {(parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')) + (0.03 * (parseFloat(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice?.toFixed(4) ?? '0')))}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div>
                        1 {form.watch('payment_method')} = $ {payingTokenPrice}
                      </div>
                    </div>
                  </div>

                  <div className='rounded-lg border-2 py-2 px-6'>
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
                                    {bit10Token.map((name) => (
                                      <SelectItem key={name} value={name}>
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
                      <div>$ {(parseInt(form.watch('bit10_amount')) * parseFloat(selectedBit10TokenPrice.toFixed(4))).toFixed(4)}</div>
                      <div>
                        1 {form.watch('bit10_token')} = $ {selectedBit10TokenPrice.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex flex-row space-x-2 w-full items-center'>
                  <Button className='w-full' disabled={swapDisabledConditions}>
                    {swaping && <Loader2 className='animate-spin mr-2' size={15} />}
                    {swaping ? 'Swaping...' : 'Swap'}
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
