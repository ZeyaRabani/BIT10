"use client"

import { Card } from '@/components/ui/card'
import React from 'react'
import Link from 'next/link'
import { RocketIcon, TestTubeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Page() {
    return (
        <div className='animate-fade-bottom-up flex flex-col items-center justify-center w-full py-8 md:py-16 space-y-4'>
            <div className='text-2xl md:text-4xl text-center font-semibold'>
                Choose Your Network
            </div>
            <div className='text-xl text-center text-muted-foreground'>
                Select a network to launch the BIT10 application
            </div>

            <div className='flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4'>
                <Link href='/buy'>
                    <Card className='border-2 rounded-2xl border-muted hover:border-primary w-[300px] md:w-80 animate-fade-bottom-up py-10 px-4 flex flex-col items-center space-y-4'>
                        <div className='bg-primary/20 p-4 rounded-xl'>
                            <RocketIcon className='h-8 w-8 text-primary' />
                        </div>
                        <div className='text-2xl font-semibold'>Mainnet</div>
                        <div className='text-lg text-center text-muted-foreground'>Launch on the main network with real transactions</div>
                        <Button className='rounded-xl px-8'>Launch Mainnet</Button>
                    </Card>
                </Link>

                <a href='https://testnet.bit10.app/buy'>
                    <Card className='border-2 rounded-2xl border-muted hover:border-primary w-[300px] md:w-80 animate-fade-bottom-up py-10 px-4 flex flex-col items-center space-y-4'>
                        <div className='bg-muted p-4 rounded-xl'>
                            <TestTubeIcon className='h-8 w-8 text-gray-700 dark:text-gray-200' />
                        </div>
                        <div className='text-2xl font-semibold'>Testnet</div>
                        <div className='text-lg text-center text-muted-foreground'>Test the application with simulated transactions</div>
                        <Button variant='secondary' className='rounded-xl px-8'>Launch Testnet</Button>
                    </Card>
                </a>
            </div>
        </div>
    )
}
