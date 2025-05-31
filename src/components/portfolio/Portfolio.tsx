import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPBalanceAndAllocation from './icp/ICPbalanceAndAllocation'
import SolDevbalanceAndAllocation from './sol_dev/SolDevbalanceAndAllocation'
import PrivyBalanceAndAllocation from './privy/PrivyBalanceAndAllocation'
import Preformance from './preformance'
import ICPRecentActivity from './icp/ICPrecentActivity'
import SolDevrecentActivity from './sol_dev/SolDevrecentActivity'
import PrivyRecentActivity from './privy/PrivyRecentActivity'

export default function Portfolio() {
    const { chain } = useChain();

    return (
        <div className='flex flex-col space-y-4'>
            {chain === 'icp' && <ICPBalanceAndAllocation />}
            {chain === 'sol_dev' && <SolDevbalanceAndAllocation />}
            {chain === 'privy' && <PrivyBalanceAndAllocation />}
            <Preformance />
            {chain === 'icp' && <ICPRecentActivity />}
            {chain === 'sol_dev' && <SolDevrecentActivity />}
            {chain === 'privy' && <PrivyRecentActivity />}
        </div>
    )
}
