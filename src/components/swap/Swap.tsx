"use client"

import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPSwapModule from './icp/ICPSwapModule'
import SolDevSwapModule from './sol_dev/SolDevSwapModule'
import EthSepoliaSwapModule from './eth_sepolia/EthSepoliaSwapModule'
import PrivySwapModule from './privy/PrivySwapModule'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

export default function Swap() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper>
            {chain === 'icp' && <ICPSwapModule />}
            {chain === 'sol_dev' && <SolDevSwapModule />}
            {chain === 'eth_sepolia' && <EthSepoliaSwapModule />}
            {chain === 'privy' && <PrivySwapModule />}
        </MaxWidthWrapper>
    )
}
