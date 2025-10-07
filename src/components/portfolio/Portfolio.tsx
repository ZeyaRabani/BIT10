import React, { useState } from 'react'
import { useChain } from '@/context/ChainContext'
import ICPOverview from './icp/ICPOverview'
import SolDevOverview from './sol_dev/SolDevOverview'
import ETHSepoliaOverview from './eth_sepolia/ETHSepoliaOverview'
import BSCTestnetOverview from './bsc_testnet/BSCTestnetOverview'
import PrivyOverview from './privy/PrivyOverview'
import AnimatedBackground from '@/components/ui/animated-background'
import ICPBIT10Portfolio from './icp/ICPBIT10Portfolio'
import SolDevBIT10Portfolio from './sol_dev/SolDevBIT10Portfolio'
import ETHSepoliaBIT10Portfolio from './eth_sepolia/ETHSepoliaBIT10Portfolio'
import BSCTestnetBIT10Portfolio from './bsc_testnet/BSCTestnetBIT10Portfolio'
import PrivyBIT10Portfolio from './privy/PrivyBIT10Portfolio'
import ICPDEXActivity from './icp/ICPDEXActivity'
import SolDevDEXActivity from './sol_dev/SolDevDEXActivity'
import ETHSepoliaDEXActivity from './eth_sepolia/ETHSepoliaDEXActivity'
import BSCTestnetDEXActivity from './bsc_testnet/BSCTestnetDEXActivity'
import PrivyDevDEXActivity from './privy/PrivyDevDEXActivity'
import ICPLendingAndBorrowing from './icp/ICPLendingAndBorrowing'
import SolDevLendingAndBorrowing from './sol_dev/SolDevLendingAndBorrowing'
import ETHSepoliaLendingAndBorrowing from './eth_sepolia/ETHSepoliaLendingAndBorrowing'
import BSCTestnetLendingAndBorrowing from './bsc_testnet/BSCTestnetLendingAndBorrowing'
import PrivyLendingAndBorrowing from './privy/PrivyLendingAndBorrowing'

const tabs = ['BIT10 Portfolio', 'DEX Activity', 'Lending & Borrowing'];

export default function Portfolio() {
    const [activeTab, setActiveTab] = useState('BIT10 Portfolio');

    const { chain } = useChain();

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    return (
        <div className='flex flex-col space-y-4'>
            {chain === 'icp' && <ICPOverview />}
            {chain === 'sol_dev' && <SolDevOverview />}
            {chain === 'eth_sepolia' && <ETHSepoliaOverview />}
            {chain === 'bsc_testnet' && <BSCTestnetOverview />}
            {chain === 'privy' && <PrivyOverview />}

            <div className='grid place-items-center'>
                <div className='relative flex flex-row space-x-2 items-center justify-around lg:w-[50vw] bg-transparent border dark:border-white rounded-md px-2 py-1.5'>
                    <AnimatedBackground
                        defaultValue='BIT10 Portfolio'
                        className='rounded bg-primary'
                        transition={{
                            ease: 'easeInOut',
                            duration: 0.2,
                        }}
                        onValueChange={(newActiveId) => handleTabChange(newActiveId)}
                    >
                        {tabs.map((label, index) => (
                            <button
                                key={index}
                                data-id={label}
                                type='button'
                                className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </AnimatedBackground>
                </div>
            </div>

            {activeTab === 'BIT10 Portfolio' && chain === 'icp' && <ICPBIT10Portfolio />}
            {activeTab === 'BIT10 Portfolio' && chain === 'sol_dev' && <SolDevBIT10Portfolio />}
            {activeTab === 'BIT10 Portfolio' && chain === 'eth_sepolia' && <ETHSepoliaBIT10Portfolio />}
            {activeTab === 'BIT10 Portfolio' && chain === 'bsc_testnet' && <BSCTestnetBIT10Portfolio />}
            {activeTab === 'BIT10 Portfolio' && chain === 'privy' && <PrivyBIT10Portfolio />}

            {activeTab === 'DEX Activity' && chain === 'icp' && <ICPDEXActivity />}
            {activeTab === 'DEX Activity' && chain === 'sol_dev' && <SolDevDEXActivity />}
            {activeTab === 'DEX Activity' && chain === 'eth_sepolia' && <ETHSepoliaDEXActivity />}
            {activeTab === 'DEX Activity' && chain === 'bsc_testnet' && <BSCTestnetDEXActivity />}
            {activeTab === 'DEX Activity' && chain === 'privy' && <PrivyDevDEXActivity />}

            {activeTab === 'Lending & Borrowing' && chain === 'icp' && <ICPLendingAndBorrowing />}
            {activeTab === 'Lending & Borrowing' && chain === 'sol_dev' && <SolDevLendingAndBorrowing />}
            {activeTab === 'Lending & Borrowing' && chain === 'eth_sepolia' && <ETHSepoliaLendingAndBorrowing />}
            {activeTab === 'Lending & Borrowing' && chain === 'bsc_testnet' && <BSCTestnetLendingAndBorrowing />}
            {activeTab === 'Lending & Borrowing' && chain === 'privy' && <PrivyLendingAndBorrowing />}
        </div>
    )
}
