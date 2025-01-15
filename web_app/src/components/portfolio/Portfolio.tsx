import React from 'react'
import BalanceAndAllocation from './balanceAndAllocation'
import RecentActivity from './recentActivity'

export default function Portfolio() {
    return (
        <div className='flex flex-col space-y-4'>
            <BalanceAndAllocation />
            <RecentActivity />
        </div>
    )
}
