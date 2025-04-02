"use client"

import React, { Suspense } from 'react'
import { useChain } from '@/context/ChainContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import ILP from '@/components/liquidity_hub/ILP'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper className='pt-4'>
            {chain ? (
                <Suspense fallback={<Preloader />}>
                    <ILP />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to become a Instant Liquidity Provider' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
