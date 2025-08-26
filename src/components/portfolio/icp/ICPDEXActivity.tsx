import React from 'react'
import RecentSwapActivity from './dex_activity/RecentSwapActivity'

export default function ICPDEXActivity() {
    return (
        <div className='flex flex-col space-y-4'>
            <RecentSwapActivity />
            {/* ToDo: Also add Liquidity Positions Table */}
        </div>
    )
}
