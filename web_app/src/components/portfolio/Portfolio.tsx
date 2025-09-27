import React from 'react'
import BalanceAndAllocation from './balanceAndAllocation'
import Preformance from './preformance'
import RecentActivity from './recentActivity'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { useBaseWallet } from '@/context/BaseWalletContext'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/utils'
import Link from 'next/link'

export default function Portfolio() {
    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { account: baseAddress, isConnected: isBaseConnected } = useBaseWallet();

    const selectedAddress = () => {
        if (chain === 'icp' && isICPConnected) {
            return icpAddress;
        } else if (chain === 'base' && isBaseConnected) {
            return baseAddress;
        } else {
            return 'Guest'
        }
    };

    const userAddress = selectedAddress();

    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between items-center'>
                <h1 className='text-center md:text-start text-3xl font-bold animate-fade-left-slow'>
                    Welcome back {userAddress ? formatAddress(userAddress) : 'Guest'}
                </h1>
                <Button className='animate-fade-right-slow' asChild>
                    <Link href='/buy'>Buy BIT10 Token</Link>
                </Button>
            </div>
            <BalanceAndAllocation />
            <Preformance />
            <RecentActivity />
        </div>
    )
}
