"use client"

import React, { Suspense } from 'react'
import { useICPWallet } from '@/context/ICPWalletContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Referral from '@/components/referral/Referral'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    const { isICPConnected } = useICPWallet();

    return (
        <MaxWidthWrapper className='py-4'>
            {isICPConnected ? (
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
