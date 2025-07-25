import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPSLPModule from './icp/ICPSLPModule'
import SolDevSLPModule from './sol_dev/SolDevSLPModule'
import ETHSepoliaSLPModule from './eth_sepolia/ETHSepoliaSLPModule'
import PrivySLPModule from './privy/PrivySLPModule'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

export default function SLP() {
  const { chain } = useChain();

  return (
    <MaxWidthWrapper>
      {chain === 'icp' && <ICPSLPModule />}
      {chain === 'sol_dev' && <SolDevSLPModule />}
      {chain === 'eth_sepolia' && <ETHSepoliaSLPModule />}
      {chain === 'privy' && <PrivySLPModule />}
    </MaxWidthWrapper>
  )
}
