"use client"

import React, { Suspense } from 'react'
import { useChain } from '@/context/ChainContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import { usePrivy } from '@privy-io/react-auth'
import Newbie from '@/components/newbie/Newbie'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { chain } = useChain();

    const { ready, authenticated } = usePrivy();

    return (
        <MaxWidthWrapper className='py-4'>
            {chain && ready && authenticated ? (
                <Suspense fallback={<Preloader />}>
                    <Newbie />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet with email to view this page' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
