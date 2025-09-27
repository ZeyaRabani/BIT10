"use client"

import { Card } from '@/components/ui/card'
import React from 'react'
import Link from 'next/link'

export default function Page() {
    return (
        <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
            <Card className='w-[300px] md:w-96 animate-fade-bottom-up p-6 flex flex-col space-y-6'>
                <Link href="/buy">
                    <div className="rounded-md border hover:border-primary hover:text-primary">
                        <div className="text-center text-3xl py-6">Launch Mainnet</div>
                    </div>
                </Link>

                <a href='https://testnet.bit10.app/buy'>
                    <div className='rounded-md border hover:border-primary hover:text-primary'>
                        <div className='text-center text-3xl py-6'>Launch Testnet</div>
                    </div>
                </a>
            </Card>
        </div>
    )
}
