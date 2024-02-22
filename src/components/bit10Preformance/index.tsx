"use client"

import React from 'react'
import SP500 from './S&P500'
import Bitcoin from './Bitcoin'

export default function Index() {
    return (
        <div className='py-4'>
            <h1 className='text-3xl font-bold text-center'>Bit10 Preformance</h1>
            <div className='grid md:grid-cols-2 gap-4 py-2'>
                <div>
                    <SP500 />
                </div>
                <div>
                    <Bitcoin />
                </div>
            </div>
        </div>
    )
}
