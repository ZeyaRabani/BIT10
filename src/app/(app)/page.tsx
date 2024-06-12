"use client"

import React, { Suspense } from 'react'
import { useWallet } from '@/context/WalletContext'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Swap from '@/components/swap/Swap'
import InformationCard from '@/components/InformationCard'

export default function Page() {
  const { isConnected } = useWallet();

  return (
    <MaxWidthWrapper>
      {isConnected ? (
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
