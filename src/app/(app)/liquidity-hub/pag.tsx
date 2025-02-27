"use client"

import { Card } from '@/components/ui/card'
import React from 'react'
import Link from 'next/link'
import { Zap, Lock } from 'lucide-react'

export default function Page() {
    return (
        <div className='animate-fade-bottom-up flex items-center justify-center w-full pt-4 md:pt-16'>
            <Card className='w-[300px] md:w-[400px] animate-fade-bottom-up p-6 flex flex-col space-y-6'>
                <Link href='/liquidity-hub/ilp'>
                    <div className='rounded-md border hover:border-primary hover:text-primary p-4 flex-col space-y-2'>
                        <div className='flex flex-row justify-between'>
                            <div className='text-2xl md:text-3xl font-semibold'>Instant Liquidity Providers</div>
                            <div className='pt-2'>
                                <Zap size={24} />
                            </div>
                        </div>
                        <div>Swap assets instantly and earn rewards-no lock-up, no fees, just pure liquidity.</div>
                    </div>
                </Link>

                <Link href='/liquidity-hub/slp'>
                    <div className='rounded-md border hover:border-primary hover:text-primary p-4 flex-col space-y-2'>
                        <div className='flex flex-row justify-between'>
                            <div className='text-2xl md:text-3xl font-semibold'>Staked Liquidity Providers</div>
                            <div className='pt-2'>
                                <Lock size={24} />
                            </div>
                        </div>
                        <div>Lock your assets for a fixed duration and earn boosted rewards from platform fees.</div>
                    </div>
                </Link>
            </Card>
        </div>
    )
}
