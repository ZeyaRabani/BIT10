"use client"

import React, { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import DEX from '@/components/dex/DEX'

export default function Page() {
    return (
        <MaxWidthWrapper className='py-4 z-10'>
            <Suspense fallback={<Preloader />}>
                <DEX />
            </Suspense>
        </MaxWidthWrapper>
    )
}
