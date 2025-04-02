import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPILPModule from './icp/ICPILPModule'
import SolDevILPModule from './sol_dev/SolDevILPModule'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

export default function ILP() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper>
            {chain === 'icp' && <ICPILPModule />}
            {chain === 'sol_dev' && <SolDevILPModule />}
        </MaxWidthWrapper>
    )
}
