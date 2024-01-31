"use client"

import React, { useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCw, Settings2, ArrowDown } from 'lucide-react'
import PriceView from '@/components/dashboard/price'
import QuoteView from '@/components/dashboard/quote'
import type { PriceResponse } from '@/lib/types'

export default function Page() {
    const [tradeDirection, setTradeDirection] = useState("sell");
    const [finalize, setFinalize] = useState(false);
    const [price, setPrice] = useState<PriceResponse | undefined>();
    const [quote, setQuote] = useState();

    const { address, isConnecting } = useAccount();
    const { open } = useWeb3Modal();
    const { disconnect } = useDisconnect();

    const disconnectWallet = () => {
        try {
            disconnect();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <MaxWidthWrapper>
            <div className='flex items-center justify-center space-x-2 py-4 max-w-[100vw]'>
                <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Dashboard</h1>
            </div>

            <div className='flex flex-col items-center justify-center space-y-4'>
                <div className='text-xl'>Decentralized exchange</div>

                <div>
                    {address ? (
                        <>
                            <div className='flex flex-row space-x-2'>
                                <div className='text-xl'>Connected:</div>
                                <div className='text-xl'>{address}</div>
                            </div>
                            <Button variant={'destructive'} onClick={() => disconnectWallet()} className='w-full'>Disconnect</Button>
                        </>
                    ) : (
                        <div className='pt-2 px-2 w-full flex items-center justify-center'>
                            <Button className='text-white px-6' onClick={() => open()}>Connect Wallet</Button>
                        </div>
                    )}
                </div>

                <div className='pb-4'>
                    <Card className="w-[300px] md:w-[380px]">
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                                <div className='flex flex-row space-x-1'>
                                    <RotateCw size={16} />
                                    <Settings2 size={16} />
                                </div>
                            </CardTitle>
                            <CardDescription>Decentralized exchange demo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='rounded p-2 bg-gray-200 dark:bg-gray-700'>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>From</div>
                                    <div>Balance BTC 5.5</div>
                                </div>
                                <div className='flex flex-row items-center justify-between py-2'>
                                    <div className="w-[160px]">
                                        <Select>
                                            <SelectTrigger id="framework">
                                                <SelectValue placeholder="Select Token" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="ETH">1 ETH</SelectItem>
                                                <SelectItem value="SOL">1 SOL</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        1
                                    </div>
                                </div>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>1 ETH token</div>
                                    <div>~ 2,310.78 $</div>
                                </div>
                            </div>
                            <div className='flex items-center justify-center -mt-2'>
                                <div className='p-2 rounded-full bg-accent w-8'><ArrowDown size={16} /></div>
                            </div>
                            <div className='border-2 rounded p-2 -mt-2'>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>To(estimated)</div>
                                    <div>Balance 0</div>
                                </div>
                                <div className='flex flex-row items-center justify-between py-2'>
                                    <div className="w-[160px]">
                                        <Select>
                                            <SelectTrigger id="framework">
                                                <SelectValue placeholder="Select Token" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="BNB">1 BNB</SelectItem>
                                                <SelectItem value="USDT">1 USDT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        1
                                    </div>
                                </div>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>Tx cost ~0.0015</div>
                                    <div>~ 2,310.7785 $</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-row space-x-2 w-full items-center">
                            <Button className='w-full' variant="outline">Cancel</Button>
                            <Button className='w-full'>Swap</Button>
                        </CardFooter>
                    </Card>

                    {/* {finalize && price ? (
                        <QuoteView
                            takerAddress={address}
                            price={price}
                            quote={quote}
                            setQuote={setQuote}
                        />
                    ) : (
                        <PriceView
                            takerAddress={address}
                            price={price}
                            setPrice={setPrice}
                            setFinalize={setFinalize}
                        />
                    )} */}
                </div>
            </div>
        </MaxWidthWrapper>
    )
}
