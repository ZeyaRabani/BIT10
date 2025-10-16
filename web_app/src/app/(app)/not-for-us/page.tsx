"use client"

import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function Page() {
    return (
        <MaxWidthWrapper>
            <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
                <Card className='border-muted w-full md:max-w-96 py-8'>
                    <CardHeader>
                        <CardTitle className='text-center tracking-wide'>Access Restricted</CardTitle>
                    </CardHeader>
                    <CardContent className='text-center flex flex-col space-y-2'>
                        <p>The Swap page is not accessible to visitors from the United States.</p>
                        <p>For any clarification, please message <a href='https://x.com/bit10startup' className='text-primary underline'>@bit10startup</a> on Twitter/X.</p>
                    </CardContent>
                </Card>
            </div>
        </MaxWidthWrapper>
    )
}
