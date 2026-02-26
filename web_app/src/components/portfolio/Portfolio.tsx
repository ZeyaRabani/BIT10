import { useMemo } from 'react';
import BalanceAndAllocation from './BalanceAndAllocation';
import Preformance from './Preformance';
import RecentActivity from './RecentActivity';
import { useChain } from '@/context/ChainContext';
import { useICPWallet } from '@/context/ICPWalletContext';
import { useEVMWallet } from '@/context/EVMWalletContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

export default function Portfolio() {
    const { chain } = useChain();
    const { isICPConnected, icpAddress } = useICPWallet();
    const { isEVMConnected, evmAddress } = useEVMWallet();
    const { connected: isSolanaConnected } = useWallet();
    const wallet = useWallet();

    const userAddress = useMemo(() => {
        if (chain === 'icp' && isICPConnected) {
            return icpAddress;
        }

        if ((chain === 'base' || chain === 'bsc') && isEVMConnected) {
            return evmAddress;
        }

        if ((chain === 'solana') && isSolanaConnected) {
            return wallet ? wallet.publicKey?.toBase58() : '';
        }
    }, [chain, isICPConnected, isEVMConnected, isSolanaConnected, icpAddress, evmAddress, wallet]);

    return (
        <div className='flex flex-col space-y-4 pb-4'>
            <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between items-center'>
                <h1 className='text-center md:text-start text-3xl font-bold animate-fade-left-slow'>
                    Welcome back {userAddress ? formatAddress(userAddress) : 'Guest'}
                </h1>
                <Button className='animate-fade-right-slow' asChild>
                    <Link href='/mint'>Mint BIT10.TOP</Link>
                </Button>
            </div>
            <BalanceAndAllocation />
            <Preformance />
            <RecentActivity />
        </div>
    )
}
