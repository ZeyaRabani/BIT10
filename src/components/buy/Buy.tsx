"use client"

import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPBuyModule from './icp/ICPBuyModule'
import SolDevBuyModule from './sol_dev/SolDevBuyModule'
import EthSepoliaBuyModule from './eth_sepolia/ETHSepoliaBuyModule'
import PrivyBuyModule from './privy/PrivyBuyModule'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

export default function Buy() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper>
            {chain === 'icp' && <ICPBuyModule />}
            {chain === 'sol_dev' && <SolDevBuyModule />}
            {chain === 'eth_sepolia' && <EthSepoliaBuyModule />}
            {chain === 'privy' && <PrivyBuyModule />}
        </MaxWidthWrapper>
    )
}
