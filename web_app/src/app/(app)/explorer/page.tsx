"use client";

import { Suspense } from 'react';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Preloader from '@/components/Preloader';
import Explorer from '@/components/explorer/Explorer';

export default function Page() {
    return (
        <MaxWidthWrapper>
            <Suspense fallback={<Preloader />}>
                <Explorer />
            </Suspense>
        </MaxWidthWrapper>
    )
}
