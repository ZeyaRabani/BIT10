"use client"

import React, { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import InformationCard from '@/components/InformationCard'

export default function Page() {
    return (
        <MaxWidthWrapper>
            <Suspense fallback={<Preloader />}>
                <InformationCard message='Audit report coming soon...' />
            </Suspense>
        </MaxWidthWrapper>
    )
}
