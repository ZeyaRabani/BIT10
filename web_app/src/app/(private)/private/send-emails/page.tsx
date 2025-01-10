"use client"

import React from 'react'
import BIT10TestnetWelcome from './BIT10TestnetWelcome'
import BIT10Review from './BIT10Review'

export default function Page() {

    return (
        <div className='flex flex-col space-y-2 p-4 md:p-16'>
            <BIT10TestnetWelcome />
            <BIT10Review />
        </div>
    )
}
