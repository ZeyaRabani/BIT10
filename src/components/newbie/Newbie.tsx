"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrivy } from '@privy-io/react-auth'

export default function Newbie() {
    const { user } = usePrivy();

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>New User Zone (Email Wallet)</CardTitle>
                </CardHeader>
                <CardContent className='flex flex-col space-y-4'>
                    <div className='text-xl'>Welcome {user?.email?.address}, to the BIT10 Testnet!</div>
                    <div className='text-xl'>Your generated Solana Devnet wallet address is: <span className='font-semibold underline'>{user?.wallet?.address}</span></div>
                    <div className='text-xl'>Follow the guide below to get started with BIT10:</div>
                    <div className='flex flex-col space-y-1'>
                        <div className='font-semibold'>What is BIT10?</div>
                        <div>
                            BIT10 is an asset manager that lets users invest in multiple cryptocurrencies at once through index funds. Instead of picking individual coins, you buy one token that represents a group of top-performing assets. Learn more at <a className='underline' href='https://gitbook.bit10.app/bit10' target='_blank'>here</a>.
                        </div>
                    </div>

                    <div className='flex flex-col space-y-1'>
                        <div className='font-semibold'>How to use the BIT10 Testnet?</div>
                        <div>
                            Follow the Step-by-Step guide <a className='underline' href='https://gitbook.bit10.app/part_3/testnet/sol_dev/1_swap' target='_blank'>here</a> to do the swap.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
