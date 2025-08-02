import React from 'react'
import BalanceAndAlloactions from './bit10_portfolio/balanceAndAlloactions'
import Bit10Preformance from './bit10_portfolio/bit10Preformance'
import RecentActivity from './bit10_portfolio/recentActivity'

export default function ETHSepoliaBIT10Portfolio() {
    return (
        <div className='flex flex-col space-y-4'>
            <BalanceAndAlloactions />
            <Bit10Preformance />
            <RecentActivity />
        </div>
    )
}
