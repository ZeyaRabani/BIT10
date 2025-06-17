import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPReferralProfileModule from './icp/ICPReferralProfileModule'
import SolDevReferralProfileModule from './sol_dev/SolDevReferralProfileModule'
import PrivyReferralProfileModule from './privy/PrivyReferralProfileModule'

export default function Profile() {
    const { chain } = useChain();

    return (
        <div>
            {chain === 'icp' && <ICPReferralProfileModule />}
            {chain === 'sol_dev' && <SolDevReferralProfileModule />}
            {chain === 'privy' && <PrivyReferralProfileModule />}
        </div>
    )
}
