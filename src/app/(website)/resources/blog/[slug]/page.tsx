import React, { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import InformationCard from '@/components/InformationCard'

export default function Page({ params }: { params: { slug: string } }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const slug = params.slug;

    return (
        <MaxWidthWrapper>
            <Suspense fallback={<Preloader />}>
                <InformationCard message='Blog coming soon...' />
            </Suspense>
        </MaxWidthWrapper>
    )
}
