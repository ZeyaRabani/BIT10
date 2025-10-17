"use client"

import React, { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Buy from '@/components/buy/Buy'

export default function Page() {
    return (
        <MaxWidthWrapper className='py-4 z-10'>
            <Suspense fallback={<Preloader />}>
                <Buy />
            </Suspense>
        </MaxWidthWrapper>
    )
}
