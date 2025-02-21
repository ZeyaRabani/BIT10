"use client"

import React, { Suspense } from 'react'
import { useWallet } from '@/context/WalletContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Collateral from '@/components/collateral/Collateral'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { isConnected } = useWallet();

    return (
        <MaxWidthWrapper className='py-4'>
            {isConnected ? (
                <Suspense fallback={<Preloader />}>
                    <Collateral />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to view Collateral' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
