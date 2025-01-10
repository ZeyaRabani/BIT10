"use client"

import React, { useState } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Minus, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import Image from 'next/image'
import CkBTCImg from '@/assets/swap/ckBTC.png'
import CkETHImg from '@/assets/swap/ckETH.png'
import ICPImg from '@/assets/swap/ICP.png'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function SelectToken() {
    const [percentCount, setPercentCount] = useState<number>(33);

    const handleIncrease = () => {
        if (percentCount < 100) {
            setPercentCount(percentCount + 1);
        }
    };

    const handleDecrease = () => {
        if (percentCount > 1) {
            setPercentCount(percentCount - 1);
        }
    };

    return (
        <div className='flex flex-row space-x-2'>
            <div className='grid grid-cols-5 gap-2 items-center justify-center'>
                <div className='col-span-1 border rounded p-2 grid place-items-center cursor-pointer' onClick={handleDecrease}>
                    <Minus className='h-5 w-5 md:h-6 md:w-6' />
                </div>
                <div className='col-span-3 border rounded p-2 md:p-1.5 grid place-items-center text-sm md:text-lg'>{percentCount} %</div>
                <div className='col-span-1 border rounded p-2 grid place-items-center cursor-pointer' onClick={handleIncrease}>
                    <Plus className='h-5 w-5 md:h-6 md:w-6' />
                </div>
            </div>
            <Select>
                <SelectTrigger className='w-[180px] dark:border-white'>
                    <SelectValue placeholder='Select a token' />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Available Tokens</SelectLabel>
                        <SelectItem value='btc'>
                            <div className='inline-flex items-center justify-center'>
                                <Image src={CkBTCImg} alt='ckBTC' width={25} height={25} className='z-20 rounded-full' />
                                <div className='ml-2'>ckBTC</div>
                            </div>
                        </SelectItem>
                        <SelectItem value='eth'>
                            <div className='inline-flex items-center justify-center'>
                                <Image src={CkETHImg} alt='ckETH' width={25} height={25} className='z-20 rounded-full' />
                                <div className='ml-2'>ckETH</div>
                            </div>
                        </SelectItem>
                        <SelectItem value='usdc'>
                            <div className='inline-flex items-center justify-center'>
                                <Image src={ICPImg} alt='ICP' width={25} height={25} className='z-20 rounded-full' />
                                <div className='ml-2'>ICP</div>
                            </div>
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}

function Type1() {
    const [tokens, setTokens] = useState<number[]>([1]);

    const handleAddToken = () => {
        setTokens([...tokens, tokens.length + 1]);
    };

    return (
        <Card className='w-[300px] md:w-[450px] animate-fade-bottom-up'>
            <CardHeader>
                <CardTitle className='flex flex-row items-center justify-between'>
                    <div>Create Custom Index</div>
                </CardTitle>
                <CardDescription>Create your own custom index fund and set the desired percentage for each token.</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col space-y-2'>
                <div>
                    <Label>Amount for Index</Label>
                    <Input className='w-full dark:border-white' placeholder='Enter amount in (ckBTC)' />
                    <p className='text-accent-foreground py-1 text-sm'>1 ckBTC = $60,335.25</p>
                </div>
                {tokens.map((token) => (
                    <SelectToken key={token} />
                ))}
                <Button variant='outline' className='w-full dark:border-white' onClick={handleAddToken}>
                    Add Token
                </Button>
                <Button className='w-full'>
                    Create Index
                </Button>
            </CardContent>
        </Card>
    )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Type2() {
    return (
        <Card className='w-[300px] md:w-[450px] animate-fade-bottom-up'>
            Type 2
        </Card>
    )
}

export default function Page() {
    return (
        <MaxWidthWrapper>
            <div className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
                <Type1 />
                {/* <Type2 /> */}
            </div>
        </MaxWidthWrapper>
    )
}
