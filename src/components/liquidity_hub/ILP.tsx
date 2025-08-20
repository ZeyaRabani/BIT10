import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPILPModule from './icp/ICPILPModule'
import SolDevILPModule from './sol_dev/SolDevILPModule'
import ETHSepoliaILPModule from './eth_sepolia/ETHSepoliaILPModule'
import BSCTestnetILPModule from './bsc_testnet/BSCTestnetILPModule'
import PrivyILPModule from './privy/PrivyILPModule'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

export default function ILP() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper>
            {chain === 'icp' && <ICPILPModule />}
            {chain === 'sol_dev' && <SolDevILPModule />}
            {chain === 'eth_sepolia' && <ETHSepoliaILPModule />}
            {chain === 'bsc_testnet' && <BSCTestnetILPModule />}
            {chain === 'privy' && <PrivyILPModule />}
        </MaxWidthWrapper>
    )
}
