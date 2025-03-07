"use client"

import React, { Suspense } from 'react'
import { useWallet } from '@/context/WalletContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { isConnected } = useWallet();

    return (
        <MaxWidthWrapper className='pt-4'>
            {isConnected ? (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Staked Liquidity Provider is comming soon...' />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to become a Staked Liquidity Provider' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
