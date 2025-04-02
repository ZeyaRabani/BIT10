"use client"

import React, { Suspense } from 'react'
import { useChain } from '@/context/ChainContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Swap from '@/components/swap/Swap'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper className='pt-4'>
            {chain ? (
                <Suspense fallback={<Preloader />}>
                    <Swap />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to buy BIT10 tokens' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
