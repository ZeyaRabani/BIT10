"use client"

import React, { Suspense } from 'react'
import { useChain } from '@/context/ChainContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import SLP from '@/components/liquidity_hub/SLP'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper className='pt-4'>
            {chain ? (
                <Suspense fallback={<Preloader />}>
                    <SLP />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to become a Staked Liquidity Provider' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
