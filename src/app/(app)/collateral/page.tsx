"use client"

import React, { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Collateral from '@/components/collateral/Collateral'

export default function Page() {
    return (
        <MaxWidthWrapper className='py-4'>
            <Suspense fallback={<Preloader />}>
                <Collateral />
            </Suspense>
        </MaxWidthWrapper>
    )
}
