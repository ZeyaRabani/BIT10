import React from 'react'
import BalanceAndAllocation from './balanceAndAllocation'
import Preformance from './preformance'
import RecentActivity from './recentActivity'

export default function Portfolio() {
    return (
        <div className='flex flex-col space-y-4'>
            <BalanceAndAllocation />
            <Preformance />
            <RecentActivity />
        </div>
    )
}
