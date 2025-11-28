"use client"

import React, { Suspense } from 'react'
import { useChain } from '@/context/ChainContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Rewards from '@/components/rewards/Rewards'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper className='py-4 z-10 relative'>
            {chain ? (
                <Suspense fallback={<Preloader />}>
                    <Rewards />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to claim your Rewards' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
