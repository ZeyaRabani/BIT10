import React from 'react'
import RecentActivity from './recentActivity'
import BalanceAndAllocation from './balanceAndAllocation'

export default function Portfolio() {
    return (
        <div className='flex flex-col space-y-4'>
            <BalanceAndAllocation />
            <RecentActivity />
        </div>
    )
}
