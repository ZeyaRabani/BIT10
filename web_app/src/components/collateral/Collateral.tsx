"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import NonRebalanceCollateral from './NonRebalanceCollateral'
import RebalanceCollateral from './RebalanceCollateral'

export default function Collateral() {
    return (
        <Card className='dark:border-white w-full lg:col-span-1'>
            <CardHeader>
                <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Collateral</div>
            </CardHeader>
            <CardContent className='flex flex-col space-y-4'>
                <NonRebalanceCollateral />
                <RebalanceCollateral />
            </CardContent>
        </Card>
    )
}
