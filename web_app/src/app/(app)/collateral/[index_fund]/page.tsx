import React, { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import RebalanceHistory from '@/components/collateral/rebalanceHistory/RebalanceHistory'

export default async function Page({ params }: { params: Promise<{ index_fund: string }> }) {
    const index_fund = (await params).index_fund;

    return (
        <MaxWidthWrapper className='py-4 z-10 relative'>
            <Suspense fallback={<Preloader />}>
                <RebalanceHistory index_fund={index_fund} />
            </Suspense>
        </MaxWidthWrapper>
    )
}
