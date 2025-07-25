import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPBalanceAndAllocation from './icp/ICPbalanceAndAllocation'
import SolDevbalanceAndAllocation from './sol_dev/SolDevbalanceAndAllocation'
import ETHSepoliaBalanceAndAllocation from './eth_sepolia/ETHSepoliaBalanceAndAllocation'
import PrivyBalanceAndAllocation from './privy/PrivyBalanceAndAllocation'
import Preformance from './preformance'
import ICPRecentActivity from './icp/ICPrecentActivity'
import SolDevrecentActivity from './sol_dev/SolDevrecentActivity'
import ETHSepoliaRecentActivity from './eth_sepolia/ETHSepoliaRecentActivity'
import PrivyRecentActivity from './privy/PrivyRecentActivity'

export default function Portfolio() {
    const { chain } = useChain();

    return (
        <div className='flex flex-col space-y-4'>
            {chain === 'icp' && <ICPBalanceAndAllocation />}
            {chain === 'sol_dev' && <SolDevbalanceAndAllocation />}
            {chain === 'eth_sepolia' && <ETHSepoliaBalanceAndAllocation />}
            {chain === 'privy' && <PrivyBalanceAndAllocation />}
            <Preformance />
            {chain === 'icp' && <ICPRecentActivity />}
            {chain === 'sol_dev' && <SolDevrecentActivity />}
            {chain === 'eth_sepolia' && <ETHSepoliaRecentActivity />}
            {chain === 'privy' && <PrivyRecentActivity />}
        </div>
    )
}
