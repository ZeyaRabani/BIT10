"use client"

import React, { Suspense } from 'react'
import { useChain } from '@/context/ChainContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Referral from '@/components/referral/Referral'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper className='py-4'>
            {chain ? (
                <Suspense fallback={<Preloader />}>
                    <Referral />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to view Referral' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
