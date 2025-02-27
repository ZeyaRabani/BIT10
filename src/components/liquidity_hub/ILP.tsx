"use client"

import React from 'react'
import { useUnisatWallet } from '@/context/UnisatWalletContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
// import { Skeleton } from '@/components/ui/skeleton'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image, { type StaticImageData } from 'next/image'
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import BIT10Img from '@/assets/swap/bit10.svg'

// interface BuyingTokenPriceResponse {
//     data: {
//         amount: string;
//         base: string;
//         currency: string;
//     };
// }

const tickIn = [
    'BTC'
]

const tickOut = [
    'ICP'
]

export default function ILP() {
    const { unisatBTCAddress, isUnisatConnected, connectUnisatWallet, disconnectUnisatWallet } = useUnisatWallet();

    // async function onSubmit() {
    //     const destinatioAddress = '2MvxteUZggvbprjogjMQVrRZ3NSNVskCpaz';
    //     const amountInMicroUnits = 100000000;
    //     // const response = await Wallet.request('sendTransfer', {
    //     //     recipients: [
    //     //         {
    //     //             address: destinatioAddress,
    //     //             amount: amountInMicroUnits
    //     //         }
    //     //     ],
    //     //     network: 'testnet'
    //     // });
    // }

    return (
        <div className='flex flex-col py-4 items-center justify-center'>
            <Card className='w-[300px] md:w-[500px] animate-fade-bottom-up'>
                <CardHeader>
                    <CardTitle className='flex flex-row items-center justify-between'>
                        <div>Instant Liquidity Provider</div>
                    </CardTitle>
                    <CardDescription>Swap assets instantly and earn rewards-no lock-up, no fees, just pure liquidity.</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col space-y-3'>
                    <div className='rounded-lg border-2 py-4 px-6 z-[1]'>
                        <p>Spent</p>
                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                            <div className='w-full'>
                                <Input placeholder='BTC to send' className='dark:border-white' />
                            </div>
                            <div className='grid grid-cols-5 items-center'>
                                <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                                    <div className='w-full px-2'>
                                        <Select defaultValue='BTC'>
                                            <SelectTrigger className='border-none focus:border-none px-8 md:px-2 outline-none'>
                                                <SelectValue placeholder='Select token' />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tickIn.map((name, index) => (
                                                    <SelectItem key={index} value={name}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className='col-span-1 -ml-6 z-20'>
                                    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                                    <Image src={BIT10Img} alt='BIT10' width={75} height={75} className='z-20' />
                                </div>
                            </div>
                        </div>
                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                            <div>255 $</div>
                            <div>1 BTC = 125 $</div>
                        </div>
                    </div>

                    <div className='rounded-lg border-2 py-4 px-6 z-[1]'>
                        <p>Recieve</p>
                        <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 items-center justify-center py-2 w-full'>
                            <div className='w-full text-3xl'>
                                12.02
                            </div>
                            <div className='grid grid-cols-5 items-center'>
                                <div className='col-span-4 px-2 mr-8 border-2 rounded-l-full z-10 w-full'>
                                    <div className='w-full px-2'>
                                        <Select defaultValue='ICP'>
                                            <SelectTrigger className='border-none focus:border-none px-8 md:px-2 outline-none'>
                                                <SelectValue placeholder='Select token' />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tickOut.map((name, index) => (
                                                    <SelectItem key={index} value={name}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className='col-span-1 -ml-6 z-20'>
                                    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                                    <Image src={BIT10Img} alt='BIT10' width={75} height={75} className='z-20' />
                                </div>
                            </div>
                        </div>
                        <div className='hidden md:flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm pr-2'>
                            <div>255 $</div>
                            <div>1 ICP = 7.26 $</div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter>
                    {isUnisatConnected ? (
                        <div className='w-full fex flex-col space-y-2'>
                            {/* <p>{unisatBTCAddress}</p> */}
                            <Button variant='destructive' className='w-full' onClick={disconnectUnisatWallet}>Disconnect</Button>
                            <Button className='w-full'>Swap</Button>
                        </div>
                    ) : (
                        <div className='w-full'>
                            <Button className='w-full' onClick={connectUnisatWallet}>Connect Unisat</Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
